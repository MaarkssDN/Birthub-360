import { logger } from '../../../../lib/logger.js';
import { prisma } from '../../../../lib/prisma.js';
import { domainEventMesh } from '../../../../lib/queue/domainEventMesh.service.js';
import { AppError } from '../../../../shared/middlewares/errorHandler.js';
import type {
  BitrixWebhookEventPayload,
  DomainEventEnvelope,
  WhatsAppMessageEventPayload,
} from '../../../../shared/contracts/domainEventMesh.contract.js';
import { postCommentToBitrix, syncActivityToBitrix } from '../service/outboundSync.js';

/**
 * Type guards de contrato (GATE-02): validam o payload do envelope ANTES de
 * tratá-lo como WhatsAppMessageEventPayload / BitrixWebhookEventPayload.
 * Campos obrigatórios conforme src/shared/contracts/domainEventMesh.contract.ts.
 */
function isWhatsAppMessageEventPayload(payload: unknown): payload is WhatsAppMessageEventPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.waMessageId === 'string' &&
    typeof p.phoneE164 === 'string' &&
    (typeof p.body === 'string' || p.body === null || p.body === undefined) &&
    (p.direction === 'inbound' || p.direction === 'outbound')
  );
}

function isBitrixWebhookEventPayload(payload: unknown): payload is BitrixWebhookEventPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.connectionId === 'string' &&
    typeof p.eventType === 'string' &&
    typeof p.bitrixRecordId === 'string' &&
    (p.entityType === 'lead' || p.entityType === 'deal')
  );
}

/**
 * Classificação permanente/transitória (handoff 16→06, MEL-21): erros 4xx do AppError
 * (lead sem vínculo, conexão ausente, payload recusado pelo Bitrix) não mudam com retentativa
 * — seguem best-effort (warn + consumo concluído). Todo o resto (rede, timeout, 5xx, erros de
 * banco, TransientBitrixError) é transitório e DEVE propagar: o mesh libera o lease do
 * consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
 */
function isPermanentBitrixSyncError(err: unknown): boolean {
  return (
    err instanceof AppError &&
    err.statusCode >= 400 &&
    err.statusCode < 500 &&
    err.statusCode !== 408 &&
    err.statusCode !== 429
  );
}

/**
 * Ponte entre o barramento canônico de eventos (DomainEventMesh) e as integrações
 * de CRM e Mensageria (Bitrix24 e WhatsApp).
 *
 * Responsável por:
 * 1. Espelhar automaticamente interações de WhatsApp, ligações e reuniões no Bitrix24.
 * 2. Publicar alertas de risco comercial e opt-out diretamente na timeline de Deals/Leads do Bitrix24.
 * 3. Reagir a webhooks de entrada do Bitrix24 disparando fluxos de mensageria e engajamento.
 */
class BitrixEventMeshBridgeService {
  private isRegistered = false;

  public register(): void {
    if (this.isRegistered) return;
    this.isRegistered = true;

    // ── 1. Espelhamento de WhatsApp no CRM Bitrix24 ─────────────────────────────
    domainEventMesh.subscribe(
      'WHATSAPP_MESSAGE_RECEIVED',
      async (event) => {
        await this.handleWhatsAppMessage(event, 'inbound');
      },
      'bitrix-bridge:whatsapp-message-received',
    );

    domainEventMesh.subscribe(
      'WHATSAPP_MESSAGE_SENT',
      async (event) => {
        await this.handleWhatsAppMessage(event, 'outbound');
      },
      'bitrix-bridge:whatsapp-message-sent',
    );

    // ── 2. Espelhamento de Chamadas e Voz no CRM Bitrix24 ───────────────────────
    domainEventMesh.subscribe(
      'VOICE_CALL_COMPLETED',
      async (event) => {
        await this.handleVoiceCall(event);
      },
      'bitrix-bridge:voice-call-completed',
    );

    domainEventMesh.subscribe(
      'SDR_CALL_COMPLETED',
      async (event) => {
        await this.handleVoiceCall(event);
      },
      'bitrix-bridge:sdr-call-completed',
    );

    // ── 3. Espelhamento de Reuniões no CRM Bitrix24 ─────────────────────────────
    domainEventMesh.subscribe(
      'CRM_MEETING_SCHEDULED',
      async (event) => {
        await this.handleMeetingScheduled(event);
      },
      'bitrix-bridge:crm-meeting-scheduled',
    );

    domainEventMesh.subscribe(
      'MEETING_SCHEDULED_CALENDAR',
      async (event) => {
        await this.handleMeetingScheduled(event);
      },
      'bitrix-bridge:meeting-scheduled-calendar',
    );

    // ── 4. Alertas Comerciais e Riscos na Timeline do Bitrix24 ──────────────────
    domainEventMesh.subscribe(
      'DEAL_RISK_SPIKED',
      async (event) => {
        await this.handleDealRisk(event);
      },
      'bitrix-bridge:deal-risk-spiked',
    );

    domainEventMesh.subscribe(
      'DEVILS_ADVOCATE_ALERT',
      async (event) => {
        await this.handleDealRisk(event);
      },
      'bitrix-bridge:devils-advocate-alert',
    );

    domainEventMesh.subscribe(
      'COMMERCIAL_BOTTLENECK_DETECTED',
      async (event) => {
        await this.handleCommercialBottleneck(event);
      },
      'bitrix-bridge:commercial-bottleneck-detected',
    );

    // ── 5. Propostas Comerciais na Timeline do Bitrix24 ─────────────────────────
    domainEventMesh.subscribe(
      'COMMERCIAL_PROPOSAL_DRAFTED',
      async (event) => {
        await this.handleProposalDrafted(event);
      },
      'bitrix-bridge:commercial-proposal-drafted',
    );

    // ── 6. Opt-Out e LGPD Unificado na Timeline do Bitrix24 ────────────────────
    domainEventMesh.subscribe(
      'CROSS_CHANNEL_OPTOUT_ENFORCED',
      async (event) => {
        await this.handleOptOutEnforced(event);
      },
      'bitrix-bridge:cross-channel-optout-enforced',
    );

    // ── 7. Reativação de Leads na Timeline do Bitrix24 ──────────────────────────
    domainEventMesh.subscribe(
      'LEAD_REACTIVATED',
      async (event) => {
        await this.handleLeadReactivated(event);
      },
      'bitrix-bridge:lead-reactivated',
    );

    // ── 8. Webhooks de Entrada do Bitrix24 -> Automações e Mensageria ───────────
    domainEventMesh.subscribe(
      'BITRIX_WEBHOOK_RECEIVED',
      async (event) => {
        await this.handleBitrixWebhookInbound(event);
      },
      'bitrix-bridge:bitrix-webhook-received',
    );

    logger.info('[BitrixEventMeshBridge] Registrado com sucesso nos eventos do DomainEventMesh.');
  }

  private async handleWhatsAppMessage(
    event: DomainEventEnvelope,
    direction: 'inbound' | 'outbound',
  ): Promise<void> {
    try {
      if (!isWhatsAppMessageEventPayload(event.payload)) {
        logger.warn(
          {
            eventId: event.eventId,
            organizationId: event.organizationId,
            eventType: event.eventType,
          },
          '[BitrixEventMeshBridge] Payload de WhatsApp inválido — evento ignorado (contrato violado).',
        );
        return;
      }
      const payload = event.payload;
      const leadId = payload.leadId;
      if (!leadId) {
        return;
      }

      const subject =
        direction === 'inbound'
          ? `Mensagem WhatsApp recebida (${payload.phoneE164})`
          : `Mensagem WhatsApp enviada (${payload.phoneE164})`;

      const description = payload.body
        ? `Conteúdo: "${payload.body.slice(0, 500)}"`
        : 'Mensagem sem texto ou anexo de mídia.';

      await syncActivityToBitrix(
        event.organizationId,
        leadId,
        {
          type: 'whatsapp',
          subject,
          description,
          direction,
          completed: true,
        },
        { propagateErrors: true, dedupRef: event.eventId },
      );

      logger.info(
        { organizationId: event.organizationId, leadId, eventId: event.eventId },
        '[BitrixEventMeshBridge] Mensagem WhatsApp sincronizada com Bitrix24 com sucesso.',
      );
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao sincronizar WhatsApp com Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleVoiceCall(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId =
        (payload.leadId as string) ||
        (event.aggregateId.startsWith('lead-')
          ? event.aggregateId.replace('lead-', '')
          : event.aggregateId);

      if (!leadId) return;

      const duration =
        typeof payload.durationSeconds === 'number' ? payload.durationSeconds : undefined;
      const summary = typeof payload.summary === 'string' ? payload.summary : '';

      await syncActivityToBitrix(
        event.organizationId,
        leadId,
        {
          type: 'call',
          subject: `Ligação telefônica / VoiceHub (${event.eventType})`,
          description: summary ? `Resumo da chamada: ${summary}` : 'Chamada de voz finalizada.',
          durationSeconds: duration,
          direction: 'outbound',
          completed: true,
        },
        { propagateErrors: true, dedupRef: event.eventId },
      );
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao sincronizar chamada de voz com Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleMeetingScheduled(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId =
        (payload.leadId as string) ||
        (event.aggregateId.startsWith('lead-')
          ? event.aggregateId.replace('lead-', '')
          : event.aggregateId);

      if (!leadId) return;

      const title =
        typeof payload.title === 'string' ? payload.title : 'Reunião comercial agendada';
      const scheduledAt = typeof payload.scheduledAt === 'string' ? payload.scheduledAt : '';

      await syncActivityToBitrix(
        event.organizationId,
        leadId,
        {
          type: 'meeting',
          subject: `📅 ${title}`,
          description: scheduledAt
            ? `Data agendada: ${scheduledAt}`
            : 'Reunião confirmada no calendário.',
          completed: false,
        },
        { propagateErrors: true, dedupRef: event.eventId },
      );
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao sincronizar reunião com Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleDealRisk(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId = (payload.leadId as string) || event.aggregateId;

      if (!leadId) return;

      const reason =
        typeof payload.reason === 'string'
          ? payload.reason
          : typeof payload.risk === 'string'
            ? payload.risk
            : 'Risco elevado detectado na negociação';
      const score = payload.riskScore != null ? ` (Score de Risco: ${payload.riskScore})` : '';

      const comment = `⚠️ [Alerta IA Birth Hub 360 - ${event.eventType}]${score}\n${reason}\nRecomendação: Avaliar histórico do cliente ou acionar roleplay com o gestor.`;

      await postCommentToBitrix(event.organizationId, leadId, comment, { dedupRef: event.eventId });
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao registrar alerta de risco na timeline do Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleCommercialBottleneck(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId = (payload.leadId as string) || event.aggregateId;

      if (!leadId) return;

      const bottleneck =
        typeof payload.bottleneck === 'string' ? payload.bottleneck : 'Gargalo no funil de vendas';
      const comment = `🔍 [Gargalo Comercial Detectado]\n${bottleneck}\nSugerido avanço de etapa ou contato ativo.`;

      await postCommentToBitrix(event.organizationId, leadId, comment, { dedupRef: event.eventId });
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao registrar gargalo comercial no Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleProposalDrafted(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId = (payload.leadId as string) || event.aggregateId;

      if (!leadId) return;

      const proposalId = typeof payload.proposalId === 'string' ? payload.proposalId : '';
      const totalValue = payload.totalValue != null ? `Valor: R$ ${payload.totalValue}` : '';
      const comment = `📄 [Proposta Comercial Elaborada]\nProposta ${proposalId} gerada no Birth Hub 360. ${totalValue}\nPronta para apresentação e assinatura.`;

      await postCommentToBitrix(event.organizationId, leadId, comment, { dedupRef: event.eventId });
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao registrar proposta comercial no Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleOptOutEnforced(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId = (payload.leadId as string) || event.aggregateId;

      if (!leadId) return;

      const reason =
        typeof payload.reason === 'string' ? payload.reason : 'Solicitação do titular (LGPD)';
      const comment = `🛑 [LGPD / Opt-out Unificado Aplicado]\nO lead solicitou cancelamento de abordagens comerciais.\nMotivo: ${reason}\nTodos os canais automatizados (WhatsApp, Voz, E-mail) foram bloqueados para este contato.`;

      await postCommentToBitrix(event.organizationId, leadId, comment, { dedupRef: event.eventId });
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao registrar opt-out unificado no Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleLeadReactivated(event: DomainEventEnvelope): Promise<void> {
    try {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const leadId = (payload.leadId as string) || event.aggregateId;

      if (!leadId) return;

      const channel = typeof payload.channel === 'string' ? `Canal: ${payload.channel}` : '';
      const comment = `🚀 [Lead Reativado com Sucesso]\nLead recuperado via automação autônoma do Birth Hub 360. ${channel}\nOportunidade restabelecida no funil.`;

      await postCommentToBitrix(event.organizationId, leadId, comment, { dedupRef: event.eventId });
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao registrar reativação no Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }

  private async handleBitrixWebhookInbound(event: DomainEventEnvelope): Promise<void> {
    try {
      if (!isBitrixWebhookEventPayload(event.payload)) {
        logger.warn(
          {
            eventId: event.eventId,
            organizationId: event.organizationId,
            eventType: event.eventType,
          },
          '[BitrixEventMeshBridge] Payload de webhook Bitrix inválido — evento ignorado (contrato violado).',
        );
        return;
      }
      const payload = event.payload;
      if (!payload.leadId) return;

      // Se o webhook informou mudança de estágio para um lead local existente:
      // Podemos verificar se há automação de boas-vindas / notificação WhatsApp
      const lead = await prisma.lead.findFirst({
        where: { id: payload.leadId, organizationId: event.organizationId },
        include: { contact: true },
      });

      if (!lead?.contact) return;

      const phone = lead.contact.whatsapp || lead.contact.phone;
      if (!phone) return;

      // Exemplo de fluxo automático de mensageria:
      // Se lead mudou de estágio no Bitrix para 'PROPOSTA' ou 'APRESENTACAO',
      // notifica ou registra evento de engajamento
      logger.info(
        {
          organizationId: event.organizationId,
          leadId: lead.id,
          stageId: payload.stageId,
          eventType: payload.eventType,
        },
        '[BitrixEventMeshBridge] Webhook Bitrix processado com sucesso para lead local.',
      );
    } catch (err) {
      if (isPermanentBitrixSyncError(err)) {
        logger.warn(
          { err, eventId: event.eventId, organizationId: event.organizationId },
          '[BitrixEventMeshBridge] Falha não-bloqueante ao processar webhook de entrada do Bitrix24 — erro permanente (4xx), retentativa não altera o resultado.',
        );
        return;
      }
      // Transitório (rede, timeout, 5xx, banco): propaga — o mesh libera o lease do
      // consumidor, marca o outbox como FAILED e reagenda com backoff até DLQ.
      throw err;
    }
  }
}

export const bitrixEventMeshBridge = new BitrixEventMeshBridgeService();

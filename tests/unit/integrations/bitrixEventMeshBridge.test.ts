import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bitrixEventMeshBridge } from '../../../src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.js';
import { domainEventMesh } from '../../../src/lib/queue/domainEventMesh.service.js';
import * as outboundSync from '../../../src/features/integrations/bitrix/service/outboundSync.js';
import { prisma } from '../../../src/lib/prisma.js';
import { AppError } from '../../../src/shared/middlewares/errorHandler.js';

describe('BitrixEventMeshBridgeService — Sincronização de Webhooks Bitrix24 & WhatsApp', () => {
  const syncActivitySpy = vi.spyOn(outboundSync, 'syncActivityToBitrix').mockResolvedValue({ bitrixActivityId: 101 });
  const postCommentSpy = vi.spyOn(outboundSync, 'postCommentToBitrix').mockResolvedValue({
    entityType: 'deal',
    bitrixRecordId: 'deal-999',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    domainEventMesh.clearProcessedEvents();
    bitrixEventMeshBridge.register();
  });

  it('deve sincronizar mensagem recebida de WhatsApp no Bitrix24 como atividade', async () => {
    await domainEventMesh.publish({
      eventType: 'WHATSAPP_MESSAGE_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'wa-recv-001',
      producer: 'integrations.whatsapp',
      aggregateId: 'lead-123',
      payload: {
        waMessageId: 'msg-abc',
        phoneE164: '+5511999998888',
        body: 'Olá, gostaria de saber mais sobre a proposta.',
        direction: 'inbound',
        leadId: 'lead-123',
      },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.objectContaining({
        type: 'whatsapp',
        direction: 'inbound',
        completed: true,
        subject: expect.stringContaining('+5511999998888'),
        description: expect.stringContaining('proposta'),
      }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve sincronizar mensagem enviada de WhatsApp no Bitrix24 como atividade outbound', async () => {
    await domainEventMesh.publish({
      eventType: 'WHATSAPP_MESSAGE_SENT',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'wa-send-002',
      producer: 'integrations.whatsapp',
      aggregateId: 'lead-123',
      payload: {
        waMessageId: 'msg-def',
        phoneE164: '+5511999998888',
        body: 'Segue o link do catálogo solicitado.',
        direction: 'outbound',
        leadId: 'lead-123',
      },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.objectContaining({
        type: 'whatsapp',
        direction: 'outbound',
        completed: true,
      }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve sincronizar chamada de voz finalizada no Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'VOICE_CALL_COMPLETED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'call-001',
      producer: 'birth-voice',
      aggregateId: 'lead-123',
      payload: {
        leadId: 'lead-123',
        durationSeconds: 145,
        summary: 'Cliente demonstrou alto interesse e solicitou demonstração.',
      },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.objectContaining({
        type: 'call',
        durationSeconds: 145,
        description: expect.stringContaining('alto interesse'),
      }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve sincronizar reunião agendada no Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'CRM_MEETING_SCHEDULED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'meeting-001',
      producer: 'calendar-service',
      aggregateId: 'lead-123',
      payload: {
        leadId: 'lead-123',
        title: 'Demo Executiva Birth Hub 360',
        scheduledAt: '2026-10-25T15:00:00Z',
      },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.objectContaining({
        type: 'meeting',
        subject: expect.stringContaining('Demo Executiva'),
        completed: false,
      }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve registrar alerta de risco elevado na timeline do Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'DEAL_RISK_SPIKED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'risk-001',
      producer: 'deal-risk-service',
      aggregateId: 'lead-123',
      payload: {
        leadId: 'lead-123',
        riskScore: 85,
        reason: 'Concorrente entrou na conta oferecendo 30% de desconto.',
      },
    });

    expect(postCommentSpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.stringContaining('Score de Risco: 85'),
      expect.objectContaining({ dedupRef: expect.any(String) }),
    );
  });

  it('deve registrar proposta comercial elaborada na timeline do Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'COMMERCIAL_PROPOSAL_DRAFTED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'prop-001',
      producer: 'proposal-service',
      aggregateId: 'lead-123',
      payload: {
        leadId: 'lead-123',
        proposalId: 'PROP-2026-99',
        totalValue: 48000,
      },
    });

    expect(postCommentSpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.stringContaining('PROP-2026-99'),
      expect.objectContaining({ dedupRef: expect.any(String) }),
    );
  });

  it('deve registrar opt-out unificado (LGPD) na timeline do Bitrix24 para bloquear contatos', async () => {
    await domainEventMesh.publish({
      eventType: 'CROSS_CHANNEL_OPTOUT_ENFORCED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'optout-001',
      producer: 'optout-service',
      aggregateId: 'lead-123',
      payload: {
        leadId: 'lead-123',
        reason: 'Solicitação explícita via WhatsApp ("PARE")',
      },
    });

    expect(postCommentSpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.stringContaining('LGPD / Opt-out Unificado Aplicado'),
      expect.objectContaining({ dedupRef: expect.any(String) }),
    );
  });

  it('deve processar webhook de entrada do Bitrix24 de forma não bloqueante', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue({
      id: 'lead-123',
      organizationId: 'tenant-alpha',
      contact: {
        phone: '+5511999998888',
        whatsapp: '+5511999998888',
      },
    } as any);

    await domainEventMesh.publish({
      eventType: 'BITRIX_WEBHOOK_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'webhook-001',
      producer: 'bitrix-webhook-service',
      aggregateId: 'lead-123',
      payload: {
        connectionId: 'conn-1',
        eventType: 'ONCRMLEADUPDATE',
        bitrixRecordId: 'b-77',
        entityType: 'lead',
        leadId: 'lead-123',
        stageId: 'PROPOSAL',
      },
    });

    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: { id: 'lead-123', organizationId: 'tenant-alpha' },
      include: { contact: true },
    });
  });

  it('deve ignorar mensagem WhatsApp com payload fora do contrato (GATE-02)', async () => {
    await domainEventMesh.publish({
      eventType: 'WHATSAPP_MESSAGE_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'wa-invalid-001',
      producer: 'integrations.whatsapp',
      aggregateId: 'lead-123',
      payload: {
        // payload sem waMessageId/phoneE164/direction válidos — não é WhatsAppMessageEventPayload
        leadId: 'lead-123',
        unexpected: 'campo arbitrário',
      },
    });

    expect(syncActivitySpy).not.toHaveBeenCalled();
  });

  it('deve ignorar webhook Bitrix com payload fora do contrato (GATE-02)', async () => {
    const findFirstSpy = vi.spyOn(prisma.lead, 'findFirst');

    await domainEventMesh.publish({
      eventType: 'BITRIX_WEBHOOK_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'webhook-invalid-001',
      producer: 'bitrix-webhook-service',
      aggregateId: 'lead-123',
      payload: {
        // falta connectionId/bitrixRecordId/entityType válidos — não é BitrixWebhookEventPayload
        leadId: 'lead-123',
        stageId: 'PROPOSAL',
      },
    });

    expect(findFirstSpy).not.toHaveBeenCalled();
  });

  it('deve propagar falha transitória do Bitrix24 — publish rejeita e outbox fica FAILED para retry', async () => {
    syncActivitySpy.mockRejectedValueOnce(new Error('Bitrix API timeout 504'));

    await expect(
      domainEventMesh.publish({
        eventType: 'WHATSAPP_MESSAGE_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'wa-fail-safe',
        producer: 'integrations.whatsapp',
        aggregateId: 'lead-123',
        payload: {
          waMessageId: 'msg-timeout',
          phoneE164: '+5511999998888',
          body: 'Teste de tolerância a falhas',
          direction: 'inbound',
          leadId: 'lead-123',
        },
      }),
    ).rejects.toThrow('Bitrix API timeout 504');

    const records = domainEventMesh.getOutboxRecords();
    expect(records.some((r) => r.status === 'FAILED' && r.lastError)).toBe(true);
  });

  it('deve tratar erro permanente (4xx) como best-effort — publish resolve e outbox fica DISPATCHED', async () => {
    syncActivitySpy.mockRejectedValueOnce(new AppError('Lead sem vínculo Bitrix', 400));

    await expect(
      domainEventMesh.publish({
        eventType: 'WHATSAPP_MESSAGE_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'wa-permanent-001',
        producer: 'integrations.whatsapp',
        aggregateId: 'lead-123',
        payload: {
          waMessageId: 'msg-perm',
          phoneE164: '+5511999998888',
          body: 'Lead sem vínculo no Bitrix',
          direction: 'inbound',
          leadId: 'lead-123',
        },
      }),
    ).resolves.toBeDefined();

    const records = domainEventMesh.getOutboxRecords();
    expect(records.some((r) => r.status === 'DISPATCHED')).toBe(true);
  });

  it('deve usar o eventId como dedupRef estável nas chamadas de sync com o Bitrix24', async () => {
    const envelope = await domainEventMesh.publish({
      eventType: 'WHATSAPP_MESSAGE_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'wa-dedup-001',
      producer: 'integrations.whatsapp',
      aggregateId: 'lead-123',
      payload: {
        waMessageId: 'msg-dedup',
        phoneE164: '+5511999998888',
        body: 'Verificação de dedup',
        direction: 'inbound',
        leadId: 'lead-123',
      },
    });

    expect(syncActivitySpy).toHaveBeenCalled();
    const opts = syncActivitySpy.mock.calls[0][3] as { dedupRef?: string };
    expect(opts.dedupRef).toBe(envelope.eventId);
  });
});

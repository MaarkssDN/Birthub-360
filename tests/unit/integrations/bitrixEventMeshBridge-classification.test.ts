import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bitrixEventMeshBridge } from '../../../src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.js';
import { domainEventMesh } from '../../../src/lib/queue/domainEventMesh.service.js';
import * as outboundSync from '../../../src/features/integrations/bitrix/service/outboundSync.js';
import { prisma } from '../../../src/lib/prisma.js';
import { AppError } from '../../../src/shared/middlewares/errorHandler.js';

/**
 * Cobertura dos caminhos novos do PR (handoff 16→06, MEL-21):
 * - classificação permanente (AppError 4xx exceto 408/429) vs transitória (propaga p/ retry/DLQ);
 * - handlers ainda não exercitados (SDR_CALL_COMPLETED, MEETING_SCHEDULED_CALENDAR,
 *   DEVILS_ADVOCATE_ALERT, COMMERCIAL_BOTTLENECK_DETECTED, LEAD_REACTIVATED);
 * - fallbacks de leadId via aggregateId e early-returns dos handlers.
 */
describe('BitrixEventMeshBridgeService — classificação de erro e handlers restantes', () => {
  const syncActivitySpy = vi
    .spyOn(outboundSync, 'syncActivityToBitrix')
    .mockResolvedValue({ bitrixActivityId: 101 });
  const postCommentSpy = vi.spyOn(outboundSync, 'postCommentToBitrix').mockResolvedValue({
    entityType: 'deal',
    bitrixRecordId: 'deal-999',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    syncActivitySpy.mockResolvedValue({ bitrixActivityId: 101 });
    postCommentSpy.mockResolvedValue({ entityType: 'deal', bitrixRecordId: 'deal-999' });
    domainEventMesh.clearProcessedEvents();
    bitrixEventMeshBridge.register();
  });

  it('deve resolver leadId a partir do aggregateId "lead-<id>" quando payload não traz leadId', async () => {
    await domainEventMesh.publish({
      eventType: 'VOICE_CALL_COMPLETED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'call-agg-001',
      producer: 'birth-voice',
      aggregateId: 'lead-777',
      payload: { durationSeconds: 42 },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      '777',
      expect.objectContaining({ type: 'call', durationSeconds: 42 }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve sincronizar SDR_CALL_COMPLETED como atividade de chamada no Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'SDR_CALL_COMPLETED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'sdr-call-001',
      producer: 'sdr-service',
      aggregateId: 'lead-555',
      payload: { summary: 'Follow-up comercial realizado.' },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      '555',
      expect.objectContaining({
        type: 'call',
        description: expect.stringContaining('Follow-up comercial'),
      }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve sincronizar MEETING_SCHEDULED_CALENDAR como reunião no Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'MEETING_SCHEDULED_CALENDAR',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'meeting-cal-001',
      producer: 'calendar-service',
      aggregateId: 'lead-888',
      payload: { title: 'Onboarding técnico', scheduledAt: '2026-11-01T10:00:00Z' },
    });

    expect(syncActivitySpy).toHaveBeenCalledWith(
      'tenant-alpha',
      '888',
      expect.objectContaining({
        type: 'meeting',
        subject: expect.stringContaining('Onboarding técnico'),
        completed: false,
      }),
      expect.objectContaining({ propagateErrors: true, dedupRef: expect.any(String) }),
    );
  });

  it('deve ignorar evento de chamada sem leadId resolvível no payload nem no aggregateId', async () => {
    await domainEventMesh.publish({
      eventType: 'SDR_CALL_COMPLETED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'sdr-call-empty',
      producer: 'sdr-service',
      aggregateId: '',
      payload: {},
    });

    expect(syncActivitySpy).not.toHaveBeenCalled();
  });

  it('deve registrar DEVILS_ADVOCATE_ALERT na timeline do Bitrix24', async () => {
    await domainEventMesh.publish({
      eventType: 'DEVILS_ADVOCATE_ALERT',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'advocate-001',
      producer: 'devils-advocate-service',
      aggregateId: 'lead-123',
      payload: { leadId: 'lead-123', reason: 'Cliente pode estar avaliando concorrente.' },
    });

    expect(postCommentSpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.stringContaining('Cliente pode estar avaliando concorrente'),
      expect.objectContaining({ dedupRef: expect.any(String) }),
    );
  });

  it('deve registrar COMMERCIAL_BOTTLENECK_DETECTED com fallback de gargalo padrão', async () => {
    await domainEventMesh.publish({
      eventType: 'COMMERCIAL_BOTTLENECK_DETECTED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'bottleneck-001',
      producer: 'commercial-intel',
      aggregateId: 'lead-123',
      payload: { leadId: 'lead-123' },
    });

    expect(postCommentSpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.stringContaining('Gargalo no funil de vendas'),
      expect.objectContaining({ dedupRef: expect.any(String) }),
    );
  });

  it('deve registrar LEAD_REACTIVATED na timeline do Bitrix24 com canal informado', async () => {
    await domainEventMesh.publish({
      eventType: 'LEAD_REACTIVATED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'reactivated-001',
      producer: 'reactivation-service',
      aggregateId: 'lead-123',
      payload: { leadId: 'lead-123', channel: 'whatsapp' },
    });

    expect(postCommentSpy).toHaveBeenCalledWith(
      'tenant-alpha',
      'lead-123',
      expect.stringContaining('Canal: whatsapp'),
      expect.objectContaining({ dedupRef: expect.any(String) }),
    );
  });

  it('deve ignorar mensagem WhatsApp válida no contrato mas sem leadId', async () => {
    await domainEventMesh.publish({
      eventType: 'WHATSAPP_MESSAGE_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'wa-sem-lead',
      producer: 'integrations.whatsapp',
      aggregateId: 'lead-123',
      payload: {
        waMessageId: 'msg-nolead',
        phoneE164: '+5511999998888',
        body: 'Sem vínculo de lead',
        direction: 'inbound',
      },
    });

    expect(syncActivitySpy).not.toHaveBeenCalled();
  });

  it('deve propagar AppError 5xx como transitório — vai para retry/DLQ do mesh', async () => {
    syncActivitySpy.mockRejectedValueOnce(new AppError('Bitrix API 500', 500));

    await expect(
      domainEventMesh.publish({
        eventType: 'VOICE_CALL_COMPLETED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'call-5xx',
        producer: 'birth-voice',
        aggregateId: 'lead-123',
        payload: { leadId: 'lead-123' },
      }),
    ).rejects.toThrow('Bitrix API 500');

    const records = domainEventMesh.getOutboxRecords();
    expect(records.some((r) => r.status === 'FAILED')).toBe(true);
  });

  it('deve tratar AppError 429 como transitório — rate limit exige retry, não descarte permanente', async () => {
    syncActivitySpy.mockRejectedValueOnce(new AppError('Bitrix rate limit', 429));

    await expect(
      domainEventMesh.publish({
        eventType: 'WHATSAPP_MESSAGE_SENT',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'wa-429',
        producer: 'integrations.whatsapp',
        aggregateId: 'lead-123',
        payload: {
          waMessageId: 'msg-429',
          phoneE164: '+5511999998888',
          body: 'Rate limit',
          direction: 'outbound',
          leadId: 'lead-123',
        },
      }),
    ).rejects.toThrow('Bitrix rate limit');
  });

  it('deve tratar AppError 408 como transitório — timeout exige retry, não descarte permanente', async () => {
    postCommentSpy.mockRejectedValueOnce(new AppError('Bitrix timeout', 408));

    await expect(
      domainEventMesh.publish({
        eventType: 'LEAD_REACTIVATED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'react-408',
        producer: 'reactivation-service',
        aggregateId: 'lead-123',
        payload: { leadId: 'lead-123' },
      }),
    ).rejects.toThrow('Bitrix timeout');
  });

  it('deve propagar erro transitório em handler de comentário (postCommentToBitrix) para o outbox', async () => {
    postCommentSpy.mockRejectedValueOnce(new Error('timeline indisponível'));

    await expect(
      domainEventMesh.publish({
        eventType: 'COMMERCIAL_PROPOSAL_DRAFTED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'prop-fail',
        producer: 'proposal-service',
        aggregateId: 'lead-123',
        payload: { leadId: 'lead-123', proposalId: 'PROP-1' },
      }),
    ).rejects.toThrow('timeline indisponível');

    const records = domainEventMesh.getOutboxRecords();
    expect(records.some((r) => r.status === 'FAILED' && r.lastError)).toBe(true);
  });

  it('deve tratar erro permanente (4xx) em handler de comentário como best-effort — outbox DISPATCHED', async () => {
    postCommentSpy.mockRejectedValueOnce(new AppError('Deal sem vínculo Bitrix', 422));

    await expect(
      domainEventMesh.publish({
        eventType: 'DEAL_RISK_SPIKED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'risk-perm',
        producer: 'deal-risk-service',
        aggregateId: 'lead-123',
        payload: { leadId: 'lead-123', reason: 'Risco qualquer' },
      }),
    ).resolves.toBeDefined();

    const records = domainEventMesh.getOutboxRecords();
    expect(records.some((r) => r.status === 'DISPATCHED')).toBe(true);
  });

  it('deve propagar erro transitório em handler de reunião para o outbox', async () => {
    syncActivitySpy.mockRejectedValueOnce(new Error('Bitrix fora do ar'));

    await expect(
      domainEventMesh.publish({
        eventType: 'MEETING_SCHEDULED_CALENDAR',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'meeting-fail',
        producer: 'calendar-service',
        aggregateId: 'lead-123',
        payload: { leadId: 'lead-123', title: 'Reunião' },
      }),
    ).rejects.toThrow('Bitrix fora do ar');
  });

  it('deve tratar erro permanente (4xx) em handler de reunião como best-effort', async () => {
    syncActivitySpy.mockRejectedValueOnce(new AppError('Lead sem vínculo Bitrix', 404));

    await expect(
      domainEventMesh.publish({
        eventType: 'CRM_MEETING_SCHEDULED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'meeting-perm',
        producer: 'calendar-service',
        aggregateId: 'lead-123',
        payload: { leadId: 'lead-123', title: 'Reunião' },
      }),
    ).resolves.toBeDefined();
  });

  it('deve ignorar webhook Bitrix sem leadId no payload — não consulta o banco', async () => {
    const findFirstSpy = vi.spyOn(prisma.lead, 'findFirst');

    await domainEventMesh.publish({
      eventType: 'BITRIX_WEBHOOK_RECEIVED',
      eventVersion: '1.0.0',
      organizationId: 'tenant-alpha',
      correlationId: 'webhook-sem-leadid',
      producer: 'bitrix-webhook-service',
      aggregateId: 'lead-123',
      payload: {
        connectionId: 'conn-1',
        eventType: 'ONCRMLEADUPDATE',
        bitrixRecordId: 'b-88',
        entityType: 'lead',
        stageId: 'PROPOSAL',
      },
    });

    expect(findFirstSpy).not.toHaveBeenCalled();
  });

  it('deve ignorar webhook Bitrix quando lead local não existe', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue(null as never);

    await expect(
      domainEventMesh.publish({
        eventType: 'BITRIX_WEBHOOK_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'webhook-no-lead',
        producer: 'bitrix-webhook-service',
        aggregateId: 'lead-404',
        payload: {
          connectionId: 'conn-1',
          eventType: 'ONCRMLEADUPDATE',
          bitrixRecordId: 'b-99',
          entityType: 'lead',
          leadId: 'lead-404',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('deve ignorar webhook Bitrix quando lead não possui contato', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue({
      id: 'lead-123',
      organizationId: 'tenant-alpha',
      contact: null,
    } as never);

    await expect(
      domainEventMesh.publish({
        eventType: 'BITRIX_WEBHOOK_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'webhook-no-contact',
        producer: 'bitrix-webhook-service',
        aggregateId: 'lead-123',
        payload: {
          connectionId: 'conn-1',
          eventType: 'ONCRMLEADUPDATE',
          bitrixRecordId: 'b-100',
          entityType: 'lead',
          leadId: 'lead-123',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('deve ignorar webhook Bitrix quando contato não possui telefone nem WhatsApp', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue({
      id: 'lead-123',
      organizationId: 'tenant-alpha',
      contact: { phone: null, whatsapp: null },
    } as never);

    await expect(
      domainEventMesh.publish({
        eventType: 'BITRIX_WEBHOOK_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'webhook-no-phone',
        producer: 'bitrix-webhook-service',
        aggregateId: 'lead-123',
        payload: {
          connectionId: 'conn-1',
          eventType: 'ONCRMLEADUPDATE',
          bitrixRecordId: 'b-101',
          entityType: 'lead',
          leadId: 'lead-123',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('deve processar webhook Bitrix usando fallback de telefone quando whatsapp está vazio', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockResolvedValue({
      id: 'lead-123',
      organizationId: 'tenant-alpha',
      contact: { phone: '+5511888887777', whatsapp: null },
    } as never);

    await expect(
      domainEventMesh.publish({
        eventType: 'BITRIX_WEBHOOK_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'webhook-phone-fallback',
        producer: 'bitrix-webhook-service',
        aggregateId: 'lead-123',
        payload: {
          connectionId: 'conn-1',
          eventType: 'ONCRMLEADUPDATE',
          bitrixRecordId: 'b-102',
          entityType: 'lead',
          leadId: 'lead-123',
          stageId: 'PROPOSAL',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('deve propagar erro transitório do banco no webhook Bitrix para retry/DLQ', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockRejectedValueOnce(new Error('connection reset'));

    await expect(
      domainEventMesh.publish({
        eventType: 'BITRIX_WEBHOOK_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'webhook-db-fail',
        producer: 'bitrix-webhook-service',
        aggregateId: 'lead-123',
        payload: {
          connectionId: 'conn-1',
          eventType: 'ONCRMLEADUPDATE',
          bitrixRecordId: 'b-103',
          entityType: 'lead',
          leadId: 'lead-123',
        },
      }),
    ).rejects.toThrow('connection reset');
  });

  it('deve tratar erro permanente (4xx) no webhook Bitrix como best-effort', async () => {
    vi.spyOn(prisma.lead, 'findFirst').mockRejectedValueOnce(
      new AppError('Registro inválido', 400),
    );

    await expect(
      domainEventMesh.publish({
        eventType: 'BITRIX_WEBHOOK_RECEIVED',
        eventVersion: '1.0.0',
        organizationId: 'tenant-alpha',
        correlationId: 'webhook-perm',
        producer: 'bitrix-webhook-service',
        aggregateId: 'lead-123',
        payload: {
          connectionId: 'conn-1',
          eventType: 'ONCRMLEADUPDATE',
          bitrixRecordId: 'b-104',
          entityType: 'lead',
          leadId: 'lead-123',
        },
      }),
    ).resolves.toBeDefined();
  });
});

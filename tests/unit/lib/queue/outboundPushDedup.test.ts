import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ONDA3-23 (Agente 23 — Pina): deduplicação de jobId vs. idempotência de negócio nas filas
 * outbound de CRM. Cobre dois defeitos corrigidos nesta onda:
 *
 * 1. `externalCrmOutbound.queue.ts` usava `Date.now()` no jobId — dedup NUNCA ocorria
 *    (retry/double-submit da mesma atualização gerava N pushes idênticos). Agora o jobId é
 *    `crm-push:{org}:{lead}:{hash(payload)}`: payload idêntico deduplica, payload novo não.
 * 2. `bitrixOutbound.queue.ts` e `externalCrmOutbound.queue.ts`: um job `completed`/`failed`
 *    retido por `removeOnComplete`/`removeOnFail` continuava ocupando o jobId e o `add`
 *    deduplicava contra ele — re-push legítimo dentro da janela de retenção era engolido.
 *    Agora o registro terminal é removido antes de re-enfileirar.
 */

const queueState = vi.hoisted(() => ({
  jobs: new Map<
    string,
    { state: string; remove: ReturnType<typeof vi.fn>; data: unknown }
  >(),
  added: [] as Array<{ name: string; data: unknown; opts: { jobId?: string } }>,
}));

vi.mock('bullmq', () => {
  class MockQueue {
    constructor(public name: string) {}
    async getJob(jobId: string) {
      const found = queueState.jobs.get(`${this.name}:${jobId}`);
      if (!found) return undefined;
      return {
        id: jobId,
        data: found.data,
        getState: async () => found.state,
        remove: found.remove,
      };
    }
    async add(name: string, data: unknown, opts: { jobId?: string }) {
      queueState.added.push({ name, data, opts });
      return { id: opts.jobId ?? `auto-${queueState.added.length}` };
    }
    on() {
      return this;
    }
  }
  class MockWorker {
    on() {
      return this;
    }
  }
  return { Queue: MockQueue, Worker: MockWorker };
});

vi.mock('../../../../src/lib/queue/redis.js', () => ({
  connection: {},
  queuesEnabled: true,
}));

vi.mock('../../../../src/lib/queue/metrics.js', () => ({
  registerQueueForMetrics: vi.fn(),
  recordQueueJobCompleted: vi.fn(),
}));

vi.mock('../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../../../src/features/integrations/bitrix/service/outboundSync.js', () => ({
  pushLeadToBitrix: vi.fn(),
}));

vi.mock('../../../../src/features/integrations/shared/ExternalCrmService.js', () => ({
  ExternalCrmService: { pushLeadToAllConnections: vi.fn() },
}));

vi.mock('../../../../src/lib/queue/deadLetter.js', () => ({
  recordDeadLetter: vi.fn(),
  isFinalAttempt: vi.fn(),
}));

const { queueLeadPushToBitrix, BITRIX_OUTBOUND_QUEUE_NAME } = await import(
  '../../../../src/lib/queue/bitrixOutbound.queue.js'
);
const { queueLeadPushToExternalCrms, EXTERNAL_CRM_OUTBOUND_QUEUE_NAME } = await import(
  '../../../../src/lib/queue/externalCrmOutbound.queue.js'
);

beforeEach(() => {
  queueState.jobs.clear();
  queueState.added.length = 0;
});

function seedJob(queueName: string, jobId: string, state: string) {
  // O mock de Queue não distingue instâncias; o sufixo da fila vai embutido na chave para
  // os dois módulos compartilharem o mesmo mapa sem colisão.
  queueState.jobs.set(`${queueName}:${jobId}`, {
    state,
    remove: vi.fn().mockResolvedValue(undefined),
    data: {},
  });
  return queueState.jobs.get(`${queueName}:${jobId}`)!;
}

describe('ONDA3-23 — bitrixOutbound: re-push após job terminal', () => {
  it('remove job completed retido por removeOnComplete antes de re-enfileirar (não engole a 2ª mudança de etapa)', async () => {
    const jobId = 'bitrix-push-org-1-lead-1';
    const existing = seedJob(BITRIX_OUTBOUND_QUEUE_NAME, jobId, 'completed');

    await queueLeadPushToBitrix('org-1', 'lead-1');

    expect(existing.remove).toHaveBeenCalledTimes(1);
    expect(queueState.added).toHaveLength(1);
    expect(queueState.added[0].opts.jobId).toBe(jobId);
  });

  it('remove job failed retido por removeOnFail (7d) antes de re-enfileirar', async () => {
    const jobId = 'bitrix-push-org-1-lead-2';
    const existing = seedJob(BITRIX_OUTBOUND_QUEUE_NAME, jobId, 'failed');

    await queueLeadPushToBitrix('org-1', 'lead-2');

    expect(existing.remove).toHaveBeenCalledTimes(1);
    expect(queueState.added).toHaveLength(1);
  });

  it('NÃO remove job ainda pendente — o add deduplica contra ele (estado mais recente é relido na execução)', async () => {
    const jobId = 'bitrix-push-org-1-lead-3';
    const existing = seedJob(BITRIX_OUTBOUND_QUEUE_NAME, jobId, 'waiting');

    await queueLeadPushToBitrix('org-1', 'lead-3');

    expect(existing.remove).not.toHaveBeenCalled();
    expect(queueState.added).toHaveLength(1);
    expect(queueState.added[0].opts.jobId).toBe(jobId);
  });
});

describe('ONDA3-23 — externalCrmOutbound: jobId determinístico por payload', () => {
  const basePayload = { name: 'Lead X', amount: 1000, stageLabel: 'Qualificado' };

  it('payload idêntico gera o MESMO jobId (dedup de retry/double-submit)', async () => {
    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-1',
      payload: basePayload,
    });
    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-1',
      // ordem das chaves diferente não pode gerar hash diferente
      payload: { stageLabel: 'Qualificado', amount: 1000, name: 'Lead X' },
    });

    expect(queueState.added).toHaveLength(2);
    expect(queueState.added[0].opts.jobId).toBe(queueState.added[1].opts.jobId);
    expect(queueState.added[0].opts.jobId).toMatch(/^crm-push-org-1-lead-1-[0-9a-f]{16}$/);
  });

  it('payload diferente (nova etapa) gera jobId DIFERENTE (push legítimo não é engolido)', async () => {
    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-1',
      payload: basePayload,
    });
    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-1',
      payload: { ...basePayload, stageLabel: 'Negociação' },
    });

    expect(queueState.added[0].opts.jobId).not.toBe(queueState.added[1].opts.jobId);
  });

  it('tenants diferentes nunca colidem no jobId (sem vazamento cross-tenant na fila)', async () => {
    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-1',
      payload: basePayload,
    });
    await queueLeadPushToExternalCrms({
      organizationId: 'org-2',
      leadId: 'lead-1',
      payload: basePayload,
    });

    expect(queueState.added[0].opts.jobId).not.toBe(queueState.added[1].opts.jobId);
    expect(queueState.added[0].opts.jobId).toContain('org-1');
    expect(queueState.added[1].opts.jobId).toContain('org-2');
  });

  it('remove job terminal com o MESMO jobId antes de re-enfileirar payload idêntico', async () => {
    // Descobre o jobId que o primeiro enqueue geraria e semeia um job 'completed' com ele.
    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-9',
      payload: basePayload,
    });
    const jobId = queueState.added[0].opts.jobId!;
    queueState.added.length = 0;
    const existing = seedJob(EXTERNAL_CRM_OUTBOUND_QUEUE_NAME, jobId, 'completed');

    await queueLeadPushToExternalCrms({
      organizationId: 'org-1',
      leadId: 'lead-9',
      payload: basePayload,
    });

    expect(existing.remove).toHaveBeenCalledTimes(1);
    expect(queueState.added).toHaveLength(1);
    expect(queueState.added[0].opts.jobId).toBe(jobId);
  });
});

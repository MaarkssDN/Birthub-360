import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import client from 'prom-client';

vi.mock('../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

/**
 * Handoff: .agents/handoffs/onda-4/10-para-07-metricas-fila-orcamento-ia.md — o Agente 10 escreveu
 * regras de alerta (infrastructure/observability/alert.rules.yml) contra
 * bullmq_queue_waiting_jobs/active_jobs/completed_jobs, que não existiam até este módulo. Estes
 * testes comprovam que os Gauges/Counter realmente ficam populados sob carga simulada, não só que
 * o módulo importa sem lançar.
 */
describe('src/lib/queue/metrics.ts', () => {
  beforeEach(() => {
    client.register.clear();
  });

  afterEach(() => {
    vi.resetModules();
    client.register.clear();
  });

  it('reports real waiting/active/failed counts per registered queue on collect', async () => {
    const {
      registerQueueForMetrics,
      bullmqQueueWaitingJobs,
      bullmqQueueActiveJobs,
      bullmqQueueFailedJobs,
    } = await import('../../../../src/lib/queue/metrics.js');

    const fakeQueue = {
      getWaitingCount: vi.fn().mockResolvedValue(7),
      getActiveCount: vi.fn().mockResolvedValue(2),
      getFailedCount: vi.fn().mockResolvedValue(1),
    };

    // @ts-expect-error mock parcial de Queue
    registerQueueForMetrics('test-queue', fakeQueue);

    const metrics = await client.register.getMetricsAsJSON();
    const waiting = metrics.find((m) => m.name === 'bullmq_queue_waiting_jobs');
    const active = metrics.find((m) => m.name === 'bullmq_queue_active_jobs');
    const failed = metrics.find((m) => m.name === 'bullmq_queue_failed_jobs');

    expect(fakeQueue.getWaitingCount).toHaveBeenCalled();
    expect(fakeQueue.getActiveCount).toHaveBeenCalled();
    expect(fakeQueue.getFailedCount).toHaveBeenCalled();
    type MetricWithValues = { values: Array<{ value: number; labels: { queue: string } }> };
    expect((waiting as unknown as MetricWithValues)?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 7, labels: { queue: 'test-queue' } }),
      ]),
    );
    expect((active as unknown as MetricWithValues)?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 2, labels: { queue: 'test-queue' } }),
      ]),
    );
    expect((failed as unknown as MetricWithValues)?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 1, labels: { queue: 'test-queue' } }),
      ]),
    );

    void bullmqQueueWaitingJobs;
    void bullmqQueueActiveJobs;
    void bullmqQueueFailedJobs;
  });

  it('ignores a null/undefined queue (Redis não configurado) instead of throwing at scrape time', async () => {
    const { registerQueueForMetrics } = await import('../../../../src/lib/queue/metrics.js');

    expect(() => registerQueueForMetrics('disabled-queue', null)).not.toThrow();
    await expect(client.register.getMetricsAsJSON()).resolves.toBeDefined();
  });

  it('does not let one failing queue scrape break metrics for the others', async () => {
    const { registerQueueForMetrics } = await import('../../../../src/lib/queue/metrics.js');

    const brokenQueue = {
      getWaitingCount: vi.fn().mockRejectedValue(new Error('Redis offline')),
      getActiveCount: vi.fn().mockRejectedValue(new Error('Redis offline')),
      getFailedCount: vi.fn().mockRejectedValue(new Error('Redis offline')),
    };
    const healthyQueue = {
      getWaitingCount: vi.fn().mockResolvedValue(3),
      getActiveCount: vi.fn().mockResolvedValue(0),
      getFailedCount: vi.fn().mockResolvedValue(0),
    };

    // @ts-expect-error mock parcial de Queue
    registerQueueForMetrics('broken-queue', brokenQueue);
    // @ts-expect-error mock parcial de Queue
    registerQueueForMetrics('healthy-queue', healthyQueue);

    const metrics = await client.register.getMetricsAsJSON();
    const waiting = metrics.find((m) => m.name === 'bullmq_queue_waiting_jobs');
    expect(
      (waiting as unknown as { values: Array<{ value: number; labels: { queue: string } }> })
        ?.values,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 3, labels: { queue: 'healthy-queue' } }),
      ]),
    );
  });

  it('increments a monotonic counter of completed jobs per queue', async () => {
    const { recordQueueJobCompleted } = await import('../../../../src/lib/queue/metrics.js');

    recordQueueJobCompleted('completion-queue');
    recordQueueJobCompleted('completion-queue');
    recordQueueJobCompleted('other-queue');

    const metrics = await client.register.getMetricsAsJSON();
    const completed = metrics.find((m) => m.name === 'bullmq_queue_completed_jobs');
    expect(
      (completed as unknown as { values: Array<{ value: number; labels: { queue: string } }> })
        ?.values,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 2, labels: { queue: 'completion-queue' } }),
        expect.objectContaining({ value: 1, labels: { queue: 'other-queue' } }),
      ]),
    );
  });

  // CPI (auditoria — "Alerta real de Redis health" nunca tinha métrica real, ver
  // .agents/handoffs/onda-39/*). redis_connection_up expõe `.status` de cada conexão ioredis
  // registrada, mas só para papéis habilitados nesta configuração — uma conexão que nunca
  // deveria ligar de propósito (enabled() === false) não deve gerar série (evitaria alerta
  // falso-positivo).
  describe('registerRedisConnectionForMetrics / redisConnectionUp', () => {
    it('reporta 1 quando a conexão está "ready" e 0 caso contrário, só para papéis habilitados', async () => {
      const { registerRedisConnectionForMetrics } =
        await import('../../../../src/lib/queue/metrics.js');

      const readyRedis = { status: 'ready' } as unknown as import('ioredis').Redis;
      const reconnectingRedis = { status: 'reconnecting' } as unknown as import('ioredis').Redis;

      registerRedisConnectionForMetrics('bullmq', readyRedis, () => true);
      registerRedisConnectionForMetrics('rate-limit', reconnectingRedis, () => true);
      registerRedisConnectionForMetrics('cache', reconnectingRedis, () => false);

      const metrics = await client.register.getMetricsAsJSON();
      const up = metrics.find((m) => m.name === 'redis_connection_up');
      const values =
        (up as unknown as { values: Array<{ value: number; labels: { role: string } }> })?.values ??
        [];

      expect(values).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 1, labels: { role: 'bullmq' } }),
          expect.objectContaining({ value: 0, labels: { role: 'rate-limit' } }),
        ]),
      );
      // 'cache' está desabilitado nesta config (enabled() === false) — nunca deveria reportar
      // série, ou o dashboard/alerta veria uma conexão "caída" que nunca deveria estar ligada.
      expect(values.find((v) => v.labels.role === 'cache')).toBeUndefined();
    });

    it('ignora um segundo registro do mesmo papel (evita duplicar série)', async () => {
      const { registerRedisConnectionForMetrics } =
        await import('../../../../src/lib/queue/metrics.js');

      const first = { status: 'ready' } as unknown as import('ioredis').Redis;
      const second = { status: 'reconnecting' } as unknown as import('ioredis').Redis;

      registerRedisConnectionForMetrics('bullmq', first, () => true);
      registerRedisConnectionForMetrics('bullmq', second, () => true);

      const metrics = await client.register.getMetricsAsJSON();
      const up = metrics.find((m) => m.name === 'redis_connection_up');
      const values =
        (up as unknown as { values: Array<{ value: number; labels: { role: string } }> })?.values ??
        [];

      expect(values.filter((v) => v.labels.role === 'bullmq')).toHaveLength(1);
      expect(values.find((v) => v.labels.role === 'bullmq')).toMatchObject({ value: 1 });
    });
  });
});

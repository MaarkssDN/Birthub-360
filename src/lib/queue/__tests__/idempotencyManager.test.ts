import { describe, expect, it } from 'vitest';
import { buildDedupJobId, GOVERNED_QUEUE_JOB_OPTIONS } from '../jobPolicy.js';
import { IdempotencyManager } from '../idempotencyManager.js';

describe('IdempotencyManager (bounds — MEL-48)', () => {
  it('deduplica chave já processada dentro do TTL', async () => {
    const mgr = new IdempotencyManager({ sweepIntervalMs: 0 });
    expect(await mgr.acquireLock('k1')).toBe(true);
    expect(await mgr.acquireLock('k1')).toBe(false);
    expect(mgr.isProcessed('k1')).toBe(true);
    mgr.dispose();
  });

  it('releaseLock permite reprocessar a mesma chave', async () => {
    const mgr = new IdempotencyManager({ sweepIntervalMs: 0 });
    await mgr.acquireLock('k2');
    await mgr.releaseLock('k2');
    expect(await mgr.acquireLock('k2')).toBe(true);
    mgr.dispose();
  });

  it('expira chaves após o TTL', async () => {
    const mgr = new IdempotencyManager({ ttlMs: 30, sweepIntervalMs: 0 });
    await mgr.acquireLock('k3');
    await new Promise((r) => setTimeout(r, 40));
    expect(mgr.isProcessed('k3')).toBe(false);
    expect(await mgr.acquireLock('k3')).toBe(true);
    mgr.dispose();
  });

  it('não cresce além de maxKeys — despeja as entradas mais antigas', async () => {
    const mgr = new IdempotencyManager({ maxKeys: 3, ttlMs: 60_000, sweepIntervalMs: 0 });
    for (const k of ['a', 'b', 'c', 'd', 'e']) {
      // força sweep a cada acquire acima do teto
      await mgr.acquireLock(k);
    }
    // 'a' e 'b' já devem ter sido despejadas pelo teto de 3
    expect(mgr.isProcessed('a')).toBe(false);
    expect(mgr.isProcessed('b')).toBe(false);
    expect(mgr.isProcessed('c')).toBe(true);
    expect(mgr.isProcessed('d')).toBe(true);
    expect(mgr.isProcessed('e')).toBe(true);
    mgr.dispose();
  });
});

describe('jobPolicy (MEL-48)', () => {
  it('GOVERNED_QUEUE_JOB_OPTIONS tem retry finito com backoff e retenção limitada', () => {
    expect(GOVERNED_QUEUE_JOB_OPTIONS.attempts).toBe(3);
    expect(GOVERNED_QUEUE_JOB_OPTIONS.backoff).toEqual({
      type: 'exponential',
      delay: 5_000,
    });
    expect(GOVERNED_QUEUE_JOB_OPTIONS.removeOnFail).toBeDefined();
    expect(GOVERNED_QUEUE_JOB_OPTIONS.removeOnComplete).toBeDefined();
  });

  it('buildDedupJobId é determinístico e inclui todos os identificadores', () => {
    expect(buildDedupJobId('crm-push', 'org1', 'lead1', 'abc')).toBe(
      buildDedupJobId('crm-push', 'org1', 'lead1', 'abc'),
    );
    expect(buildDedupJobId('crm-push', 'org1', 'lead1', 'abc')).not.toBe(
      buildDedupJobId('crm-push', 'org1', 'lead1', 'def'),
    );
  });
});

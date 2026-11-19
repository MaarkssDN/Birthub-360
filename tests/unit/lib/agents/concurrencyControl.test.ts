import { describe, expect, it } from 'vitest';
import {
  AgentConcurrencyLimiter,
  ConcurrencyLimitExceededException,
} from '../../../../src/lib/agents/concurrencyControl.js';

describe('AgentConcurrencyLimiter — Controle de Concorrência de Agentes', () => {
  it('permite aquisição e liberação correta de slots', () => {
    const limiter = new AgentConcurrencyLimiter({
      maxConcurrentPerTenant: 3,
      maxConcurrentPerRole: 2,
    });

    const release1 = limiter.acquireSlot('tenant-1', 'sdr');
    expect(limiter.getActiveTenantCount('tenant-1')).toBe(1);
    expect(limiter.getActiveRoleCount('tenant-1', 'sdr')).toBe(1);

    const release2 = limiter.acquireSlot('tenant-1', 'sdr');
    expect(limiter.getActiveTenantCount('tenant-1')).toBe(2);
    expect(limiter.getActiveRoleCount('tenant-1', 'sdr')).toBe(2);

    release1();
    expect(limiter.getActiveTenantCount('tenant-1')).toBe(1);
    expect(limiter.getActiveRoleCount('tenant-1', 'sdr')).toBe(1);

    release2();
    expect(limiter.getActiveTenantCount('tenant-1')).toBe(0);
    expect(limiter.getActiveRoleCount('tenant-1', 'sdr')).toBe(0);
  });

  it('bloqueia quando o limite do cargo é excedido', () => {
    const limiter = new AgentConcurrencyLimiter({
      maxConcurrentPerTenant: 5,
      maxConcurrentPerRole: 2,
    });

    limiter.acquireSlot('tenant-1', 'closer');
    limiter.acquireSlot('tenant-1', 'closer');

    expect(() => {
      limiter.acquireSlot('tenant-1', 'closer');
    }).toThrow(ConcurrencyLimitExceededException);
  });

  it('bloqueia quando o limite total do tenant é excedido', () => {
    const limiter = new AgentConcurrencyLimiter({
      maxConcurrentPerTenant: 2,
      maxConcurrentPerRole: 2,
    });

    limiter.acquireSlot('tenant-1', 'sdr');
    limiter.acquireSlot('tenant-1', 'bdr');

    expect(() => {
      limiter.acquireSlot('tenant-1', 'closer');
    }).toThrow(ConcurrencyLimitExceededException);
  });

  it('runWithLimit garante liberação de slot mesmo com exceção', async () => {
    const limiter = new AgentConcurrencyLimiter({
      maxConcurrentPerTenant: 2,
      maxConcurrentPerRole: 2,
    });

    await expect(
      limiter.runWithLimit('tenant-1', 'ops', async () => {
        expect(limiter.getActiveRoleCount('tenant-1', 'ops')).toBe(1);
        throw new Error('Falha simulada na execução');
      }),
    ).rejects.toThrow('Falha simulada na execução');

    expect(limiter.getActiveRoleCount('tenant-1', 'ops')).toBe(0);
    expect(limiter.getActiveTenantCount('tenant-1')).toBe(0);
  });
});

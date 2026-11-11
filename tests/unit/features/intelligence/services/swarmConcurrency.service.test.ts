import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acquireMissionSlot,
  cancelMissionWait,
  getSwarmConcurrencyState,
  releaseMissionSlot,
} from '../../../../../src/features/intelligence/services/swarmConcurrency.service.js';

// Gate de concorrência/idempotência do enxame — estado em memória por org.
// Cada teste usa organizationId único para não vazar estado entre casos.

const ENV_KEYS = ['SWARM_MAX_CONCURRENT_MISSIONS', 'SWARM_MISSION_QUEUE_TIMEOUT_MS'] as const;
const savedEnv: Record<string, string | undefined> = Object.fromEntries(
  ENV_KEYS.map((k) => [k, process.env[k]]),
);

function setMax(n: number) {
  process.env.SWARM_MAX_CONCURRENT_MISSIONS = String(n);
}

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.useRealTimers();
});

describe('swarmConcurrency.service', () => {
  it('concede slot imediato abaixo do limite e libera depois', async () => {
    setMax(2);
    const org = 'org-a1';
    await expect(acquireMissionSlot(org, 's1')).resolves.toBe('acquired');
    expect(getSwarmConcurrencyState(org).active).toBe(1);
    releaseMissionSlot(org, 's1');
    expect(getSwarmConcurrencyState(org).active).toBe(0);
  });

  it('rejeita sessionId duplicado na mesma org (idempotência)', async () => {
    setMax(4);
    const org = 'org-a2';
    await acquireMissionSlot(org, 'dup-1');
    await expect(acquireMissionSlot(org, 'dup-1')).resolves.toBe('duplicate');
    releaseMissionSlot(org, 'dup-1');
    await expect(acquireMissionSlot(org, 'dup-1')).resolves.toBe('acquired');
    releaseMissionSlot(org, 'dup-1');
  });

  it('mesmo sessionId em orgs diferentes NÃO colide (isolamento tenant)', async () => {
    setMax(1);
    await acquireMissionSlot('org-a3', 'shared-sid');
    await expect(acquireMissionSlot('org-b3', 'shared-sid')).resolves.toBe('acquired');
    releaseMissionSlot('org-a3', 'shared-sid');
    releaseMissionSlot('org-b3', 'shared-sid');
  });

  it('enfileira além do limite e promove na ordem FIFO ao liberar', async () => {
    setMax(1);
    const org = 'org-a4';
    await acquireMissionSlot(org, 'first');

    const order: string[] = [];
    const p2 = acquireMissionSlot(org, 'second').then((r) => {
      order.push(`second:${r}`);
      return r;
    });
    const p3 = acquireMissionSlot(org, 'third').then((r) => {
      order.push(`third:${r}`);
      return r;
    });

    // ainda na fila
    expect(getSwarmConcurrencyState(org).waiting).toBe(2);

    releaseMissionSlot(org, 'first');
    await expect(p2).resolves.toBe('acquired');
    expect(getSwarmConcurrencyState(org).active).toBe(1);

    releaseMissionSlot(org, 'second');
    await expect(p3).resolves.toBe('acquired');
    expect(order).toEqual(['second:acquired', 'third:acquired']);
    releaseMissionSlot(org, 'third');
  });

  it('notifica posição na fila via callback onQueued', async () => {
    setMax(1);
    const org = 'org-a5';
    await acquireMissionSlot(org, 'holder');
    const positions: number[] = [];
    const p = acquireMissionSlot(org, 'waiter', (pos) => positions.push(pos));
    expect(positions).toEqual([1]);
    releaseMissionSlot(org, 'holder');
    await expect(p).resolves.toBe('acquired');
    releaseMissionSlot(org, 'waiter');
  });

  it('timeout na fila retorna timeout e libera a espera', async () => {
    vi.useFakeTimers();
    process.env.SWARM_MISSION_QUEUE_TIMEOUT_MS = '50';
    setMax(1);
    const org = 'org-a6';
    await acquireMissionSlot(org, 'holder');
    const p = acquireMissionSlot(org, 'stuck');
    await vi.advanceTimersByTimeAsync(60);
    await expect(p).resolves.toBe('timeout');
    expect(getSwarmConcurrencyState(org).waiting).toBe(0);
    releaseMissionSlot(org, 'holder');
  });

  it('cancelMissionWait remove waiter sem afetar o ativo', async () => {
    setMax(1);
    const org = 'org-a7';
    await acquireMissionSlot(org, 'holder');
    const p = acquireMissionSlot(org, 'cancel-me');
    cancelMissionWait(org, 'cancel-me');
    // cancel resolve 'timeout' — o waiter desistiu, nunca executa.
    await expect(p).resolves.toBe('timeout');
    expect(getSwarmConcurrencyState(org).waiting).toBe(0);
    expect(getSwarmConcurrencyState(org).active).toBe(1);
    releaseMissionSlot(org, 'holder');
  });

  it('limite é configurável e clampeado em 8', async () => {
    process.env.SWARM_MAX_CONCURRENT_MISSIONS = '99';
    const org = 'org-a8';
    // adquire até o teto real (8) — o 9º deve enfileirar
    for (let i = 0; i < 8; i++) {
      await expect(acquireMissionSlot(org, `m${i}`)).resolves.toBe('acquired');
    }
    expect(getSwarmConcurrencyState(org).maxConcurrent).toBe(8);
    const ninth = acquireMissionSlot(org, 'm8');
    expect(getSwarmConcurrencyState(org).waiting).toBe(1);
    for (let i = 0; i < 8; i++) releaseMissionSlot(org, `m${i}`);
    await expect(ninth).resolves.toBe('acquired');
    releaseMissionSlot(org, 'm8');
  });
});

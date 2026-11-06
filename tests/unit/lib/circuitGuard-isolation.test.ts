import { beforeEach, describe, expect, it } from 'vitest';
import {
  CircuitOpenError,
  circuitGuard,
  getCircuitHealthSnapshot,
} from '../../../src/lib/circuitGuard.js';

describe('CircuitGuard Per-Dependency Isolation (DIV-AGENTE-16-002)', () => {
  beforeEach(() => {
    circuitGuard.reset();
  });

  it('opens only the redis circuit on consecutive Redis failures without affecting database, bitrix, or telephony', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(
        circuitGuard.execute('redis', async () => {
          throw new Error('Redis connection timeout');
        }),
      ).rejects.toThrow('Redis connection timeout');
    }

    expect(circuitGuard.getState('redis')).toBe('OPEN');
    expect(circuitGuard.isOpen('redis')).toBe(true);

    // Demais circuitos permanecem estritamente CLOSED e operacionais
    expect(circuitGuard.getState('database')).toBe('CLOSED');
    expect(circuitGuard.getState('bitrix')).toBe('CLOSED');
    expect(circuitGuard.getState('telephony')).toBe('CLOSED');

    // Chamada subsequente ao Redis falha imediatamente com CircuitOpenError
    await expect(
      circuitGuard.execute('redis', async () => 'cached-value'),
    ).rejects.toThrow(CircuitOpenError);

    // Leitura direta no banco PostgreSQL continua executando normalmente sem falso positivo
    const dbResult = await circuitGuard.execute('database', async () => ({
      rows: [{ id: 'lead-1' }],
    }));
    expect(dbResult).toEqual({ rows: [{ id: 'lead-1' }] });
  });

  it('transitions from OPEN to HALF_OPEN after cooldownMs and closes again on successful probe', async () => {
    const baseTime = 1_700_000_000_000;

    circuitGuard.recordFailure('redis', new Error('ERR 1'), baseTime);
    circuitGuard.recordFailure('redis', new Error('ERR 2'), baseTime + 100);
    circuitGuard.recordFailure('redis', new Error('ERR 3'), baseTime + 200);

    expect(circuitGuard.getState('redis', baseTime + 500)).toBe('OPEN');

    // Após o cooldown padrão de 30_000ms, entra em HALF_OPEN
    const afterCooldown = baseTime + 31_000;
    expect(circuitGuard.getState('redis', afterCooldown)).toBe('HALF_OPEN');

    // Sucesso na sondagem fecha o circuito
    const res = await circuitGuard.execute(
      'redis',
      async () => 'PONG',
      { nowMs: afterCooldown },
    );
    expect(res).toBe('PONG');
    expect(circuitGuard.getState('redis', afterCooldown + 10)).toBe('CLOSED');
  });

  it('exposes granular status per dependency in getCircuitHealthSnapshot', () => {
    circuitGuard.recordFailure('bitrix', new Error('Bitrix 503'));
    const snapshot = getCircuitHealthSnapshot();

    expect(snapshot.redis.state).toBe('CLOSED');
    expect(snapshot.database.state).toBe('CLOSED');
    expect(snapshot.bitrix.failures).toBe(1);
    expect(snapshot.bitrix.lastError).toBe('Bitrix 503');
  });
});

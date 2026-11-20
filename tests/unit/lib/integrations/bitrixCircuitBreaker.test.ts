import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BitrixCircuitBreaker,
  BitrixCircuitBreakerError,
} from '../../../../src/lib/integrations/bitrix/client.js';

describe('Bitrix24 Circuit Breaker Fail-Fast Protection (B-11 Atlas)', () => {
  let breaker: BitrixCircuitBreaker;

  beforeEach(() => {
    breaker = new BitrixCircuitBreaker({
      failureThreshold: 3, // 3 failures to trip in test
      resetTimeoutMs: 100, // 100ms reset
      retryAfterSeconds: 5,
    });
  });

  it('allows requests through when circuit is CLOSED and tracks success', async () => {
    const mockAction = vi.fn().mockResolvedValue({ status: 'ok', data: [1, 2, 3] });

    const result = await breaker.execute(mockAction);

    expect(result).toEqual({ status: 'ok', data: [1, 2, 3] });
    expect(breaker.getState()).toBe('CLOSED');
    expect(mockAction).toHaveBeenCalledOnce();
  });

  it('trips circuit to OPEN on 3 consecutive failures and fails fast with 503', async () => {
    const failingAction = vi.fn().mockRejectedValue(new Error('Bitrix API 500 Internal Error'));

    // 1st failure
    await expect(breaker.execute(failingAction)).rejects.toThrow('Bitrix API 500 Internal Error');
    expect(breaker.getState()).toBe('CLOSED');

    // 2nd failure
    await expect(breaker.execute(failingAction)).rejects.toThrow('Bitrix API 500 Internal Error');
    expect(breaker.getState()).toBe('CLOSED');

    // 3rd failure: trips to OPEN!
    await expect(breaker.execute(failingAction)).rejects.toThrow('Bitrix API 500 Internal Error');
    expect(breaker.getState()).toBe('OPEN');

    // 4th call: FAIL-FAST without ever calling failingAction!
    const untriggeredAction = vi.fn();
    try {
      await breaker.execute(untriggeredAction);
      expect.fail('Should have thrown BitrixCircuitBreakerError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BitrixCircuitBreakerError);
      expect(err.statusCode).toBe(503);
      expect(err.retryAfterSeconds).toBeGreaterThan(0);
      expect(untriggeredAction).not.toHaveBeenCalled(); // Worker not blocked!
    }
  });

  it('recovers from HALF_OPEN back to CLOSED on successful probe', async () => {
    const failingAction = vi.fn().mockRejectedValue(new Error('Bitrix timeout'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingAction)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe('OPEN');

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(breaker.getState()).toBe('HALF_OPEN');

    // Successful probe
    const recoveryAction = vi.fn().mockResolvedValue({ recovered: true });
    const probeResult = await breaker.execute(recoveryAction);

    expect(probeResult).toEqual({ recovered: true });
    expect(breaker.getState()).toBe('CLOSED');
  });
});

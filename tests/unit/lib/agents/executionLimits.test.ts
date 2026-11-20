import { describe, expect, it } from 'vitest';
import {
  ExecutionTimeoutException,
  withExecutionTimeout,
} from '../../../../src/lib/agents/executionLimits.js';

describe('ExecutionLimits — Proteção contra Travamento e Timeout', () => {
  it('conclui com sucesso quando a ação termina antes do timeout', async () => {
    const action = new Promise<string>((resolve) => {
      setTimeout(() => resolve('sucesso'), 10);
    });

    const result = await withExecutionTimeout(action, {
      agentRole: 'sdr',
      timeoutMs: 100,
      correlationId: 'test-timeout-ok',
    });

    expect(result).toBe('sucesso');
  });

  it('lança ExecutionTimeoutException quando a ação ultrapassa o timeout', async () => {
    const slowAction = new Promise<string>((resolve) => {
      setTimeout(() => resolve('demorou'), 200);
    });

    await expect(
      withExecutionTimeout(slowAction, {
        agentRole: 'bdr',
        timeoutMs: 30,
        correlationId: 'test-timeout-fail',
      }),
    ).rejects.toThrow(ExecutionTimeoutException);
  });
});

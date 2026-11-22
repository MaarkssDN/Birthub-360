import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOOL_EXECUTOR_TIMEOUT_MS,
  getToolExecutor,
  ToolTimeoutError,
  withToolTimeout,
  type ToolExecutionContext,
  type ToolExecutionOutput,
} from '@/features/job-roles/services/toolExecutors.js';

const ctx = {} as ToolExecutionContext;
const okOutput: ToolExecutionOutput = {
  summary: 'ok',
  facts: [],
  metrics: {},
  evidence: [],
  missingData: [],
};

describe('withToolTimeout — timeout individual por ferramenta (TAREFA-SANEAMENTO-031)', () => {
  it('executor que resolve dentro do limite retorna o output normalmente', async () => {
    const executor = withToolTimeout(async () => okOutput, 'lead.read', 1000);
    await expect(executor(ctx)).resolves.toEqual(okOutput);
  });

  it('executor que nunca resolve é abortado com ToolTimeoutError TOOL_TIMEOUT', async () => {
    const hung = withToolTimeout(() => new Promise(() => {}), 'lead.enrich', 50);
    await expect(hung(ctx)).rejects.toBeInstanceOf(ToolTimeoutError);
    await expect(hung(ctx)).rejects.toThrow(/TOOL_TIMEOUT.*lead\.enrich.*50ms/);
  });

  it('erro do executor propaga sem ser convertido em timeout', async () => {
    const failing = withToolTimeout(async () => {
      throw new Error('falha real do serviço');
    }, 'lead.read', 1000);
    await expect(failing(ctx)).rejects.toThrow('falha real do serviço');
  });

  it('timeout default é finito e conservador (nunca infinito)', () => {
    expect(DEFAULT_TOOL_EXECUTOR_TIMEOUT_MS).toBeGreaterThan(0);
    expect(DEFAULT_TOOL_EXECUTOR_TIMEOUT_MS).toBeLessThanOrEqual(300_000);
  });
});

describe('getToolExecutor — registry sempre retorna executor com timeout aplicado', () => {
  it('capability registrada retorna executor (agora wrapped com timeout)', () => {
    const executor = getToolExecutor('lead.read');
    expect(typeof executor).toBe('function');
  });

  it('capability desconhecida continua retornando undefined (fail-closed preservado)', () => {
    expect(getToolExecutor('capability.inexistente')).toBeUndefined();
  });
});

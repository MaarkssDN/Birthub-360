import { describe, expect, it } from 'vitest';
import {
  agentRuntimeOrchestrator,
  ExecutionTimeoutException,
  TokenBudgetExceededException,
} from '../../../../src/lib/agents/index.js';

describe('AgentRuntimeOrchestrator — Governança Integrada em Runtime', () => {
  it('executa com sucesso integrando rastreabilidade e telemetria de tokens', async () => {
    const response = await agentRuntimeOrchestrator.execute({
      agentRole: 'sdr',
      tenantId: 'tenant-test',
      mission: 'Qualificar lead Acme Corp',
      input: { leadId: 'lead-123' },
      executor: async (ctx) => {
        expect(ctx.correlationId).toBeDefined();
        expect(ctx.traceParent).toBeDefined();
        expect(ctx.tenantId).toBe('tenant-test');

        return {
          result: { qualified: true, score: 85 },
          usage: {
            promptTokens: 400,
            completionTokens: 150,
            totalTokens: 550,
          },
        };
      },
    });

    expect(response.result).toEqual({ qualified: true, score: 85 });
    expect(response.tokensConsumed).toBe(550);
    expect(response.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('interrompe e lança erro quando o tempo limite de execução é violado', async () => {
    await expect(
      agentRuntimeOrchestrator.execute({
        agentRole: 'closer',
        tenantId: 'tenant-test',
        mission: 'Negociar proposta complexa',
        input: {},
        timeoutMs: 20,
        executor: async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return { result: 'nao-deve-chegar' };
        },
      }),
    ).rejects.toThrow(ExecutionTimeoutException);
  });

  it('interrompe e lança erro quando o limite de tokens da missão é violado', async () => {
    await expect(
      agentRuntimeOrchestrator.execute({
        agentRole: 'ops',
        tenantId: 'tenant-test',
        mission: 'Processar automação pesada',
        input: {},
        maxTokensPerTurn: 500,
        executor: async () => {
          return {
            result: 'feito',
            usage: {
              promptTokens: 600,
              completionTokens: 200,
              totalTokens: 800,
            },
          };
        },
      }),
    ).rejects.toThrow(TokenBudgetExceededException);
  });
});

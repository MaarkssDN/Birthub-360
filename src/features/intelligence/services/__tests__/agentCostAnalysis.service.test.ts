import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiLogGroupBy = vi.fn();

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    aILog: {
      groupBy: (...args: unknown[]) => aiLogGroupBy(...args),
    },
  },
}));

import { analyzeAgentCosts } from '../agentCostAnalysis.service.js';

// TAREFA-SANEAMENTO-042 / BT360-DT-0094 — métricas de custo de IA agregadas em UMA query
// groupBy por agentRole (antes: findMany de todas as linhas + agregação em memória, e ainda
// selecionando campos inexistentes no schema — costUsd/promptTokens/completionTokens).

describe('analyzeAgentCosts', () => {
  beforeEach(() => {
    aiLogGroupBy.mockReset();
  });

  it('agrega por agentRole em query única e devolve o shape AgentCostAnalysis', async () => {
    aiLogGroupBy.mockResolvedValue([
      {
        agentRole: 'SDR',
        _count: { _all: 4 },
        _sum: { cost: 1.2, tokens: 9000 },
      },
      {
        agentRole: 'CLOSER',
        _count: { _all: 2 },
        _sum: { cost: 0.8, tokens: 4000 },
      },
      {
        agentRole: null,
        _count: { _all: 1 },
        _sum: { cost: 0.1, tokens: 500 },
      },
    ]);

    const result = await analyzeAgentCosts('org-1', 30);

    expect(aiLogGroupBy).toHaveBeenCalledTimes(1);
    expect(aiLogGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['agentRole'],
        where: expect.objectContaining({ organizationId: 'org-1' }),
        _count: { _all: true },
        _sum: { cost: true, tokens: true },
      }),
    );

    // Ordenado por custo desc: SDR (1.2) > CLOSER (0.8) > UNKNOWN (0.1)
    expect(result.agents.map((a) => a.agentType)).toEqual(['SDR', 'CLOSER', 'UNKNOWN']);
    expect(result.agents[0]).toMatchObject({
      totalExecutions: 4,
      totalCostUsd: 1.2,
      avgCostPerExecution: 0.3,
      totalTokens: 9000,
      avgTokensPerExecution: 2250,
    });
    expect(result.totalCostUsd).toBeCloseTo(2.1);
    expect(result.mostExpensiveAgent).toBe('SDR');
    expect(result.mostEfficientAgent).toBe('UNKNOWN'); // menor avgCostPerExecution (0.1)
  });

  it('período sem logs retorna lista vazia e totais zerados', async () => {
    aiLogGroupBy.mockResolvedValue([]);

    const result = await analyzeAgentCosts('org-1', 7);

    expect(result.agents).toEqual([]);
    expect(result.totalCostUsd).toBe(0);
    expect(result.mostExpensiveAgent).toBe('Nenhum');
    expect(result.mostEfficientAgent).toBe('Nenhum');
  });

  it('propaga erro do banco (sem fallback silencioso)', async () => {
    aiLogGroupBy.mockRejectedValue(new Error('connection reset'));

    await expect(analyzeAgentCosts('org-1')).rejects.toThrow('connection reset');
  });

  it('_sum nulo de um grupo vira zero (não NaN)', async () => {
    aiLogGroupBy.mockResolvedValue([
      {
        agentRole: 'OPS',
        _count: { _all: 3 },
        _sum: { cost: null, tokens: null },
      },
    ]);

    const result = await analyzeAgentCosts('org-1');

    expect(result.agents[0]).toMatchObject({
      agentType: 'OPS',
      totalExecutions: 3,
      totalCostUsd: 0,
      avgCostPerExecution: 0,
      totalTokens: 0,
      avgTokensPerExecution: 0,
    });
  });
});

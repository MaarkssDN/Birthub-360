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

// TAREFA-SANEAMENTO-042 (BT360-DT-0094): o serviço agrega via `groupBy` no Postgres
// (não mais findMany + redução em memória) e mescla agentRole nulo com 'UNKNOWN'.

describe('analyzeAgentCosts — groupBy por agentRole', () => {
  beforeEach(() => {
    aiLogGroupBy.mockReset();
  });

  it('agrega custos por agente com uma única query groupBy', async () => {
    aiLogGroupBy.mockResolvedValue([
      { agentRole: 'SDR', _count: { _all: 4 }, _sum: { cost: 1.2, tokens: 9000 } },
      { agentRole: 'BDR', _count: { _all: 2 }, _sum: { cost: 0.8, tokens: 4000 } },
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

    expect(result.agents).toHaveLength(2);
    const sdr = result.agents.find((a) => a.agentType === 'SDR')!;
    expect(sdr.totalExecutions).toBe(4);
    expect(sdr.totalCostUsd).toBeCloseTo(1.2);
    expect(sdr.avgCostPerExecution).toBeCloseTo(0.3);
    expect(sdr.totalTokens).toBe(9000);
    expect(result.mostExpensiveAgent).toBe('SDR');
    // SDR: avg 0.30 < BDR: avg 0.40 → mais eficiente é o SDR
    expect(result.mostEfficientAgent).toBe('SDR');
  });

  it('mescla agentRole nulo com UNKNOWN e preserva totais', async () => {
    aiLogGroupBy.mockResolvedValue([
      { agentRole: null, _count: { _all: 3 }, _sum: { cost: 0.5, tokens: 1500 } },
      { agentRole: 'UNKNOWN', _count: { _all: 1 }, _sum: { cost: 0.1, tokens: 500 } },
    ]);

    const result = await analyzeAgentCosts('org-1');

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].agentType).toBe('UNKNOWN');
    expect(result.agents[0].totalExecutions).toBe(4);
    expect(result.agents[0].totalCostUsd).toBeCloseTo(0.6);
    expect(result.totalCostUsd).toBeCloseTo(0.6);
  });

  it('retorna análise vazia quando não há logs no período', async () => {
    aiLogGroupBy.mockResolvedValue([]);

    const result = await analyzeAgentCosts('org-1', 7);

    expect(result.agents).toEqual([]);
    expect(result.totalCostUsd).toBe(0);
    expect(result.mostExpensiveAgent).toBe('Nenhum');
    expect(result.mostEfficientAgent).toBe('Nenhum');
    expect(result.period).toBe('Últimos 7 dias');
  });

  it('propaga erro do banco em vez de retornar análise enganosa', async () => {
    aiLogGroupBy.mockRejectedValue(new Error('db down'));

    await expect(analyzeAgentCosts('org-1')).rejects.toThrow('db down');
  });
});

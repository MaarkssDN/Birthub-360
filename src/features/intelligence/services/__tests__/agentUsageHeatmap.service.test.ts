import { beforeEach, describe, expect, it, vi } from 'vitest';

const agentMemoryGroupBy = vi.fn();
const agentMemoryFindMany = vi.fn();

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    agentMemory: {
      groupBy: (...args: unknown[]) => agentMemoryGroupBy(...args),
      findMany: (...args: unknown[]) => agentMemoryFindMany(...args),
    },
  },
}));

import { generateAgentUsageHeatmap } from '../agentUsageHeatmap.service.js';

// Reconciliação 2026-11 (handoff 01→07, BT360-DT-0008) — heatmap de uso de agentes
// agrega em UMA query groupBy por agentType+status (antes: agentMemory.findMany de
// todas as linhas do período + custo fabricado `count*0.01` + avgLatencyMs = NaN).

describe('generateAgentUsageHeatmap', () => {
  beforeEach(() => {
    agentMemoryGroupBy.mockReset();
    agentMemoryFindMany.mockReset();
  });

  it('agrega por agentType/status em query única groupBy (sem findMany)', async () => {
    agentMemoryGroupBy.mockResolvedValue([
      { agentType: 'SDR', status: 'Completed', _count: { _all: 3 } },
      { agentType: 'SDR', status: 'Failed', _count: { _all: 1 } },
      { agentType: 'OPS', status: 'Completed', _count: { _all: 2 } },
    ]);

    const result = await generateAgentUsageHeatmap('org-1', 30);

    expect(agentMemoryGroupBy).toHaveBeenCalledTimes(1);
    expect(agentMemoryGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['agentType', 'status'],
        where: expect.objectContaining({ organizationId: 'org-1' }),
        _count: { _all: true },
      }),
    );
    expect(agentMemoryFindMany).not.toHaveBeenCalled();

    // Ordenado por execuções desc: SDR (4) > OPS (2)
    expect(result.agents.map((a) => a.agentType)).toEqual(['SDR', 'OPS']);
    expect(result.agents[0]).toMatchObject({
      agentType: 'SDR',
      executions: 4,
      successRate: 0.75,
      percentage: (4 / 6) * 100,
    });
    expect(result.agents[1]).toMatchObject({
      agentType: 'OPS',
      executions: 2,
      successRate: 1,
    });
    expect(result.totalExecutions).toBe(6);
    expect(result.topAgent).toBe('SDR');
    expect(result.period).toBe('Últimos 30 dias');
  });

  it('não fabrica custo nem latência: costUsd e avgLatencyMs são null, nunca NaN', async () => {
    agentMemoryGroupBy.mockResolvedValue([
      { agentType: 'SDR', status: 'Completed', _count: { _all: 5 } },
    ]);

    const result = await generateAgentUsageHeatmap('org-1');
    const agent = result.agents[0];

    expect(agent.costUsd).toBeNull();
    expect(agent.avgLatencyMs).toBeNull();
    expect(Number.isNaN(agent.avgLatencyMs)).toBe(false);
    expect(Number.isNaN(agent.costUsd)).toBe(false);
  });

  it('período sem memórias retorna lista vazia e totais zerados', async () => {
    agentMemoryGroupBy.mockResolvedValue([]);

    const result = await generateAgentUsageHeatmap('org-1', 7);

    expect(result.agents).toEqual([]);
    expect(result.totalExecutions).toBe(0);
    expect(result.topAgent).toBe('Nenhum');
  });

  it('propaga erro do banco (sem fallback silencioso)', async () => {
    agentMemoryGroupBy.mockRejectedValue(new Error('connection reset'));

    await expect(generateAgentUsageHeatmap('org-1')).rejects.toThrow('connection reset');
  });
});

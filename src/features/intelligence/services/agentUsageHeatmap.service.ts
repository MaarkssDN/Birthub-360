import { prisma } from '../../../lib/prisma.js';
import '../../../lib/logger.js';

/**
 * Heatmap de Uso do Swarm
 * Visualiza quais agentes são mais usados
 */

export interface AgentUsageHeatmap {
  organizationId: string;
  period: string;
  agents: Array<{
    agentType: string;
    executions: number;
    percentage: number;
    /**
     * `AgentMemory` não registra latência de execução — o campo é `null` em vez de um valor
     * fabricado (antes era `totalLatency / count` com `totalLatency` nunca acumulado, gerando
     * NaN). Quando existir fonte real de latência por agente, preencher aqui.
     */
    avgLatencyMs: number | null;
    successRate: number;
    /**
     * Removido o `costUsd` estimado (`count * 0.01`) — KPI fabricado. `AgentMemory` não tem
     * custo; custo real por chamada de IA vive em `AILog` (agregado por `agentRole` em
     * `agentCostAnalysis.service.ts`), que usa vocabulário diferente de `agentType` e não pode
     * ser juntado sem um mapeamento confiável.
     */
  }>;
  totalExecutions: number;
  topAgent: string;
}

/**
 * Gera heatmap de uso dos agentes
 */
export async function generateAgentUsageHeatmap(
  organizationId: string,
  days: number = 30,
): Promise<AgentUsageHeatmap> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // BT360-DT-0008 / TAREFA-SANEAMENTO-012: agregação no banco via groupBy por (agentType,
  // status) — antes um findMany sem limite carregava todas as linhas de AgentMemory do
  // período em memória.
  const grouped = await prisma.agentMemory.groupBy({
    by: ['agentType', 'status'],
    where: {
      organizationId,
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });

  const agentStats = new Map<string, { count: number; success: number }>();

  for (const row of grouped) {
    const agent = row.agentType;
    if (!agentStats.has(agent)) {
      agentStats.set(agent, { count: 0, success: 0 });
    }
    const stats = agentStats.get(agent)!;
    stats.count += row._count._all;
    stats.success += row.status === 'Completed' ? row._count._all : 0;
  }

  const agents = Array.from(agentStats.entries()).map(([agentType, stats]) => ({
    agentType,
    executions: stats.count,
    percentage: 0, // Calculado depois
    avgLatencyMs: null,
    successRate: stats.success / stats.count,
  }));

  const totalExecutions = agents.reduce((sum, a) => sum + a.executions, 0);
  agents.forEach((a) => (a.percentage = totalExecutions > 0 ? (a.executions / totalExecutions) * 100 : 0));

  agents.sort((a, b) => b.executions - a.executions);

  return {
    organizationId,
    period: `Últimos ${days} dias`,
    agents,
    totalExecutions,
    topAgent: agents[0]?.agentType || 'Nenhum',
  };
}

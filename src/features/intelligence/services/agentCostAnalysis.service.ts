import { prisma } from '../../../lib/prisma.js';
import '../../../lib/logger.js';

/**
 * Análise de Custos por Agente
 * Custo detalhado por agente/missão
 */

export interface AgentCostAnalysis {
  organizationId: string;
  period: string;
  agents: Array<{
    agentType: string;
    totalExecutions: number;
    totalCostUsd: number;
    avgCostPerExecution: number;
    totalTokens: number;
    avgTokensPerExecution: number;
  }>;
  totalCostUsd: number;
  mostExpensiveAgent: string;
  mostEfficientAgent: string;
}

/**
 * Analisa custos por agente.
 *
 * TAREFA-SANEAMENTO-042 (BT360-DT-0094): a versão anterior fazia `findMany` de todos os
 * AILog do período e agregava em memória — transferência desnecessária de todas as linhas
 * e pressão no pool de conexões. Agora o agrupamento acontece no Postgres via `groupBy`
 * (campos reais do model AILog: `cost` em USD e `tokens` total, ver usage-log.ts).
 */
export async function analyzeAgentCosts(
  organizationId: string,
  days: number = 30,
): Promise<AgentCostAnalysis> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const grouped = await prisma.aILog.groupBy({
    by: ['agentRole'],
    where: {
      organizationId,
      createdAt: { gte: since },
    },
    _count: { _all: true },
    _sum: { cost: true, tokens: true },
  });

  // `agentRole` nulo e a string 'UNKNOWN' são o mesmo agente lógico — mescla como a
  // versão anterior (`log.agentRole || 'UNKNOWN'`).
  const agentStats = new Map<
    string,
    {
      count: number;
      totalCost: number;
      totalTokens: number;
    }
  >();

  for (const row of grouped) {
    const agent = row.agentRole || 'UNKNOWN';
    const stats = agentStats.get(agent) ?? { count: 0, totalCost: 0, totalTokens: 0 };
    stats.count += row._count._all;
    stats.totalCost += row._sum.cost ?? 0;
    stats.totalTokens += row._sum.tokens ?? 0;
    agentStats.set(agent, stats);
  }

  const agents = Array.from(agentStats.entries()).map(([agentType, stats]) => ({
    agentType,
    totalExecutions: stats.count,
    totalCostUsd: stats.totalCost,
    avgCostPerExecution: stats.totalCost / stats.count,
    totalTokens: stats.totalTokens,
    avgTokensPerExecution: stats.totalTokens / stats.count,
  }));

  const totalCostUsd = agents.reduce((sum, a) => sum + a.totalCostUsd, 0);

  agents.sort((a, b) => b.totalCostUsd - a.totalCostUsd);

  return {
    organizationId,
    period: `Últimos ${days} dias`,
    agents,
    totalCostUsd,
    mostExpensiveAgent: agents[0]?.agentType || 'Nenhum',
    mostEfficientAgent:
      agents.length > 0
        ? agents.reduce((min, curr) =>
            curr.avgCostPerExecution < min.avgCostPerExecution ? curr : min,
          ).agentType
        : 'Nenhum',
  };
}

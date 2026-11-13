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
 * Analisa custos por agente
 */
export async function analyzeAgentCosts(
  organizationId: string,
  days: number = 30,
): Promise<AgentCostAnalysis> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // BT360-DT-0008 / TAREFA-SANEAMENTO-012: agregação no banco via groupBy — antes um findMany
  // sem `take` carregava todas as linhas de AILog do período em memória. O select anterior
  // também pedia campos inexistentes no model (`costUsd`, `promptTokens`, `completionTokens`;
  // os reais são `cost`, `tokens`, `latencyMs`), o que quebrava o endpoint em runtime.
  const grouped = await prisma.aILog.groupBy({
    by: ['agentRole'],
    where: {
      organizationId,
      createdAt: { gte: since },
    },
    _count: { _all: true },
    _sum: { cost: true, tokens: true },
  });

  const agents = grouped.map((row) => {
    const totalExecutions = row._count._all;
    const totalCostUsd = row._sum.cost ?? 0;
    const totalTokens = row._sum.tokens ?? 0;
    return {
      agentType: row.agentRole ?? 'UNKNOWN',
      totalExecutions,
      totalCostUsd,
      avgCostPerExecution: totalCostUsd / totalExecutions,
      totalTokens,
      avgTokensPerExecution: totalTokens / totalExecutions,
    };
  });

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

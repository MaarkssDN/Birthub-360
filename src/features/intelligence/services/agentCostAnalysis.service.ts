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
 * TAREFA-SANEAMENTO-042 / BT360-DT-0094: antes carregava TODAS as linhas de `AILog` do período
 * para agregar em memória — sem teto de linhas, cada chamada varria a tabela inteira do tenant e
 * pesava no pool de conexões do painel gerencial. Agora é uma única query `groupBy` por
 * `agentRole` (mesmo padrão de `PrismaUsageRepository.groupByModel/groupByPrompt`).
 *
 * Campos reais do model `AILog` (schema.prisma): `tokens`, `cost`, `agentRole` — a versão
 * anterior selecionava `costUsd`/`promptTokens`/`completionTokens`, que NÃO existem no schema e
 * faziam a query falhar em runtime.
 */
export async function analyzeAgentCosts(
  organizationId: string,
  days: number = 30,
): Promise<AgentCostAnalysis> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.aILog.groupBy({
    by: ['agentRole'],
    where: {
      organizationId,
      createdAt: { gte: since },
    },
    _count: { _all: true },
    _sum: { cost: true, tokens: true },
  });

  const agents = rows.map((row) => {
    const count = row._count._all;
    const totalCost = row._sum.cost ?? 0;
    const totalTokens = row._sum.tokens ?? 0;
    return {
      agentType: row.agentRole || 'UNKNOWN',
      totalExecutions: count,
      totalCostUsd: totalCost,
      avgCostPerExecution: count > 0 ? totalCost / count : 0,
      totalTokens,
      avgTokensPerExecution: count > 0 ? totalTokens / count : 0,
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

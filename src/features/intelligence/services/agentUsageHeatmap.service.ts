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
     * Sempre `null` hoje: não existe fonte real de latência por `agentType`.
     * `AgentMemory` (a fonte de execuções/sucesso deste heatmap) não grava duração, e
     * `AILog.latencyMs` é indexado por `agentRole` — um espaço de chaves diferente
     * (SDR/BDR/CLOSER/CRM/OPS) que não corresponde 1:1 a `agentType` (SDR/OPS/
     * LEARNING_PROFILE/SUPERVISOR/...). Mesclar os dois seria fabricar KPI.
     */
    avgLatencyMs: number | null;
    successRate: number;
    /**
     * Sempre `null` hoje pelo mesmo motivo: custo real por agente vive em `AILog.cost`,
     * agregado por `agentRole` no endpoint `/api/agent/cost-analysis`
     * (agentCostAnalysis.service.ts). A versão anterior fabricava `count * 0.01`.
     */
    costUsd: number | null;
  }>;
  totalExecutions: number;
  topAgent: string;
}

/**
 * Gera heatmap de uso dos agentes.
 *
 * Reconciliação 2026-11 (handoff 01→07, BT360-DT-0008): antes fazia
 * `agentMemory.findMany` de TODAS as linhas do período para agregar em memória, e ainda
 * fabricava `costUsd` (`count * 0.01`) e `avgLatencyMs` (`totalLatency` nunca era
 * acumulado → NaN). Agora é uma única query `groupBy` por `agentType`+`status` —
 * mesmo padrão de `agentCostAnalysis.service.ts` (`aILog.groupBy`).
 */
export async function generateAgentUsageHeatmap(
  organizationId: string,
  days: number = 30,
): Promise<AgentUsageHeatmap> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.agentMemory.groupBy({
    by: ['agentType', 'status'],
    where: {
      organizationId,
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });

  const agentStats = new Map<string, { count: number; success: number }>();

  for (const row of rows) {
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
    costUsd: null,
  }));

  const totalExecutions = agents.reduce((sum, a) => sum + a.executions, 0);
  agents.forEach(
    (a) => (a.percentage = totalExecutions > 0 ? (a.executions / totalExecutions) * 100 : 0),
  );

  agents.sort((a, b) => b.executions - a.executions);

  return {
    organizationId,
    period: `Últimos ${days} dias`,
    agents,
    totalExecutions,
    topAgent: agents[0]?.agentType || 'Nenhum',
  };
}

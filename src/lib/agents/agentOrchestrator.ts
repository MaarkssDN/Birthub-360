/**
 * src/lib/agents/agentOrchestrator.ts
 * Orquestrador modular e desacoplado para governança de agentes de runtime.
 *
 * Princípios:
 * - Complexidade ciclomática baixa (funções coesas e curtas)
 * - Responsabilidade única: aplica controle de concorrência, limites de execução,
 *   token budgets e logs estruturados com correlationId.
 * - Enxuto: < 200 linhas de código.
 */

import { randomUUID } from 'node:crypto';
import { logger } from '../logger.js';
import { agentConcurrencyLimiter } from './concurrencyControl.js';
import { type ExecutionContext, withExecutionTimeout } from './executionLimits.js';
import { AgentTokenBudgetTracker, type TokenUsageRecord } from './tokenBudget.js';

export interface OrchestratedAgentParams<TInput, TOutput> {
  agentRole: string;
  tenantId: string;
  mission: string;
  input: TInput;
  correlationId?: string;
  traceParent?: string;
  timeoutMs?: number;
  maxTokensPerMission?: number;
  maxTokensPerTurn?: number;
  executor: (context: AgentExecutionContext<TInput>) => Promise<AgentExecutionOutput<TOutput>>;
}

export interface AgentExecutionContext<TInput> {
  correlationId: string;
  traceParent: string;
  tenantId: string;
  agentRole: string;
  input: TInput;
  tokenTracker: AgentTokenBudgetTracker;
}

export interface AgentExecutionOutput<TOutput> {
  result: TOutput;
  usage?: TokenUsageRecord;
}

export interface OrchestratedAgentResult<TOutput> {
  result: TOutput;
  correlationId: string;
  traceParent: string;
  tokensConsumed: number;
  durationMs: number;
}

export class AgentRuntimeOrchestrator {
  /**
   * Executa uma missão de agente aplicando todas as travas de governança em runtime.
   */
  public async execute<TInput, TOutput>(
    params: OrchestratedAgentParams<TInput, TOutput>,
  ): Promise<OrchestratedAgentResult<TOutput>> {
    const correlationId = params.correlationId ?? `corr-${randomUUID()}`;
    const traceParent = params.traceParent ?? `00-${randomUUID().replace(/-/g, '')}-00`;
    const startTime = Date.now();

    const tokenTracker = new AgentTokenBudgetTracker({
      agentRole: params.agentRole,
      correlationId,
      organizationId: params.tenantId,
      maxTokensPerMission: params.maxTokensPerMission,
      maxTokensPerTurn: params.maxTokensPerTurn,
    });

    const executionContext: AgentExecutionContext<TInput> = {
      correlationId,
      traceParent,
      tenantId: params.tenantId,
      agentRole: params.agentRole,
      input: params.input,
      tokenTracker,
    };

    logger.info(
      {
        correlationId,
        traceParent,
        tenantId: params.tenantId,
        agentRole: params.agentRole,
        missionPreview: params.mission.slice(0, 100),
      },
      '[AgentOrchestrator] Iniciando execução governada de agente',
    );

    try {
      const output = await agentConcurrencyLimiter.runWithLimit(
        params.tenantId,
        params.agentRole,
        async () => {
          const timeoutContext: ExecutionContext = {
            agentRole: params.agentRole,
            correlationId,
            timeoutMs: params.timeoutMs,
            stepName: 'agent-execution',
          };

          return withExecutionTimeout(params.executor(executionContext), timeoutContext);
        },
      );

      if (output.usage) {
        tokenTracker.recordUsage(output.usage);
      }

      const durationMs = Date.now() - startTime;

      logger.info(
        {
          correlationId,
          traceParent,
          tenantId: params.tenantId,
          agentRole: params.agentRole,
          durationMs,
          totalTokens: tokenTracker.getAccumulatedTokens(),
        },
        '[AgentOrchestrator] Execução de agente concluída com sucesso',
      );

      return {
        result: output.result,
        correlationId,
        traceParent,
        tokensConsumed: tokenTracker.getAccumulatedTokens(),
        durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      logger.error(
        {
          err: error,
          correlationId,
          traceParent,
          tenantId: params.tenantId,
          agentRole: params.agentRole,
          durationMs,
        },
        '[AgentOrchestrator] Falha na execução governada de agente',
      );
      throw error;
    }
  }
}

export const agentRuntimeOrchestrator = new AgentRuntimeOrchestrator();

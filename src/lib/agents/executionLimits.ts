/**
 * src/lib/agents/executionLimits.ts
 * Limites de tempo de execução individual e proteção contra loops em runtime.
 *
 * Responsável por:
 * - Evitar travamento do runtime do agente por chamadas externas lentas ou infinitas
 * - Garantir timeout determinístico com liberação de recursos
 * - Observabilidade estruturada de timeouts com correlationId
 */

import { logger } from '../logger.js';

export class ExecutionTimeoutException extends Error {
  constructor(
    public readonly agentRole: string,
    public readonly timeoutMs: number,
    public readonly correlationId?: string,
  ) {
    super(
      `Tempo limite de execução excedido pelo agente '${agentRole}'! ` +
        `Operação cancelada após ${timeoutMs}ms (correlationId: ${correlationId ?? 'n/a'}).`,
    );
    this.name = 'ExecutionTimeoutException';
  }
}

export interface ExecutionContext {
  agentRole: string;
  timeoutMs?: number;
  correlationId?: string;
  stepName?: string;
}

export const DEFAULT_AGENT_EXECUTION_TIMEOUT_MS = 60_000; // 60 segundos por etapa

/**
 * Envolve a execução de uma Promise com um timeout rígido determinístico via Promise.race.
 * Lança ExecutionTimeoutException se o tempo limite for excedido.
 */
export async function withExecutionTimeout<T>(
  action: Promise<T>,
  context: ExecutionContext,
): Promise<T> {
  const timeoutMs = context.timeoutMs ?? DEFAULT_AGENT_EXECUTION_TIMEOUT_MS;
  const { agentRole, correlationId, stepName } = context;

  let timeoutTimer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutTimer = setTimeout(() => {
      logger.error(
        {
          agentRole,
          correlationId,
          stepName,
          timeoutMs,
        },
        '[ExecutionLimits] Timeout de execução atingido pelo agente',
      );
      reject(new ExecutionTimeoutException(agentRole, timeoutMs, correlationId));
    }, timeoutMs);
  });

  try {
    return await Promise.race([action, timeoutPromise]);
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
  }
}

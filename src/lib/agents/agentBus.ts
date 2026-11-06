/**
 * src/lib/agents/agentBus.ts
 * Barramento de mensageria entre agentes com trava estrita de recursao e prevencao de loops (maxHops = 5).
 * (Handoff 23-para-13 / DIV-AGENTE-13-001)
 */
import { randomUUID } from 'node:crypto';
import { logger } from '../logger.js';

export class LoopDetectedException extends Error {
  constructor(public readonly correlationId: string, public readonly hopCount: number) {
    super(`Loop de execucao detectado entre agentes! Limite maximo de 5 hops excedido (correlationId: ${correlationId}, hopCount: ${hopCount}).`);
    this.name = 'LoopDetectedException';
  }
}

export interface AgentBusMessage<T = unknown> {
  id: string;
  senderAgentId: string;
  recipientAgentId: string;
  payload: T;
  correlationId: string;
  hopCount: number;
  traceParent?: string;
  timestamp: string;
}

export class AgentBus {
  public static readonly MAX_HOPS = 5;

  /**
   * Valida metadados de rastreabilidade e rejeita loops infinitos de recursao.
   */
  public routeMessage<T>(params: {
    senderAgentId: string;
    recipientAgentId: string;
    payload: T;
    correlationId?: string;
    hopCount?: number;
    traceParent?: string;
  }): AgentBusMessage<T> {
    const correlationId = params.correlationId || `corr-${randomUUID()}`;
    const hopCount = (params.hopCount ?? 0) + 1;
    const traceParent = params.traceParent || `00-${randomUUID().replace(/-/g, '')}-00`;

    if (hopCount > AgentBus.MAX_HOPS) {
      logger.error(
        { correlationId, hopCount, sender: params.senderAgentId, recipient: params.recipientAgentId },
        '[AgentBus] ALERTA CRITICO: Loop de comunicacao entre agentes abortado',
      );
      throw new LoopDetectedException(correlationId, hopCount);
    }

    return {
      id: `msg-${randomUUID()}`,
      senderAgentId: params.senderAgentId,
      recipientAgentId: params.recipientAgentId,
      payload: params.payload,
      correlationId,
      hopCount,
      traceParent,
      timestamp: new Date().toISOString(),
    };
  }
}

export const agentBus = new AgentBus();

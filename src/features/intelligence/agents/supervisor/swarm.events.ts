// Extraído de supervisor.agent.ts (handoff 00-para-13 / DIV-AGENTE-13-002) — tipos e helpers
// de evento do enxame, compartilhados entre o orquestrador e os nós especialistas.
import { AIMessage } from '@langchain/core/messages';
import type { SwarmAgentKey } from '../subSwarms.config.js';

export type SwarmEventType = 'routing' | 'agent_result' | 'agent_error' | 'final';

export interface SwarmEvent {
  type: SwarmEventType;
  agent: 'supervisor' | SwarmAgentKey;
  content: string;
  step: number;
  reasoning?: string;
  /** Presente apenas em eventos 'routing': qual especialista está prestes a ser acionado. */
  nextAgent?: SwarmAgentKey;
  /** Confiança do supervisor na decisão (0-1). Presente em eventos 'routing'. */
  confidence?: number;
  /** Modelo de IA usado para esta decisão (ex: 'gpt-oss-20b'). Presente em eventos 'routing'. */
  modelUsed?: string;
  /** Custo em tokens desta decisão. Presente em eventos 'routing'. */
  tokensUsed?: number;
  /** Se o roteamento usou fallback heurístico. Presente em eventos 'routing'. */
  fallbackTriggered?: boolean;
  /** Correlation ID para tracing distribuído. Presente em todos os eventos. */
  correlationId?: string;
}

export function buildEvent(
  type: SwarmEventType,
  agent: SwarmEvent['agent'],
  content: string,
  step: number,
  reasoning?: string,
  nextAgent?: SwarmAgentKey,
  confidence?: number,
  modelUsed?: string,
  tokensUsed?: number,
  fallbackTriggered?: boolean,
  correlationId?: string,
): SwarmEvent {
  return {
    type,
    agent,
    content,
    step,
    reasoning,
    nextAgent,
    confidence,
    modelUsed,
    tokensUsed,
    fallbackTriggered,
    correlationId,
  };
}

export function toAiMessage(event: SwarmEvent): AIMessage {
  return new AIMessage({ content: event.content, additional_kwargs: { swarmEvent: event } });
}

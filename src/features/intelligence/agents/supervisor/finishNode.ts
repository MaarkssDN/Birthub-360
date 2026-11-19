/**
 * src/features/intelligence/agents/supervisor/finishNode.ts
 * Nó de síntese final e encerramento executivo do enxame de agentes.
 * (Handoff 00-para-13 / DIV-AGENTE-13-002 / TAREFA-SANEAMENTO-009)
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getAiModel } from '../../../../lib/ai/gateway.js';
import { logger } from '../../../../lib/logger.js';
import type { SwarmAgentKey } from '../subSwarms.config.js';
import { AGENT_INFO, buildSynthesisSystemPrompt } from './prompts.js';
import { buildEvent, toAiMessage } from './swarm.events.js';
import type { SwarmStateType } from './swarm.state.js';

export async function finishNode(state: SwarmStateType) {
  const resultsSummary = (Object.entries(state.results) as [SwarmAgentKey, string][])
    .map(([agent, content]) => `${AGENT_INFO[agent].label}:\n${content}`)
    .join('\n\n');

  if (!resultsSummary) {
    const content = 'Nenhum especialista precisou ser acionado para esta missão.';
    return { messages: [toAiMessage(buildEvent('final', 'supervisor', content, state.step))] };
  }

  let synthesis: string;
  try {
    const model = getAiModel('local-llama3-fast', 0.2, 'supervisor-synthesis');
    const response = await model.invoke([
      new SystemMessage(buildSynthesisSystemPrompt()),
      new HumanMessage(
        `Missão original: ${state.mission}\n\nIntel recebida dos especialistas:\n${resultsSummary}`,
      ),
    ]);
    synthesis = response.content.trim() || resultsSummary;
  } catch (error: any) {
    logger.error({ err: error }, 'Swarm synthesis failed, falling back to raw results');
    synthesis = resultsSummary;
  }

  return {
    messages: [toAiMessage(buildEvent('final', 'supervisor', synthesis, state.step))],
  };
}

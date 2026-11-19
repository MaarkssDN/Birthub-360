/**
 * src/features/intelligence/agents/supervisor/supervisorNode.ts
 * Nós de roteamento semântico e supervisão do grafo de agentes.
 * (Handoff 00-para-13 / DIV-AGENTE-13-002 / TAREFA-SANEAMENTO-009)
 */

import { type AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { ChatOpenAI } from '@langchain/openai';
import { logAiUsage } from '../../../../lib/ai/gateway.js';
import { logger } from '../../../../lib/logger.js';
import { buildModelWithFallback } from '../fallback.util.js';
import {
  detectSubSwarm,
  matchCatalogAgents,
  SUB_SWARMS,
  type SwarmAgentKey,
} from '../subSwarms.config.js';
import {
  buildSwarmCorrelationId,
  enforceLeadGuard,
  fallbackDecision,
  type SupervisorDecision,
  supervisorDecisionSchema,
} from '../supervisor.decision.js';
import { SWARM_CATALOG_TOTAL_AGENTS, SWARM_MAX_STEPS } from '../swarm.constants.js';
import { AGENT_INFO, buildSupervisorSystemPrompt } from './prompts.js';
import { buildEvent, toAiMessage } from './swarm.events.js';
import type { SwarmRoute, SwarmStateType } from './swarm.state.js';

let cachedSupervisorLlm: ReturnType<typeof buildModelWithFallback> | null = null;
export function getSupervisorLlm() {
  if (cachedSupervisorLlm) return cachedSupervisorLlm;

  cachedSupervisorLlm = buildModelWithFallback('openai/gpt-oss-20b');
  return cachedSupervisorLlm;
}

const MAX_STEPS = SWARM_MAX_STEPS;

/**
 * Nó de roteamento semântico dinâmico que conecta a missão aos Sub-Swarms temáticos
 * e aos 379 especialistas do catálogo oficial da plataforma.
 */
export async function semanticRouterNode(state: SwarmStateType, config?: RunnableConfig) {
  const subSwarm =
    state.subSwarm && state.subSwarm !== 'commercial'
      ? state.subSwarm
      : detectSubSwarm(state.mission);

  const catalogMatches = matchCatalogAgents(state.mission, subSwarm, { topK: 3 });
  const correlationId = buildSwarmCorrelationId(config);

  const topMatch = catalogMatches[0];
  const content = topMatch
    ? `Roteamento semântico dinâmico: Sub-Swarm '${SUB_SWARMS[subSwarm].label}' ativado. Especialista sugerido do catálogo amplo (${SWARM_CATALOG_TOTAL_AGENTS} agentes): ${topMatch.name} (${topMatch.code}) [Aderência: ${Math.round(topMatch.similarityScore * 100)}%].`
    : `Roteamento semântico dinâmico: Sub-Swarm '${SUB_SWARMS[subSwarm].label}' ativado com especialistas primários.`;

  return {
    subSwarm,
    catalogMatches,
    messages: [
      toAiMessage(
        buildEvent(
          'routing',
          'supervisor',
          content,
          0,
          topMatch?.matchReason || `Sub-Swarm ${subSwarm}`,
          undefined,
          0.9,
          undefined,
          undefined,
          false,
          correlationId,
        ),
      ),
    ],
  };
}

/**
 * Nó principal de supervisão e decisão estruturada do enxame.
 */
export async function supervisorNode(state: SwarmStateType, config?: RunnableConfig) {
  const step = state.step + 1;

  if (step > MAX_STEPS) {
    const reasoning = `Limite de ${MAX_STEPS} etapas do enxame atingido. Terminação determinística de ciclo garantida.`;
    return {
      step,
      next: 'finish' as const,
      instruction: '',
      messages: [
        toAiMessage(
          buildEvent(
            'routing',
            'supervisor',
            `Encerrando o roteamento: ${reasoning} Preparando síntese final.`,
            step,
            reasoning,
            undefined,
            1.0,
            undefined,
            undefined,
            false,
            buildSwarmCorrelationId(config),
          ),
        ),
      ],
    };
  }

  const activeSubSwarm =
    state.subSwarm && state.subSwarm !== 'commercial'
      ? state.subSwarm
      : detectSubSwarm(state.mission);

  const catalogMatches =
    state.catalogMatches && state.catalogMatches.length > 0
      ? state.catalogMatches
      : matchCatalogAgents(state.mission, activeSubSwarm, { topK: 3 });

  const systemPrompt = buildSupervisorSystemPrompt({
    mission: state.mission,
    leadId: state.leadId,
    completed: state.completed,
    results: state.results,
    activeSubSwarm,
    catalogMatches,
  });

  const correlationId = buildSwarmCorrelationId(config);

  let decision: SupervisorDecision;
  const startTime = Date.now();
  let fallbackTriggered = false;
  let modelUsed: string | undefined;
  let tokensUsed: number | undefined;

  try {
    const structuredModel = (getSupervisorLlm() as ChatOpenAI).withStructuredOutput(
      supervisorDecisionSchema,
      { name: 'route_decision', includeRaw: true },
    );

    const result = await structuredModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage('Qual é o próximo passo?'),
    ]);
    const raw = result.raw as AIMessage;

    const usage = raw?.usage_metadata;
    if (usage) {
      modelUsed = (raw.response_metadata?.model_name as string) || 'local-llama3-fast';
      tokensUsed = usage.total_tokens;

      await logAiUsage({
        model: modelUsed,
        usage: {
          totalTokens: usage.total_tokens,
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
        },
        latencyMs: Date.now() - startTime,
      });
    }

    if (!result.parsed) {
      throw new Error('Supervisor não retornou uma decisão estruturada válida.');
    }
    decision = supervisorDecisionSchema.parse(result.parsed);
  } catch (error: any) {
    logger.error({ err: error }, 'Swarm supervisor routing failed, using fallback heuristic');
    decision = fallbackDecision(
      state.completed,
      Boolean(state.leadId),
      state.mission,
      activeSubSwarm,
    );
    fallbackTriggered = true;
  }

  decision = enforceLeadGuard(decision, { ...state, subSwarm: activeSubSwarm });

  const content =
    decision.action === 'finish'
      ? `Missão avaliada como concluída. ${decision.reasoning}`.trim()
      : `Encaminhando para ${AGENT_INFO[decision.action as SwarmAgentKey].label}: ${decision.instruction}`;

  const confidence = fallbackTriggered ? 0.3 : 0.8;

  return {
    step,
    subSwarm: activeSubSwarm,
    selectedCatalogAgent: decision.catalogAgentCode || null,
    next: decision.action,
    instruction: decision.instruction,
    messages: [
      toAiMessage(
        buildEvent(
          'routing',
          'supervisor',
          content,
          step,
          decision.reasoning,
          decision.action === 'finish' ? undefined : decision.action,
          confidence,
          modelUsed,
          tokensUsed,
          fallbackTriggered,
          correlationId,
        ),
      ),
    ],
  };
}

export function routerCondition(state: SwarmStateType): SwarmRoute {
  return state.next;
}

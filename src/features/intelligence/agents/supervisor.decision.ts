/**
 * supervisor.decision.ts — extraído de supervisor.agent.ts (TAREFA-SANEAMENTO-009 /
 * BT360-DT-0065): schema da decisão do supervisor, fallback determinístico, trava de
 * lead e correlation id. Re-exportado por supervisor.agent.ts para preservar a API
 * pública — nenhum consumidor precisa mudar de import.
 */
import type { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import { detectSubSwarm, type SubSwarmDomain, type SwarmAgentKey } from './subSwarms.config.js';

export const supervisorDecisionSchema = z.object({
  action: z
    .enum(['sdr', 'bdr', 'closer', 'crm', 'ops', 'finish'])
    .describe(
      'Qual especialista deve atuar a seguir, ou "finish" se a missão já foi suficientemente atendida.',
    ),
  subSwarm: z
    .enum(['commercial', 'marketing', 'customer_success', 'operations'])
    .optional()
    .describe('Sub-Swarm temático direcionado para a etapa.'),
  catalogAgentCode: z
    .string()
    .optional()
    .describe(
      'Código de um dos 379 agentes do catálogo selecionado pelo roteamento semântico, se aplicável.',
    ),
  instruction: z
    .string()
    .default('')
    .describe(
      'Instrução objetiva e ESPECÍFICA em português para o especialista escolhido: diga exatamente o que analisar/fazer e com base em que dado da missão. String vazia se action for "finish".',
    ),
  reasoning: z
    .string()
    .default('')
    .describe(
      'Uma frase curta explicando por que este especialista (e não outro) foi escolhido agora.',
    ),
});

export type SupervisorDecision = z.infer<typeof supervisorDecisionSchema>;

/** Contexto mínimo que enforceLeadGuard precisa — estrutural, desacoplado do SwarmState. */
export interface SwarmLeadGuardContext {
  leadId?: string;
  completed: SwarmAgentKey[];
  mission: string;
  subSwarm?: SubSwarmDomain;
}

// Exportado só para teste unitário direto do roteamento de contingência. Recebe a missão original
// para usar como instrução de contingência — antes disto, todo fallback (parsing falhou, guard
// interceptou) mandava um texto fixo e genérico pro especialista ("produza um resultado
// objetivo"), descartando o pedido real do usuário justamente nos casos em que o roteamento por
// IA não pôde ser confiado.
export function fallbackDecision(
  completed: SwarmAgentKey[],
  hasLeadId: boolean,
  mission: string = '',
  subSwarm?: SubSwarmDomain,
): SupervisorDecision {
  const activeSubSwarm = subSwarm || (mission ? detectSubSwarm(mission) : 'commercial');
  let order: SwarmAgentKey[];

  if (activeSubSwarm === 'marketing') {
    order = hasLeadId ? ['bdr', 'sdr', 'ops', 'crm'] : ['bdr', 'ops', 'crm'];
  } else if (activeSubSwarm === 'customer_success') {
    order = ['crm', 'ops', 'closer'];
  } else if (activeSubSwarm === 'operations') {
    order = ['ops', 'crm', 'bdr'];
  } else {
    order = hasLeadId ? ['sdr', 'bdr', 'closer', 'crm', 'ops'] : ['bdr', 'closer', 'crm', 'ops'];
  }

  const pending = order.find((agent) => !completed.includes(agent));
  if (!pending) {
    return {
      action: 'finish',
      instruction: '',
      reasoning: 'Todos os especialistas relevantes já atuaram.',
    };
  }
  return {
    action: pending,
    instruction:
      mission.trim() ||
      'Analise a missão do usuário com os dados disponíveis e produza um resultado objetivo.',
    reasoning:
      'Roteamento sequencial de contingência (resposta do supervisor não pôde ser interpretada).',
  };
}

// Trava determinística: nunca aciona o Agente SDR sem um leadId real, mesmo que o LLM do
// supervisor "esqueça" a instrução do prompt e escolha 'sdr' de qualquer forma — sdrNode
// dependeria de get_lead_context com um ID que não existe e queimaria uma rodada inteira do
// enxame só para produzir o mesmo erro que dava pra prever aqui. Exportado para teste unitário.
export function enforceLeadGuard(
  decision: SupervisorDecision,
  context: SwarmLeadGuardContext,
): SupervisorDecision {
  if (decision.action !== 'sdr' || context.leadId) {
    return decision;
  }
  const rerouted = fallbackDecision(
    context.completed,
    false,
    context.mission,
    context.subSwarm ?? decision.subSwarm,
  );
  const note = 'SDR não pode ser acionado: nenhum leadId foi informado para esta missão.';
  return {
    ...rerouted,
    reasoning: rerouted.reasoning ? `${note} ${rerouted.reasoning}` : note,
  };
}

// Correlation ID para tracing distribuído do supervisor: baseado no thread_id do checkpoint
// (`${tenant}:${sid}`, montado em executeMission/executeMissionStream) e timestamp.
// Decisão do Agente 07 (opção b) — ver
// .agents/handoffs/onda-52/07-para-00-correlationid-supervisor-thread-id.md.
export function buildSwarmCorrelationId(config?: RunnableConfig, now: number = Date.now()): string {
  const raw = config?.configurable?.thread_id;
  const threadId = typeof raw === 'string' && raw ? raw : 'no-thread';
  return `swarm-${threadId}-${now}`;
}

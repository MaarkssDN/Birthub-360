// Extraído de supervisor.agent.ts (handoff 00-para-13 / DIV-AGENTE-13-002) — nós adaptadores
// que executam cada especialista do enxame com a instrução lapidada pelo supervisor.
// Comportamento idêntico ao original: mesmos agentes, mesma sessão, mesmos eventos.
import { logger } from '../../../../lib/logger.js';
import { BDRAgent } from '../bdr.agent.js';
import { CloserAgent } from '../closer.agent.js';
import { CRMAgent } from '../crm.agent.js';
import { OpsAgent } from '../ops.agent.js';
import { SDRQualificationAgent } from '../sdrQualification.agent.js';
import type { SwarmAgentKey } from '../subSwarms.config.js';
import type { SwarmStateType } from '../supervisor.agent.js';
import { buildEvent, toAiMessage } from './swarm.events.js';

// Monta o sessionId (chave de AgentMemory) de cada especialista do enxame incluindo o leadId
// quando disponível, por dois motivos:
// 1. Sem isso, duas missões diferentes cujo primeiro acionamento de um mesmo especialista caía no
//    mesmo `state.step` (ex.: sempre 1 na primeira chamada) geravam o MESMO sessionId
//    (`swarm-bdr-1`), e a segunda missão sobrescrevia (via updateMemory/findFirst+update) a
//    AgentMemory da primeira — colisão entre leads sem relação alguma.
// 2. `AgentMemory` (prisma/schema.prisma) ainda não tem coluna estruturada `leadId`/`contactId`,
//    então `eraseDataSubject` (LGPD) não consegue localizar sessões de um titular. Embutir
//    `lead_${leadId}` no sessionId dá uma correlação recuperável por string enquanto essa migração
//    (proposta em .agents/handoffs/onda-6/01A-para-07-agentmemory-sem-vinculo-titular.md) não é
//    aplicada pelo Agente 01A.
function swarmSessionId(
  role: 'sdr' | 'bdr' | 'closer' | 'crm' | 'ops',
  state: SwarmStateType,
): string {
  return state.leadId
    ? `swarm-${role}-lead_${state.leadId}-${state.step}`
    : `swarm-${role}-${state.step}`;
}

// Adapters que executam os sub-agentes com a instrução lapidada pelo supervisor (não mais o texto cru do roteamento).
export async function sdrNode(state: SwarmStateType) {
  // SDRQualificationAgent.run() espera um ID real de Lead do CRM (usa a ferramenta get_lead_context,
  // que faz um lookup exato por id) — nunca texto livre. Antes desta correção, este node passava
  // state.instruction (a instrução em português lapidada pelo supervisor) no lugar do leadId, e a
  // qualificação sempre falhava com "Lead não encontrado no CRM" (IA-003).
  if (!state.leadId) {
    const content =
      'Não foi possível qualificar: nenhum lead foi informado para esta missão. Informe o ID do lead relacionado para que o Agente SDR busque o contexto real no CRM.';
    return {
      completed: ['sdr'] as SwarmAgentKey[],
      results: { sdr: content },
      messages: [toAiMessage(buildEvent('agent_error', 'sdr', content, state.step))],
    };
  }
  try {
    const agent = new SDRQualificationAgent();
    const result = await agent.run(
      state.leadId,
      swarmSessionId('sdr', state),
      state.instruction || undefined,
    );
    // Sem isto, uma falha real (ex: trava de consentimento LGPD, erro do grafo) — que
    // SDRQualificationAgent.run() já reporta como `{ success: false, error }` — caía no
    // fallback de baixo e o enxame relatava "Análise concluída sem detalhamento textual." como
    // se tivesse dado certo. mesmo padrão de checagem já usado em bdrNode/closerNode/crmNode/opsNode.
    if (result.error) {
      throw new Error(result.error);
    }
    const content =
      'detailedLog' in result && result.detailedLog
        ? result.detailedLog
        : 'Análise concluída sem detalhamento textual.';
    return {
      completed: ['sdr'] as SwarmAgentKey[],
      results: { sdr: content },
      messages: [toAiMessage(buildEvent('agent_result', 'sdr', content, state.step))],
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no Agente SDR.';
    logger.error({ err: error }, 'Swarm SDR node failed');
    return {
      completed: ['sdr'] as SwarmAgentKey[],
      results: { sdr: `Erro: ${message}` },
      messages: [
        toAiMessage(
          buildEvent(
            'agent_error',
            'sdr',
            `O Agente SDR encontrou um problema: ${message}`,
            state.step,
          ),
        ),
      ],
    };
  }
}

export async function bdrNode(state: SwarmStateType) {
  const instruction = state.instruction || state.mission;
  try {
    const agent = new BDRAgent();
    const result = await agent.run(instruction, swarmSessionId('bdr', state));
    if (result.error) {
      throw new Error(result.error);
    }
    const content = result.qualification || 'Análise concluída sem detalhamento textual.';
    return {
      completed: ['bdr'] as SwarmAgentKey[],
      results: { bdr: content },
      messages: [toAiMessage(buildEvent('agent_result', 'bdr', content, state.step))],
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no Agente BDR.';
    logger.error({ err: error }, 'Swarm BDR node failed');
    return {
      completed: ['bdr'] as SwarmAgentKey[],
      results: { bdr: `Erro: ${message}` },
      messages: [
        toAiMessage(
          buildEvent(
            'agent_error',
            'bdr',
            `O Agente BDR encontrou um problema: ${message}`,
            state.step,
          ),
        ),
      ],
    };
  }
}

export async function closerNode(state: SwarmStateType) {
  const instruction = state.instruction || state.mission;
  try {
    const agent = new CloserAgent();
    const result = await agent.run(instruction, swarmSessionId('closer', state));
    if (result.error) {
      throw new Error(result.error);
    }
    const content = result.closePlan || 'Plano de fechamento concluído sem detalhamento textual.';
    return {
      completed: ['closer'] as SwarmAgentKey[],
      results: { closer: content },
      messages: [toAiMessage(buildEvent('agent_result', 'closer', content, state.step))],
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no Closer.';
    logger.error({ err: error }, 'Swarm Closer node failed');
    return {
      completed: ['closer'] as SwarmAgentKey[],
      results: { closer: `Erro: ${message}` },
      messages: [
        toAiMessage(
          buildEvent(
            'agent_error',
            'closer',
            `O Closer encontrou um problema: ${message}`,
            state.step,
          ),
        ),
      ],
    };
  }
}

export async function crmNode(state: SwarmStateType) {
  const instruction = state.instruction || state.mission;
  try {
    const agent = new CRMAgent();
    const result = await agent.run(instruction, swarmSessionId('crm', state));
    if (result.error) {
      throw new Error(result.error);
    }
    const content = result.action || 'Análise concluída sem detalhamento textual.';
    return {
      completed: ['crm'] as SwarmAgentKey[],
      results: { crm: content },
      messages: [toAiMessage(buildEvent('agent_result', 'crm', content, state.step))],
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no Agente de CRM.';
    logger.error({ err: error }, 'Swarm CRM node failed');
    return {
      completed: ['crm'] as SwarmAgentKey[],
      results: { crm: `Erro: ${message}` },
      messages: [
        toAiMessage(
          buildEvent(
            'agent_error',
            'crm',
            `O Agente de CRM encontrou um problema: ${message}`,
            state.step,
          ),
        ),
      ],
    };
  }
}

export async function opsNode(state: SwarmStateType) {
  const instruction = state.instruction || state.mission;
  try {
    const agent = new OpsAgent();
    const result = await agent.run(
      instruction,
      swarmSessionId('ops', state),
      state.leadId || undefined,
    );
    if (result.error) {
      throw new Error(result.error);
    }
    const content = result.output || 'Ação concluída sem detalhamento textual.';
    return {
      completed: ['ops'] as SwarmAgentKey[],
      results: { ops: content },
      messages: [toAiMessage(buildEvent('agent_result', 'ops', content, state.step))],
    };
  } catch (error: any) {
    const message =
      error instanceof Error ? error.message : 'Falha desconhecida no Agente de Operações.';
    logger.error({ err: error }, 'Swarm Ops node failed');
    return {
      completed: ['ops'] as SwarmAgentKey[],
      results: { ops: `Erro: ${message}` },
      messages: [
        toAiMessage(
          buildEvent(
            'agent_error',
            'ops',
            `O Agente de Operações encontrou um problema: ${message}`,
            state.step,
          ),
        ),
      ],
    };
  }
}

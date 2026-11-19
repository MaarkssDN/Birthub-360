import { type AIMessage, type BaseMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';
import { checkpointer, ensureCheckpointerReady } from '../../../lib/ai/checkpointer.js';
import { getTenantId } from '../../../lib/async-context.js';
import { logger } from '../../../lib/logger.js';
import { assertPiiExternalConsent } from '../services/guardrails.service.js';
import {
  detectSubSwarm,
  getAllCatalogAgents,
  matchCatalogAgents,
  type SemanticAgentMatch,
  type SemanticRoutingPlan,
  SUB_SWARMS,
  type SubSwarmDomain,
  type SwarmAgentKey,
  semanticRouteMission,
} from './subSwarms.config.js';
import { finishNode } from './supervisor/finishNode.js';
import { AGENT_INFO } from './supervisor/prompts.js';
import { bdrNode, closerNode, crmNode, opsNode, sdrNode } from './supervisor/specialistNodes.js';
import {
  getSupervisorLlm,
  routerCondition,
  semanticRouterNode,
  supervisorNode,
} from './supervisor/supervisorNode.js';
import { buildEvent, type SwarmEvent } from './supervisor/swarm.events.js';
import { SwarmState } from './supervisor/swarm.state.js';
import {
  buildSwarmCorrelationId,
  enforceLeadGuard,
  fallbackDecision,
  supervisorDecisionSchema,
} from './supervisor.decision.js';
import {
  SWARM_CATALOG_TOTAL_AGENTS,
  SWARM_DEFAULT_SUB_SWARM,
  SWARM_MAX_STEPS,
} from './swarm.constants.js';

export type { SwarmEvent, SwarmEventType } from './supervisor/swarm.events.js';

export type { SwarmRoute, SwarmStateType } from './supervisor/swarm.state.js';
// Re-exporta a API canônica para preservar compatibilidade com todos os consumidores
export {
  AGENT_INFO,
  buildSwarmCorrelationId,
  detectSubSwarm,
  enforceLeadGuard,
  fallbackDecision,
  getAllCatalogAgents,
  getSupervisorLlm,
  matchCatalogAgents,
  type SemanticAgentMatch,
  type SemanticRoutingPlan,
  SUB_SWARMS,
  type SubSwarmDomain,
  SWARM_CATALOG_TOTAL_AGENTS,
  SWARM_DEFAULT_SUB_SWARM,
  SWARM_MAX_STEPS,
  type SwarmAgentKey,
  semanticRouteMission,
  semanticRouterNode,
  supervisorDecisionSchema,
  supervisorNode,
};

const workflow = new StateGraph(SwarmState)
  .addNode('semanticRouter', semanticRouterNode)
  .addNode('supervisor', supervisorNode)
  .addNode('sdr', sdrNode)
  .addNode('bdr', bdrNode)
  .addNode('closer', closerNode)
  .addNode('crm', crmNode)
  .addNode('ops', opsNode)
  .addNode('finish', finishNode)
  .addEdge('__start__', 'semanticRouter')
  .addEdge('semanticRouter', 'supervisor')
  .addConditionalEdges('supervisor', routerCondition, {
    sdr: 'sdr',
    bdr: 'bdr',
    closer: 'closer',
    crm: 'crm',
    ops: 'ops',
    finish: 'finish',
  })
  .addEdge('sdr', 'supervisor')
  .addEdge('bdr', 'supervisor')
  .addEdge('closer', 'supervisor')
  .addEdge('crm', 'supervisor')
  .addEdge('ops', 'supervisor')
  .addEdge('finish', '__end__');

// AI-002 (onda 32): checkpointer real (Postgres, compartilhado — src/lib/ai/checkpointer.ts).
const swarmApp = workflow.compile({ checkpointer });

export class SwarmOrchestrator {
  async executeMission(mission: string, sessionId?: string, leadId?: string) {
    const sid = sessionId || `swarm-mission-${Date.now()}`;
    // thread_id prefixado pelo tenant (AI-002, onda 20). `sessionId` chega cru do corpo da
    // requisição HTTP (POST /swarm/mission) — sem o prefixo, duas organizações que
    // (coincidentemente ou não) mandassem o mesmo sessionId reaproveitariam o checkpoint uma
    // da outra, já que o checkpointer deste grafo é compartilhado por todo o processo.
    const config = {
      configurable: { thread_id: `${getTenantId() ?? 'unknown-tenant'}:${sid}` },
      recursionLimit: 25,
    };

    try {
      // AI-007 (parte 3): gate fail-closed antes de enviar PII a provedor externo
      assertPiiExternalConsent(getTenantId());
      // AI-002 (onda 32): garante que as tabelas do checkpointer Postgres existam
      await ensureCheckpointerReady();
      const finalState = await swarmApp.invoke(
        { messages: [new HumanMessage(mission)], mission, leadId: leadId || '' },
        config,
      );
      return finalState.messages as BaseMessage[];
    } catch (error: any) {
      logger.error({ err: error, sessionId: sid }, 'Swarm execution failed');
      throw error;
    }
  }

  async executeMissionStream(
    mission: string,
    sessionId: string,
    onChunk: (event: SwarmEvent) => void,
    leadId?: string,
  ) {
    const sid = sessionId || `swarm-mission-${Date.now()}`;
    const config = {
      configurable: { thread_id: `${getTenantId() ?? 'unknown-tenant'}:${sid}` },
      recursionLimit: 25,
    };

    try {
      assertPiiExternalConsent(getTenantId());
      await ensureCheckpointerReady();
      const stream = await swarmApp.stream(
        { messages: [new HumanMessage(mission)], mission, leadId: leadId || '' },
        config,
      );

      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const nodeData = chunk[nodeName as keyof typeof chunk] as
          | { messages?: BaseMessage[] }
          | undefined;
        const msgs = nodeData?.messages;
        if (msgs && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1] as AIMessage;
          const event =
            (lastMsg.additional_kwargs?.swarmEvent as SwarmEvent | undefined) ??
            buildEvent('agent_result', 'supervisor', String(lastMsg.content ?? ''), 0);
          onChunk(event);
        }
      }
    } catch (error: any) {
      logger.error({ err: error, sessionId: sid }, 'Swarm stream execution failed');
      throw error;
    }
  }

  /**
   * Executa uma missão especializada usando a Suíte Comercial V3.1 (19 especialistas, 463 habilidades).
   * Integração de envelope seguro V3.1 e garantia de isolamento multi-tenant fail-closed.
   */
  async executeCommercialV3Specialist(
    agentId: import('../commercial-v3/contracts/commercialAgentV3.types.js').CommercialV3AgentId,
    mission: string,
    options?: {
      organizationId?: string;
      playbookId?: string;
      contextPayload?: Record<string, unknown>;
      sessionId?: string;
    },
  ) {
    const { commercialAgentV3Orchestrator } = await import(
      '../commercial-v3/services/commercialAgentV3Orchestrator.service.js'
    );
    const orgId = options?.organizationId || getTenantId() || 'org_default';
    assertPiiExternalConsent(orgId);

    return commercialAgentV3Orchestrator.dispatchMission({
      agentId,
      organizationId: orgId,
      mission,
    });
  }
}

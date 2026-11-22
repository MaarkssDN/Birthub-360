/**
 * Birth Hub 360° — Camada de runtime dos 29 personagens (missão de integração
 * funcional). Deriva, para cada personagem do catálogo canônico, o vínculo
 * REAL com o agente/motor que o sustenta — sem inventar rotas nem agentes.
 *
 * Fontes de verdade:
 * - `COMMERCIAL_AGENT_REGISTRY` (httpRoute/noRouteReason/capabilities) — 15 agentes.
 * - Rotas montadas em `src/bootstrap/routes.ts` — canais/voz e orquestração.
 * - `ModuleAgentWidget` + `/api/agent/swarm/stream` — personagens-pilar e Supervisor.
 *
 * Regra: `status` reflete APENAS evidência de código/rota existente.
 * 'unavailable' é uma resposta honesta (lacuna documentada), nunca um mock.
 */

import { COMMERCIAL_AGENT_REGISTRY } from '../intelligence/agents/commercialAgentRegistry.js';
import {
  CHARACTER_CATALOG,
  type CharacterDefinition,
  type CharacterState,
} from './characterCatalog.js';

/* ------------------------------------------------------------------ *
 *  Estados operacionais (8) — derivados de execução real, nunca de timer
 * ------------------------------------------------------------------ */

export type OperationalState =
  /** Personagem pronto para receber tarefa. */
  | 'available'
  /** Posição na fila de concorrência do Supervisor (slot ainda não concedido). */
  | 'queued'
  /** Especialista executando operação real. */
  | 'processing'
  /** Supervisor encaminhando/coordenando trabalho entre especialistas. */
  | 'delegating'
  /** Execução finalizada com sucesso. */
  | 'completed'
  /** Falha real identificada. */
  | 'error'
  /** Permissão, dependência ou condição impeditiva (ex.: SOURCE_REQUIRED). */
  | 'blocked'
  /** Runtime ou serviço indisponível (ex.: módulo legacy desligado, sem rota). */
  | 'unavailable';

export const OPERATIONAL_STATES: readonly OperationalState[] = [
  'available',
  'queued',
  'processing',
  'delegating',
  'completed',
  'error',
  'blocked',
  'unavailable',
] as const;

/** Mapeia os 8 estados operacionais para os 6 estados visuais do SVG. */
export function operationalStateToCharacterState(state: OperationalState): CharacterState {
  switch (state) {
    case 'queued':
      return 'listening';
    case 'processing':
    case 'delegating':
      return 'processing';
    case 'completed':
      return 'success';
    case 'error':
    case 'blocked':
      return 'error';
    default:
      return 'idle';
  }
}

/* ------------------------------------------------------------------ *
 *  Vínculo personagem → agente/motor real
 * ------------------------------------------------------------------ */

export type CharacterAgentKind =
  | 'pillar-context'
  | 'commercial-agent'
  | 'channel-engine'
  | 'orchestration';

/** Como uma missão dispara o agente a partir do personagem. */
export type CharacterDispatch =
  /** Via `/api/agent/swarm/stream` (Supervisor 00 delega aos especialistas). */
  | 'swarm-stream'
  /** Via a superfície real do módulo (rota/página dedicada do agente). */
  | 'module-surface'
  /** Sem caminho de execução hoje — exibição apenas informativa. */
  | 'none';

export interface CharacterRuntimeInfo {
  kind: CharacterAgentKind;
  status: 'available' | 'degraded' | 'unavailable';
  /** Motivo documentado quando não há caminho real de execução. */
  reason: string | null;
  /** Rota HTTP real de execução, quando existir. */
  httpRoute: string | null;
  capabilities: string[];
  requiresApproval: boolean;
  risk: string | null;
  dispatch: CharacterDispatch;
}

export interface CharacterRuntimeEntry {
  character: CharacterDefinition;
  runtime: CharacterRuntimeInfo;
}

/** Motores de canal/voz — evidência de rota/superfície verificada no código. */
const CHANNEL_RUNTIME: Record<
  string,
  {
    status: 'available' | 'unavailable';
    reason: string | null;
    httpRoute: string | null;
    dispatch: CharacterDispatch;
  }
> = {
  // /api/voice-hub está montado como unavailableLegacyModule (503 MODULE_NOT_READY)
  // em src/bootstrap/routes.ts — motor existe, entrega desligada por decisão.
  'voice-agent': {
    status: 'unavailable',
    reason: 'Módulo voice-hub desativado (503 MODULE_NOT_READY) — ver src/bootstrap/routes.ts',
    httpRoute: null,
    dispatch: 'none',
  },
  // 'sdr-diagnostic' é uma superfície real de módulo (JoaoReisDiagnosticHub) na
  // navegação do Pilar 06 — diagnóstico interativo, não runtime de missão.
  'sdr-diagnostic': {
    status: 'available',
    reason: null,
    httpRoute: null,
    dispatch: 'module-surface',
  },
  // hunters/tactical existem como código de domínio sem rota HTTP própria —
  // invocáveis indiretamente via swarm quando o Supervisor os acionar.
  'hunter-agent': {
    status: 'unavailable',
    reason: 'Motor existe (src/features/intelligence/agents/hunters) sem rota HTTP dedicada',
    httpRoute: null,
    dispatch: 'none',
  },
  'tactical-agent': {
    status: 'unavailable',
    reason: 'Motor existe (src/features/intelligence/agents/tactical) sem rota HTTP dedicada',
    httpRoute: null,
    dispatch: 'none',
  },
};

const REGISTRY_BY_ID = new Map(COMMERCIAL_AGENT_REGISTRY.map((a) => [a.id, a]));

/** Deriva o vínculo runtime de UM personagem. Pura e determinística. */
export function getCharacterRuntime(character: CharacterDefinition): CharacterRuntimeInfo {
  if (character.layer === 'pillar') {
    // Personagens-pilar são contexto de módulo: a execução real é a missão do
    // enxame via Supervisor 00 (mesmo caminho do ModuleAgentWidget).
    return {
      kind: 'pillar-context',
      status: 'available',
      reason: null,
      httpRoute: '/api/agent/swarm/stream',
      capabilities: ['contextual_copilot', 'swarm_mission'],
      requiresApproval: false,
      risk: null,
      dispatch: 'swarm-stream',
    };
  }

  if (character.layer === 'orchestration') {
    return {
      kind: 'orchestration',
      status: 'available',
      reason: null,
      httpRoute: '/api/agent/swarm/stream',
      capabilities: ['mission_routing', 'delegation', 'oversight'],
      requiresApproval: false,
      risk: null,
      dispatch: 'swarm-stream',
    };
  }

  if (character.layer === 'channel-agent') {
    const ch = CHANNEL_RUNTIME[character.linkedAgentId ?? ''];
    return {
      kind: 'channel-engine',
      status: ch?.status ?? 'unavailable',
      reason: ch?.reason ?? 'Motor de canal sem vínculo verificado',
      httpRoute: ch?.httpRoute ?? null,
      capabilities: [],
      requiresApproval: false,
      risk: null,
      dispatch: ch?.dispatch ?? 'none',
    };
  }

  // commercial-agent
  const agent = character.linkedAgentId
    ? REGISTRY_BY_ID.get(character.linkedAgentId as never)
    : undefined;
  if (!agent) {
    return {
      kind: 'commercial-agent',
      status: 'unavailable',
      reason: `Agente '${character.linkedAgentId}' ausente do COMMERCIAL_AGENT_REGISTRY`,
      httpRoute: null,
      capabilities: [],
      requiresApproval: false,
      risk: null,
      dispatch: 'none',
    };
  }
  const hasRoute = Boolean(agent.httpRoute);
  return {
    kind: 'commercial-agent',
    status: hasRoute ? 'available' : 'unavailable',
    reason: agent.noRouteReason,
    httpRoute: agent.httpRoute,
    capabilities: [...agent.capabilities],
    requiresApproval: agent.requiresApproval,
    risk: agent.risk,
    dispatch: hasRoute ? 'module-surface' : 'none',
  };
}

/** Catálogo enriquecido com vínculo runtime — fonte do endpoint /api/agent/characters. */
export function listCharacterRuntime(): CharacterRuntimeEntry[] {
  return CHARACTER_CATALOG.map((character) => ({
    character,
    runtime: getCharacterRuntime(character),
  }));
}

export function getCharacterRuntimeEntry(characterId: string): CharacterRuntimeEntry | undefined {
  const character = CHARACTER_CATALOG.find((c) => c.id === characterId);
  return character ? { character, runtime: getCharacterRuntime(character) } : undefined;
}

/* ------------------------------------------------------------------ *
 *  Eventos SSE do enxame → estado operacional
 * ------------------------------------------------------------------ */

export interface SwarmEventLike {
  type: 'routing' | 'agent_result' | 'agent_error' | 'final' | string;
  agent?: string;
}

/** Converte um SwarmEvent real no estado operacional do personagem. */
export function mapSwarmEventToOperationalState(event: SwarmEventLike): OperationalState {
  switch (event.type) {
    case 'routing':
      return 'delegating';
    case 'agent_result':
      return 'processing';
    case 'final':
      return 'completed';
    case 'agent_error':
      return 'error';
    default:
      return 'processing';
  }
}

/** Estados terminais de uma execução (para histórico/polling). */
export function isTerminalOperationalState(state: OperationalState): boolean {
  return (
    state === 'completed' || state === 'error' || state === 'blocked' || state === 'unavailable'
  );
}

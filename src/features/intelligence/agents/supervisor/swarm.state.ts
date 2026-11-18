// Estado do grafo do enxame extraído de supervisor.agent.ts — módulo folha de tipos/estado
// para quebrar o ciclo de dependência supervisor.agent.ts ↔ supervisor/specialistNodes.ts
// (violação `no-circular` do dependency-cruiser; BT360-DT-0004 / Onda 5). specialistNodes.ts
// só precisa do TIPO do estado; manter a Annotation aqui evita que o módulo de nós
// precise importar o orquestrador inteiro.
import type { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import type { SemanticAgentMatch, SubSwarmDomain, SwarmAgentKey } from '../subSwarms.config.js';

export type SwarmRoute = SwarmAgentKey | 'finish';

export const SwarmState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  mission: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => '',
  }),
  instruction: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => '',
  }),
  // ID real de Lead do CRM, opcional — ver sdrNode: sem isto, SDRQualificationAgent.run() recebia
  // o texto livre da missão/instrução no lugar de um ID de lead de verdade e a ferramenta de
  // contexto sempre falhava com "lead não encontrado" (IA-003).
  leadId: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => '',
  }),
  subSwarm: Annotation<SubSwarmDomain>({
    reducer: (left, right) => right ?? left,
    default: () => 'commercial',
  }),
  catalogMatches: Annotation<SemanticAgentMatch[]>({
    reducer: (left, right) => (right && right.length > 0 ? right : left),
    default: () => [],
  }),
  selectedCatalogAgent: Annotation<string | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  next: Annotation<SwarmRoute>({
    reducer: (left, right) => right ?? left,
    default: () => 'sdr',
  }),
  completed: Annotation<SwarmAgentKey[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  results: Annotation<Partial<Record<SwarmAgentKey, string>>>({
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({}),
  }),
  step: Annotation<number>({
    reducer: (left, right) => right ?? left,
    default: () => 0,
  }),
});

export type SwarmStateType = typeof SwarmState.State;

// Estado do grafo do enxame, extraído de supervisor.agent.ts para quebrar o ciclo
// supervisor.agent.ts → supervisor/specialistNodes.ts → supervisor.agent.ts
// (specialistNodes precisava apenas do tipo SwarmStateType, mas o import de volta
// reabria o ciclo que a regra `no-circular` do dependency-cruiser proíbe).
import type { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import type { SemanticAgentMatch, SubSwarmDomain, SwarmAgentKey } from '../subSwarms.config.js';

// Mesmo union de `SwarmRoute` em supervisor.agent.ts — redeclarado aqui porque importar
// aquele tipo recriaria o ciclo que este módulo existe para quebrar.
type SwarmRoute = SwarmAgentKey | 'finish';

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

// Exportado (type-only) para os nós especialistas em supervisor/specialistNodes.ts.
export type SwarmStateType = typeof SwarmState.State;

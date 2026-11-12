/**
 * Birth Hub 360° — Registro Canônico de Personagens Digitais (29).
 *
 * Fonte única de verdade para a camada de interface (Categoria 5 do
 * `docs/master-v4/03-INVENTARIO-OFICIAL-AGENTES.md`): 9 personagens-pilar
 * homologados (Orbit…Sudo) + 20 personagens de agentes de runtime, canais
 * de voz e orquestração.
 *
 * Regras invioláveis:
 * - Os 9 personagens-pilar mantêm ids, nomes, paletas e contextos originais.
 * - Os 20 novos NUNCA representam personas do Agent Builder (379) — cada um
 *   vincula-se a um agente real do `COMMERCIAL_AGENT_REGISTRY`, a um motor de
 *   canal/voz ou ao Supervisor Central.
 * - `fallbackId` aponta para um personagem sempre existente ('core').
 * - Nenhum personagem é um agente de IA: o processamento permanece no
 *   Supervisor/AgentBus. Este catálogo é puramente declarativo/visual.
 */
import type { CharacterDefinition, CharacterLayer } from './characterCatalog.shared.js';
import { PILLAR_CHARACTERS } from './characterCatalogPillars.js';
import { AGENT_CHARACTERS } from './characterCatalogAgents.js';

export type {
  CharacterDefinition,
  CharacterLayer,
  CharacterPalette,
  CharacterState,
} from './characterCatalog.shared.js';
export { CHARACTER_STATES } from './characterCatalog.shared.js';

/** Catálogo completo — 29 personagens (9 pilares + 20 agentes/canais/orquestração). */
export const CHARACTER_CATALOG: CharacterDefinition[] = [...PILLAR_CHARACTERS, ...AGENT_CHARACTERS];

/* ------------------------------------------------------------------ *
 *  Índices e helpers declarativos
 * ------------------------------------------------------------------ */

const BY_ID = new Map(CHARACTER_CATALOG.map((c) => [c.id, c]));
const BY_CONTEXT_GROUP = new Map(
  CHARACTER_CATALOG.filter((c) => c.contextGroup).map((c) => [c.contextGroup as string, c]),
);

export function getCharacter(id: string): CharacterDefinition | undefined {
  return BY_ID.get(id);
}

const CORE_FALLBACK = CHARACTER_CATALOG.find((c) => c.id === 'core') as CharacterDefinition;

export function getCharacterOrFallback(id: string): CharacterDefinition {
  return BY_ID.get(id) ?? CORE_FALLBACK;
}

/** Personagem-pilar associado a um grupo de navegação do ModuleAgentWidget. */
export function getPillarCharacter(contextGroup: string): CharacterDefinition | undefined {
  return BY_CONTEXT_GROUP.get(contextGroup);
}

export function getCharactersByLayer(layer: CharacterLayer): CharacterDefinition[] {
  return CHARACTER_CATALOG.filter((c) => c.layer === layer);
}

/** Personagens vinculados a um agente/motor real (camadas 2, 3 e 7). */
export function getCharactersByAgent(linkedAgentId: string): CharacterDefinition[] {
  return CHARACTER_CATALOG.filter((c) => c.linkedAgentId === linkedAgentId);
}

/** Caminho do SVG com fallback para 'core' quando o id é desconhecido. */
export function characterSvgSrc(id: string): string {
  return getCharacterOrFallback(id).svg;
}

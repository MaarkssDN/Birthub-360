/**
 * Sincroniza os tokens de marca (identidade-visual/birthhub360/tokens/characters.{json,ts})
 * com o registro canônico de personagens (src/features/characters/characterCatalog.ts).
 *
 * Gera a seção `agentCharacters` (Camadas 2, 3 e 7 — 20 personagens novos) sem tocar nos 9
 * personagens-pilar originais. Idempotente: pode ser re-executado após mudanças no catálogo.
 *
 * Uso: npx tsx scripts/sync-character-brand-tokens.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTER_CATALOG,
  type CharacterState,
} from '../src/features/characters/characterCatalog.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_DIR = join(ROOT, 'identidade-visual', 'birthhub360', 'tokens');

const agentCharacters = CHARACTER_CATALOG.filter((c) => c.layer !== 'pillar');

const STATE_PARAMS: Record<
  CharacterState,
  { animation: (id: string) => string; scale: number; haloOpacity: number; statusColor: (p: string) => string }
> = {
  idle: {
    animation: (id) => `${id}-idle 5.5s ease-in-out infinite`,
    scale: 1,
    haloOpacity: 0.35,
    statusColor: (p) => p,
  },
  listening: {
    animation: (id) => `${id}-listening 1.6s ease-in-out infinite`,
    scale: 1.05,
    haloOpacity: 0.7,
    statusColor: () => '#00D4FF',
  },
  processing: {
    animation: (id) => `${id}-processing 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
    scale: 1.03,
    haloOpacity: 0.8,
    statusColor: () => '#FF2D9B',
  },
  speaking: {
    animation: (id) => `${id}-speaking 1.9s ease-in-out infinite`,
    scale: 1.04,
    haloOpacity: 0.6,
    statusColor: (p) => p,
  },
  success: {
    animation: (id) => `${id}-success 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
    scale: 1.08,
    haloOpacity: 0.88,
    statusColor: () => '#10B981',
  },
  error: {
    animation: (id) => `${id}-error 0.5s ease-in-out`,
    scale: 0.98,
    haloOpacity: 0.72,
    statusColor: () => '#EF4444',
  },
};

function buildEntry(c: (typeof agentCharacters)[number]) {
  const expressions = Object.fromEntries(
    c.states.map((s) => {
      const p = STATE_PARAMS[s];
      return [
        s,
        {
          animation: p.animation(c.id),
          scale: p.scale,
          haloOpacity: p.haloOpacity,
          statusColor: p.statusColor(c.palette.primary),
          description: c.animationSignature,
        },
      ];
    }),
  );
  return {
    id: c.id,
    name: c.name,
    layer: c.layer,
    linkedAgentId: c.linkedAgentId,
    role: c.role,
    module: c.modules[0] ?? null,
    modules: c.modules,
    ariaLabel: c.ariaLabel,
    command: c.command,
    archetype: c.archetype,
    palette: {
      primary: c.palette.primary,
      primaryRgb: c.palette.primary,
      secondary: c.palette.secondary,
      secondaryRgb: c.palette.secondary,
      accent: c.palette.accent,
      gradientDark: `linear-gradient(135deg, ${c.palette.primary}40 0%, ${c.palette.secondary}26 100%)`,
      gradientLight: `linear-gradient(135deg, ${c.palette.primary}26 0%, ${c.palette.secondary}1A 100%)`,
      halo: c.palette.halo,
      heading: c.palette.heading,
      subheading: c.palette.subheading,
    },
    assets: { svg: c.svg, viewBox: c.viewBox },
    expressions,
  };
}

// ---- characters.json ----
const jsonPath = join(TOKENS_DIR, 'characters.json');
const json = JSON.parse(readFileSync(jsonPath, 'utf8'));
json.agentCharacters = Object.fromEntries(agentCharacters.map((c) => [c.id, buildEntry(c)]));
json.meta = {
  ...(json.meta ?? {}),
  expandedAt: '2026-11-10',
  totalCharacters: 29,
  note: 'agentCharacters = Camadas 2/3/7 geradas de src/features/characters/characterCatalog.ts via scripts/sync-character-brand-tokens.ts',
};
writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

// ---- characters.ts (append-only: não altera os 9 pilares) ----
const tsPath = join(TOKENS_DIR, 'characters.ts');
let ts = readFileSync(tsPath, 'utf8');
const marker = 'export function getCharacter(id: CharacterId)';
if (!ts.includes('BIRTHHUB_AGENT_CHARACTERS')) {
  const ids = agentCharacters.map((c) => `'${c.id}'`).join(' | ');
  const entries = agentCharacters
    .map((c) => {
      const e = buildEntry(c);
      const expr = (['idle', 'listening', 'processing', 'speaking', 'success', 'error'] as const)
        .map((s) => {
          const x = (e.expressions as Record<string, any>)[s];
          return `      ${s}: {\n        animation: '${x.animation}',\n        scale: ${x.scale},\n        haloOpacity: ${x.haloOpacity},\n        statusColor: '${x.statusColor}',\n        description: '${x.description}',\n      },`;
        })
        .join('\n');
      const palette = Object.entries(e.palette)
        .map(([k, v]) => `      ${k}: '${v}',`)
        .join('\n');
      return `  ${c.id}: {\n    id: '${c.id}',\n    name: '${c.name}',\n    pillar: '${c.layer}',\n    module: ${JSON.stringify(c.modules[0] ?? null)},\n    role: '${c.role}',\n    ariaLabel: '${c.ariaLabel}',\n    command: '${c.command}',\n    archetype: '${c.archetype}',\n    palette: {\n${palette}\n    },\n    assets: {\n      svg: '${c.svg}',\n      viewBox: '${c.viewBox}',\n    },\n    expressions: {\n${expr}\n    },\n  },`;
    })
    .join('\n');
  const block = `
/**
 * EXPANSÃO 9 → 29 — Camadas 2/3/7 (20 personagens de agentes de runtime,
 * canais de voz e orquestração). Gerado por scripts/sync-character-brand-tokens.ts
 * a partir de src/features/characters/characterCatalog.ts — não editar à mão.
 */
export type AgentCharacterId = ${ids};
export type AnyCharacterId = CharacterId | AgentCharacterId;

export interface AgentCharacterDefinition extends Omit<CharacterDefinition, 'id'> {
  id: AgentCharacterId;
}

export const BIRTHHUB_AGENT_CHARACTERS: Record<AgentCharacterId, AgentCharacterDefinition> = {
${entries}
} as const;

export function getAgentCharacter(id: AgentCharacterId): AgentCharacterDefinition {
  return BIRTHHUB_AGENT_CHARACTERS[id];
}

export function listAgentCharacters(): AgentCharacterDefinition[] {
  return Object.values(BIRTHHUB_AGENT_CHARACTERS);
}
`;
  ts = ts.replace(marker, `${block}\n${marker}`);
  writeFileSync(tsPath, ts, 'utf8');
}

console.log(
  `OK — ${agentCharacters.length} agentCharacters sincronizados (total catálogo: ${CHARACTER_CATALOG.length})`,
);

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHARACTER_CATALOG,
  CHARACTER_STATES,
  getCharacter,
  getCharacterOrFallback,
  getCharactersByAgent,
  getCharactersByLayer,
} from '../../../../src/features/characters/characterCatalog.js';
import { COMMERCIAL_AGENT_REGISTRY } from '../../../../src/features/intelligence/agents/commercialAgentRegistry.js';

const PUBLIC_DIR = join(__dirname, '../../../../public');
const ORIGINAL_NINE = ['orbit', 'nexus', 'aria', 'vanguard', 'oracle', 'core', 'spark', 'echo', 'sudo'];
const CHANNEL_AGENT_IDS = ['voice-agent', 'sdr-diagnostic', 'hunter-agent', 'tactical-agent'];
const SUPERVISOR_ID = 'supervisor-central';

describe('characterCatalog — homologação 29 personagens', () => {
  it('contém exatamente 29 personagens', () => {
    expect(CHARACTER_CATALOG).toHaveLength(29);
  });

  it('todos os IDs são únicos', () => {
    const ids = CHARACTER_CATALOG.map((c) => c.id);
    expect(new Set(ids).size).toBe(29);
  });

  it('preserva integralmente os 9 personagens originais', () => {
    for (const id of ORIGINAL_NINE) {
      const c = getCharacter(id);
      expect(c, `personagem ${id} ausente`).toBeDefined();
      expect(c!.layer).toBe('pillar');
      expect(c!.contextGroup).toBeTruthy();
      expect(existsSync(join(PUBLIC_DIR, c!.svg))).toBe(true);
    }
  });

  it('os 20 novos personagens estão nas camadas 2, 3 e 7', () => {
    const agents = CHARACTER_CATALOG.filter((c) => c.layer !== 'pillar');
    expect(agents).toHaveLength(20);
    expect(getCharactersByLayer('commercial-agent')).toHaveLength(15);
    expect(getCharactersByLayer('channel-agent')).toHaveLength(4);
    expect(getCharactersByLayer('orchestration')).toHaveLength(1);
  });

  it('todo personagem novo está vinculado a um agente real registrado', () => {
    const commercialIds = new Set(COMMERCIAL_AGENT_REGISTRY.map((d) => d.id));
    for (const c of CHARACTER_CATALOG.filter((x) => x.layer !== 'pillar')) {
      expect(c.linkedAgentId, `${c.id} sem linkedAgentId`).toBeTruthy();
      const valid =
        commercialIds.has(c.linkedAgentId!) ||
        CHANNEL_AGENT_IDS.includes(c.linkedAgentId!) ||
        c.linkedAgentId === SUPERVISOR_ID;
      expect(valid, `${c.id} → ${c.linkedAgentId} não corresponde a agente real`).toBe(true);
    }
  });

  it('cada agente comercial de runtime tem exatamente um personagem', () => {
    for (const def of COMMERCIAL_AGENT_REGISTRY) {
      expect(getCharactersByAgent(def.id), `sem personagem para ${def.id}`).toHaveLength(1);
    }
  });

  it('todos os 29 SVGs existem em public/ e usam viewBox 128', () => {
    for (const c of CHARACTER_CATALOG) {
      const path = join(PUBLIC_DIR, c.svg);
      expect(existsSync(path), `SVG ausente: ${c.svg}`).toBe(true);
      expect(c.viewBox).toBe('0 0 128 128');
      const xml = readFileSync(path, 'utf8');
      expect(xml).toContain('<svg');
      // xmlns="http://www.w3.org/2000/svg" é namespace XML, não recurso externo.
      // O que é proibido: referências externas (href/src=http, <image>, @import, url(http).
      expect(xml).not.toMatch(/(href|src)\s*=\s*["']https?:/i);
      expect(xml).not.toMatch(/<image|@import|url\(\s*['"]?https?:/i);
      expect(xml).toMatch(/<title[\s>]/);
    }
  });

  it('todos suportam os 6 estados operacionais', () => {
    for (const c of CHARACTER_CATALOG) {
      expect(c.states).toEqual(CHARACTER_STATES);
    }
  });

  it('nenhum personagem usa serviço externo de avatar', () => {
    for (const c of CHARACTER_CATALOG) {
      expect(c.svg).toMatch(/^\/brand\/characters\/[a-z-]+\.svg$/);
    }
  });

  it('fallback retorna core para ID desconhecido', () => {
    expect(getCharacterOrFallback('inexistente').id).toBe('core');
    expect(getCharacter('inexistente')).toBeUndefined();
  });

  it('personagens-pilar mantêm contextMsg/contextGroup; agentes não pertencem a pilares', () => {
    for (const c of CHARACTER_CATALOG) {
      if (c.layer === 'pillar') {
        expect(c.contextMsg, `${c.id} pillar sem contextMsg`).toBeTruthy();
        expect(c.contextGroup, `${c.id} pillar sem contextGroup`).toBeTruthy();
      } else {
        expect(c.contextGroup, `${c.id} não-pilar não pode ter contextGroup`).toBeNull();
        expect(c.linkedAgentId, `${c.id} sem vínculo de agente`).toBeTruthy();
      }
    }
  });
});

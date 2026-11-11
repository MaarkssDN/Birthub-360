import { describe, expect, it } from 'vitest';
import {
  getCharacterRuntime,
  getCharacterRuntimeEntry,
  isTerminalOperationalState,
  listCharacterRuntime,
  mapSwarmEventToOperationalState,
  operationalStateToCharacterState,
  OPERATIONAL_STATES,
} from '../../../../src/features/characters/characterRuntime.js';
import { CHARACTER_CATALOG, getCharacter } from '../../../../src/features/characters/characterCatalog.js';

describe('characterRuntime — vínculo personagem→agente real', () => {
  it('deriva runtime para os 29 personagens sem exceção', () => {
    const entries = listCharacterRuntime();
    expect(entries).toHaveLength(29);
    for (const { character, runtime } of entries) {
      expect(runtime.kind).toBeTruthy();
      expect(runtime.status).toMatch(/available|degraded|unavailable/);
      expect(runtime.dispatch).toMatch(/swarm-stream|module-surface|none/);
      expect(character.id).toBeTruthy();
    }
  });

  it('agentes comerciais COM rota HTTP ficam available + module-surface', () => {
    const ldr = getCharacter('axiom')!;
    const rt = getCharacterRuntime(ldr);
    expect(rt.kind).toBe('commercial-agent');
    expect(rt.status).toBe('available');
    expect(rt.httpRoute).toBe('/api/agent/commercial-cell/ldr-intelligence/run');
    expect(rt.capabilities.length).toBeGreaterThan(0);
    expect(rt.dispatch).toBe('module-surface');
  });

  it('agente sem rota (billing-revenue/SOURCE_REQUIRED) fica unavailable com motivo', () => {
    const ledger = getCharacter('ledger')!;
    const rt = getCharacterRuntime(ledger);
    expect(rt.status).toBe('unavailable');
    expect(rt.httpRoute).toBeNull();
    expect(rt.dispatch).toBe('none');
    expect(rt.reason).toBeTruthy();
  });

  it('pilares e orquestrador despacham via swarm-stream (Supervisor 00)', () => {
    for (const id of ['orbit', 'core', 'sudo', 'aegis']) {
      const rt = getCharacterRuntime(getCharacter(id)!);
      expect(rt.dispatch).toBe('swarm-stream');
      expect(rt.httpRoute).toBe('/api/agent/swarm/stream');
      expect(rt.status).toBe('available');
    }
  });

  it('voice-agent reflete voice-hub desativado (503 MODULE_NOT_READY)', () => {
    const rt = getCharacterRuntime(getCharacter('vox')!);
    expect(rt.status).toBe('unavailable');
    expect(rt.reason).toMatch(/MODULE_NOT_READY|voice-hub/);
  });

  it('sdr-diagnostic fica available via superfície de módulo', () => {
    const rt = getCharacterRuntime(getCharacter('scope')!);
    expect(rt.status).toBe('available');
    expect(rt.dispatch).toBe('module-surface');
  });

  it('hunter/tactical sem rota HTTP ficam unavailable honestos', () => {
    for (const id of ['tracker', 'tempo']) {
      const rt = getCharacterRuntime(getCharacter(id)!);
      expect(rt.status).toBe('unavailable');
      expect(rt.httpRoute).toBeNull();
    }
  });

  it('todo personagem do catálogo tem entrada runtime (sem órfãos)', () => {
    for (const c of CHARACTER_CATALOG) {
      expect(getCharacterRuntimeEntry(c.id), `sem runtime para ${c.id}`).toBeDefined();
    }
    expect(getCharacterRuntimeEntry('inexistente')).toBeUndefined();
  });
});

describe('characterRuntime — estados operacionais', () => {
  it('mapeia SwarmEvent → estado operacional', () => {
    expect(mapSwarmEventToOperationalState({ type: 'routing' })).toBe('delegating');
    expect(mapSwarmEventToOperationalState({ type: 'agent_result' })).toBe('processing');
    expect(mapSwarmEventToOperationalState({ type: 'final' })).toBe('completed');
    expect(mapSwarmEventToOperationalState({ type: 'agent_error' })).toBe('error');
  });

  it('mapeia estado operacional → estado visual do SVG', () => {
    expect(operationalStateToCharacterState('available')).toBe('idle');
    expect(operationalStateToCharacterState('queued')).toBe('listening');
    expect(operationalStateToCharacterState('processing')).toBe('processing');
    expect(operationalStateToCharacterState('delegating')).toBe('processing');
    expect(operationalStateToCharacterState('completed')).toBe('success');
    expect(operationalStateToCharacterState('error')).toBe('error');
    expect(operationalStateToCharacterState('blocked')).toBe('error');
    expect(operationalStateToCharacterState('unavailable')).toBe('idle');
  });

  it('8 estados operacionais cobrem os 6 visuais', () => {
    expect(OPERATIONAL_STATES).toHaveLength(8);
    const visuals = new Set(OPERATIONAL_STATES.map(operationalStateToCharacterState));
    expect(visuals.size).toBeLessThanOrEqual(6);
  });

  it('estados terminais são completed/error/blocked/unavailable', () => {
    expect(isTerminalOperationalState('completed')).toBe(true);
    expect(isTerminalOperationalState('error')).toBe(true);
    expect(isTerminalOperationalState('processing')).toBe(false);
    expect(isTerminalOperationalState('queued')).toBe(false);
  });
});

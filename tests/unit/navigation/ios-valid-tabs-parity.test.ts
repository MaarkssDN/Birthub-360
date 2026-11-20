import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIVE_NAV_TABS } from '../../../src/lib/navigationBus.js';

/**
 * Auditoria DEM-20261115-001 (Agente 09, Onda AUD-3) — paridade estrita entre `validTabs` em
 * `ios/App/App/SceneDelegate.swift` (iOS nativo) e `ACTIVE_NAV_TABS` em
 * `src/lib/navigationBus.ts`.
 *
 * O app iOS mantém um espelho manual dos destinos navegáveis (Swift não importa TypeScript).
 * Antes desta correção a lista iOS divergia do Android em drift bidirecional (~34 entradas,
 * com `sdr-diagnostic-joao` inexistente e sem `crm360`, `propostas`, `forecast`, `settings_*`
 * etc.) — deep link válido numa plataforma falhava na outra. Este teste é a contraparte iOS
 * de `android-valid-tabs-parity.test.ts`.
 */

const ROOT = path.resolve(__dirname, '../../..');
const SCENE_DELEGATE = path.join(ROOT, 'ios/App/App/SceneDelegate.swift');

function extractSwiftValidTabs(source: string): Set<string> {
  const match = source.match(/validTabs:\s*Set<String>\s*=\s*\[([\s\S]*?)\]/);
  if (!match) {
    throw new Error('validTabs não encontrado em SceneDelegate.swift — o formato mudou.');
  }
  const tabs = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return new Set(tabs);
}

describe('paridade validTabs (iOS) × ACTIVE_NAV_TABS (web)', () => {
  const swiftTabs = extractSwiftValidTabs(readFileSync(SCENE_DELEGATE, 'utf8'));
  const tsTabs = new Set<string>(ACTIVE_NAV_TABS);

  it('os dois conjuntos são idênticos', () => {
    const onlySwift = [...swiftTabs].filter((t) => !tsTabs.has(t)).sort();
    const onlyTs = [...tsTabs].filter((t) => !swiftTabs.has(t)).sort();
    expect({ onlySwift, onlyTs }).toEqual({ onlySwift: [], onlyTs: [] });
  });

  it('caso de falha documentado: `sdr-diagnostic-joao` não existe em nenhum lado', () => {
    // Regressão real do DEM-20261115-001 — esse destino fantasma existia só na lista iOS.
    expect(swiftTabs.has('sdr-diagnostic-joao')).toBe(false);
    expect(tsTabs.has('sdr-diagnostic-joao')).toBe(false);
  });
});

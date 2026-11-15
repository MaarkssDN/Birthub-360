import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIVE_NAV_TABS } from '../../../src/lib/navigationBus.js';

/**
 * TAREFA-SANEAMENTO-028 / BT360-DT-0053 — paridade estrita entre `VALID_TABS` em
 * `MainActivity.java` (Android nativo) e `ACTIVE_NAV_TABS` em `src/lib/navigationBus.ts`.
 *
 * O app Android mantém um espelho manual dos destinos navegáveis; sem este teste, uma
 * alteração do Agente 02 em `TAB_ROUTE_SET`/`NAV_HIDDEN_TABS` silenciosamente divergiria
 * os dois lados (o caso real foi `gamification`, que só existia no lado TS).
 */

const ROOT = path.resolve(__dirname, '../../..');
const MAIN_ACTIVITY = path.join(
  ROOT,
  'android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java',
);

function extractJavaValidTabs(source: string): Set<string> {
  const match = source.match(/VALID_TABS\s*=\s*new\s+HashSet<>\(Arrays\.asList\(([\s\S]*?)\)\)/);
  if (!match) {
    throw new Error('VALID_TABS não encontrado em MainActivity.java — o formato mudou.');
  }
  const tabs = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return new Set(tabs);
}

describe('paridade VALID_TABS (Android) × ACTIVE_NAV_TABS (web)', () => {
  const javaTabs = extractJavaValidTabs(readFileSync(MAIN_ACTIVITY, 'utf8'));
  const tsTabs = new Set<string>(ACTIVE_NAV_TABS);

  it('os dois conjuntos são idênticos', () => {
    const onlyJava = [...javaTabs].filter((t) => !tsTabs.has(t)).sort();
    const onlyTs = [...tsTabs].filter((t) => !javaTabs.has(t)).sort();
    expect({ onlyJava, onlyTs }).toEqual({ onlyJava: [], onlyTs: [] });
  });

  it('caso de falha documentado: `gamification` existe nos dois lados', () => {
    // Regressão real do BT360-DT-0053 — este destino já divergiu uma vez.
    expect(javaTabs.has('gamification')).toBe(true);
    expect(tsTabs.has('gamification')).toBe(true);
  });
});

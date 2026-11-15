// scripts/architecture/verify-baseline-freshness.mjs
//
// Gate de "baseline de known violations não pode ficar stale" (BT360-DT-0004 / Onda 5,
// handoff .agents/handoffs/onda-saneamento-20261110/00-para-00-...md).
//
// Problema que resolve: `.dependency-cruiser-known-violations.json` é uma baseline manual —
// quando uma onda corrige violações, as entradas antigas continuam no arquivo. O depcruise
// só emite um *aviso* ("N stale known violations") sem falhar o gate, então a baseline pode
// apodrecer indefinidamente e esconder se uma "correção" foi real ou se o arquivo só ficou
// desatualizado. Este script cruza a baseline com o grafo atual e falha se houver entrada
// que já não corresponde a nenhuma violação real (stale) — forçando o prune via
// `npm run lint:architecture:prune` (depcruise --baseline --baseline-mode shrink-only, que
// remove somente o que foi corrigido e NUNCA adiciona violação nova).
//
// `npm run lint:architecture` (--ignore-known) já reprova violação real fora da baseline.
// O que faltava era o sentido inverso: entrada de baseline que já não corresponde a nenhuma
// violação real (stale) só gerava um aviso não-fatal do depcruise ("N stale known violations"),
// deixando a baseline apodrecer quando uma onda corrige imports — exatamente a dessincronia do
// BT360-DT-0004. Este script detecta isso e falha, forçando a ressincronização via
// `npm run lint:architecture:baseline` (regen manual, nunca em CI — ver
// generate-known-violations-baseline.mjs) com revisão de diff.
//
// Nota: `depcruise --baseline-mode shrink-only` NÃO é usado como remediação — o match "same"
// do depcruise exige igualdade estrita do objeto de violação (inclui `cycle`), então ele
// considera stale entradas que o --ignore-known ainda reconhece, e num baseline majoritariamente
// de ciclos ele esvazia o arquivo inteiro (verificado empiricamente em BT360-DT-0004).

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBaseline } from './generate-known-violations-baseline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASELINE_PATH = path.join(ROOT, '.dependency-cruiser-known-violations.json');

// Mesmo comando do lint:architecture / generate-known-violations-baseline.mjs — manter em
// sincronia (worker*.ts é glob do próprio depcruise: worker.ts + worker-<dominio>.ts).
const DEPCRUISE_CMD =
  'npx depcruise --config .dependency-cruiser.cjs --output-type json src server.ts worker*.ts';

function violationKey(entry) {
  // Mesma chave usada para ordenar em buildBaseline: from|to|rule.name.
  return `${entry.from}|${entry.to ?? ''}|${entry.rule.name}`;
}

function runDepcruise() {
  const stdout = execSync(DEPCRUISE_CMD, {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

function main() {
  const report = runDepcruise();
  const currentViolations = buildBaseline(report);
  const currentKeys = new Set(currentViolations.map(violationKey));

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));
  if (!Array.isArray(baseline)) {
    console.error(
      '❌ .dependency-cruiser-known-violations.json não é um array JSON — formato inesperado.',
    );
    process.exit(1);
  }

  const stale = baseline.filter((entry) => !currentKeys.has(violationKey(entry)));

  if (stale.length > 0) {
    console.error(
      `❌ Baseline de known violations desatualizada: ${stale.length} entrada(s) já não ` +
        `correspondem a nenhuma violação real do grafo atual.\n` +
        `Para corrigir, rode \`npm run lint:architecture:baseline\` e revise o diff com atenção: ` +
        `entradas stale devem sumir e NENHUMA violação nova pode entrar na baseline sem ` +
        `documentação de dono em docs/architecture/KNOWN_VIOLATIONS.md.\n` +
        `Exemplos de entradas stale:\n` +
        stale
          .slice(0, 10)
          .map((e) => `  - ${e.from} → ${e.to ?? '(ciclo)'} [${e.rule.name}]`)
          .join('\n'),
    );
    process.exit(1);
  }

  console.log(
    `✅ verify:baseline-freshness — baseline sincronizada: ${baseline.length} entrada(s) ` +
      `conferem com o grafo atual (${currentViolations.length} violação(ões) detectada(s) no total).`,
  );
}

main();

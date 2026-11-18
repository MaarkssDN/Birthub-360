#!/usr/bin/env node
/**
 * Runner portátil do Schemathesis contra `docs/openapi.yaml` (Agente 18 — MEL-39, Onda 5).
 *
 * Substitui o script `test:api-schema` do package.json, que está hardcoded para o venv Windows
 * `.venv-opensource` (`.\\.venv-opensource\\Scripts\\schemathesis.exe`) e não funciona em Linux/CI.
 * Este script resolve o binário nesta ordem:
 *   1. `SCHEMATHESIS_BIN` (override explícito);
 *   2. `.venv-opensource/Scripts/schemathesis.exe` (Windows, layout atual do repo);
 *   3. `.venv-opensource/bin/schemathesis` (venv Linux/macOS);
 *   4. `schemathesis` no PATH;
 *   5. `uvx schemathesis` (uv instalado, sem venv).
 *
 * Uso:
 *   node scripts/api/schemathesis.mjs [--url http://127.0.0.1:3000] [-- <args extras do schemathesis>]
 *
 * Exemplo report-first (roda contra spec local + API de staging, grava resultado em arquivo):
 *   node scripts/api/schemathesis.mjs --url https://staging.example.com -- --report
 *
 * Pré-requisito: a API precisa estar rodando na URL informada — o Schemathesis gera casos a
 * partir do schema e os executa por HTTP. Sem servidor no ar, use o gate estático
 * `npm run verify:openapi-drift`, que não precisa de runtime.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const specPath = path.join(repoRoot, 'docs', 'openapi.yaml');

const argv = process.argv.slice(2);
const urlIdx = argv.indexOf('--url');
const url = urlIdx >= 0 ? argv[urlIdx + 1] : 'http://127.0.0.1:3000';
const extraIdx = argv.indexOf('--');
const extraArgs = extraIdx >= 0 ? argv.slice(extraIdx + 1) : [];

function resolveSchemathesis() {
  const candidates = [
    process.env.SCHEMATHESIS_BIN,
    path.join(repoRoot, '.venv-opensource', 'Scripts', 'schemathesis.exe'),
    path.join(repoRoot, '.venv-opensource', 'bin', 'schemathesis'),
    'schemathesis',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === 'schemathesis' || existsSync(candidate)) {
      // PATH lookup: spawnSync resolve; se não existir, cai no próximo candidato.
      const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: false });
      if (!probe.error) return { command: candidate, prefixArgs: [] };
    }
  }

  return { command: 'uvx', prefixArgs: ['schemathesis'] };
}

if (!existsSync(specPath)) {
  console.error(`Spec não encontrada: ${specPath}`);
  process.exit(2);
}

const { command, prefixArgs } = resolveSchemathesis();
const args = [
  ...prefixArgs,
  'run',
  specPath,
  '--url',
  url,
  // Checks default do Schemathesis já cobrem "not_a_server_error" (5xx inesperado) e
  // conformidade de resposta. Flags adicionais do usuário vão depois de `--`.
  ...extraArgs,
];

console.log(`Schemathesis: ${command} ${args.join(' ')}`);
const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);

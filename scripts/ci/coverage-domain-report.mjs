#!/usr/bin/env node
/**
 * Relatório de cobertura por domínio (MEL-46 / DEM-20261114-007).
 *
 * Lê o coverage-final.json (formato istanbul, saída do reporter 'json' do Vitest)
 * e agrega lines/statements/branches/functions por conjunto de globs de domínio,
 * usando istanbul-lib-coverage — os mesmos números que o Vitest usa nos thresholds
 * de `coverage.thresholds`.
 *
 * Uso:
 *   node scripts/ci/coverage-domain-report.mjs [caminho-do-coverage-final.json]
 * Default: coverage/unit/coverage-final.json
 *   --files   lista os arquivos que casaram com cada domínio
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import istanbulLibCoverage from 'istanbul-lib-coverage';

const { createCoverageMap } = istanbulLibCoverage;

const coveragePath =
  process.argv[2] ?? path.resolve('coverage/unit/coverage-final.json');
const showFiles = process.argv.includes('--files');

if (!existsSync(coveragePath)) {
  console.error(`coverage-final.json não encontrado em: ${coveragePath}`);
  console.error('Rode antes: npm run coverage:unit');
  process.exit(1);
}

// Domínios auditados pela Onda 6 — manter em sincronia com os thresholds por
// domínio de vitest.unit.config.ts (chaves de `coverage.thresholds`).
const DOMAINS = {
  auth: [
    'src/lib/auth/**',
    'src/lib/auth.ts',
    'src/lib/auth-client.ts',
    'src/bootstrap/auth.ts',
    'src/features/auth/**',
    'src/shared/middlewares/authenticateToken.ts',
    'src/shared/middlewares/authorization.ts',
    'src/lib/voice-hub/lib/auth-tokens.ts',
    'src/lib/voice-hub/routes/auth.routes.ts',
    'src/lib/voice-hub/controllers/auth.controller.ts',
    'src/features/prospecting/outbound/server/auth.ts',
    'src/features/prospecting/outbound/server/routes/auth.routes.ts',
  ],
  billing: [
    'src/features/billing/**',
    'src/lib/voice-hub/controllers/billing.controller.ts',
    'src/lib/voice-hub/repositories/billingRepository.ts',
    'src/lib/voice-hub/routes/billing.routes.ts',
    'src/lib/voice-hub/services/billingService.ts',
    'src/features/voice-hub/pages/Dashboard/Billing.tsx',
    'src/services/telephony/billing.service.ts',
  ],
  tenancy: [
    'src/lib/tenant-prisma.ts',
    'src/lib/tenant-scoping-registry.ts',
    'src/lib/prisma-interceptors.ts',
    'src/lib/context.ts',
    'src/lib/async-context.ts',
    'src/lib/queue/outbox/tenantGuard.ts',
    'src/shared/middlewares/tenantRateLimiter.ts',
    'src/lib/voice-hub/repositories/tenantRepository.ts',
    'src/lib/voice-hub/repositories/tenantAiConsentRepository.ts',
  ],
  ia: [
    'src/lib/ai/**',
    'src/features/copiloto-ia/**',
    'src/features/intelligence/**',
    'src/features/ai-voice/**',
    'src/lib/voice-hub/controllers/ai.controller.ts',
    'src/lib/voice-hub/routes/ai.routes.ts',
    'src/lib/voice-hub/middlewares/aiConsent.ts',
  ],
};

// Converte glob simples ('**', '*', '?') em RegExp sobre caminhos com '/'.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++;
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

// Extrai o segmento a partir de 'src/' do caminho absoluto (fallback: caminho inteiro).
function relativize(absPath) {
  const posix = toPosix(absPath);
  const idx = posix.indexOf('/src/');
  const idx2 = posix.lastIndexOf('src/');
  const start = idx !== -1 ? idx + 1 : idx2;
  return start !== -1 ? posix.slice(start) : posix;
}

const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));

const domainMatchers = Object.fromEntries(
  Object.entries(DOMAINS).map(([name, globs]) => [
    name,
    globs.map((g) => {
      const re = globToRegExp(g);
      return (rel) => re.test(rel);
    }),
  ]),
);

// Um mapa por domínio + um global, todos via istanbul-lib-coverage para que os
// percentuais sejam idênticos aos avaliados pelo Vitest nos thresholds.
const maps = { global: createCoverageMap({}) };
for (const name of Object.keys(DOMAINS)) maps[name] = createCoverageMap({});
const matchedFiles = Object.fromEntries(Object.keys(DOMAINS).map((n) => [n, []]));

for (const [absPath, fc] of Object.entries(coverage)) {
  const rel = relativize(absPath);
  maps.global.addFileCoverage(fc);
  for (const [name, matchers] of Object.entries(domainMatchers)) {
    if (matchers.some((fn) => fn(rel))) {
      maps[name].addFileCoverage(fc);
      matchedFiles[name].push(rel);
    }
  }
}

function summary(map) {
  const s = map.getCoverageSummary();
  return {
    files: map.files().length,
    lines: s.lines.pct,
    statements: s.statements.pct,
    branches: s.branches.pct,
    functions: s.functions.pct,
  };
}

const globalSummary = summary(maps.global);
console.log(`Coverage source: ${coveragePath}`);
console.log('');
console.log(
  `GLOBAL files=${globalSummary.files} lines=${globalSummary.lines.toFixed(2)}% ` +
    `stmts=${globalSummary.statements.toFixed(2)}% branches=${globalSummary.branches.toFixed(2)}% ` +
    `funcs=${globalSummary.functions.toFixed(2)}%`,
);
console.log('');
for (const name of Object.keys(DOMAINS)) {
  const s = summary(maps[name]);
  console.log(
    `${name.padEnd(10)} files=${String(s.files).padStart(4)} lines=${s.lines.toFixed(2).padStart(6)}% ` +
      `stmts=${s.statements.toFixed(2).padStart(6)}% branches=${s.branches.toFixed(2).padStart(6)}% ` +
      `funcs=${s.functions.toFixed(2).padStart(6)}%`,
  );
  if (showFiles) {
    for (const f of matchedFiles[name].sort()) console.log(`    - ${f}`);
  }
}

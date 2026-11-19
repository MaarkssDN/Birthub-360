#!/usr/bin/env node
/**
 * B-14 — bloqueia dumps/backups de banco no Git (AGENTS.md §22/§24).
 *
 * Uso:
 *   node scripts/ci/check-no-db-dumps.mjs            # arquivos em staging (pre-commit)
 *   node scripts/ci/check-no-db-dumps.mjs --all      # todos os arquivos versionados (CI)
 *
 * Bloqueia .sql, .sql.gz, .dump, .backup e .bak. Exceção: SQL de migração do Prisma
 * (`prisma/migrations/**`), rotinas DDL em `scripts/db/` e `migrate.sql` — código versionado
 * sem `INSERT`/`COPY`, não dump de dados.
 */
import { execFileSync } from 'node:child_process';

const DUMP_PATTERN = /\.(sql(\.gz)?|dump|backup|bak)$/i;
const ALLOWED_PATTERN = /^(prisma\/migrations\/|scripts\/db\/|migrate\.sql$)/;

export function findDumpFiles(paths) {
  return paths.filter((p) => DUMP_PATTERN.test(p) && !ALLOWED_PATTERN.test(p));
}

function listFiles(all) {
  const args = all
    ? ['ls-files', '-z']
    : ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'];
  return execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const offenders = findDumpFiles(listFiles(process.argv.includes('--all')));
  if (offenders.length > 0) {
    console.error('[B-14] Dump/backup de banco bloqueado (pode conter dados pessoais — LGPD):');
    for (const f of offenders) console.error(`  - ${f}`);
    console.error('Remova do staging (git restore --staged <arquivo>) e guarde fora do repositório.');
    process.exit(1);
  }
  console.log('[B-14] Nenhum dump de banco detectado.');
}

#!/usr/bin/env node

// POS3-02-ENV-HARNESS — bootstrap do ambiente isolado de testes de integração
// (Agente 02 — Bento, Squad 00). Vive em tests/setup/ porque a MATRIZ_PROPRIEDADE
// dá esse path ao Agente 02 (scripts/test/** não tem dono nominal na matriz).
//
// Sobe o stack dedicado tests/setup/docker-compose.pos3-02-test.yml
// (Postgres :5434 + Redis :6379 + Meilisearch :7701, tudo prefixado pos3_02_),
// provisiona o banco de teste (papéis app/migrator + extensões via
// create-app-role.sql.tpl), gera .env.test, roda `prisma migrate deploy`,
// SÓ DEPOIS semeia o baseline de compliance (as tabelas precisam existir),
// executa a suíte alvo do vitest.integration e derruba o stack ao final
// (a menos que --keep-up).
//
// Uso (da raiz do repo):
//   node tests/setup/pos3-02-env-harness.mjs [opções] [-- <arquivos-vitest>...]
//
// Opções:
//   --keep-up       Não derruba os containers ao final (modo iterativo; derrube depois
//                   com `docker compose -f tests/setup/docker-compose.pos3-02-test.yml down`).
//   --down          Só derruba o stack (preserva volumes nomeados).
//   --purge         Só derruba o stack E remove os volumes pos3_02_* (banco zerado).
//   --db <nome>     Sobrescreve o nome do banco de teste (default:
//                   prospectordb_pos3_02_test). Validado por whitelist estrita
//                   ^[a-zA-Z_][a-zA-Z0-9_]*_test$ — sem espaços, aspas ou SQL.
//   --skip-migrate  Pula `prisma generate`/`migrate deploy` (schema já migrado).
//                   ATENÇÃO: sem migrate o seed de compliance e os testes quebram
//                   num banco recém-criado — use só com volume já migrado.
//   -- <files>      Arquivos/padrões passados ao vitest (default: as 3 suítes de
//                   cadência que motivaram a missão).
//
// Requisitos: Docker CLI + daemon acessível (docker compose v2). Sem Docker este
// script aborta com mensagem clara — pg-mem/embedded NÃO é substituto válido para
// estas suítes (RLS, roles NOSUPERUSER e pgvector são exercitados de verdade).
//
// Ordem garantida (correção do REPROVADO do Agente 09 — Silas):
//   compose up → CREATE DATABASE → papéis/extensões → .env.test → prisma migrate
//   deploy → seed compliance → vitest → compose down (finally, sempre que o stack
//   tiver subido nesta execução).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertTestDatabaseSafety,
  buildComplianceSeedSql,
  dockerRemoteHost,
  parseDotEnvContent,
  rewriteEnvTestForRemoteDocker,
} from '../../scripts/test/prepare-integration-env.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMPOSE_FILE = path.join(ROOT, 'tests', 'setup', 'docker-compose.pos3-02-test.yml');
const ENV_TEST_PATH = path.join(ROOT, '.env.test');
const ENV_TEST_EXAMPLE_PATH = path.join(ROOT, '.env.test.example');

const PG_CONTAINER = 'pos3_02_postgres';
const BOOTSTRAP_SUPERUSER = 'prospector';
const BOOTSTRAP_DB = 'prospectordb';
const DEFAULT_TEST_DB = 'prospectordb_pos3_02_test';

// Whitelist estrita de identificador SQL: letras/dígitos/underscore, começa com
// letra ou underscore, termina em _test. Como o charset não inclui aspas, espaços,
// ponto-e-vírgula ou operadores, a interpolação em SQL abaixo é segura.
const DB_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*_test$/;

// Defaults idênticos aos do compose / .env.test.example.
const APP_ROLE_PASSWORD = process.env.APP_ROLE_PASSWORD || 'prospector_app_pass';
const MIGRATOR_ROLE_PASSWORD =
  process.env.MIGRATOR_ROLE_PASSWORD ||
  process.env.MIGRATOR_DB_PASSWORD ||
  'prospector_migrator_pass';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'prospector_redis_pass';

const DEFAULT_TEST_FILES = [
  'tests/integration/cadenceRun.worker.test.ts',
  'tests/integration/cadence-start.routes.test.ts',
  'tests/integration/cadence-schedule-meeting.routes.test.ts',
];

// Erro de harness: capturado em main() para rodar o finally (compose down) antes de sair.
// NÃO usar process.exit() dentro do try — isso bypassa o finally e deixaria os
// containers pos3_02_* zumbis no Docker (achado do REPROVADO do Agente 09 — Silas).
class HarnessError extends Error {}

function fail(message) {
  throw new HarnessError(message);
}

function parseArgs(argv) {
  const opts = { keepUp: false, down: false, purge: false, skipMigrate: false, testFiles: [] };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--keep-up') opts.keepUp = true;
    else if (arg === '--down') opts.down = true;
    else if (arg === '--purge') opts.purge = true;
    else if (arg === '--skip-migrate') opts.skipMigrate = true;
    else if (arg === '--db') {
      opts.dbName = argv[i + 1];
      i += 1;
    } else if (arg === '--') rest.push(...argv.slice(i + 1));
    else if (arg.startsWith('--')) {
      fail(`Opção desconhecida: ${arg}`);
    } else rest.push(arg);
  }
  opts.testFiles = rest.length > 0 ? rest : DEFAULT_TEST_FILES;
  return opts;
}

function docker(args, options = {}) {
  return spawnSync('docker', args, { encoding: 'utf-8', cwd: ROOT, ...options });
}

function compose(args, options = {}) {
  return docker(['compose', '-f', COMPOSE_FILE, ...args], { stdio: 'inherit', ...options });
}

// spawnSync com stdio inherit não devolve stdout; para consultas usa encoding sem inherit.
function dockerOut(args) {
  const r = docker(args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function psqlExec(database, sqlArgs, { inherit = true } = {}) {
  return docker(
    ['exec', PG_CONTAINER, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', BOOTSTRAP_SUPERUSER, '-d', database, ...sqlArgs],
    inherit ? { stdio: 'inherit' } : { stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function npx(args, env) {
  const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return spawnSync(bin, args, { cwd: ROOT, env, stdio: 'inherit', shell: false });
}

function checkDockerAvailable() {
  const r = dockerOut(['compose', 'version']);
  if (r.status !== 0) {
    fail(
      'Docker CLI/daemon indisponível — o harness de integração exige Postgres+pgvector, ' +
        'Redis e Meilisearch REAIS (RLS, papéis NOSUPERUSER e pgvector são exercitados nos ' +
        'testes; pg-mem/embedded não é substituto válido).\n' +
        `Detalhe: ${(r.stderr || '').trim() || 'docker compose version falhou'}. ` +
        'Provisione Docker (Docker Desktop/daemon) ou execute a suíte no job de CI.',
    );
  }
}

function composeDown(purge) {
  const args = ['down'];
  if (purge) args.push('-v');
  const r = compose(args);
  if (r.status !== 0) {
    console.error('[pos3-02-env-harness] aviso: `docker compose down` retornou erro (containers podem ter ficado de pé).');
  }
}

function ensureDatabase(dbName) {
  const check = psqlExec(
    BOOTSTRAP_DB,
    ['-tAc', `SELECT 1 FROM pg_database WHERE datname='${dbName}'`],
    { inherit: false },
  );
  if (check.status !== 0) {
    fail(`Falha ao consultar pg_database no container ${PG_CONTAINER}:\n${check.stderr}`);
  }
  if (check.stdout.trim() === '1') {
    console.log(`[pos3-02-env-harness] Banco "${dbName}" já existe — reutilizando (volume preservado).`);
    return;
  }
  console.log(`[pos3-02-env-harness] Criando banco isolado "${dbName}" ...`);
  const create = psqlExec(BOOTSTRAP_DB, [
    '-c',
    `CREATE DATABASE "${dbName}" OWNER ${BOOTSTRAP_SUPERUSER};`,
  ]);
  if (create.status !== 0) fail('Falha ao CREATE DATABASE.');
}

// Passo 1 do provisionamento: papéis + extensões. Roda ANTES do migrate deploy
// porque as migrations executam como prospector_migrator (DIRECT_URL) e precisam
// do papel existir. O seed de compliance é passo POSTERIOR (ver seedComplianceBaseline)
// porque as tabelas Organization/OrganizationAiConsent/OptOutRecord só existem
// depois de `prisma migrate deploy` — sem isso o INSERT falha em banco vazio.
function bootstrapRolesAndExtensions(dbName) {
  // create-app-role.sql.tpl está montado em /docker-entrypoint-initdb.d dentro do
  // container. Cria/atualiza prospector_app (NOSUPERUSER) e prospector_migrator
  // (dono), extensões vector/pg_trgm e transfere ownership — idempotente.
  const r = psqlExec(dbName, [
    '-v', `app_password=${APP_ROLE_PASSWORD}`,
    '-v', `migrator_password=${MIGRATOR_ROLE_PASSWORD}`,
    '-f', '/docker-entrypoint-initdb.d/create-app-role.sql.tpl',
  ]);
  if (r.status !== 0) fail('Falha no bootstrap de papéis/extensões (create-app-role.sql.tpl).');
}

// Passo 2 (DEPOIS de migrate deploy): baseline determinístico de compliance/opt-out
// (BT360-DT-0071). Idempotente (ids fixos + ON CONFLICT DO NOTHING) e nunca toca
// test-org-id. Importado de scripts/test/prepare-integration-env.js (função pura,
// sem dependência dos nomes de container birthhub_* daquele harness).
function seedComplianceBaseline(dbName) {
  const seed = psqlExec(dbName, ['-c', buildComplianceSeedSql()]);
  if (seed.status !== 0) fail('Falha ao semear baseline de compliance/opt-out.');
}

function buildTestDatabaseUrl(dbName) {
  return `postgresql://prospector_app:${APP_ROLE_PASSWORD}@localhost:5434/${dbName}`;
}

function buildTestDirectUrl(dbName) {
  return `postgresql://prospector_migrator:${MIGRATOR_ROLE_PASSWORD}@localhost:5434/${dbName}`;
}

function writeEnvTest(dbName) {
  if (!existsSync(ENV_TEST_EXAMPLE_PATH)) {
    fail('.env.test.example ausente — não é possível gerar .env.test.');
  }
  let content = readFileSync(ENV_TEST_EXAMPLE_PATH, 'utf-8');
  const overrides = {
    DATABASE_URL: buildTestDatabaseUrl(dbName),
    DIRECT_URL: buildTestDirectUrl(dbName),
    // Índice 2 isola as filas BullMQ do harness do index 1 usado pela stack compartilhada.
    REDIS_URL: `redis://:${REDIS_PASSWORD}@localhost:6379/2`,
  };
  for (const [key, value] of Object.entries(overrides)) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}\n`;
    }
  }
  const remoteHost = dockerRemoteHost();
  if (remoteHost) {
    content = rewriteEnvTestForRemoteDocker(content, remoteHost);
    console.log(`[pos3-02-env-harness] DOCKER_HOST remoto (${remoteHost}) — hosts de serviço reescritos.`);
  }
  writeFileSync(ENV_TEST_PATH, content);
  console.log('[pos3-02-env-harness] .env.test gerado para o banco isolado (gitignored).');
}

function runMigrations(env) {
  console.log('[pos3-02-env-harness] prisma generate ...');
  let r = npx(['prisma', 'generate'], env);
  if (r.status !== 0) fail('prisma generate falhou.');
  console.log('[pos3-02-env-harness] prisma migrate deploy ...');
  r = npx(['prisma', 'migrate', 'deploy'], env);
  if (r.status !== 0) fail('prisma migrate deploy falhou — verifique se o banco está healthy.');
}

function runTests(env, files) {
  console.log(`[pos3-02-env-harness] vitest.integration: ${files.join(', ')}`);
  const r = npx(
    ['vitest', 'run', '-c', 'vitest.integration.config.ts', '--no-file-parallelism', ...files],
    env,
  );
  return r.status ?? 1;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  let exitCode = 1;
  let stackUp = false;

  try {
    const dbName = opts.dbName || DEFAULT_TEST_DB;
    if (!DB_NAME_RE.test(dbName)) {
      fail(
        `Nome de banco "${dbName}" inválido — whitelist estrita ` +
          '^[a-zA-Z_][a-zA-Z0-9_]*_test$ (sem espaços/aspas/SQL). ' +
          'Precisa terminar em "_test" pela trava de segurança do harness.',
      );
    }

    if (opts.down || opts.purge) {
      checkDockerAvailable();
      composeDown(opts.purge);
      console.log(`[pos3-02-env-harness] Stack derrubado${opts.purge ? ' (volumes removidos)' : ' (volumes preservados)'}.`);
      exitCode = 0;
      return; // finally roda, mas stackUp=false → não derruba nada duas vezes
    }

    checkDockerAvailable();

    console.log('[pos3-02-env-harness] Subindo stack isolado (tests/setup/docker-compose.pos3-02-test.yml) ...');
    const up = compose(['up', '-d', '--wait']);
    if (up.status !== 0) {
      fail(
        'docker compose up falhou. Se o erro mencionar bind/porta já em uso, a stack ' +
          'compartilhada (birthhub_*) provavelmente está de pé — rode ' +
          '`docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml down` ' +
          'ou use o outro ambiente. NÃO misture os dois (mesmas portas 5434/6379/7701).',
      );
    }
    stackUp = true;

    ensureDatabase(dbName);
    bootstrapRolesAndExtensions(dbName);
    writeEnvTest(dbName);

    const envFile = parseDotEnvContent(readFileSync(ENV_TEST_PATH, 'utf-8'));
    const env = { ...process.env, ...envFile, NODE_ENV: 'test' };
    try {
      assertTestDatabaseSafety(env);
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }

    if (!opts.skipMigrate) runMigrations(env);
    seedComplianceBaseline(dbName);
    exitCode = runTests(env, opts.testFiles);
  } catch (err) {
    console.error(`\n[pos3-02-env-harness] ${err instanceof Error ? err.message : String(err)}`);
    exitCode = 1;
  } finally {
    // Garante teardown mesmo quando fail() lança no meio do fluxo — containers
    // efêmeros desta execução nunca ficam zumbis (achado do REPROVADO do Silas).
    if (stackUp && !opts.keepUp) {
      console.log('[pos3-02-env-harness] Derrubando stack (volumes preservados; --purge remove).');
      composeDown(false);
    } else if (stackUp && opts.keepUp) {
      console.log('[pos3-02-env-harness] --keep-up: stack permanece de pé.');
      console.log('  Derrubar: docker compose -f tests/setup/docker-compose.pos3-02-test.yml down');
      console.log('  Resetar:   docker compose -f tests/setup/docker-compose.pos3-02-test.yml down -v');
    }
  }

  process.exit(exitCode);
}

main();

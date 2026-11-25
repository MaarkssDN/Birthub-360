#!/usr/bin/env node

// Harness de ambiente de teste ISOLADO por squad/agente — POS3-02-ISOLATED-ENV
// (Agente 02, Squad 00). Substitui a dependência dos containers compartilhados
// `birthhub_postgres`/`birthhub_redis` (porta 5434/6379), que foram a causa dos
// ECONNREFUSED da Onda 3 quando o worktree de integração não os tinha de pé.
//
// Modelo de isolamento (duas camadas, nunca compartilhar banco de escrita):
//   1. CONTAINER por (squad, slot): projeto compose `bht-s<NN>s<slot>` com seu
//      próprio Postgres (pgvector/pgvector:pg17) e Redis (redis:7-alpine) em
//      portas dedicadas — PG 55400+squad*10+slot, Redis 56400+idem.
//   2. BANCO por consumidor (scope): `<scope>_prospectordb_test` dentro do
//      Postgres do slot — scopes diferentes no mesmo slot compartilham a
//      instância mas nunca o banco. No Redis, cada scope usa um DB index
//      lógico próprio (hash estável do scope % 16).
//
// Uso típico (worktree do consumidor):
//   node scripts/test-env/envctl.mjs up --scope s00            # sobe + provisiona + lease
//   node scripts/test-env/envctl.mjs migrate --scope s00       # prisma migrate deploy
//   node scripts/test-env/envctl.mjs test --scope s00 -- tests/integration/foo.test.ts
//   node scripts/test-env/envctl.mjs down --scope s00          # derruba + remove lease
//   node scripts/test-env/envctl.mjs reset --scope s00         # down -v + up (banco limpo)
//
// `test` escreve .env.test a partir do env gerado (com backup em .env.test.backup)
// porque vitest.integration.config.ts carrega .env.test fixo e o pretest do npm
// rodaria prepare-integration-env.js contra os containers COMPARTILHADOS — por
// isso `test` invoca o vitest diretamente, sem `npm run test:integration`.
//
// Sem dependências novas: Node >= 18, docker CLI + compose plugin. Reutiliza
// buildComplianceSeedSql/dockerRemoteHost/parseDotEnvContent de
// scripts/test/prepare-integration-env.js (mesma fonte, sem duplicar SQL).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildComplianceSeedSql,
  dockerRemoteHost,
  parseDotEnvContent,
} from '../test/prepare-integration-env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const COMPOSE_FILE = path.join(__dirname, 'docker-compose.test.yml');
const LEASES_DIR = path.join(REPO_ROOT, '.agents', 'runs', 'leases');

// ── Defaults de credencial: idênticos aos do harness oficial (dev/test local,
// não são segredos). Sobrescrevíveis por env ou flags.
const CREDS = {
  POSTGRES_USER: process.env.POSTGRES_USER || 'prospector',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'prospector_pass',
  APP_DB_PASSWORD: process.env.APP_DB_PASSWORD || 'prospector_app_pass',
  MIGRATOR_DB_PASSWORD:
    process.env.MIGRATOR_DB_PASSWORD || 'prospector_migrator_pass',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'prospector_redis_pass',
};

// ── Argumentos ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      args._.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) {
        args[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args[a.slice(2)] = argv[++i];
      } else {
        args[a.slice(2)] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

const USAGE = `Uso: node scripts/test-env/envctl.mjs <comando> [flags]

Comandos:
  plan        Mostra a configuração resolvida (portas, projeto, banco) sem tocar em nada.
  env         Gera .env.test.<scope> na raiz. --activate também grava .env.test (com backup).
  up          docker compose up -d + health + provision (banco/papéis/seed) + lease.
  provision   Só provisiona banco/papéis/seed no Postgres já de pé do slot.
  migrate     prisma migrate deploy contra o banco do scope.
  seed        npx tsx prisma/seed.ts contra o banco do scope.
  test        Gera/ativa .env.test e roda vitest integration direto (sem pretest/npm).
              Args após "--" vão para o vitest (ex.: tests/integration/leads.test.ts).
  status      docker compose ps + checagem de portas publicadas.
  health      healthcheck detalhado (pg_isready/redis PING via docker exec).
  down        docker compose down + remove lease. --volumes apaga os dados (reset).
  reset       down --volumes seguido de up (banco 100% limpo).
  lease       Reescreve o lease do scope sem subir nada.

Flags:
  --scope <id>     Id do consumidor (default: derivado de --squad/--slot, ex.: s00).
                   Banco criado: <scope>_prospectordb_test. Use prefixo do squad.
  --squad <NN>     Squad dono (00-09). Default: 2 primeiros dígitos do scope ou 00.
  --slot <N>       Slot do agente dentro do squad (0-9, default 0). Define as portas.
  --host <h>       Host publicado no Docker (default: localhost; remoto via DOCKER_HOST).
  --redis-db <n>   DB index lógico do Redis para este scope (default: hash(scope)%16).
  --meili <url>    MEILI_HOST opcional para o .env.test gerado (ex.: instância :7701).
  --keep-env       Em 'test', não reescreve .env.test (usa o que já estiver lá).
`;

// ── Resolução de configuração ───────────────────────────────────────────────
function squadOf(scope, explicit) {
  if (explicit != null) return String(explicit).padStart(2, '0');
  const m = String(scope).match(/s(\d{1,2})/i);
  return m ? m[1].padStart(2, '0') : '00';
}

function sanitizeScope(scope) {
  const s = String(scope).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!s) throw new Error('scope inválido (vazio após sanitização)');
  return s;
}

// Hash estável (djb2) → DB index lógico do Redis, determinístico por scope.
function redisDbIndex(scope) {
  let h = 5381;
  for (const ch of String(scope)) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h % 16;
}

// dockerRemoteHost() só olha $DOCKER_HOST. O contexto ativo do docker CLI também
// pode apontar para um daemon remoto (ex.: context "samsung" → tcp://192.168.0.116:2375)
// — nesse caso as portas são publicadas NO HOST REMOTO e as URLs precisam dele.
// inspect de contexto é client-side (não exige daemon de pé).
function remoteHostFromContext() {
  const ctx = spawnSync('docker', ['context', 'show'], { encoding: 'utf-8' });
  const name = (ctx.stdout || '').trim();
  if (!name || name === 'default' || ctx.status !== 0) return null;
  const insp = spawnSync(
    'docker',
    ['context', 'inspect', name, '--format', '{{.Endpoints.docker.Host}}'],
    { encoding: 'utf-8' },
  );
  const host = (insp.stdout || '').trim();
  const m = host.match(/^tcp:\/\/([^:/]+)/);
  if (!m) return null;
  return m[1] === 'localhost' || m[1] === '127.0.0.1' ? null : m[1];
}

function resolveConfig(args) {
  const squad = squadOf(args.scope || `s${String(args.squad || '00').padStart(2, '0')}`, args.squad);
  const slot = Math.min(9, Math.max(0, parseInt(args.slot || '0', 10) || 0));
  const scope = sanitizeScope(args.scope || `s${squad}`);
  const offset = parseInt(squad, 10) * 10 + slot;
  const remoteHost = dockerRemoteHost() || remoteHostFromContext();
  const host = args.host || remoteHost || 'localhost';

  return {
    scope,
    squad,
    slot,
    project: `bht-s${squad}s${String(slot).padStart(2, '0')}`,
    pgPort: 55400 + offset,
    redisPort: 56400 + offset,
    pgVolume: `bht_s${squad}s${String(slot).padStart(2, '0')}_pgdata`,
    redisVolume: `bht_s${squad}s${String(slot).padStart(2, '0')}_redisdata`,
    database: `${scope}_prospectordb_test`,
    redisDb: args['redis-db'] != null ? parseInt(args['redis-db'], 10) : redisDbIndex(scope),
    host,
    remoteHost,
    meiliHost: args.meili || '',
  };
}

function composeEnv(cfg) {
  return {
    ...process.env,
    COMPOSE_PROJECT_NAME: cfg.project,
    BHT_PG_PORT: String(cfg.pgPort),
    BHT_REDIS_PORT: String(cfg.redisPort),
    BHT_PG_VOLUME: cfg.pgVolume,
    BHT_REDIS_VOLUME: cfg.redisVolume,
    POSTGRES_USER: CREDS.POSTGRES_USER,
    POSTGRES_PASSWORD: CREDS.POSTGRES_PASSWORD,
    APP_DB_PASSWORD: CREDS.APP_DB_PASSWORD,
    MIGRATOR_DB_PASSWORD: CREDS.MIGRATOR_DB_PASSWORD,
    REDIS_PASSWORD: CREDS.REDIS_PASSWORD,
  };
}

function dockerCompose(cfg, composeArgs, opts = {}) {
  const r = spawnSync('docker', ['compose', '-f', COMPOSE_FILE, ...composeArgs], {
    cwd: REPO_ROOT,
    env: composeEnv(cfg),
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf-8',
  });
  return r;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    env: { ...process.env, ...(opts.env || {}) },
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf-8',
  });
  return r;
}

function fail(msg, code = 1) {
  console.error(`[envctl] ${msg}`);
  process.exit(code);
}

function requireDocker() {
  const r = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    encoding: 'utf-8',
    timeout: 15000,
  });
  if (r.error || r.status !== 0) {
    fail(
      'Docker daemon inacessível (contexto/DOCKER_HOST ativo não responde ao ' +
        '`docker version`). Suba o Docker Desktop/daemon remoto ou registre ' +
        'BLOQUEADO-POR-AMBIENTE — NÃO é skip: os testes de integração exigem PG/Redis reais.',
      3,
    );
  }
  return r.stdout.trim();
}

// ── Env file ────────────────────────────────────────────────────────────────
function envFileContent(cfg) {
  const pg = `postgresql://prospector_app:${CREDS.APP_DB_PASSWORD}@${cfg.host}:${cfg.pgPort}/${cfg.database}`;
  const direct = `postgresql://prospector_migrator:${CREDS.MIGRATOR_DB_PASSWORD}@${cfg.host}:${cfg.pgPort}/${cfg.database}`;
  const lines = [
    '# GERADO por scripts/test-env/envctl.mjs — não editar à mão; regenerar com `envctl env`.',
    `# scope=${cfg.scope} squad=${cfg.squad} slot=${cfg.slot} projeto=${cfg.project} redis_db=${cfg.redisDb}`,
    'NODE_ENV=test',
    'PORT=3000',
    `DATABASE_URL=${pg}`,
    `DIRECT_URL=${direct}`,
    `TEST_DATABASE_URL=${pg}`,
    `REDIS_URL=redis://:${CREDS.REDIS_PASSWORD}@${cfg.host}:${cfg.redisPort}/${cfg.redisDb}`,
    `MEILI_HOST=${cfg.meiliHost || 'http://localhost:7701'}`,
    'MEILI_MASTER_KEY=birthhub360_meili_master_key_test',
    'ALLOWED_ORIGINS=http://localhost:3000',
    'ALLOW_DEV_AUTH_BYPASS=true',
    '',
  ];
  return lines.join('\n');
}

function writeEnvFile(cfg, { activate = false } = {}) {
  const scopeFile = path.join(REPO_ROOT, `.env.test.${cfg.scope}`);
  writeFileSync(scopeFile, envFileContent(cfg));
  console.log(`[envctl] env gerado: ${path.relative(REPO_ROOT, scopeFile)}`);

  if (activate) {
    const envTest = path.join(REPO_ROOT, '.env.test');
    if (existsSync(envTest)) {
      copyFileSync(envTest, path.join(REPO_ROOT, '.env.test.backup'));
      console.log('[envctl] .env.test anterior preservado em .env.test.backup');
    }
    copyFileSync(scopeFile, envTest);
    console.log(`[envctl] .env.test ativado para scope=${cfg.scope} (backup em .env.test.backup)`);
  }
  return scopeFile;
}

function loadScopeEnv(cfg) {
  const scopeFile = path.join(REPO_ROOT, `.env.test.${cfg.scope}`);
  if (!existsSync(scopeFile)) {
    fail(`.env.test.${cfg.scope} não existe — rode \`envctl env --scope ${cfg.scope}\` antes.`);
  }
  return parseDotEnvContent(readFileSync(scopeFile, 'utf-8'));
}

// ── Lease ───────────────────────────────────────────────────────────────────
function leasePath(cfg) {
  return path.join(LEASES_DIR, `env-${cfg.project}.lease`);
}

function writeLease(cfg, { note = '' } = {}) {
  mkdirSync(LEASES_DIR, { recursive: true });
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const iso = (d) => d.toISOString().slice(0, 19) + '-03:00';
  const content = [
    `scope: ${cfg.scope}`,
    `squad: ${cfg.squad}`,
    `slot: ${cfg.slot}`,
    `compose_project: ${cfg.project}`,
    `session_id: envctl-${cfg.scope}-${now.toISOString().slice(0, 10)}`,
    `agent: consumidor do scope ${cfg.scope} (POS3-02-ISOLATED-ENV)`,
    `branch: worktree local do consumidor`,
    `acquired_at: ${iso(now)}`,
    `expires_at: ${iso(expires)}`,
    `recurso:`,
    `  postgres: ${cfg.host}:${cfg.pgPort} (container ${cfg.project}_postgres)`,
    `  redis: ${cfg.host}:${cfg.redisPort} db/${cfg.redisDb} (container ${cfg.project}_redis)`,
    `  database: ${cfg.database}`,
    `  env_file: .env.test.${cfg.scope}`,
    note ? `notas: |\n  ${note.replace(/\n/g, '\n  ')}` : 'notas: lease automático do envctl; remover com `envctl down`.',
    '',
  ].join('\n');
  writeFileSync(leasePath(cfg), content);
  console.log(`[envctl] lease registrado: .agents/runs/leases/env-${cfg.project}.lease (expira ${iso(expires)})`);
}

function removeLease(cfg) {
  const p = leasePath(cfg);
  if (existsSync(p)) {
    rmSync(p);
    console.log(`[envctl] lease removido: ${path.relative(REPO_ROOT, p)}`);
  }
}

// ── Health / espera ─────────────────────────────────────────────────────────
function waitForPort(port, host, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      const sock = new net.Socket();
      sock.setTimeout(3000);
      sock.once('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.once('timeout', () => {
        sock.destroy();
        retry();
      });
      sock.once('error', () => {
        sock.destroy();
        retry();
      });
      const retry = () => {
        if (Date.now() > deadline) reject(new Error(`timeout esperando ${host}:${port}`));
        else setTimeout(attempt, 1500);
      };
      sock.connect(port, host);
    };
    attempt();
  });
}

// ── Provisionamento do banco do consumidor ──────────────────────────────────
function psqlInContainer(cfg, db, sqlArgs, { capture = true } = {}) {
  return run(
    'docker',
    ['exec', `${cfg.project}_postgres`, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', CREDS.POSTGRES_USER, '-d', db, ...sqlArgs],
    { capture },
  );
}

function provision(cfg) {
  console.log(`[envctl] provisionando banco "${cfg.database}" no ${cfg.project}_postgres...`);

  const exists = psqlInContainer(cfg, 'postgres', [
    '-tAc',
    `SELECT 1 FROM pg_database WHERE datname='${cfg.database}'`,
  ]);
  if (exists.status !== 0) fail(`falha ao consultar pg_database: ${exists.stderr || exists.stdout}`);

  if (exists.stdout.trim() !== '1') {
    const create = psqlInContainer(cfg, 'postgres', [
      '-c',
      `CREATE DATABASE "${cfg.database}" OWNER ${CREDS.POSTGRES_USER};`,
    ], { capture: false });
    if (create.status !== 0) fail(`falha ao criar o banco "${cfg.database}"`);
    console.log(`[envctl] banco "${cfg.database}" criado.`);
  } else {
    console.log(`[envctl] banco "${cfg.database}" já existe — reaproveitando.`);
  }

  // Papéis (prospector_app/prospector_migrator) + default privileges + hooks de
  // regime restrito — idempotente, mesmo procedimento do prepare-integration-env.js.
  const roles = psqlInContainer(cfg, cfg.database, [
    '-v',
    `app_password=${CREDS.APP_DB_PASSWORD}`,
    '-v',
    `migrator_password=${CREDS.MIGRATOR_DB_PASSWORD}`,
    '-f',
    '/docker-entrypoint-initdb.d/create-app-role.sql.tpl',
  ], { capture: false });
  if (roles.status !== 0) fail('falha ao aplicar create-app-role.sql.tpl no banco do scope');

  // Extensões exigidas pelo schema (vector, pg_trgm via postgis init; idempotente).
  const ext = psqlInContainer(cfg, cfg.database, [
    '-f',
    '/docker-entrypoint-initdb.d/02-enable-extensions.sql',
  ], { capture: false });
  if (ext.status !== 0) {
    console.warn('[envctl] aviso: 02-enable-extensions.sql falhou (postgis pode não existir na imagem) — migrations dirão se falta extensão.');
  }

  // Baseline determinístico de compliance/opt-out (BT360-DT-0071) — reusa o SQL
  // oficial do harness para não divergir.
  const seed = psqlInContainer(cfg, cfg.database, ['-c', buildComplianceSeedSql()], { capture: false });
  if (seed.status !== 0) fail('falha ao semear baseline de compliance/opt-out');

  console.log('[envctl] provisionamento concluído (banco + papéis + extensões + baseline compliance).');
}

// ── Comandos ────────────────────────────────────────────────────────────────
async function cmdUp(cfg, { reset = false } = {}) {
  const serverVersion = requireDocker();
  console.log(`[envctl] docker server ${serverVersion} — subindo ${cfg.project} (pg:${cfg.pgPort} redis:${cfg.redisPort})`);
  const up = dockerCompose(cfg, ['up', '-d']);
  if (up.status !== 0) fail('docker compose up falhou', up.status || 1);

  console.log('[envctl] aguardando healthchecks (pg_isready / redis PING)...');
  await waitForPort(cfg.pgPort, cfg.host);
  await waitForPort(cfg.redisPort, cfg.host);

  provision(cfg);
  writeLease(cfg);
  writeEnvFile(cfg);
  console.log(`[envctl] UP. Próximos passos:\n  node scripts/test-env/envctl.mjs migrate --scope ${cfg.scope}\n  node scripts/test-env/envctl.mjs test --scope ${cfg.scope} -- <arquivo.test.ts>`);
}

function cmdDown(cfg, { volumes = false } = {}) {
  requireDocker();
  const args = ['down'];
  if (volumes) args.push('--volumes');
  const r = dockerCompose(cfg, args);
  if (r.status !== 0) fail('docker compose down falhou', r.status || 1);
  removeLease(cfg);
  if (volumes) console.log('[envctl] volumes removidos — próximo `up` recria o banco do zero.');
}

function cmdMigrate(cfg) {
  const scopeEnv = loadScopeEnv(cfg);
  const env = {
    ...process.env,
    ...scopeEnv,
    NODE_ENV: 'test',
    DIRECT_URL: scopeEnv.DIRECT_URL || scopeEnv.DATABASE_URL,
  };
  console.log(`[envctl] prisma migrate deploy → ${cfg.host}:${cfg.pgPort}/${cfg.database}`);
  const r = run('npx', ['prisma', 'migrate', 'deploy'], { env, capture: false });
  if (r.status !== 0) fail('prisma migrate deploy falhou', r.status || 1);
}

function cmdSeed(cfg) {
  const scopeEnv = loadScopeEnv(cfg);
  const env = { ...process.env, ...scopeEnv, NODE_ENV: 'test' };
  console.log(`[envctl] seed (prisma/seed.ts) → ${cfg.database}`);
  const r = run('npx', ['tsx', 'prisma/seed.ts'], { env });
  if (r.status !== 0) fail('seed falhou', r.status || 1);
}

function cmdTest(cfg, args) {
  const scopeEnvFile = writeEnvFile(cfg, { activate: !args['keep-env'] });
  void scopeEnvFile;
  const vitestArgs = args._.length ? args._ : [];
  console.log(`[envctl] vitest integration (scope=${cfg.scope}, sem pretest — containers compartilhados não são exigidos)`);
  const env = { ...process.env, ...loadScopeEnv(cfg), NODE_ENV: 'test' };
  const r = spawnSync(
    'npx',
    ['vitest', 'run', '-c', 'vitest.integration.config.ts', '--no-file-parallelism', ...vitestArgs],
    { cwd: REPO_ROOT, env, stdio: 'inherit' },
  );
  process.exit(r.status ?? 1);
}

async function cmdStatus(cfg) {
  requireDocker();
  const r = dockerCompose(cfg, ['ps'], { capture: true });
  process.stdout.write(r.stdout || '');
  if (r.stderr) process.stderr.write(r.stderr);
  for (const [name, port] of [['postgres', cfg.pgPort], ['redis', cfg.redisPort]]) {
    try {
      // checagem TCP rápida sem bloquear o comando
      const sock = new net.Socket();
      sock.setTimeout(2000);
      const open = await new Promise((res) => {
        sock.once('connect', () => res(true));
        sock.once('error', () => res(false));
        sock.once('timeout', () => res(false));
        sock.connect(port, cfg.host);
      });
      sock.destroy();
      console.log(`[envctl] ${name} ${cfg.host}:${port} → ${open ? 'OPEN' : 'closed'}`);
    } catch {
      console.log(`[envctl] ${name} ${cfg.host}:${port} → unreachable`);
    }
  }
}

async function cmdHealth(cfg) {
  requireDocker();
  const pg = run('docker', ['exec', `${cfg.project}_postgres`, 'pg_isready', '-U', CREDS.POSTGRES_USER, '-d', 'postgres'], { capture: true });
  console.log(`[envctl] pg_isready: ${pg.status === 0 ? 'OK' : (pg.stderr || pg.stdout || 'falhou').trim()}`);
  const rd = run('docker', ['exec', `${cfg.project}_redis`, 'redis-cli', '-a', CREDS.REDIS_PASSWORD, 'ping'], { capture: true });
  console.log(`[envctl] redis PING: ${(rd.stdout || '').trim() || (rd.stderr || 'falhou').trim()}`);
  await waitForPort(cfg.pgPort, cfg.host, 10000).then(() => console.log('[envctl] porta PG publicada: OK')).catch(() => console.log('[envctl] porta PG publicada: FALHOU'));
  await waitForPort(cfg.redisPort, cfg.host, 10000).then(() => console.log('[envctl] porta Redis publicada: OK')).catch(() => console.log('[envctl] porta Redis publicada: FALHOU'));
}

// ── main ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const args = parseArgs(argv);
const command = args._.shift();

if (!command || ['help', '-h', '--help'].includes(command)) {
  console.log(USAGE);
  process.exit(command ? 0 : 1);
}

const cfg = resolveConfig(args);

switch (command) {
  case 'plan': {
    console.log(`[envctl] scope=${cfg.scope} squad=${cfg.squad} slot=${cfg.slot}`);
    console.log(`[envctl] compose_project=${cfg.project}`);
    console.log(`[envctl] postgres  ${cfg.host}:${cfg.pgPort}  db=${cfg.database}`);
    console.log(`[envctl] redis     ${cfg.host}:${cfg.redisPort}  logical_db=${cfg.redisDb}`);
    console.log(`[envctl] volumes   ${cfg.pgVolume} / ${cfg.redisVolume}`);
    console.log(`[envctl] docker_remote_host=${cfg.remoteHost || 'nenhum (local)'}`);
    console.log(`[envctl] env_file  .env.test.${cfg.scope}`);
    break;
  }
  case 'env':
    writeEnvFile(cfg, { activate: Boolean(args.activate) });
    break;
  case 'up':
    await cmdUp(cfg);
    break;
  case 'provision':
    requireDocker();
    provision(cfg);
    writeLease(cfg);
    writeEnvFile(cfg);
    break;
  case 'migrate':
    cmdMigrate(cfg);
    break;
  case 'seed':
    cmdSeed(cfg);
    break;
  case 'test':
    cmdTest(cfg, args);
    break;
  case 'status':
    await cmdStatus(cfg);
    break;
  case 'health':
    await cmdHealth(cfg);
    break;
  case 'down':
    cmdDown(cfg, { volumes: Boolean(args.volumes) });
    break;
  case 'reset':
    cmdDown(cfg, { volumes: true });
    await cmdUp(cfg);
    break;
  case 'lease':
    writeLease(cfg);
    break;
  default:
    console.error(`[envctl] comando desconhecido: ${command}\n`);
    console.log(USAGE);
    process.exit(1);
}

#!/usr/bin/env node

// Roda antes de npm run test:integration (via pretest:integration no package.json).
//
// Corrige problemas reais do setup anterior (ver TEST-003 em
// docs/auditoria-divida-tecnica/07-PLANO-DE-TESTES.md):
//
// 1. `docker-compose up -d` incondicional quebrava no CI: o próprio ci.yml já sobe postgres/redis
//    como service containers nas mesmas portas (5434/6379) que o docker-compose.yml local usa, e
//    subir os dois ao mesmo tempo faz o docker-compose falhar tentando bindar uma porta ocupada.
//    Local, continuamos subindo a stack normalmente.
// 2. `.env.test` nunca era criado em lugar nenhum — dotenv -e .env.test falhava (ou rodava sem as
//    variáveis certas) tanto localmente quanto no CI. No CI, o próprio workflow agora escreve
//    .env.test com as credenciais reais do job antes deste script rodar; localmente, copiamos de
//    .env.test.example na primeira execução.
// 3. `.env.test.example` apontava para "prospectordb" — o MESMO banco que o dev usa. Testes de
//    integração fazem create/delete de linhas de verdade; sem um banco isolado, rodar
//    `test:integration` localmente misturaria (ou destruiria) dado de dev de verdade. O banco
//    isolado ("prospectordb_test", mesmo nome que o CI usa) não existe por padrão no Postgres do
//    docker-compose.yml (que só cria "prospectordb" na inicialização) — este script garante que
//    ele exista, com a extensão vector e o papel `prospector_app` prontos, antes de qualquer coisa
//    depender disso (mesmo script SQL que scripts/db/bootstrap-app-role.sh usa no CI).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const FORBIDDEN_PRODUCTION_HOST_PATTERNS = [
  /\.rds\.amazonaws\.com$/i,
  /\.supabase\.co$/i,
  /\.pooler\.supabase\.com$/i,
  /\.neon\.tech$/i,
  /\.postgres\.database\.azure\.com$/i,
  /\.gcp\.cloudsql/i,
  /^prod[-.]/i,
  /\.prod\./i,
];

/**
 * Parseia um arquivo `.env` simples (KEY=VALUE) para validação de segurança do test harness.
 */
export function parseDotEnvContent(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

/**
 * Trava de segurança obrigatória do test harness (DIV-AGENTE-14-001):
 * Garante que o ambiente de testes de integração aponte exclusivamente para um banco de testes
 * isolado (`*_test`), nunca para instâncias de produção/RDS e sempre sob `NODE_ENV === 'test'`.
 */
export function assertTestDatabaseSafety(envVars = process.env) {
  const nodeEnv = envVars.NODE_ENV || 'test';
  if (nodeEnv !== 'test') {
    throw new Error(
      `[TestHarnessSafety] Execução abortada: NODE_ENV deve ser estritamente "test", recebido "${nodeEnv}".`,
    );
  }

  const urlsToCheck = [
    { key: 'DATABASE_URL', value: envVars.DATABASE_URL },
    { key: 'DIRECT_URL', value: envVars.DIRECT_URL },
    { key: 'TEST_DATABASE_URL', value: envVars.TEST_DATABASE_URL },
  ].filter((entry) => Boolean(entry.value));

  if (urlsToCheck.length === 0) {
    throw new Error(
      '[TestHarnessSafety] Execução abortada: nenhuma URL de banco (DATABASE_URL / TEST_DATABASE_URL) configurada para validação.',
    );
  }

  for (const { key, value } of urlsToCheck) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`[TestHarnessSafety] Execução abortada: ${key} possui formato de URL inválido.`);
    }

    const hostname = parsed.hostname.toLowerCase();
    if (FORBIDDEN_PRODUCTION_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
      throw new Error(
        `[TestHarnessSafety] Execução abortada: ${key} aponta para um host gerenciado/produção proibido ("${hostname}").`,
      );
    }

    const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')).split('/')[0] || '';
    if (!dbName.endsWith('_test')) {
      throw new Error(
        `[TestHarnessSafety] Execução abortada: o banco "${dbName}" em ${key} não possui o sufixo obrigatório "_test".`,
      );
    }
  }

  return true;
}

const isCI = process.env.CI === 'true' || process.env.CI === '1';
const envTestPath = path.resolve(process.cwd(), '.env.test');
const envTestExamplePath = path.resolve(process.cwd(), '.env.test.example');

// Chaves de serviço cujos hosts devem acompanhar o host onde o Docker publica
// as portas. ALLOWED_ORIGINS e afins NÃO entram aqui — são origem do browser,
// não endpoint de container.
const DOCKER_SERVICE_URL_KEYS = new Set([
  'DATABASE_URL',
  'DIRECT_URL',
  'TEST_DATABASE_URL',
  'REDIS_URL',
  'MEILI_HOST',
]);

/**
 * Quando o Docker daemon é remoto (DOCKER_HOST=tcp://<host>:<port>), os containers
 * publicam as portas NO HOST REMOTO — `localhost` nas URLs de serviço não
 * resolve nada na máquina que roda os testes (foi a causa do ECONNREFUSED
 * 127.0.0.1:6379/5434 observado em 2026-11-10). Devolve o host remoto ou null
 * quando o Docker é local (default context / unix socket / localhost).
 */
export function dockerRemoteHost(env = process.env) {
  const dockerHost = env.DOCKER_HOST || '';
  const match = dockerHost.match(/^tcp:\/\/([^:/]+)/);
  if (!match) return null;
  const host = match[1];
  return host === 'localhost' || host === '127.0.0.1' ? null : host;
}

/**
 * Reescreve o host das URLs de serviço do `.env.test.example` para o host
 * remoto do Docker, preservando credenciais, porta, path e query. Linhas que
 * não sejam de serviço (ex.: ALLOWED_ORIGINS) passam intactas.
 */
export function rewriteEnvTestForRemoteDocker(content, remoteHost) {
  if (!remoteHost) return content;
  return content
    .split('\n')
    .map((line) => {
      const eq = line.indexOf('=');
      if (eq <= 0) return line;
      const key = line.slice(0, eq).trim();
      if (!DOCKER_SERVICE_URL_KEYS.has(key)) return line;
      const value = line.slice(eq + 1);
      return `${key}=${value.replace(/(@|\/\/)(localhost|127\.0\.0\.1)(?=[:/])/g, `$1${remoteHost}`)}`;
    })
    .join('\n');
}

const POSTGRES_CONTAINER = 'birthhub_postgres';
const BOOTSTRAP_SUPERUSER = 'prospector';
const BOOTSTRAP_DB = 'prospectordb';
const TEST_DB_NAME = 'prospectordb_test';
const APP_ROLE_PASSWORD = process.env.APP_ROLE_PASSWORD || 'prospector_app_pass';
const MIGRATOR_ROLE_PASSWORD =
  process.env.MIGRATOR_ROLE_PASSWORD ||
  process.env.MIGRATOR_DB_PASSWORD ||
  'prospector_migrator_pass';

const REQUIRED_CONTAINERS = ['birthhub_postgres', 'birthhub_redis', 'birthhub_meilisearch'];
const COMPOSE_FILES = ['-f', 'docker-compose.yml', '-f', 'docker-compose.postgres-local.yml'];
const SERVICE_BY_CONTAINER = {
  birthhub_postgres: 'postgres',
  birthhub_redis: 'redis',
  birthhub_meilisearch: 'meilisearch',
};

function waitForPort(port, host, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const tryConnect = () => {
      const client = new net.Socket();
      client.once('connect', () => {
        client.destroy();
        resolve();
      });
      client.once('error', () => {
        client.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`Timeout esperando ${host}:${port} ficar disponível.`));
        } else {
          setTimeout(tryConnect, 1000);
        }
      });
      client.connect(port, host);
    };
    tryConnect();
  });
}

async function runPrepareIntegrationEnv() {
  if (!existsSync(envTestPath)) {
    if (existsSync(envTestExamplePath)) {
      const remoteHost = dockerRemoteHost();
      const content = rewriteEnvTestForRemoteDocker(
        readFileSync(envTestExamplePath, 'utf-8'),
        remoteHost,
      );
      writeFileSync(envTestPath, content);
      console.log(
        remoteHost
          ? `.env.test não existia — copiado de .env.test.example com hosts de serviço reescritos para o Docker remoto (${remoteHost}).`
          : '.env.test não existia — copiado de .env.test.example.',
      );
    } else {
      console.error(
        '.env.test não encontrado e .env.test.example ausente. ' +
          'No CI isso deveria ter sido criado por um step do workflow antes deste script rodar.',
      );
      process.exit(1);
    }
  }

  const parsedEnvFile = parseDotEnvContent(readFileSync(envTestPath, 'utf-8'));
  const effectiveEnv = {
    ...parsedEnvFile,
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || parsedEnvFile.NODE_ENV || 'test',
  };

  try {
    assertTestDatabaseSafety(effectiveEnv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  if (!isCI) {
    const running = spawnSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf-8' });
    if (running.error?.code === 'ENOENT') {
      console.error(
        'Docker CLI não encontrado no PATH. Os testes de integração/E2E exigem Postgres, Redis e ' +
          'Meilisearch reais; instale/provisione Docker ou execute no job de CI com service containers. ' +
          'O gate foi interrompido (não é PASS nem skip).',
      );
      process.exit(1);
    }
    if (running.status !== 0) {
      console.error(running.stderr || 'Falha ao consultar containers pelo Docker CLI.');
      process.exit(running.status || 1);
    }
    const runningNames = new Set(
      (running.stdout || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const allRunning = REQUIRED_CONTAINERS.every((name) => runningNames.has(name));

    if (allRunning) {
      console.log(
        `Containers ${REQUIRED_CONTAINERS.join(', ')} já em execução (compartilhados entre ` +
          'worktrees) — pulando `docker compose up` para evitar conflito de container_name fixo.',
      );
    } else {
      const missingContainers = REQUIRED_CONTAINERS.filter((name) => !runningNames.has(name));
      const missingServices = missingContainers.map((name) => SERVICE_BY_CONTAINER[name]);
      console.log(
        `Containers ausentes: ${missingContainers.join(', ')} — subindo só ${missingServices.join(', ')} ` +
          '(os demais já em execução são reaproveitados, não recriados).',
      );
      const result = spawnSync(
        'docker',
        ['compose', ...COMPOSE_FILES, 'up', '-d', ...missingServices],
        {
          stdio: 'inherit',
        },
      );
      if (result.status !== 0) {
        console.error(
          `Falha ao subir docker-compose (${missingServices.join(', ')}). Se o erro for "container name ` +
            'already in use", outro worktree já subiu esse container sob um projeto compose diferente — ' +
            'defina COMPOSE_PROJECT_NAME igual ao worktree que os criou primeiro, ou pare-os ' +
            '(`docker stop birthhub_postgres birthhub_redis birthhub_meilisearch`) antes de tentar de novo. Veja a ' +
            'saída acima para o erro exato.',
        );
        process.exit(result.status || 1);
      }
    }

    const readyDeadline = Date.now() + 60000;
    for (;;) {
      const ready = spawnSync(
        'docker',
        ['exec', POSTGRES_CONTAINER, 'pg_isready', '-U', BOOTSTRAP_SUPERUSER, '-d', BOOTSTRAP_DB],
        { encoding: 'utf-8' },
      );
      if (ready.status === 0) break;
      if (Date.now() > readyDeadline) {
        console.error('Timeout esperando o Postgres do container ficar pronto (pg_isready).');
        process.exit(1);
      }
      spawnSync(process.execPath, ['-e', 'setTimeout(() => {}, 2000)'], { stdio: 'ignore' });
    }

    const exists = spawnSync(
      'docker',
      [
        'exec',
        POSTGRES_CONTAINER,
        'psql',
        '-U',
        BOOTSTRAP_SUPERUSER,
        '-d',
        BOOTSTRAP_DB,
        '-tAc',
        `SELECT 1 FROM pg_database WHERE datname='${TEST_DB_NAME}'`,
      ],
      { encoding: 'utf-8' },
    );
    if (exists.status !== 0) {
      console.error(exists.stderr || 'Falha ao verificar se o banco de teste isolado já existe.');
      process.exit(exists.status || 1);
    }

    if (exists.stdout.trim() !== '1') {
      console.log(
        `Banco "${TEST_DB_NAME}" não existe — criando (isolado de "${BOOTSTRAP_DB}", nunca usado pelo dev).`,
      );
      const create = spawnSync(
        'docker',
        [
          'exec',
          POSTGRES_CONTAINER,
          'psql',
          '-v',
          'ON_ERROR_STOP=1',
          '-U',
          BOOTSTRAP_SUPERUSER,
          '-d',
          BOOTSTRAP_DB,
          '-c',
          `CREATE DATABASE ${TEST_DB_NAME} OWNER ${BOOTSTRAP_SUPERUSER};`,
        ],
        { stdio: 'inherit' },
      );
      if (create.status !== 0) {
        console.error(`Falha ao criar o banco "${TEST_DB_NAME}".`);
        process.exit(create.status || 1);
      }
    }

    const bootstrap = spawnSync(
      'docker',
      [
        'exec',
        POSTGRES_CONTAINER,
        'psql',
        '-v',
        'ON_ERROR_STOP=1',
        '-U',
        BOOTSTRAP_SUPERUSER,
        '-d',
        TEST_DB_NAME,
        '-v',
        `app_password=${APP_ROLE_PASSWORD}`,
        '-v',
        `migrator_password=${MIGRATOR_ROLE_PASSWORD}`,
        '-f',
        '/docker-entrypoint-initdb.d/create-app-role.sql.tpl',
      ],
      { stdio: 'inherit' },
    );
    if (bootstrap.status !== 0) {
      console.error(`Falha ao preparar papel/extensão em "${TEST_DB_NAME}".`);
      process.exit(bootstrap.status || 1);
    }

    // Isolamento dev↔test do Meilisearch: quando o .env.test aponta para a
    // instância dedicada de teste (porta 7701, ver .env.test.example), garante
    // que o container exista — o docker-compose.yml só sobe a instância de dev.
    const testMeiliHost = effectiveEnv.MEILI_HOST || '';
    if (/:7701(?::|\/|$)/.test(testMeiliHost)) {
      const TEST_MEILI_CONTAINER = 'birthhub_meilisearch_test';
      const ps = spawnSync('docker', ['ps', '-a', '--format', '{{.Names}}'], {
        encoding: 'utf-8',
      });
      const names = new Set(
        (ps.stdout || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      );
      if (!names.has(TEST_MEILI_CONTAINER)) {
        console.log(
          `Meilisearch de teste dedicado ausente — subindo ${TEST_MEILI_CONTAINER} (porta 7701).`,
        );
        const run = spawnSync(
          'docker',
          [
            'run',
            '-d',
            '--name',
            TEST_MEILI_CONTAINER,
            '-p',
            '7701:7700',
            '-e',
            `MEILI_MASTER_KEY=${effectiveEnv.MEILI_MASTER_KEY || ''}`,
            '-e',
            'MEILI_ENV=development',
            'getmeili/meilisearch:v1.6',
          ],
          { stdio: 'inherit' },
        );
        if (run.status !== 0) {
          console.error('Falha ao subir o Meilisearch de teste dedicado.');
          process.exit(run.status || 1);
        }
      }
    }
  }

  // Com Docker remoto as portas são publicadas no host do daemon, não em localhost.
  await waitForPort(5434, dockerRemoteHost() || 'localhost', 60000);
}

const isMainModule =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]).endsWith('prepare-integration-env.js');

if (isMainModule) {
  runPrepareIntegrationEnv()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

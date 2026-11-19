import net from 'node:net';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Onda 6 / MEL-45 (agente 14): isolamento do ambiente E2E local.
//
// Problema: a config usava PORT fixo 3000 (default de .env.test) com
// `reuseExistingServer: true` fora do CI. Se QUALQUER processo já estivesse escutando na 3000 —
// tipicamente o `start:e2e` de OUTRO worktree da mesma onda, com outro .env.test/banco — o
// Playwright "reusava" esse servidor estranho e os specs de signup/onboarding falhavam por
// bater numa base/ambiente que não era o esperado (o oposto do isolamento por worktree que o
// resto do harness garante).
//
// Correção: quando ninguém apontou explicitamente um alvo (E2E_BASE_URL) e PORT é o default
// '3000' vindo de .env.test, alocamos uma porta efêmera de verdade (listen(0)) — impossível
// colidir com o servidor de outro worktree — e exportamos process.env.PORT para que
// global-setup.ts e helpers enxerguem a mesma porta. O webServer que o Playwright spawna é
// morto por ele ao final do run (cleanup garantido — antes, um servidor "reusado" nunca era
// encerrado e ficava órfão segurando a porta). PORT != '3000' ou E2E_BASE_URL definidos pelo
// usuário/CI continuam respeitados como override explícito.
//
// NOTA: package.json tem "type": "module", então este arquivo é carregado via import() ESM real
// — top-level await é suportado aqui (verificado em playwright/lib/common requireOrImport).
async function allocateEphemeralPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => (port > 0 ? resolve(port) : reject(new Error('porta efêmera inválida'))));
    });
  });
}

const EXPLICIT_BASE_URL = process.env.E2E_BASE_URL?.trim();
const EXPLICIT_PORT = process.env.PORT?.trim();
const PORT =
  EXPLICIT_PORT && EXPLICIT_PORT !== '3000'
    ? EXPLICIT_PORT
    : EXPLICIT_BASE_URL
      ? // E2E_BASE_URL explícita sem PORT: mantém o comportamento anterior (webServer local na 3000).
        '3000'
      : String(await allocateEphemeralPort());
// Garante que global-setup.ts (lê process.env.PORT no top-level do próprio módulo) e qualquer
// helper vejam a porta efêmera — o config é avaliado antes do globalSetup no mesmo processo.
process.env.PORT = PORT;
const BASE_URL = EXPLICIT_BASE_URL ?? `http://localhost:${PORT}`;

// Ambientes que já vêm com um Chromium provisionado (sandbox de agente, imagem corporativa de CI)
// costumam ter uma build diferente da que o @playwright/test instalado espera — o launch falha com
// "Executable doesn't exist at .../chromium_headless_shell-<build>/...", mesmo havendo um Chromium
// perfeitamente utilizável na máquina. Apontar o executável por env resolve isso sem tocar no
// caminho padrão: quando a variável não está definida, o Playwright continua resolvendo o browser
// sozinho, exatamente como o CI faz depois de `npx playwright install --with-deps chromium`.
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?.trim() || undefined;

// TAREFA-SANEAMENTO-039 (BT360-DT-0089): os specs E2E agora fazem asserções diretas no banco
// (tests/e2e/db-assertions.ts). Antes de qualquer worker subir, garante fail-fast que a URL de
// banco aponta para um database de teste (`*_test`) — nunca para produção. Mesma regra da trava
// assertTestDatabaseSafety do harness de integração (scripts/test/prepare-integration-env.js).
function assertE2eTestDatabase(): void {
  const urls = [process.env.DATABASE_URL, process.env.TEST_DATABASE_URL, process.env.DIRECT_URL]
    .filter((u): u is string => typeof u === 'string' && u.trim() !== '');
  for (const url of urls) {
    let dbName = '';
    try {
      dbName = new URL(url).pathname.replace(/^\//, '');
    } catch {
      throw new Error(`playwright.config: DATABASE_URL inválida para asserções E2E: ${url}`);
    }
    if (!dbName.endsWith('_test')) {
      throw new Error(
        `playwright.config: recusando E2E contra database "${dbName}" — ` +
          'asserções de persistência exigem database terminada em "_test"',
      );
    }
  }
}
assertE2eTestDatabase();

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/visual.spec.ts', '**/visual-audit.spec.ts'],
  globalSetup: './tests/e2e/global-setup.ts',
  // Os specs de auth/leads criam usuários/organizações reais no banco de testes de integração —
  // rodar em série evita duas rotinas de signup/CRUD pisando uma na outra na mesma tabela.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  // Default do Playwright (30s) não sobra folga pro signUp() de helpers.ts (que já usa até 30s
  // pra navegar pro app sob carga do runner  // (ver tests/e2e/helpers.ts). Aumentado de 30s para 45s (e agora 60s) para absorver o load total
  // sem esconder um hang de verdade - signUp() estoura o timeout dele primeiro nesse caso.
  timeout: 60_000,
  reporter: [
    ...(process.env.CI ? [['line']] : []),
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    // `page.request`/`request` mandam o cookie de sessão mas NÃO mandam `Origin` (um navegador real
    // sempre manda em POST/PUT/DELETE). O csrfGuard exige Origin/Referer válido em mutação com cookie
    // (SEC-002), então sem isto todo `page.request.post('/api/...')` dos specs tomava 403. Origem =
    // a do próprio app sob teste, exatamente o que o navegador enviaria.
    extraHTTPHeaders: { Origin: new URL(BASE_URL).origin },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath
          ? { launchOptions: { executablePath: chromiumExecutablePath } }
          : {}),
      },
    },
  ],
  webServer: process.env.IGNORE_WEBSERVER ? undefined : {
    // `npm run preview` (vite preview) servia só o SPA estático, sem `/api` — nenhum teste que
    // dependesse de login real podia funcionar. `start:e2e` sobe o servidor Express de verdade
    // (auth, Prisma/RLS, todas as rotas), igual ao que roda em produção.
    //
    // O entrypoint é tests/e2e/e2e-server.ts (e não `npm run start:e2e` direto): ele instala
    // ANTES um stub de fetch que permite exercitar a jornada real da Mesa de Tratamento contra
    // um portal Bitrix24 falso em 127.0.0.1 (tests/e2e/bitrix-mock/) — só ativo com
    // E2E_BITRIX_MOCK=1, que só este webServer seta. Sem a variável o servidor se comporta
    // idêntico ao start:e2e. BITRIX_MIN_INTERVAL_MS=0 desliga o pacing de ~500ms entre chamadas
    // REST do Bitrix — otimização de teste, sem efeito no que é assertado.
    command: 'npx dotenv-cli -e .env.test -- tsx tests/e2e/e2e-server.ts',
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      PORT,
      E2E_BITRIX_MOCK: '1',
      E2E_BITRIX_MOCK_PORT: process.env.E2E_BITRIX_MOCK_PORT ?? '4799',
      BITRIX_MIN_INTERVAL_MS: '0',
      // O apiLimiter genérico envolve /api/auth antes do authLimiter dedicado. A suíte E2E inteira
      // faz centenas de GETs de sessão + chamadas de API a partir do mesmo IP do runner e pode
      // ultrapassar o default de produção (600/15min), mesmo com AUTH_RATE_LIMIT_MAX elevado.
      // Isto vale SOMENTE para o processo de servidor criado pelo Playwright; produção continua
      // usando o limite configurado em env.ts/Render. Mantemos um teto finito para ainda detectar
      // loops explosivos em testes, mas sem transformar o tamanho da suíte em falso 429.
      API_RATE_LIMIT_MAX: process.env.API_RATE_LIMIT_MAX ?? '5000',
      AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX ?? '500',
    },
  },
});

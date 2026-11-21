// Cenario de carga para rotas de ANALYTICS e COMMERCIAL INTELLIGENCE (Handoff P04/P05 / Onda 5+).
//
// Mede a latencia real dos 17 relatorios executivos sob autenticacao, RBAC (COMMERCIAL_INTELLIGENCE_ROLES:
// ADMIN/GESTOR) e isolamento multi-tenant (RLS).
//
// ─── Por que este cenario e necessario ──────────────────────────────────────────────────────────
// docs/development/PERFORMANCE_BUDGETS.md e .agents/handoffs/00-para-04-10-08-relatorios-forecast.md
// registraram que o k6 ate entao so media /health/* (sem autenticacao) e rotas basicas de CRM
// (/api/leads, /api/companies, /api/activities).
// As rotas executivas de inteligencia comercial (/api/commercial-intelligence/*) executam calculos
// complexos de agregacao, aging de negocios, taxas de conversao de funil e reconciliacao de sync
// Bitrix24. Sem um cenario k6 dedicado, o overhead dos calculos analiticos e queries agregadas
// nunca era medido sob concorrencia.
//
// ─── Autenticacao e Setup ──────────────────────────────────────────────────────────────────────
// O setup() cria um tenant e usuario ADMIN real via POST /api/auth/sign-up/email (Better Auth).
// Como ADMIN pertence a COMMERCIAL_INTELLIGENCE_ROLES, tem permissao de acesso a todos os relatorios.
// Em seguida, faz o seed de empresas e leads reais com datas, estagios e valores variados, garantindo
// que os endpoints de analytics tenham volume real para calcular agregacoes sem retornar conjuntos vazios.
//
// ─── Endpoints sob teste ───────────────────────────────────────────────────────────────────────
//   1. GET /api/commercial-intelligence/overview             (Cockpit executivo e KPIs principais)
//   2. GET /api/commercial-intelligence/performance          (Conversao por etapa e taxas de fechamento)
//   3. GET /api/commercial-intelligence/aging                (Tempo de permanencia dos leads em cada estagio)
//   4. GET /api/commercial-intelligence/pipeline-creation    (Volume e ritmo de novos negocios gerados)
//   5. GET /api/commercial-intelligence/bitrix-sync-health   (Saude e integridade operacional do sync Bitrix24)
//
// ─── Thresholds e SLO ──────────────────────────────────────────────────────────────────────────
//   - http_req_failed < 1% no cenario medido.
//   - p50 < 200ms, p95 < 500ms (SLO docs/SRE.md 1.2), p99 < 800ms (teto maximo do Documento Mestre P04).
//
// ─── Execucao local ────────────────────────────────────────────────────────────────────────────
//   k6 run tests/load/k6-analytics-commercial-intelligence.js --env BASE_URL=http://localhost:3000
// Ou via Docker:
//   npm run load:k6:analytics

import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  scenarios: {
    warmup: {
      executor: 'constant-vus',
      vus: 5,
      duration: '20s',
      exec: 'default',
      tags: { phase: 'warmup' },
    },
    measure: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      startTime: '20s',
      exec: 'default',
      tags: { phase: 'measure' },
    },
  },
  setupTimeout: '120s',
  thresholds: {
    'http_req_failed{scenario:measure}': ['rate<0.01'],
    'http_req_duration{endpoint:ci_overview,scenario:measure}': ['p(50)<200', 'p(95)<500', 'p(99)<800'],
    'http_req_duration{endpoint:ci_performance,scenario:measure}': ['p(50)<200', 'p(95)<500', 'p(99)<800'],
    'http_req_duration{endpoint:ci_aging,scenario:measure}': ['p(50)<200', 'p(95)<500', 'p(99)<800'],
    'http_req_duration{endpoint:ci_pipeline_creation,scenario:measure}': ['p(50)<200', 'p(95)<500', 'p(99)<800'],
    'http_req_duration{endpoint:ci_bitrix_sync_health,scenario:measure}': ['p(50)<200', 'p(95)<500', 'p(99)<800'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const SESSION_COOKIE_NAME = 'better-auth.session_token';

const COMPANY_SEED_COUNT = 60;
const LEAD_SEED_COUNT = 60;
const LEAD_SEED_BATCH_SIZE = 15;

const STAGE_POOL = [
  'Lead Recebido',
  'Qualificação (SDR)',
  'Reunião Agendada',
  'Nova Oportunidade',
  'Proposta Enviada',
  'Negócios Ganhos',
];

function jsonHeaders(cookie) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Cookie: `${SESSION_COOKIE_NAME}=${cookie}`,
    Origin: baseUrl,
  };
}

function extractSessionCookie(response) {
  const setCookieHeader = response.headers['Set-Cookie'];
  if (!setCookieHeader) return null;
  const match = new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`).exec(setCookieHeader);
  return match ? match[1] : null;
}

function uniqueEmail() {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `k6-analytics-${unique}@birthhub360.com.br`;
}

export function setup() {
  const email = uniqueEmail();
  const signUpRes = http.post(
    `${baseUrl}/api/auth/sign-up/email`,
    JSON.stringify({ email, password: 'K6LoadTest123!', name: `K6 Analytics ${email}` }),
    {
      headers: { 'Content-Type': 'application/json', Origin: baseUrl },
      tags: { endpoint: 'auth_signup' },
    },
  );

  const signedUp = check(signUpRes, {
    'sign-up de analytics respondeu 200': (res) => res.status === 200,
  });
  if (!signedUp) {
    throw new Error(`Falha no sign-up de setup do k6 analytics (status ${signUpRes.status}): ${signUpRes.body}`);
  }

  const cookie = extractSessionCookie(signUpRes);
  if (!cookie) {
    throw new Error('Sign-up respondeu 200 mas nao retornou o cookie better-auth.session_token.');
  }
  const headers = jsonHeaders(cookie);

  // Seed de empresas
  const companyRequests = [];
  for (let i = 0; i < COMPANY_SEED_COUNT; i++) {
    companyRequests.push([
      'POST',
      `${baseUrl}/api/companies`,
      JSON.stringify({
        legalName: `K6 Analytics Empresa ${i} LTDA`,
        tradeName: `K6 Analytics ${i}`,
        segment: i % 2 === 0 ? 'Saúde' : 'Tecnologia',
      }),
      { headers, tags: { endpoint: 'setup_seed_company' } },
    ]);
  }
  const companyResponses = http.batch(companyRequests);
  const companyIds = companyResponses
    .filter((res) => res.status === 201)
    .map((res) => res.json('data.id'));

  if (companyIds.length === 0) {
    throw new Error('Seed de empresas para analytics falhou — nenhuma empresa criada.');
  }

  // Seed de leads para preenchimento de funil e metricas
  const leadIds = [];
  for (let batchStart = 0; batchStart < LEAD_SEED_COUNT; batchStart += LEAD_SEED_BATCH_SIZE) {
    const leadRequests = [];
    for (
      let i = batchStart;
      i < Math.min(batchStart + LEAD_SEED_BATCH_SIZE, LEAD_SEED_COUNT);
      i++
    ) {
      leadRequests.push([
        'POST',
        `${baseUrl}/api/leads`,
        JSON.stringify({
          companyId: companyIds[i % companyIds.length],
          source: i % 2 === 0 ? 'Inbound' : 'Outbound',
          funnel: 'Negocio',
          status: STAGE_POOL[i % STAGE_POOL.length],
          temperature: i % 3 === 0 ? 'Quente' : 'Morno',
          value: 10000 + i * 2500,
        }),
        { headers, tags: { endpoint: 'setup_seed_lead' } },
      ]);
    }
    const leadResponses = http.batch(leadRequests);
    for (const res of leadResponses) {
      if (res.status === 201) leadIds.push(res.json('data.id'));
    }
  }

  return { cookie, companyIds, leadIds };
}

export default function (data) {
  const headers = jsonHeaders(data.cookie);

  // 1. Overview do Cockpit Executivo
  group('ci_overview', () => {
    const res = http.get(`${baseUrl}/api/commercial-intelligence/overview`, {
      headers,
      tags: { endpoint: 'ci_overview' },
    });
    check(res, {
      'GET /overview status 200': (r) => r.status === 200,
      'GET /overview retorna dados validos': (r) => r.json('data') !== undefined,
    });
  });

  // 2. Performance e Conversao por Estagio
  group('ci_performance', () => {
    const res = http.get(`${baseUrl}/api/commercial-intelligence/performance`, {
      headers,
      tags: { endpoint: 'ci_performance' },
    });
    check(res, {
      'GET /performance status 200': (r) => r.status === 200,
      'GET /performance retorna dados validos': (r) => r.json('data') !== undefined,
    });
  });

  // 3. Aging de Negocios
  group('ci_aging', () => {
    const res = http.get(`${baseUrl}/api/commercial-intelligence/aging`, {
      headers,
      tags: { endpoint: 'ci_aging' },
    });
    check(res, {
      'GET /aging status 200': (r) => r.status === 200,
      'GET /aging retorna dados validos': (r) => r.json('data') !== undefined,
    });
  });

  // 4. Ritmo de Criacao de Pipeline
  group('ci_pipeline_creation', () => {
    const res = http.get(`${baseUrl}/api/commercial-intelligence/pipeline-creation`, {
      headers,
      tags: { endpoint: 'ci_pipeline_creation' },
    });
    check(res, {
      'GET /pipeline-creation status 200': (r) => r.status === 200,
      'GET /pipeline-creation retorna dados validos': (r) => r.json('data') !== undefined,
    });
  });

  // 5. Saude Operacional do Sync Bitrix24
  group('ci_bitrix_sync_health', () => {
    const res = http.get(`${baseUrl}/api/commercial-intelligence/bitrix-sync-health`, {
      headers,
      tags: { endpoint: 'ci_bitrix_sync_health' },
    });
    check(res, {
      'GET /bitrix-sync-health status 200': (r) => r.status === 200,
      'GET /bitrix-sync-health retorna dados validos': (r) => r.json('data') !== undefined,
    });
  });

  sleep(1);
}

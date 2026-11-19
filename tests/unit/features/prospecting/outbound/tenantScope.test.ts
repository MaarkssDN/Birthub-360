/**
 * Handoff 12→05 (F2) — escopo de tenant do outbound legado.
 *
 * Cobre o contrato HTTP do apiRouter: toda rota de dados exige sessão com
 * `company` (requireTenantScope → 401 sem sessão, 403 sem tenant) e as queries
 * filtram pela company da sessão (nenhum vazamento cross-tenant/LGPD).
 *
 * O banco é mockado em server/db.js — os testes verificam o SQL/parâmetros
 * emitidos e os códigos de status, não o Postgres real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { http, passthrough } from 'msw';
// supertest sobe o app num socket TCP real — sem passthrough o MSW global
// (estratégia "error") barraria a própria requisição de teste.
import { server } from '../../../../mocks/server';

import { apiRouter } from '@/features/prospecting/outbound/server/routes';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from '@/features/prospecting/outbound/server/auth';
import { startSearchRun } from '@/features/prospecting/outbound/server/observability';

const dbMocks = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(async () => {}),
}));

vi.mock('@/features/prospecting/outbound/server/db.js', () => ({
  getDatabase: vi.fn(async () => ({ exec: dbMocks.exec, run: dbMocks.run })),
  saveDatabase: vi.fn(),
  logActivity: vi.fn(async () => {}),
  executeQuery: vi.fn(async () => ({ columns: [], values: [] })),
  getStats: vi.fn(async () => ({})),
  checkExplorerSqlSafety: vi.fn(() => ({ allowed: true })),
  toPgQuery: (sql: string) => sql,
}));

function rows(columns: string[], values: any[][]) {
  return [{ columns, values }];
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/outbound', apiRouter);
  return app;
}

function sessionCookie(user: { id: string; role: string; company: string | null }) {
  const token = createSessionToken(user);
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
}

const COMPANY_A = 'empresa-a';
const COMPANY_B = 'empresa-b';

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.exec.mockResolvedValue(rows(['id'], []));
  server.use(http.all(/^http:\/\/127\.0\.0\.1:\d+\//, () => passthrough()));
});

describe('outbound apiRouter — requireTenantScope', () => {
  it('GET /health responde sem sessão (sonda pública)', async () => {
    const res = await request(buildApp()).get('/api/outbound/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /campaigns sem sessão → 401', async () => {
    const res = await request(buildApp()).get('/api/outbound/campaigns');
    expect(res.status).toBe(401);
  });

  it('GET /campaigns com sessão sem company → 403', async () => {
    const res = await request(buildApp())
      .get('/api/outbound/campaigns')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: null }));
    expect(res.status).toBe(403);
  });

  it('GET /campaigns filtra pela company da sessão', async () => {
    dbMocks.exec.mockResolvedValueOnce(
      rows(['id', 'title', 'company'], [['c1', 'Campanha A', 'Empresa A']]),
    );
    const res = await request(buildApp())
      .get('/api/outbound/campaigns')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }));
    expect(res.status).toBe(200);
    const [sql, params] = dbMocks.exec.mock.calls[0];
    expect(String(sql)).toContain('LOWER(TRIM(COALESCE(c.company');
    expect(String(sql)).toContain('WHERE');
    expect(params[0]).toBe(COMPANY_A);
  });

  it('GET /users/:userId/leads de vendedor de OUTRA company → 404 (não revelar existência)', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['company'], [[COMPANY_B]]));
    const res = await request(buildApp())
      .get('/api/outbound/users/u-vendedor-b/leads')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'admin', company: COMPANY_A }));
    expect(res.status).toBe(404);
  });

  it('GET /leads/:id/tasks une tasks a leads com filtro de company', async () => {
    dbMocks.exec.mockResolvedValueOnce(
      rows(['id', 'description'], [['t1', 'Ligar']]),
    );
    const res = await request(buildApp())
      .get('/api/outbound/leads/lead-1/tasks')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }));
    expect(res.status).toBe(200);
    const [sql, params] = dbMocks.exec.mock.calls[0];
    expect(String(sql)).toContain('JOIN leads');
    expect(String(sql)).toContain('l.company');
    expect(params).toContain(COMPANY_A);
  });

  it('GET /tasks (painel gerencial) filtra pela company da sessão', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['id'], []));
    const res = await request(buildApp())
      .get('/api/outbound/tasks')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'gestor', company: COMPANY_A }));
    expect(res.status).toBe(200);
    const [sql, params] = dbMocks.exec.mock.calls[0];
    expect(String(sql)).toContain('l.company');
    expect(params).toContain(COMPANY_A);
  });

  it('GET /leads/:id/evidence de lead de OUTRA company → 404 (sem vazar evidência)', async () => {
    // leadBelongsToCompany não encontra o lead no escopo da sessão
    dbMocks.exec.mockResolvedValueOnce(rows(['id'], []));
    const res = await request(buildApp())
      .get('/api/outbound/leads/lead-de-b/evidence')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }));
    expect(res.status).toBe(404);
  });

  it('PUT /leads/:id/stage em lead de OUTRA company → 404 (sem escrita cross-tenant)', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['stage'], []));
    const res = await request(buildApp())
      .put('/api/outbound/leads/lead-de-b/stage')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }))
      .send({ stage: 'contatado' });
    expect(res.status).toBe(404);
    expect(dbMocks.run).not.toHaveBeenCalled();
  });

  it('POST /integrations/bitrix24/send-lead com lead.id de OUTRA company → 404', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['id'], []));
    const res = await request(buildApp())
      .post('/api/outbound/integrations/bitrix24/send-lead')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }))
      .send({ lead: { id: 'lead-de-b', name: 'Empresa B' } });
    expect(res.status).toBe(404);
  });

  it('GET /feedback/summary agrega só leads/messages da company da sessão', async () => {
    dbMocks.exec
      .mockResolvedValueOnce(rows(['channel', 'feedback'], []))
      .mockResolvedValueOnce(rows(['stage'], []));
    const res = await request(buildApp())
      .get('/api/outbound/feedback/summary')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'admin', company: COMPANY_A }));
    expect(res.status).toBe(200);
    const [sqlMsgs] = dbMocks.exec.mock.calls[0];
    const [sqlLeads, paramsLeads] = dbMocks.exec.mock.calls[1];
    expect(String(sqlMsgs)).toContain('EXISTS');
    expect(String(sqlMsgs)).toContain('l.company');
    expect(String(sqlLeads)).toContain('company');
    expect(paramsLeads).toContain(COMPANY_A);
  });

  it('GET /users lista apenas usuários da company da sessão', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['id', 'email'], [['u2', 'v@b.com']]));
    const res = await request(buildApp())
      .get('/api/outbound/users')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'admin', company: COMPANY_A }));
    expect(res.status).toBe(200);
    const [sql, params] = dbMocks.exec.mock.calls[0];
    expect(String(sql)).toContain('company');
    expect(params).toContain(COMPANY_A);
  });
});

describe('outbound apiRouter — search-runs com escopo de tenant (parecer 24 PR #323)', () => {
  it('GET /search-runs/:id da MESMA company → 200', async () => {
    const run = startSearchRun({ request: { query: 'clínicas', company: COMPANY_A } });
    const res = await request(buildApp())
      .get(`/api/outbound/search-runs/${run.searchId}`)
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }));
    expect(res.status).toBe(200);
    expect(res.body.searchId).toBe(run.searchId);
  });

  it('GET /search-runs/:id de OUTRA company → 404 (PII de prospecção não vaza)', async () => {
    const run = startSearchRun({ request: { query: 'clínicas', company: COMPANY_B } });
    const res = await request(buildApp())
      .get(`/api/outbound/search-runs/${run.searchId}`)
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }));
    expect(res.status).toBe(404);
  });

  it('GET /search-runs/:id de run sem company registrada → 404', async () => {
    const run = startSearchRun({ request: { query: 'clínicas' } });
    const res = await request(buildApp())
      .get(`/api/outbound/search-runs/${run.searchId}`)
      .set('Cookie', sessionCookie({ id: 'u1', role: 'user', company: COMPANY_A }));
    expect(res.status).toBe(404);
  });
});

describe('outbound apiRouter — POST /prospect ignora company do body (parecer 24 PR #323)', () => {
  it('admin NÃO consegue prospectar com company de outro tenant via body', async () => {
    // O dedupe de leads é a primeira query do handler — seu parâmetro company
    // prova qual tenant foi efetivamente usado, mesmo que a busca falhe depois
    // por falta de providers configurados.
    const res = await request(buildApp())
      .post('/api/outbound/prospect')
      .set('Cookie', sessionCookie({ id: 'u1', role: 'admin', company: COMPANY_A }))
      .send({ query: 'clínicas em São Paulo', company: COMPANY_B, limit: 1 });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    const dedupeCall = dbMocks.exec.mock.calls.find(([sql]) =>
      String(sql).includes('FROM leads'),
    );
    expect(dedupeCall).toBeDefined();
    expect(dedupeCall![1][0]).toBe(COMPANY_A);
    expect(dedupeCall![1]).not.toContain(COMPANY_B);
  });
});

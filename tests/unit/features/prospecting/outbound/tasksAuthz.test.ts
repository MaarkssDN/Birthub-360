/**
 * ONDA3-43-PROSPECTING-AUTHZ — regressão do IDOR em tasks do outbound.
 *
 * Reproduz os achados do handoff 45→05 (Otto):
 *  1. GET /users/:userId/tasks não comparava :userId com a sessão — qualquer
 *     autenticado do tenant lia as tarefas de outro vendedor.
 *  2. POST /leads/:id/tasks aceitava `userId` arbitrário do body (criar tarefa
 *     "em nome" de outro usuário / sujar o painel alheio).
 *  3. PUT /tasks/:id não verificava ownership e gravava no audit log o
 *     `userId` vindo do body (spoofing de autoria).
 *
 * Contrato esperado após a correção:
 *  - self-service: userId da rota/body == req.outboundUser.id → permitido;
 *  - admin/gestor (requireManager): pode ver/atribuir/editar tarefas de
 *    terceiros dentro do tenant;
 *  - demais roles → 403 nas operações sobre tarefas de outro usuário.
 *
 * O banco é mockado em server/db.js — verificamos SQL/parâmetros e status HTTP.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { http, passthrough } from 'msw';
import { server } from '../../../../mocks/server';

import { apiRouter } from '@/features/prospecting/outbound/server/routes';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from '@/features/prospecting/outbound/server/auth';

const dbMocks = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(async () => {}),
}));
const logActivityMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock('@/features/prospecting/outbound/server/db.js', () => ({
  getDatabase: vi.fn(async () => ({ exec: dbMocks.exec, run: dbMocks.run })),
  saveDatabase: vi.fn(),
  logActivity: logActivityMock,
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
const SELLER = { id: 'u-seller', role: 'user', company: COMPANY_A };
const OTHER = 'u-outro-vendedor';
const MANAGER = { id: 'u-gestor', role: 'gestor', company: COMPANY_A };
const ADMIN = { id: 'u-admin', role: 'admin', company: COMPANY_A };

beforeEach(() => {
  vi.clearAllMocks();
  // Default: lead existe no tenant; demais selects vazios.
  dbMocks.exec.mockImplementation(async (sql: any) => {
    const s = String(sql);
    if (s.includes('FROM leads l WHERE l.id')) return rows(['id'], [['lead-1']]);
    if (s.includes('INSERT INTO tasks'))
      return rows(['id', 'user_id', 'status'], [['t1', SELLER.id, 'pending']]);
    return rows(['id'], []);
  });
  server.use(http.all(/^http:\/\/127\.0\.0\.1:\d+\//, () => passthrough()));
});

describe('ONDA3-43 — GET /users/:userId/tasks (IDOR intra-tenant)', () => {
  it('vendedor NÃO pode ler tarefas de outro usuário → 403', async () => {
    const res = await request(buildApp())
      .get(`/api/outbound/users/${OTHER}/tasks`)
      .set('Cookie', sessionCookie(SELLER));
    expect(res.status).toBe(403);
    // Não deve nem consultar o banco com o userId alheio.
    expect(dbMocks.exec).not.toHaveBeenCalled();
  });

  it('vendedor lê as PROPRIAS tarefas → 200', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['id', 'description'], [['t1', 'Ligar']]));
    const res = await request(buildApp())
      .get(`/api/outbound/users/${SELLER.id}/tasks`)
      .set('Cookie', sessionCookie(SELLER));
    expect(res.status).toBe(200);
    const [sql, params] = dbMocks.exec.mock.calls[0];
    expect(String(sql)).toContain('t.user_id = ?');
    expect(params[0]).toBe(SELLER.id);
  });

  it('gestor pode ler tarefas de outro usuário do tenant → 200', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['id'], []));
    const res = await request(buildApp())
      .get(`/api/outbound/users/${OTHER}/tasks`)
      .set('Cookie', sessionCookie(MANAGER));
    expect(res.status).toBe(200);
  });

  it('admin pode ler tarefas de outro usuário do tenant → 200', async () => {
    dbMocks.exec.mockResolvedValueOnce(rows(['id'], []));
    const res = await request(buildApp())
      .get(`/api/outbound/users/${OTHER}/tasks`)
      .set('Cookie', sessionCookie(ADMIN));
    expect(res.status).toBe(200);
  });
});

describe('ONDA3-43 — POST /leads/:id/tasks (userId arbitrário no body)', () => {
  it('vendedor NÃO pode criar tarefa em nome de outro usuário → 403, sem INSERT', async () => {
    const res = await request(buildApp())
      .post('/api/outbound/leads/lead-1/tasks')
      .set('Cookie', sessionCookie(SELLER))
      .send({ description: 'Ligar para o lead', userId: OTHER });
    expect(res.status).toBe(403);
    const insertCalls = dbMocks.exec.mock.calls.filter(([sql]) =>
      String(sql).includes('INSERT INTO tasks'),
    );
    expect(insertCalls).toHaveLength(0);
  });

  it('vendedor cria tarefa para SI MESMO → 201 e user_id = sessão', async () => {
    const res = await request(buildApp())
      .post('/api/outbound/leads/lead-1/tasks')
      .set('Cookie', sessionCookie(SELLER))
      .send({ description: 'Ligar para o lead', userId: SELLER.id });
    expect(res.status).toBe(201);
    const insertCall = dbMocks.exec.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO tasks'),
    );
    expect(insertCall).toBeDefined();
    // params: [lead_id, user_id, description, due_date]
    expect(insertCall![1][1]).toBe(SELLER.id);
  });

  it('gestor PODE atribuir tarefa a outro vendedor → 201', async () => {
    const res = await request(buildApp())
      .post('/api/outbound/leads/lead-1/tasks')
      .set('Cookie', sessionCookie(MANAGER))
      .send({ description: 'Follow-up', userId: OTHER });
    expect(res.status).toBe(201);
    const insertCall = dbMocks.exec.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO tasks'),
    );
    expect(insertCall![1][1]).toBe(OTHER);
  });
});

describe('ONDA3-43 — PUT /tasks/:id (ownership + autoria no audit log)', () => {
  function mockTaskLookup(userId: string | null) {
    // SELECT t.lead_id, t.status, t.user_id ... JOIN leads
    dbMocks.exec.mockImplementationOnce(async (sql: any) => {
      if (String(sql).includes('FROM tasks t JOIN leads'))
        return rows(['lead_id', 'status', 'user_id'], [['lead-1', 'pending', userId]]);
      return rows(['id'], []);
    });
  }

  it('vendedor NÃO pode alterar tarefa de outro usuário → 403, sem UPDATE', async () => {
    mockTaskLookup(OTHER);
    const res = await request(buildApp())
      .put('/api/outbound/tasks/t1')
      .set('Cookie', sessionCookie(SELLER))
      .send({ status: 'done' });
    expect(res.status).toBe(403);
    const updateCalls = dbMocks.run.mock.calls.filter(([sql]) =>
      String(sql).includes('UPDATE tasks'),
    );
    expect(updateCalls).toHaveLength(0);
  });

  it('vendedor altera a PROPRIA tarefa → 200', async () => {
    mockTaskLookup(SELLER.id);
    dbMocks.exec.mockResolvedValueOnce(rows(['id', 'status'], [['t1', 'done']]));
    const res = await request(buildApp())
      .put('/api/outbound/tasks/t1')
      .set('Cookie', sessionCookie(SELLER))
      .send({ status: 'done' });
    expect(res.status).toBe(200);
  });

  it('gestor altera tarefa de outro usuário → 200', async () => {
    mockTaskLookup(OTHER);
    dbMocks.exec.mockResolvedValueOnce(rows(['id', 'status'], [['t1', 'done']]));
    const res = await request(buildApp())
      .put('/api/outbound/tasks/t1')
      .set('Cookie', sessionCookie(MANAGER))
      .send({ status: 'done' });
    expect(res.status).toBe(200);
  });

  it('audit log registra o usuário da SESSÃO, não o userId do body', async () => {
    mockTaskLookup(SELLER.id);
    dbMocks.exec.mockResolvedValueOnce(rows(['id', 'status'], [['t1', 'done']]));
    await request(buildApp())
      .put('/api/outbound/tasks/t1')
      .set('Cookie', sessionCookie(SELLER))
      .send({ status: 'done', userId: OTHER });
    expect(logActivityMock).toHaveBeenCalled();
    const call = logActivityMock.mock.calls[0][1] as any;
    expect(call.userId).toBe(SELLER.id);
  });
});

describe('ONDA3-43 — validação de dueDate', () => {
  it('POST com dueDate inválida → 400', async () => {
    const res = await request(buildApp())
      .post('/api/outbound/leads/lead-1/tasks')
      .set('Cookie', sessionCookie(SELLER))
      .send({ description: 'Tarefa', dueDate: 'lixo' });
    expect(res.status).toBe(400);
  });

  it('PUT com dueDate inválida → 400', async () => {
    const res = await request(buildApp())
      .put('/api/outbound/tasks/t1')
      .set('Cookie', sessionCookie(SELLER))
      .send({ dueDate: 'não-é-data' });
    expect(res.status).toBe(400);
  });
});

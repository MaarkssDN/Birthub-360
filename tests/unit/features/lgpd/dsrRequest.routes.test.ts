import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Handoff `.agents/handoffs/21-para-01-dsr-canal-publico-lgpd.md` — contrato
// público do canal DSR: anti-enumeração no submit (202 idêntico exista ou não o
// titular), token inválido/expirado recusado sem vazar existência, e o service
// mockado isola a rota da persistência/RLS.

const createDataSubjectRequest = vi.fn();
const verifyDataSubjectRequest = vi.fn();
const getDataSubjectRequestStatus = vi.fn();

vi.mock('@/features/lgpd/dsrRequest.service.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/lgpd/dsrRequest.service.js')>();
  return {
    ...actual,
    createDataSubjectRequest: (...args: unknown[]) => createDataSubjectRequest(...args),
    verifyDataSubjectRequest: (...args: unknown[]) => verifyDataSubjectRequest(...args),
    getDataSubjectRequestStatus: (...args: unknown[]) => getDataSubjectRequestStatus(...args),
  };
});

const { dsrRequestRoutes } = await import('@/features/lgpd/dsrRequest.routes.js');
const { DsrInvalidTokenError, DsrUnavailableError } = await import(
  '@/features/lgpd/dsrRequest.service.js'
);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/public/data-subject-requests', dsrRequestRoutes);
  return app;
}

const VALID_BODY = {
  email: 'titular@example.com',
  rightType: 'ERASURE',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dsrRequest.routes — POST / (anti-enumeração)', () => {
  it('responde 202 idêntico quando o titular existe ou não (service colapsa os dois casos)', async () => {
    // O service devolve 'created' ou 'no_subject' — a rota NÃO pode distinguir.
    createDataSubjectRequest.mockResolvedValue('no_subject');
    const res1 = await request(buildApp()).post('/api/public/data-subject-requests').send(VALID_BODY);
    expect(res1.status).toBe(202);
    expect(res1.body).toEqual({ ok: true });

    createDataSubjectRequest.mockResolvedValue('created');
    const res2 = await request(buildApp()).post('/api/public/data-subject-requests').send(VALID_BODY);
    expect(res2.status).toBe(202);
    expect(res2.body).toEqual({ ok: true });
  });

  it('rejeita payload inválido sem chamar o service', async () => {
    const res = await request(buildApp())
      .post('/api/public/data-subject-requests')
      .send({ email: 'não-é-email', rightType: 'TUDO' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(createDataSubjectRequest).not.toHaveBeenCalled();
  });

  it('responde 503 quando o tenant público não está configurado', async () => {
    createDataSubjectRequest.mockRejectedValue(new DsrUnavailableError());
    const res = await request(buildApp()).post('/api/public/data-subject-requests').send(VALID_BODY);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, error: 'unavailable' });
  });
});

describe('dsrRequest.routes — POST /verify', () => {
  it('devolve o resultado da execução do direito quando o token é válido', async () => {
    verifyDataSubjectRequest.mockResolvedValue({ status: 'COMPLETED' });
    const res = await request(buildApp())
      .post('/api/public/data-subject-requests/verify')
      .send({ protocol: 'DSR-ABCD-1234-EF56', token: 'token-valido-de-teste' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, status: 'COMPLETED' });
  });

  it('rejeita token inválido/expirado com erro genérico', async () => {
    verifyDataSubjectRequest.mockRejectedValue(new DsrInvalidTokenError());
    const res = await request(buildApp())
      .post('/api/public/data-subject-requests/verify')
      .send({ protocol: 'DSR-ABCD-1234-EF56', token: 'token-errado' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'invalid_or_expired_token' });
  });
});

describe('dsrRequest.routes — GET /status/:statusToken', () => {
  it('devolve só metadados do pedido (sem PII, sem e-mail, sem contactId)', async () => {
    getDataSubjectRequestStatus.mockResolvedValue({
      protocol: 'DSR-ABCD-1234-EF56',
      rightType: 'ERASURE',
      status: 'COMPLETED',
      createdAt: new Date('2026-11-17T00:00:00Z'),
      verifiedAt: new Date('2026-11-17T01:00:00Z'),
    });
    const res = await request(buildApp()).get(
      '/api/public/data-subject-requests/status/token-opaco',
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      protocol: 'DSR-ABCD-1234-EF56',
      rightType: 'ERASURE',
      status: 'COMPLETED',
      createdAt: '2026-11-17T00:00:00.000Z',
      verifiedAt: '2026-11-17T01:00:00.000Z',
    });
    expect(JSON.stringify(res.body)).not.toContain('@');
  });

  it('token de status inexistente → 400 genérico', async () => {
    getDataSubjectRequestStatus.mockRejectedValue(new DsrInvalidTokenError());
    const res = await request(buildApp()).get(
      '/api/public/data-subject-requests/status/token-inexistente',
    );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'invalid_or_expired_token' });
  });
});

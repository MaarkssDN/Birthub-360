/**
 * Testes do middleware idempotencyKey (MISSÃO POS4-22-IDEM — contrato de deduplicação
 * para o outbox mobile do Agente 85).
 *
 * Cobre o contrato:
 * - mesma key + mesmo payload → efeito único (handler executa 1x) e replay da resposta
 *   original com header X-Idempotent-Replay;
 * - mesma key + payload diferente → 409 IDEMPOTENCY_KEY_CONFLICT;
 * - mesma key em organizations diferentes → não interfere (namespacing multi-tenant);
 * - ausência de key → passthrough (backward compat);
 * - resposta de erro (5xx) não consome a key — retry com mesmo key/payload reexecuta.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../authenticateToken.js';
import { __resetIdempotencyStoreForTests, idempotencyKeyMiddleware } from '../idempotencyKey.js';

function buildApp(organizationId = 'org-A') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as AuthRequest).user = {
      id: 'user-1',
      email: 'vendedor@birthhub.test',
      role: 'SDR',
      organizationId,
    };
    next();
  });
  app.use(idempotencyKeyMiddleware);

  const counter = { calls: 0 };
  app.post('/api/leads', (req, res) => {
    counter.calls += 1;
    if ((req.body as { fail?: boolean }).fail) {
      res.status(500).json({ success: false, error: 'boom' });
      return;
    }
    res
      .status(201)
      .json({ success: true, data: { id: `lead-${counter.calls}`, n: counter.calls } });
  });
  return { app, counter };
}

function appForOrg(organizationId: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as AuthRequest).user = {
      id: 'user-1',
      email: 'vendedor@birthhub.test',
      role: 'SDR',
      organizationId,
    };
    next();
  });
  app.use(idempotencyKeyMiddleware);
  app.post('/api/leads', (_req, res) => {
    res.status(201).json({ success: true, data: { org: organizationId } });
  });
  return app;
}

describe('idempotencyKeyMiddleware', () => {
  beforeEach(() => {
    __resetIdempotencyStoreForTests();
    vi.restoreAllMocks();
  });

  it('mesma key + mesmo payload → handler executa 1x e replay retorna resposta original', async () => {
    const { app, counter } = buildApp();
    const payload = { name: 'Lead Offline', phone: '11999990000' };

    const first = await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'key-uuid-1')
      .send(payload);
    expect(first.status).toBe(201);
    expect(first.body.data.id).toBe('lead-1');
    expect(first.headers['x-idempotent-replay']).toBeUndefined();

    const second = await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'key-uuid-1')
      .send(payload);
    expect(second.status).toBe(201);
    expect(second.headers['x-idempotent-replay']).toBe('true');
    expect(second.body).toEqual(first.body); // replay idêntico, sem novo efeito
    expect(counter.calls).toBe(1);
  });

  it('key é namespaced por organização: mesma key em orgs diferentes não colide', async () => {
    const appA = appForOrg('org-A');
    const appB = appForOrg('org-B');
    const payload = { name: 'Lead', phone: '1' };

    const a1 = await request(appA)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'shared-key')
      .send(payload);
    const b1 = await request(appB)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'shared-key')
      .send(payload);
    // Payloads "diferentes" por org? Não — mesmo payload, mas orgs distintas: ambos executam.
    expect(a1.status).toBe(201);
    expect(b1.status).toBe(201);
    expect(b1.headers['x-idempotent-replay']).toBeUndefined();

    // E org B reenviando a mesma key+payload faz replay do SEU registro, não o de A.
    const b2 = await request(appB)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'shared-key')
      .send(payload);
    expect(b2.headers['x-idempotent-replay']).toBe('true');
    expect(b2.body.data.org).toBe('org-B');
  });

  it('mesma key + payload diferente → 409 IDEMPOTENCY_KEY_CONFLICT', async () => {
    const { app, counter } = buildApp();

    await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'key-conflict')
      .send({ name: 'Lead A' });

    const conflict = await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'key-conflict')
      .send({ name: 'Lead B diferente' });

    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('IDEMPOTENCY_KEY_CONFLICT');
    expect(counter.calls).toBe(1);
  });

  it('sem header X-Idempotency-Key → passthrough, cada request executa (backward compat)', async () => {
    const { app, counter } = buildApp();
    const payload = { name: 'Lead' };

    await request(app).post('/api/leads').send(payload);
    await request(app).post('/api/leads').send(payload);

    expect(counter.calls).toBe(2);
  });

  it('resposta 5xx não consome a key — retry com mesmo key/payload reexecuta', async () => {
    const { app, counter } = buildApp();

    const fail = await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'key-retry')
      .send({ fail: true });
    expect(fail.status).toBe(500);

    const ok = await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'key-retry')
      .send({ name: 'agora ok' });
    // Payload diferente + key não consumida por falha → executa normalmente.
    expect(ok.status).toBe(201);
    expect(ok.headers['x-idempotent-replay']).toBeUndefined();
    expect(counter.calls).toBe(2);
  });

  it('key acima de 255 chars → 400 INVALID_IDEMPOTENCY_KEY', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post('/api/leads')
      .set('X-Idempotency-Key', 'x'.repeat(256))
      .send({ name: 'Lead' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('métodos não-mutantes ignoram o header', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as AuthRequest).user = {
        id: 'u',
        email: 'e',
        role: 'SDR',
        organizationId: 'org-A',
      };
      next();
    });
    app.use(idempotencyKeyMiddleware);
    const handler = vi.fn((_req, res) => res.json({ ok: true }));
    app.get('/api/leads', handler);

    await request(app).get('/api/leads').set('X-Idempotency-Key', 'k').expect(200);
    await request(app).get('/api/leads').set('X-Idempotency-Key', 'k').expect(200);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

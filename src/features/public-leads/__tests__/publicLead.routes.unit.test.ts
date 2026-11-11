import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capturePublicLead = vi.fn();

vi.mock('../publicLead.service.js', async () => {
  const actual = await vi.importActual<typeof import('../publicLead.service.js')>(
    '../publicLead.service.js',
  );
  return {
    ...actual,
    capturePublicLead: (...args: unknown[]) => capturePublicLead(...args),
  };
});

vi.mock('../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { LANDING_DEMO_CONSENT_VERSION } from '../publicLead.constants.js';
import { publicLeadRoutes } from '../publicLead.routes.js';
import { PublicLeadUnavailableError } from '../publicLead.service.js';

const valid = {
  nome: 'Mariana Albuquerque',
  email: 'voce@suaempresa.com.br',
  whatsapp: '11999999999',
  equipe: '6 a 15',
  consent: true,
  consentTextVersion: LANDING_DEMO_CONSENT_VERSION,
};

function buildApp(max = 100) {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/public/leads',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, error: 'rate_limited' },
    }),
    publicLeadRoutes,
  );
  return app;
}

describe('POST /api/public/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturePublicLead.mockResolvedValue('created');
  });

  it('retorna 202 genérico em payload válido, sem expor o lead criado', async () => {
    const res = await request(buildApp()).post('/api/public/leads').send(valid);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(res.body).not.toHaveProperty('id');
    expect(res.body).not.toHaveProperty('leadId');
    expect(capturePublicLead).toHaveBeenCalledOnce();
  });

  it('retorna o mesmo 202 para reenvio (idempotência, sem enumeração)', async () => {
    capturePublicLead.mockResolvedValue('duplicate');
    const res = await request(buildApp()).post('/api/public/leads').send(valid);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
  });

  it('retorna 202 e não persiste quando o honeypot está preenchido', async () => {
    const res = await request(buildApp())
      .post('/api/public/leads')
      .send({ ...valid, website: 'http://bot.test' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(capturePublicLead).not.toHaveBeenCalled();
  });

  it('retorna 400 com fields claros para e-mail inválido e sem consentimento', async () => {
    const emailRes = await request(buildApp())
      .post('/api/public/leads')
      .send({ ...valid, email: 'invalido' });
    expect(emailRes.status).toBe(400);
    expect(emailRes.body).toEqual({
      ok: false,
      error: 'invalid_payload',
      fields: { email: 'invalid' },
    });

    const consentRes = await request(buildApp())
      .post('/api/public/leads')
      .send({ ...valid, consent: false });
    expect(consentRes.status).toBe(400);
    expect(consentRes.body.error).toBe('invalid_payload');
    expect(consentRes.body.fields.consent).toBe('required');
    expect(capturePublicLead).not.toHaveBeenCalled();
  });

  it('retorna 503 genérico quando o tenant da landing não está configurado', async () => {
    capturePublicLead.mockRejectedValue(new PublicLeadUnavailableError());
    const res = await request(buildApp()).post('/api/public/leads').send(valid);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, error: 'unavailable' });
  });

  it('dispara 429 após exceder o rate limit por IP', async () => {
    const app = buildApp(2);
    const first = await request(app).post('/api/public/leads').send(valid);
    const second = await request(app).post('/api/public/leads').send(valid);
    const third = await request(app).post('/api/public/leads').send(valid);
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ ok: false, error: 'rate_limited' });
  });
});

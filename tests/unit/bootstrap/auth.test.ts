import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../../src/lib/auth.js', () => ({
  auth: async () => new Response('auth-handler', { status: 200 }),
}));

import { mountAuthHandler } from '../../../src/bootstrap/auth.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  mountAuthHandler(app);
  return app;
}

const ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
] as const;

describe('bootstrap/auth — SSO helpers', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('GET /api/auth/sso-providers reporta provedores configurados', async () => {
    process.env.GOOGLE_CLIENT_ID = 'gid';
    process.env.GOOGLE_CLIENT_SECRET = 'gsecret';
    const res = await request(buildApp()).get('/api/auth/sso-providers');
    expect(res.status).toBe(200);
    expect(res.body.providers.google.configured).toBe(true);
    expect(res.body.providers.microsoft.configured).toBe(false);
  });

  it('POST /api/auth/sso-discover rejeita entrada vazia', async () => {
    const res = await request(buildApp()).post('/api/auth/sso-discover').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/sso-discover rejeita domínio inválido', async () => {
    const res = await request(buildApp()).post('/api/auth/sso-discover').send({ domain: 'x' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/sso-discover retorna 503 quando provedor não configurado', async () => {
    const res = await request(buildApp())
      .post('/api/auth/sso-discover')
      .send({ email: 'user@empresa.com.br' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('SSO_NOT_CONFIGURED');
    expect(res.body.provider).toBe('google');
  });

  it('POST /api/auth/sso-discover retorna provider configurado para domínio Microsoft', async () => {
    process.env.MICROSOFT_CLIENT_ID = 'mid';
    process.env.MICROSOFT_CLIENT_SECRET = 'msecret';
    const res = await request(buildApp())
      .post('/api/auth/sso-discover')
      .send({ domain: 'contoso.onmicrosoft.com' });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('microsoft');
    expect(res.body.providerName).toBe('Microsoft Entra ID');
    expect(res.body.configured).toBe(true);
  });

  it('POST /api/auth/sso-discover retorna provider google para domínio comum configurado', async () => {
    process.env.GOOGLE_CLIENT_ID = 'gid';
    process.env.GOOGLE_CLIENT_SECRET = 'gsecret';
    const res = await request(buildApp())
      .post('/api/auth/sso-discover')
      .send({ email: 'User@Empresa.COM.BR' });
    expect(res.status).toBe(200);
    expect(res.body.domain).toBe('empresa.com.br');
    expect(res.body.provider).toBe('google');
  });

  it('rotas /api/auth/* delegam ao handler do Better Auth', async () => {
    const res = await request(buildApp()).get('/api/auth/get-session');
    expect(res.status).toBe(200);
    expect(res.text).toBe('auth-handler');
  });
});

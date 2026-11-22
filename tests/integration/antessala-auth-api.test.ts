import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { mountAuthHandler } from '../../src/bootstrap/auth.js';

describe('Antessala — Revenue Command Center: Endpoints de Autenticação e SSO', () => {
  const app = express();
  app.use(express.json());
  mountAuthHandler(app);

  describe('GET /api/auth/sso-providers', () => {
    it('deve listar provedores SSO corporativos e seu status real de configuração', async () => {
      const res = await request(app).get('/api/auth/sso-providers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.providers).toBeDefined();
      expect(res.body.providers.google).toBeDefined();
      expect(res.body.providers.google.name).toBe('Google Workspace');
      expect(typeof res.body.providers.google.configured).toBe('boolean');
      expect(res.body.providers.microsoft).toBeDefined();
      expect(res.body.providers.microsoft.name).toBe('Microsoft Entra ID');
      expect(typeof res.body.providers.microsoft.configured).toBe('boolean');
    });
  });

  describe('POST /api/auth/sso-discover', () => {
    it('deve rejeitar requisição sem domínio corporativo', async () => {
      const res = await request(app)
        .post('/api/auth/sso-discover')
        .send({ domain: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Informe um domínio corporativo válido');
    });

    it('deve rejeitar formato de domínio inválido', async () => {
      const res = await request(app)
        .post('/api/auth/sso-discover')
        .send({ domain: 'invalid_domain' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Domínio corporativo inválido');
    });

    it('deve retornar 503 transparente quando credenciais do provedor não estiverem ativas no ambiente', async () => {
      // Quando GOOGLE_CLIENT_ID e MICROSOFT_CLIENT_ID não estiverem no ambiente local
      const res = await request(app)
        .post('/api/auth/sso-discover')
        .send({ domain: 'empresa.com.br' });

      // Se não configurado, deve retornar 503 com código explícito SSO_NOT_CONFIGURED (sem farsa)
      // Se configurado, retorna 200
      if (res.status === 503) {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe('SSO_NOT_CONFIGURED');
        expect(res.body.error).toContain('ainda não foi ativado com credenciais empresariais');
      } else {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.configured).toBe(true);
      }
    });

    it('deve identificar Microsoft Entra ID para domínios federados Microsoft/Office 365', async () => {
      const res = await request(app)
        .post('/api/auth/sso-discover')
        .send({ domain: 'corporativo.onmicrosoft.com' });

      if (res.status === 503) {
        expect(res.body.provider).toBe('microsoft');
        expect(res.body.providerName).toBe('Microsoft Entra ID');
      } else {
        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('microsoft');
      }
    });
  });

  describe('Anti-Enumeração de Usuários no Reset de Senha', () => {
    it('deve responder 200 neutro para e-mail não existente sem vazar status', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'inexistente-12345@empresa.com.br' });

      // Better Auth responde 200 com mensagem neutra
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
    });
  });
});

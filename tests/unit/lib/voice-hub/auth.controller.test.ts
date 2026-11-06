import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from '@/lib/voice-hub/controllers/auth.controller';

vi.mock('@/lib/voice-hub/services/authService', () => {
  class MockAuthError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
      this.name = 'AuthError';
    }
  }

  return {
    register: vi.fn(),
    login: vi.fn(),
    refreshSession: vi.fn(),
    AuthError: MockAuthError,
  };
});

vi.mock('@/lib/voice-hub/services/audit', () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock('@/lib/voice-hub/repositories/metricRepository', () => ({
  createMetric: vi.fn(),
}));

vi.mock('@/lib/voice-hub/lib/cookies', () => ({
  ACCESS_TOKEN_MAX_AGE_MS: 900000,
  REFRESH_TOKEN_MAX_AGE_MS: 604800000,
  setCookie: vi.fn(),
  setLoggedInCookie: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import * as authService from '@/lib/voice-hub/services/authService';
import * as cookies from '@/lib/voice-hub/lib/cookies';
import * as audit from '@/lib/voice-hub/services/audit';
import * as metrics from '@/lib/voice-hub/repositories/metricRepository';

describe('auth.controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonFn: any;
  let statusFn: any;
  let clearCookieFn: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonFn = vi.fn().mockReturnThis();
    statusFn = vi.fn().mockReturnValue({ json: jsonFn });
    clearCookieFn = vi.fn().mockReturnThis();

    mockReq = {
      body: {},
      cookies: {},
      headers: {},
    };

    mockRes = {
      json: jsonFn,
      status: statusFn,
      clearCookie: clearCookieFn,
    };
  });

  describe('registerHandler', () => {
    it('deve retornar 400 se schema de registro for inválido', async () => {
      mockReq.body = { email: 'invalido' };

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Formato de email inválido' });
    });

    it('deve registrar com sucesso e configurar cookies', async () => {
      mockReq.body = {
        email: 'user@empresa.com.br',
        password: 'Password123!',
        companyName: 'Empresa SA',
      };

      const resultMock = {
        organizationId: 'org-123',
        user: { id: 'u1', email: 'user@empresa.com.br' },
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      vi.mocked(authService.register).mockResolvedValue(resultMock as any);

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(authService.register).toHaveBeenCalledWith(
        'user@empresa.com.br',
        'Password123!',
        'Empresa SA',
      );
      expect(audit.writeAuditLog).toHaveBeenCalled();
      expect(cookies.setCookie).toHaveBeenCalledTimes(2);
      expect(cookies.setLoggedInCookie).toHaveBeenCalledWith(mockRes);
      expect(jsonFn).toHaveBeenCalledWith(resultMock);
    });

    it('deve repassar o status correto em caso de AuthError', async () => {
      mockReq.body = {
        email: 'user@empresa.com.br',
        password: 'Password123!',
        companyName: 'Empresa SA',
      };

      const authErr = new authService.AuthError('E-mail já cadastrado', 409);
      vi.mocked(authService.register).mockRejectedValue(authErr);

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(409);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'E-mail já cadastrado' });
    });

    it('deve retornar 500 em erro genérico', async () => {
      mockReq.body = {
        email: 'user@empresa.com.br',
        password: 'Password123!',
        companyName: 'Empresa SA',
      };

      vi.mocked(authService.register).mockRejectedValue(new Error('Falha no banco'));

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Erro interno no servidor' });
    });
  });

  describe('loginHandler', () => {
    it('deve retornar 400 se schema de login for inválido', async () => {
      mockReq.body = { email: 'not-an-email' };

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Formato de email inválido' });
    });

    it('deve logar com sucesso e configurar cookies de sessão', async () => {
      mockReq.body = {
        email: 'admin@empresa.com.br',
        password: 'SecurePassword123!',
      };

      const loginResult = {
        organizationId: 'org-123',
        user: { id: 'u2', email: 'admin@empresa.com.br' },
        token: 'access-token-456',
        refreshToken: 'refresh-token-456',
      };

      vi.mocked(authService.login).mockResolvedValue(loginResult as any);

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(authService.login).toHaveBeenCalledWith('admin@empresa.com.br', 'SecurePassword123!');
      expect(audit.writeAuditLog).toHaveBeenCalled();
      expect(metrics.createMetric).toHaveBeenCalled();
      expect(cookies.setCookie).toHaveBeenCalledTimes(2);
      expect(cookies.setLoggedInCookie).toHaveBeenCalledWith(mockRes);
      expect(jsonFn).toHaveBeenCalledWith(loginResult);
    });

    it('deve tratar AuthError de credenciais inválidas', async () => {
      mockReq.body = {
        email: 'admin@empresa.com.br',
        password: 'WrongPassword!',
      };

      const authErr = new authService.AuthError('Credenciais inválidas', 401);
      vi.mocked(authService.login).mockRejectedValue(authErr);

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Credenciais inválidas' });
    });

    it('deve retornar 500 em erro genérico no login', async () => {
      mockReq.body = {
        email: 'admin@empresa.com.br',
        password: 'Password123!',
      };

      vi.mocked(authService.login).mockRejectedValue(new Error('Network failure'));

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Erro interno no servidor' });
    });
  });

  describe('refreshHandler', () => {
    it('deve retornar 401 se nenhum refresh token for fornecido', async () => {
      mockReq.body = {};
      mockReq.cookies = {};

      await refreshHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Refresh token não fornecido.' });
    });

    it('deve renovar a sessão com token extraído de req.body', async () => {
      mockReq.body = { token: 'valid-refresh-token' };

      const refreshMock = {
        token: 'new-access-token',
        user: { id: 'u3' },
      };

      vi.mocked(authService.refreshSession).mockResolvedValue(refreshMock as any);

      await refreshHandler(mockReq as Request, mockRes as Response);

      expect(authService.refreshSession).toHaveBeenCalledWith('valid-refresh-token');
      expect(cookies.setCookie).toHaveBeenCalledWith(
        mockRes,
        'access_token',
        'new-access-token',
        expect.any(Number),
      );
      expect(cookies.setLoggedInCookie).toHaveBeenCalledWith(mockRes);
      expect(jsonFn).toHaveBeenCalledWith(refreshMock);
    });

    it('deve limpar cookies e retornar 401 se refreshSession retornar nulo', async () => {
      mockReq.body = { token: 'invalid-token' };

      vi.mocked(authService.refreshSession).mockResolvedValue(null as any);

      await refreshHandler(mockReq as Request, mockRes as Response);

      expect(clearCookieFn).toHaveBeenCalledWith('access_token');
      expect(clearCookieFn).toHaveBeenCalledWith('refresh_token');
      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Refresh token inválido.' });
    });

    it('deve retornar 500 em caso de falha na renovação da sessão', async () => {
      mockReq.body = { token: 'bad-token' };

      vi.mocked(authService.refreshSession).mockRejectedValue(new Error('Invalid token'));

      await refreshHandler(mockReq as Request, mockRes as Response);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Erro interno no servidor.' });
    });
  });

  describe('logoutHandler', () => {
    it('deve limpar todos os cookies de sessão e responder com sucesso', async () => {
      await logoutHandler(mockReq as Request, mockRes as Response);

      expect(clearCookieFn).toHaveBeenCalledWith('access_token');
      expect(clearCookieFn).toHaveBeenCalledWith('refresh_token');
      expect(clearCookieFn).toHaveBeenCalledWith('logged_in');
      expect(jsonFn).toHaveBeenCalledWith({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { AppError, errorHandler } from '../../../../src/shared/middlewares/errorHandler.js';

describe('Agente 20 (Ciro) & Agente 22 (Hugo) - RFC 7807 Problem Details & Stack Trace Suppression', () => {
  it('deve formatar erro no padrão RFC 7807 contendo type, title, status, detail, instance', () => {
    const err = new AppError('Acesso não autorizado', 403);
    const req = {
      originalUrl: '/api/v1/crm/deals/123',
      header: vi.fn().mockReturnValue('application/problem+json'),
      headers: { 'x-request-id': 'req-test-abc' },
    } as any;

    let responseStatus = 0;
    let responseBody: any = null;
    let responseHeaders: Record<string, string> = {};

    const res = {
      status: (code: number) => {
        responseStatus = code;
        return res;
      },
      json: (body: any) => {
        responseBody = body;
        return res;
      },
      getHeader: vi.fn(),
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
      },
    } as any;

    errorHandler(err, req, res, () => {});

    expect(responseStatus).toBe(403);
    expect(responseBody.success).toBe(false);
    expect(responseBody.code).toBe('FORBIDDEN');
    expect(responseBody.status).toBe(403);
    expect(responseBody.type).toBe('https://api.birthhub360.com/errors/forbidden');
    expect(responseBody.title).toBe('Acesso não autorizado');
    expect(responseBody.detail).toBe('Acesso não autorizado');
    expect(responseBody.instance).toBe('/api/v1/crm/deals/123');
    expect(responseBody.requestId).toBe('req-test-abc');
    expect(responseBody.stack).toBeUndefined();
    expect(responseHeaders['Content-Type']).toBe('application/problem+json; charset=utf-8');
  });

  it('deve mascarar erro 500 e nunca expor stack trace em ambiente restrito (staging/production)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'staging';

    try {
      const err = new Error('Database password leak: postgres://admin:secret@db.internal:5432');
      (err as any).statusCode = 500;

      const req = {
        originalUrl: '/api/v1/leads',
        header: vi.fn().mockReturnValue(undefined),
        headers: {},
      } as any;

      let responseStatus = 0;
      let responseBody: any = null;

      const res = {
        status: (code: number) => {
          responseStatus = code;
          return res;
        },
        json: (body: any) => {
          responseBody = body;
          return res;
        },
        getHeader: vi.fn(),
        setHeader: vi.fn(),
      } as any;

      errorHandler(err, req, res, () => {});

      expect(responseStatus).toBe(500);
      expect(responseBody.error).toBe('Erro Interno do Servidor');
      expect(responseBody.title).toBe('Erro Interno do Servidor');
      expect(responseBody.detail).toBe('Erro Interno do Servidor');
      expect(responseBody.stack).toBeUndefined();
      expect(JSON.stringify(responseBody)).not.toContain('postgres://');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

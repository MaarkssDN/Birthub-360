import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// NODE_ENV=production é resolvido em env.ts no import; mockar o módulo evita
// re-parsear todo o schema de env e as travas de boot (process.exit) que só
// fazem sentido fora de teste. errorHandler só lê env.NODE_ENV.
vi.mock('@/config/env', () => ({
  env: { NODE_ENV: 'production' },
}));

import { errorHandler, AppError } from '@/shared/middlewares/errorHandler';

function buildReqRes() {
  const headers = new Map<string, string>();
  headers.set('x-request-id', 'req-prod-1');
  const req = {
    headers: { 'x-request-id': 'req-prod-1' },
    observability: { requestId: 'req-prod-1' },
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    getHeader: vi.fn((name: string) => headers.get(name.toLowerCase())),
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name.toLowerCase(), value);
    }),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

function bodyOf(res: Response) {
  return (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
}

describe('errorHandler — mascaramento de produção (MEL-40)', () => {
  it('AppError 503 em produção -> mensagem genérica e details suprimidos', () => {
    const { req, res, next } = buildReqRes();
    const err = new AppError('faultstring do Omie: CNPJ inválido', 503, {
      upstream: 'omie',
    });

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = bodyOf(res);
    expect(body.error).toBe('Erro Interno do Servidor');
    expect(body.details).toBeUndefined();
    expect(body.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('AppError 502 em produção -> mensagem genérica (toda 5xx, não só 500)', () => {
    const { req, res, next } = buildReqRes();
    errorHandler(new AppError('Bad Gateway: upstream vazou token', 502), req, res, next);

    const body = bodyOf(res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(body.error).toBe('Erro Interno do Servidor');
    expect(body.code).toBe('BAD_GATEWAY');
  });

  it('AppError 4xx em produção -> mensagem do pedido preservada', () => {
    const { req, res, next } = buildReqRes();
    errorHandler(new AppError('Nome é obrigatório', 400), req, res, next);

    const body = bodyOf(res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(body.error).toBe('Nome é obrigatório');
  });

  it('erro genérico com statusCode 503 em produção -> mensagem mascarada (regressão A1)', () => {
    const { req, res, next } = buildReqRes();
    const err = new Error('connect ECONNREFUSED db-interno:5432') as Error & {
      statusCode?: number;
    };
    err.statusCode = 503;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(bodyOf(res).error).toBe('Erro Interno do Servidor');
  });

  it('erro genérico com statusCode 404 em produção -> mensagem preservada', () => {
    const { req, res, next } = buildReqRes();
    const err = new Error('recurso específico não existe') as Error & {
      statusCode?: number;
    };
    err.statusCode = 404;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(bodyOf(res).error).toBe('recurso específico não existe');
  });

  // undefined não entra: o default do construtor AppError já resolve para 400.
  it.each([200, 700, 'abc'])(
    'statusCode inválido (%s) -> normalizado para 500 sem RangeError',
    (statusCode) => {
      const { req, res, next } = buildReqRes();
      const err = new AppError('msg', statusCode as number);

      expect(() => errorHandler(err, req, res, next)).not.toThrow();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(bodyOf(res).error).toBe('Erro Interno do Servidor');
    },
  );
});

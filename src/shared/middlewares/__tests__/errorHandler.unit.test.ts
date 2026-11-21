import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError, z } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_ERROR_CODES,
  ApiEnvelopeSchema,
  ApiErrorEnvelopeSchema,
  ApiSuccessEnvelopeSchema,
} from '../../contracts/apiEnvelope.contract.js';
import { AppError, errorHandler, sendApiError } from '../errorHandler.js';

// `env` é mockado para controlar NODE_ENV nos testes de mascaramento de erro 500 — o
// módulo real valida dezenas de variáveis no import e não é necessário para este middleware.
const envState = vi.hoisted(() => ({ NODE_ENV: 'test' as 'test' | 'production' | 'development' }));
vi.mock('../../../config/env.js', () => ({ env: envState }));

function makeRes() {
  const headers = new Map<string, string>();
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn((k: string, v: string) => headers.set(k, v)),
    getHeader: vi.fn((k: string) => headers.get(k)),
    headers,
  } as unknown as Response & { headers: Map<string, string> };
  return res;
}

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function emittedBody(res: ReturnType<typeof makeRes>): Record<string, unknown> {
  expect(res.json).toHaveBeenCalledTimes(1);
  return res.json.mock.calls[0][0] as Record<string, unknown>;
}

describe('errorHandler — envelope de erro padronizado (MEL-40)', () => {
  beforeEach(() => {
    envState.NODE_ENV = 'test';
    vi.clearAllMocks();
  });

  it('erro genérico -> 500 INTERNAL_ERROR, retryable=true, mensagem não mascarada fora de produção', () => {
    const req = makeReq({ 'x-request-id': 'req-123' });
    const res = makeRes();

    errorHandler(new Error('falha inesperada'), req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const body = emittedBody(res);
    expect(body).toMatchObject({
      success: false,
      error: 'falha inesperada',
      code: 'INTERNAL_ERROR',
      retryable: true,
      requestId: 'req-123',
    });
    // O corpo emitido deve validar contra o schema canônico do contrato.
    expect(() => ApiErrorEnvelopeSchema.parse(body)).not.toThrow();
    expect(() => ApiEnvelopeSchema.parse(body)).not.toThrow();
  });

  it('mascara a mensagem de erro 500 quando NODE_ENV=production', () => {
    envState.NODE_ENV = 'production';
    const req = makeReq();
    const res = makeRes();

    errorHandler(new Error('stack interno vazou'), req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(emittedBody(res)).toMatchObject({ error: 'Erro Interno do Servidor' });
  });

  it('não mascara erro 4xx em produção (a mensagem é do contrato, não do stack)', () => {
    envState.NODE_ENV = 'production';
    const req = makeReq();
    const res = makeRes();

    errorHandler(new AppError('Lead não encontrado', 404), req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(emittedBody(res)).toMatchObject({ error: 'Lead não encontrado', code: 'NOT_FOUND' });
  });

  it('ZodError -> 400 VALIDATION_ERROR com details = issues', () => {
    const schema = z.object({ nome: z.string() });
    let zodError: ZodError | undefined;
    try {
      schema.parse({ nome: 123 });
    } catch (err) {
      zodError = err as ZodError;
    }
    const req = makeReq();
    const res = makeRes();

    errorHandler(zodError!, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    const body = emittedBody(res);
    expect(body).toMatchObject({ success: false, code: 'VALIDATION_ERROR', retryable: false });
    expect(Array.isArray(body.details)).toBe(true);
    expect((body.details as unknown[]).length).toBeGreaterThan(0);
    expect(() => ApiErrorEnvelopeSchema.parse(body)).not.toThrow();
  });

  it('AppError -> repassa statusCode/message/details e deriva code do status', () => {
    const req = makeReq();
    const res = makeRes();

    errorHandler(new AppError('Conflito de negócio', 409, { leadId: 'l1' }), req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    const body = emittedBody(res);
    expect(body).toMatchObject({
      success: false,
      error: 'Conflito de negócio',
      code: 'CONFLICT',
      retryable: false,
      details: { leadId: 'l1' },
    });
  });

  it('Prisma P2002 -> 409 CONFLICT; P2025 -> 404 NOT_FOUND', () => {
    const req = makeReq();

    const res2002 = makeRes();
    errorHandler(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
      req,
      res2002,
      vi.fn(),
    );
    expect(res2002.status).toHaveBeenCalledWith(409);
    expect(emittedBody(res2002)).toMatchObject({ code: 'CONFLICT', success: false });

    const res2025 = makeRes();
    errorHandler(
      new Prisma.PrismaClientKnownRequestError('missing', {
        code: 'P2025',
        clientVersion: 'test',
      }),
      req,
      res2025,
      vi.fn(),
    );
    expect(res2025.status).toHaveBeenCalledWith(404);
    expect(emittedBody(res2025)).toMatchObject({ code: 'NOT_FOUND', success: false });
  });

  it('regra de retryable: 429 retentável, 400/404 não retentáveis', () => {
    const req = makeReq();

    const res429 = makeRes();
    errorHandler(new AppError('muitas requisições', 429), req, res429, vi.fn());
    expect(emittedBody(res429)).toMatchObject({ code: 'RATE_LIMITED', retryable: true });

    const res404 = makeRes();
    errorHandler(new AppError('não achou', 404), req, res404, vi.fn());
    expect(emittedBody(res404)).toMatchObject({ code: 'NOT_FOUND', retryable: false });
  });

  it('requestId vem do header x-request-id quando observability não rodou', () => {
    const req = makeReq({ 'x-request-id': 'corr-abc' });
    const res = makeRes();

    errorHandler(new Error('x'), req, res, vi.fn());

    expect(emittedBody(res)).toMatchObject({ requestId: 'corr-abc' });
  });
});

describe('sendApiError — helper de rota no mesmo envelope (MEL-40)', () => {
  beforeEach(() => {
    envState.NODE_ENV = 'test';
    vi.clearAllMocks();
  });

  it('emite o mesmo envelope do middleware para erro de domínio sem exceção', () => {
    const req = makeReq({ 'x-request-id': 'req-9' });
    const res = makeRes();

    sendApiError(req, res, 422, 'Dados inconsistentes', { details: { field: 'cnpj' } });

    expect(res.status).toHaveBeenCalledWith(422);
    const body = emittedBody(res);
    expect(body).toMatchObject({
      success: false,
      error: 'Dados inconsistentes',
      code: 'UNPROCESSABLE_ENTITY',
      retryable: false,
      requestId: 'req-9',
      details: { field: 'cnpj' },
    });
    expect(() => ApiErrorEnvelopeSchema.parse(body)).not.toThrow();
  });

  it('permite sobrescrever o code derivado do status', () => {
    const req = makeReq();
    const res = makeRes();

    sendApiError(req, res, 400, 'inválido', { code: 'VALIDATION_ERROR' });

    expect(emittedBody(res)).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('apiEnvelope.contract — schemas canônicos', () => {
  it('API_ERROR_CODES cobre exatamente os códigos emitidos pelo errorHandler', () => {
    // Mesmo conjunto do enum `code` documentado em docs/openapi.yaml (schema ErrorResponse).
    expect(API_ERROR_CODES).toEqual([
      'VALIDATION_ERROR',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'METHOD_NOT_ALLOWED',
      'CONFLICT',
      'GONE',
      'UNSUPPORTED_MEDIA_TYPE',
      'UNPROCESSABLE_ENTITY',
      'RATE_LIMITED',
      'INTERNAL_ERROR',
      'BAD_GATEWAY',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'BAD_REQUEST',
    ]);
  });

  it('ApiSuccessEnvelopeSchema aceita o envelope { success:true, data }', () => {
    expect(
      ApiSuccessEnvelopeSchema.parse({ success: true, data: { id: 1 }, meta: { page: 1 } }),
    ).toMatchObject({ success: true });
  });

  it('ApiErrorEnvelopeSchema rejeita corpo sem success:false/error', () => {
    expect(() => ApiErrorEnvelopeSchema.parse({ success: true })).toThrow();
    expect(() => ApiErrorEnvelopeSchema.parse({ error: 'x' })).toThrow();
  });
});

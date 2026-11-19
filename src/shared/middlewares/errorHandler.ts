import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import type { ApiErrorCode } from '../contracts/apiEnvelope.contract.js';
import type { IObservabilityRequest } from './observability.js';

// Re-exporta os tipos canônicos do contrato de envelope (MEL-40, Onda 5) para não quebrar
// imports existentes de `errorHandler.js` — a fonte única de verdade agora é
// `src/shared/contracts/apiEnvelope.contract.ts`.
export type { ApiErrorCode };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
  /** Código estável de erro, para o consumidor decidir programaticamente sem parsear `error`. */
  code?: ApiErrorCode;
  /** Mesmo id de `x-request-id` (ver `observability.ts`) — nunca um segundo mecanismo de id. */
  requestId?: string;
  /** Regra: 5xx e timeouts (408/504) são retentáveis; 4xx de validação/autorização/conflito não são. */
  retryable?: boolean;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/**
 * `err.statusCode` vem de fontes heterogêneas: `AppError` (a convenção é inteiro 4xx/5xx, mas
 * nada impede um dev de passar valor inválido), middlewares de terceiros (`http-errors`,
 * `multer`, `body-parser`) e erros arbitrários. Um status fora de 400–599 faria `res.status()`
 * lançar `RangeError` DENTRO do próprio error handler — o que faz o Express cair no handler de
 * erro default e devolver uma página HTML de erro (em dev, com stack). Normalizar aqui mantém o
 * contrato JSON garantido para qualquer entrada.
 */
function sanitizeStatusCode(statusCode: unknown): number {
  return typeof statusCode === 'number' &&
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode < 600
    ? statusCode
    : 500;
}

/**
 * Regra de exposição de `error.message` ao cliente (checklist de contratos — nunca vazar
 * stack/PII): em produção, TODO erro 5xx recebe mensagem genérica, independente do tipo —
 * `AppError` com 502/503/504 também pode carregar detalhe de upstream no `message`
 * (ex.: `faultstring` do Omie, erro bruto do Slack/Stripe em integrações externas).
 * Em desenvolvimento/teste a mensagem real é preservada para
 * depuração. Erros 4xx mantêm a mensagem: são erros do pedido, escritos para o usuário final.
 */
function clientSafeMessage(err: Error, status: number): string {
  if (env.NODE_ENV === 'production' && status >= 500) {
    return 'Erro Interno do Servidor';
  }
  return err.message || 'Erro Interno do Servidor';
}

/** `details` pode carregar payload de upstream — suprimido junto com a mensagem mascarada. */
function clientSafeDetails(err: Error & { details?: unknown }, status: number): unknown {
  if (env.NODE_ENV === 'production' && status >= 500) return undefined;
  return err.details;
}

/** Mapeia status HTTP -> `code` estável. Ver o comentário de `ApiErrorCode` acima. */
function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 405:
      return 'METHOD_NOT_ALLOWED';
    case 409:
      return 'CONFLICT';
    case 410:
      return 'GONE';
    case 415:
      return 'UNSUPPORTED_MEDIA_TYPE';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'RATE_LIMITED';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 408:
    case 504:
      return 'TIMEOUT';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  }
}

/**
 * Regra de `retryable` (checklist de contratos do produto): 5xx é falha do servidor/upstream —
 * repetir a mesma requisição pode funcionar (transiente). 408/504 são timeout — também vale
 * repetir. 429 é limite de taxa — repetir vale, só que com backoff (o cliente decide o tempo).
 * Qualquer outro 4xx (validação, autenticação, autorização, conflito, não encontrado) é erro do
 * pedido em si: repetir sem mudar o request só reproduz o mesmo erro.
 */
function isRetryableStatus(status: number): boolean {
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

/** Reaproveita o `x-request-id` já gerado por `observabilityMiddleware` — nunca gera um segundo id. */
function resolveRequestId(req: Request, res: Response): string | undefined {
  const fromObservability = (req as IObservabilityRequest).observability?.requestId;
  if (typeof fromObservability === 'string' && fromObservability) return fromObservability;
  if (Array.isArray(fromObservability) && fromObservability[0]) return fromObservability[0];

  // Guards defensivos: testes unitários e callers fora do pipeline Express podem montar
  // req/res parciais sem `headers`/`getHeader` — o requestId é best-effort, nunca derruba a resposta.
  const headerValue =
    typeof res.getHeader === 'function' ? res.getHeader('x-request-id') : undefined;
  if (typeof headerValue === 'string' && headerValue) return headerValue;

  const rawReqHeader = req.headers?.['x-request-id'];
  if (typeof rawReqHeader === 'string' && rawReqHeader) return rawReqHeader;
  if (Array.isArray(rawReqHeader) && rawReqHeader[0]) return rawReqHeader[0];

  return undefined;
}

function sendError(
  req: Request,
  res: Response,
  status: number,
  error: string,
  options?: { code?: ApiErrorCode; details?: unknown },
): void {
  const code = options?.code ?? codeForStatus(status);
  const body: ApiResponse = {
    success: false,
    error,
    code,
    retryable: isRetryableStatus(status),
    requestId: resolveRequestId(req, res),
  };
  if (options?.details !== undefined) body.details = options.details;
  res.status(status).json(body);
}

/**
 * Helper público para rotas que precisam responder um erro de domínio sem lançar exceção
 * (MEL-40, Onda 5). Emite exatamente o mesmo envelope do middleware global — `success:false`,
 * `error`, `code` derivado do status (ou explícito via `options.code`), `retryable` e
 * `requestId` reaproveitado de `x-request-id` — em vez do `{ success:false, error }` parcial que
 * vários handlers legados ainda retornam inline. Rotas novas devem preferir este helper (ou
 * `throw new AppError(...)`, que cai no mesmo envelope via `errorHandler`); a migração dos
 * handlers inline existentes é gradual e por domínio (ver `docs/api/README.md`).
 */
export function sendApiError(
  req: Request,
  res: Response,
  status: number,
  error: string,
  options?: { code?: ApiErrorCode; details?: unknown },
): void {
  sendError(req, res, status, error, options);
}

export const errorHandler = (
  err: Error & { statusCode?: number; details?: unknown },
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // requestId incluído aqui de propósito (achado da auditoria de release-readiness,
  // error-resilience): a resposta HTTP abaixo já carrega este mesmo id via `resolveRequestId`,
  // mas a linha de log real (onde o erro e o stack de fato aparecem) não carregava — quebrando a
  // correlação "usuário relatou erro X" → "achar o log correspondente".
  logger.error(
    { err, status: err.statusCode, requestId: resolveRequestId(req, res) },
    'Global error handler',
  );

  if (err instanceof ZodError) {
    sendError(req, res, 400, 'Erro de Validação', {
      code: 'VALIDATION_ERROR',
      details: err.issues,
    });
    return;
  }

  if (err instanceof AppError) {
    const status = sanitizeStatusCode(err.statusCode);
    sendError(req, res, status, clientSafeMessage(err, status), {
      details: clientSafeDetails(err, status),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(req, res, 409, 'Conflito de Dados: Este registro já existe.', { code: 'CONFLICT' });
      return;
    }
    if (err.code === 'P2025') {
      sendError(req, res, 404, 'Registro não encontrado.', { code: 'NOT_FOUND' });
      return;
    }
  }

  const status = sanitizeStatusCode(err.statusCode);
  sendError(req, res, status, clientSafeMessage(err, status));
};

import { z } from 'zod';

/**
 * Contrato canônico dos envelopes de resposta da API (Agente 18 — MEL-40, Onda 5).
 *
 * Fonte única de verdade compartilhada por:
 * - `src/shared/middlewares/errorHandler.ts` — middleware global que emite o envelope de erro;
 * - `docs/openapi.yaml` — schema `ErrorResponse` espelha `ApiErrorEnvelopeSchema` (manter em
 *   sincronia; o gate `npm run verify:openapi-drift` cobre paths/métodos, não schemas de resposta);
 * - consumidores (frontend/mobile) que queiram validar a resposta em runtime.
 *
 * Envelope de sucesso (emitido pelas rotas, não por este middleware):
 *   `{ "success": true, "data": ..., "meta"?: ... }`
 * Envelope de erro (emitido por `errorHandler` e por helpers de rota que sigam o padrão):
 *   `{ "success": false, "error": "<mensagem>", "code": "<ApiErrorCode>", "retryable": <bool>,
 *      "requestId": "<x-request-id>", "details"?: ... }`
 *
 * `error` é a mensagem legível (string) — o `code` estável é o campo para decisão
 * programática. Campos são aditivos/opcionais por compatibilidade: rotas legadas podem omitir
 * `code`/`retryable`/`requestId`, e o frontend não pode depender deles em endpoints antigos.
 */

/**
 * Taxonomia estável de `code` de erro. Deriva do status HTTP e, quando o tipo de erro já lançado
 * no código permite mais precisão (ZodError, `AppError`, `Prisma.PrismaClientKnownRequestError`),
 * do próprio tipo. Propositalmente pequena: cobre os status HTTP que este backend já lança hoje
 * via `AppError`/rotas (400, 401, 403, 404, 405, 409, 410, 415, 422, 429, 500, 502, 503, 504) —
 * não é uma taxonomia inventada do zero, e novos códigos só devem ser adicionados quando um novo
 * status HTTP passar a ser lançado de verdade.
 */
export const API_ERROR_CODES = [
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
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Envelope de erro emitido pelo middleware global `errorHandler.ts`. */
export const ApiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  /** Mensagem de erro legível para o usuário/cliente. */
  error: z.string(),
  /** Reservado no envelope; não é populado hoje por `errorHandler.ts`. */
  message: z.string().optional(),
  /** Detalhe estruturado quando disponível (ex.: `issues` do ZodError). */
  details: z.unknown().optional(),
  /** Código estável — fonte de verdade para decisão programática do consumidor. */
  code: z.enum(API_ERROR_CODES).optional(),
  /** Mesmo id de `x-request-id` (ver `observability.ts`) — nunca um segundo mecanismo de id. */
  requestId: z.string().optional(),
  /**
   * Regra: 5xx e timeouts (408/504) são retentáveis; 429 é retentável com backoff; demais 4xx
   * (validação, autenticação, autorização, conflito, não encontrado) não são.
   */
  retryable: z.boolean().optional(),
});

export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;

/**
 * Envelope de sucesso emitido pelas rotas (`{ success: true, data, meta? }`). `data`/`meta` são
 * propositalmente `unknown`: o contrato por endpoint vive em `docs/openapi.yaml`, não aqui.
 */
export const ApiSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown().optional(),
  message: z.string().optional(),
  meta: z.unknown().optional(),
});

export type ApiSuccessEnvelope = z.infer<typeof ApiSuccessEnvelopeSchema>;

/** Envelope unificado (sucesso ou erro) — o que o consumidor recebe em qualquer resposta JSON. */
export const ApiEnvelopeSchema = z.union([ApiSuccessEnvelopeSchema, ApiErrorEnvelopeSchema]);
export type ApiEnvelope = z.infer<typeof ApiEnvelopeSchema>;

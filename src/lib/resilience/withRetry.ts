/**
 * Resiliência — retry genérico com backoff exponencial + full jitter (Agente 24 — Ivo).
 *
 * Complementa `src/lib/queue/outbox/backoff.ts` (dono: Agente 23) e
 * `src/lib/queue/deadLetter.ts` (dono: Agente 23): este helper cobre chamadas
 * NÃO-BullMQ — HTTP clients, integrações síncronas, scripts — onde o retry
 * precisa viver dentro do próprio processo. A matemática de backoff é
 * reutilizada via `computeBackoffMs` (full jitter), sem duplicação.
 *
 * Contrato:
 * - `fn` recebe o número da tentativa (1-based) e deve executar o efeito.
 * - Falha transitória: espera `computeBackoffMs(attempt, backoff, random)` e
 *   reexecuta até `maxAttempts` (total de tentativas, não de retries).
 * - Falha permanente: `shouldRetry` retorna false → propaga o erro na hora,
 *   sem aguardar backoff.
 * - Esgotadas as tentativas: chama `onExhausted` (hook de DLQ/alerta do caller)
 *   e propaga o último erro — nunca engole falha.
 * - `signal` abortado interrompe antes da próxima tentativa.
 */

import { type BackoffPolicy, computeBackoffMs, DEFAULT_BACKOFF } from '../queue/outbox/backoff.js';

export interface RetryOptions {
  /** Total de tentativas incluindo a primeira. Default: 3. */
  maxAttempts?: number;
  /** Política de backoff (base/max/jitter). Default: DEFAULT_BACKOFF do outbox. */
  backoff?: BackoffPolicy;
  /** Fonte de aleatoriedade injetável (testes determinísticos). */
  random?: () => number;
  /** Sleep injetável (testes com fake timers). Default: setTimeout real. */
  sleep?: (ms: number) => Promise<void>;
  /** Classificador de erro: false = falha permanente, propaga sem retry. Default: retenta tudo. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Hook executado uma vez quando as tentativas se esgotam (antes de propagar). */
  onExhausted?: (error: unknown, attemptsMade: number) => void | Promise<void>;
  /** AbortSignal opcional — interrompe antes de nova tentativa/espera. */
  signal?: AbortSignal;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abortError(): Error {
  const err = new Error('Retry abortado pelo caller (AbortSignal).');
  err.name = 'AbortError';
  return err;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    backoff = DEFAULT_BACKOFF,
    random = Math.random,
    sleep = defaultSleep,
    shouldRetry = () => true,
    onExhausted,
    signal,
  } = options;

  const attempts = Math.max(1, Math.floor(maxAttempts));
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal?.aborted) throw abortError();

    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt >= attempts;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        if (isLastAttempt && onExhausted) {
          await onExhausted(error, attempts);
        }
        throw error;
      }

      const delayMs = computeBackoffMs(attempt, backoff, random);
      await sleep(delayMs);
    }
  }

  // Inalcançável: o loop sempre retorna ou lança. Mantido para o narrowing do TS.
  throw lastError;
}

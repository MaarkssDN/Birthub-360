/**
 * Bitrix24 API Client with Circuit Breaker Fail-Fast Protection
 * Bloqueador B-11: Circuit Breaker com fail-fast para a API Bitrix24 em caso de instabilidade remota.
 * Squad 50 — Atlas (Coordenador de Integrações)
 *
 * Em caso de falhas consecutivas ou instabilidade do Bitrix24, o circuito se abre e requisições
 * subsequentes falham rapidamente (fail-fast) retornando status 503 com cabeçalho Retry-After,
 * evitando congelar workers de sync e esgotar sockets do sistema.
 */

import { logger } from '../../logger.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  retryAfterSeconds?: number;
}

export class BitrixCircuitBreakerError extends Error {
  public readonly statusCode: number = 503;
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number = 30) {
    super(
      `Bitrix24 Circuit Breaker: O circuito está ABERTO devido a instabilidade na API remota. Tente novamente após ${retryAfterSeconds}s (503 Service Unavailable).`,
    );
    this.name = 'BitrixCircuitBreakerError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class BitrixCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private nextAttemptAt: number = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly retryAfterSeconds: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.retryAfterSeconds = options.retryAfterSeconds ?? Math.ceil(this.resetTimeoutMs / 1000);
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptAt) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  public recordFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptAt = Date.now() + this.resetTimeoutMs;
      logger.error(
        {
          failureCount: this.failureCount,
          threshold: this.failureThreshold,
          resetTimeoutMs: this.resetTimeoutMs,
        },
        'Bitrix24 Circuit Breaker [B-11]: Limite de falhas atingido. Circuito ABERTO (fail-fast ativado).',
      );
    }
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      const remainingSeconds = Math.max(1, Math.ceil((this.nextAttemptAt - Date.now()) / 1000));
      logger.warn(
        { remainingSeconds },
        'Bitrix24 Circuit Breaker: requisição rejeitada prematuramente com 503 (fail-fast).',
      );
      throw new BitrixCircuitBreakerError(remainingSeconds);
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttemptAt = 0;
  }
}

export const bitrixCircuitBreaker = new BitrixCircuitBreaker();

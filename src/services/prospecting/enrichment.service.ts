/**
 * src/services/prospecting/enrichment.service.ts
 * Servico de enriquecimento com Circuit Breaker e respeito estrito a Rate Limiting (429 / Retry-After).
 * (Handoff 00-para-05 / DIV-AGENTE-05-002)
 */
import { logger } from '../../lib/logger.js';

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super(
      `CircuitBreakerOpen: Requisicoes pausadas devido a Rate Limit (429). Tente novamente em ${retryAfterMs}ms.`,
    );
    this.name = 'CircuitBreakerOpenError';
  }
}

export class LeadEnrichmentService {
  private circuitOpenUntil: number = 0;

  /**
   * Executa chamada ao provedor de enriquecimento respeitando estado de Circuit Breaker.
   */
  public async executeEnrichmentRequest<T>(
    requestFn: () => Promise<{ status: number; headers?: Record<string, string>; data?: T }>,
  ): Promise<T> {
    const now = Date.now();
    if (now < this.circuitOpenUntil) {
      const waitRemaining = this.circuitOpenUntil - now;
      logger.warn(
        { waitRemaining },
        '[LeadEnrichmentService] Circuit Breaker ABERTO - Requisicao abortada',
      );
      throw new CircuitBreakerOpenError(waitRemaining);
    }

    const response = await requestFn();

    if (response.status === 429) {
      // Leitura de header Retry-After (em segundos) ou padrao de 5 segundos
      const retryAfterHeader = response.headers?.['retry-after'];
      const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 5 : 5;
      const cooldownMs = retryAfterSeconds * 1000;

      this.circuitOpenUntil = Date.now() + cooldownMs;
      logger.warn({ cooldownMs }, '[LeadEnrichmentService] 429 recebido! Circuit Breaker armado');
      throw new CircuitBreakerOpenError(cooldownMs);
    }

    if (response.status >= 400) {
      throw new Error(`Erro no provedor externo de enriquecimento: HTTP ${response.status}`);
    }

    return response.data as T;
  }

  public resetCircuit(): void {
    this.circuitOpenUntil = 0;
  }
}

export const leadEnrichmentService = new LeadEnrichmentService();

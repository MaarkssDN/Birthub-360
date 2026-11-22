import { describe, expect, it, beforeEach } from 'vitest';
import {
  leadEnrichmentService,
  CircuitBreakerOpenError,
} from '../../../../src/services/prospecting/enrichment.service.js';

describe('LeadEnrichmentService — Circuit Breaker and Rate Limiting', () => {
  beforeEach(() => {
    leadEnrichmentService.resetCircuit();
  });

  it('ao receber 429, o servico pausa novas requisicoes pelo tempo estipulado em Retry-After sem consumir creditos', async () => {
    let callCount = 0;
    const fake429Provider = async () => {
      callCount++;
      return { status: 429, headers: { 'retry-after': '3' } };
    };

    // Primeira chamada: recebe 429 e abre o circuito por 3 segundos
    await expect(leadEnrichmentService.executeEnrichmentRequest(fake429Provider)).rejects.toThrow(
      CircuitBreakerOpenError,
    );
    expect(callCount).toBe(1);

    // Segunda chamada imediata: deve ser bloqueada localmente pelo Circuit Breaker sem chamar o provedor
    await expect(leadEnrichmentService.executeEnrichmentRequest(fake429Provider)).rejects.toThrow(
      CircuitBreakerOpenError,
    );
    expect(callCount).toBe(1); // Nao consumiu chamada adicional nem creditos
  });

  it('permite chamadas com sucesso HTTP 200 normalmente', async () => {
    const successProvider = async () => ({
      status: 200,
      data: { companyName: 'Acme Inc', verifiedEmail: 'contato@acme.com' },
    });

    const result = await leadEnrichmentService.executeEnrichmentRequest(successProvider);
    expect(result.companyName).toBe('Acme Inc');
  });
});

import { describe, expect, it } from 'vitest';
import { analyticsService } from '../../../../src/services/analytics.service.js';

describe('AnalyticsService — Error Observability (B-06)', () => {
  it('falha no banco resulta em estado de erro observavel e NAO em zeros mascarados', async () => {
    const failingDbQuery = async () => {
      const err = new Error('Query timeout after 5000ms');
      (err as any).code = '57014';
      throw err;
    };

    const result = await analyticsService.computeMetrics('org-1', failingDbQuery);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.code).toBe('DATABASE_TIMEOUT');
      expect(result.message).toContain('Nao foi possivel carregar');
    }
  });

  it('retorna metricas reais calculadas em caso de sucesso', async () => {
    const successQuery = async () => ({
      totalLeads: 120,
      revenue: 45000,
      conversionRate: 0.15,
    });

    const result = await analyticsService.computeMetrics('org-1', successQuery);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.totalLeads).toBe(120);
      expect(result.data.revenue).toBe(45000);
    }
  });
});

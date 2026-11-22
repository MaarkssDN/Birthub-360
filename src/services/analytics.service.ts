/**
 * src/services/analytics.service.ts
 * Servico de analytics e agregacao de metricas com observabilidade explicita de erros (Handoff 00-para-04 / B-06).
 * Elimina o mascaramento de falhas de banco por retornos zerados ({ total: 0, revenue: 0 }).
 */
import { logger } from '../lib/logger.js';

export type AnalyticsResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; code: string; message: string };

export interface BusinessMetrics {
  totalLeads: number;
  revenue: number;
  conversionRate: number;
}

export class AnalyticsService {
  /**
   * Executa a consulta de metricas garantindo que erros de timeout ou syntax do banco
   * NAO sejam mascarados por zeros, propagando status explicito de erro para o frontend.
   */
  public async computeMetrics(
    organizationId: string,
    queryFn: () => Promise<BusinessMetrics>,
  ): Promise<AnalyticsResult<BusinessMetrics>> {
    if (!organizationId) {
      throw new Error('Tenancy violation: organizationId obrigatorio');
    }

    try {
      const data = await queryFn();
      return { status: 'success', data };
    } catch (err: any) {
      const isTimeout = err?.message?.includes('timeout') || err?.code === '57014';
      const errorCode = isTimeout ? 'DATABASE_TIMEOUT' : 'DATABASE_QUERY_ERROR';

      logger.error(
        { organizationId, errorCode, err: err?.message },
        '[AnalyticsService] Falha observavel em agregacao de banco de dados',
      );

      return {
        status: 'error',
        code: errorCode,
        message: 'Nao foi possivel carregar os dados de metricas. Tente novamente mais tarde.',
      };
    }
  }
}

export const analyticsService = new AnalyticsService();

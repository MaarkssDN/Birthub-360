import { runCrawler } from '../prospecting/crawlee/crawler.js';
import type { CrawledPageSignals } from '../prospecting/domain/prospectTypes.js';
import {
  persistCrawledSignals,
  type CrawlPagePersistence,
} from '../prospecting/services/webCrawlPersistence.service.js';
import { logger } from '../../lib/logger.js';
import {
  TenantContextMissingError,
  withTenantActivity,
  withTenantContext,
} from './interceptors.js';

export type ScrapeProspectParams = {
  tenantId?: string;
  organizationId?: string;
  url: string;
  /** Atalho de persistência: empresa já conhecida pelo chamador (pula o match por domínio). */
  companyId?: string;
  /** Resolve a empresa dona do lead quando `companyId` não é informado. */
  leadId?: string;
};

export interface ScrapeProspectResult {
  /** 'success' = ao menos uma página crawleada; 'failed' = nenhuma página retornou dados
   * (URL bloqueada por SSRF, domínio inacessível ou crawler sem resultado). */
  status: 'success' | 'failed';
  crawled: CrawledPageSignals[];
  /** Resultado da ponte de persistência — uma entrada por página crawleada. */
  persistence: CrawlPagePersistence[];
}

/**
 * Activity do workflow `prospectWorkflow`: roda o Crawlee na URL e persiste os sinais
 * (e-mails/redes) na Company correspondente via `persistCrawledSignals`, com dedupe.
 * `organizationId` vem de `params.organizationId ?? params.tenantId` — o tenant validado por
 * `withTenantActivity`/`withTenantContext` é o mesmo valor, então o where explícito por
 * organizationId e a RLS do Postgres apontam para o mesmo tenant.
 */
export const scrapeProspect = withTenantActivity(
  async (params: ScrapeProspectParams): Promise<ScrapeProspectResult> => {
    const crawled = await runCrawler([params.url]);
    const organizationId = params.organizationId ?? params.tenantId ?? '';

    let persistence: CrawlPagePersistence[] = [];
    if (crawled.length > 0) {
      persistence = await persistCrawledSignals(crawled, {
        organizationId,
        companyId: params.companyId,
        leadId: params.leadId,
      });
    } else {
      logger.warn(
        { url: params.url, organizationId },
        'scrapeProspect: crawler não retornou páginas (URL bloqueada ou falha de navegação)',
      );
    }

    return {
      status: crawled.length > 0 ? 'success' : 'failed',
      crawled,
      persistence,
    };
  },
);

export { TenantContextMissingError, withTenantActivity, withTenantContext };

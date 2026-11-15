/**
 * Contratos da ponte Crawlee → persistência (reconciliação do handoff 16→05, Onda 14).
 *
 * Tipos de fronteira entre a feature `prospecting` (dona da extração e da persistência,
 * implementadas em `src/lib/enrichment/webCrawlPersistence.service.ts`) e o runtime Temporal
 * (`src/features/temporal-workers/`). Vivem em `src/shared/contracts/` porque são consumidos
 * por mais de uma feature — a regra `no-cross-feature-imports` do dependency-cruiser proíbe
 * import direto de internals entre features e manda a composição passar por shared/contracts.
 */

/**
 * Sinais extraídos de uma página pelo crawler Crawlee (`prospecting/crawlee/crawler.ts`), já
 * normalizados (e-mails deduplicados, links sociais filtrados). Tipo de contrato para que a
 * ponte de persistência não dependa do módulo `crawlee` (que é opcional/não instalado em todos
 * os ambientes) nem do arquivo excluído do tsconfig.
 */
export interface CrawledPageSignals {
  url: string;
  title: string;
  emails: string[];
  socialMedia: string[];
}

export type CrawlMatchBy = 'companyId' | 'leadId' | 'websiteDomain' | 'none';

export interface CrawlPagePersistence {
  url: string;
  companyId: string | null;
  matchedBy: CrawlMatchBy;
  persisted: boolean;
  /** true quando a Company foi de fato alterada (e-mail/rede novos); false = já estava tudo lá. */
  changed: boolean;
  emailsAdded: number;
  socialFieldsAdded: number;
  reason?: string;
}

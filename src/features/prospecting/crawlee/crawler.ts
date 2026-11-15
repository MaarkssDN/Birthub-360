import { PlaywrightCrawler } from 'crawlee';
import type { CrawledPageSignals } from '../domain/prospectTypes.js';
import { webScraperService } from '../services/enrichment/webScraper.service.js';
import { logger } from '../../../lib/logger.js';

/**
 * User-Agent institucional do crawler — identifica o robô como BirthHub e aponta a URL do
 * projeto, em vez de se disfarçar de browser comum (boa prática de crawling e requisito do
 * handoff 16→05). Configurável via `CRAWLEE_USER_AGENT`; o default replica o UA já usado pelo
 * `WebScraperService` (scraper leve HTTP) para consistência entre os dois caminhos de scrape.
 */
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; BirthHubBot/1.0; +https://birthub360.com)';

function getCrawlerUserAgent(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.CRAWLEE_USER_AGENT?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_USER_AGENT;
}

function getEnvInt(
  name: string,
  fallback: number,
  environment: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(environment[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

/**
 * Timeouts configuráveis (segundos) — `CRAWLEE_NAVIGATION_TIMEOUT_SECS` (default 30, mesmo
 * default do Crawlee) e `CRAWLEE_REQUEST_HANDLER_TIMEOUT_SECS` (default 300). Sem env, o
 * comportamento é o do Crawlee; com env, dá pra apertar o teto em ambientes lentos/instáveis.
 */
function getCrawlerTimeouts(environment: NodeJS.ProcessEnv = process.env): {
  navigationTimeoutSecs: number;
  requestHandlerTimeoutSecs: number;
} {
  return {
    navigationTimeoutSecs: getEnvInt('CRAWLEE_NAVIGATION_TIMEOUT_SECS', 30, environment),
    requestHandlerTimeoutSecs: getEnvInt('CRAWLEE_REQUEST_HANDLER_TIMEOUT_SECS', 300, environment),
  };
}

export interface RunCrawlerOptions {
  /** Sobrescreve o User-Agent institucional (testes/uso pontual). */
  userAgent?: string;
  /** Sobrescreve os timeouts lidos de env (testes/uso pontual). */
  navigationTimeoutSecs?: number;
  requestHandlerTimeoutSecs?: number;
}

/**
 * Roda o Crawlee (PlaywrightCrawler) sobre as URLs informadas e devolve os sinais extraídos
 * por página. URLs reprovadas pela política anti-SSRF de `WebScraperService.isSafeUrl`
 * (localhost, IPs privados, schemes não-http) são descartadas ANTES de qualquer request —
 * o crawler não pode ser usado para varrer alvos internos (handoff 16→05, item 3).
 *
 * robots.txt e rate-limit por domínio: NÃO implementados — não existe utilitário de robots no
 * projeto e o rate limiter existente (`providerRateLimit.ts`) é por provider de API, não por
 * domínio de crawl. Registrado como pendência no handoff.
 */
export async function runCrawler(
  urls: string[],
  options: RunCrawlerOptions = {},
): Promise<CrawledPageSignals[]> {
  const safeUrls = urls.filter((url) => {
    const ok = webScraperService.isSafeUrl(url);
    if (!ok) {
      logger.warn({ url }, 'runCrawler: URL bloqueada pela política anti-SSRF — ignorada');
    }
    return ok;
  });
  if (safeUrls.length === 0) return [];

  const timeouts = getCrawlerTimeouts();
  const userAgent = options.userAgent ?? getCrawlerUserAgent();
  const data: CrawledPageSignals[] = [];

  const crawler = new PlaywrightCrawler({
    navigationTimeoutSecs: options.navigationTimeoutSecs ?? timeouts.navigationTimeoutSecs,
    requestHandlerTimeoutSecs:
      options.requestHandlerTimeoutSecs ?? timeouts.requestHandlerTimeoutSecs,
    maxRequestRetries: 2,
    // User-Agent institucional em TODA navegação — inclui a primeira (preNavigationHooks roda
    // antes do goto), diferente de setar header só dentro do requestHandler.
    preNavigationHooks: [
      async ({ page }) => {
        await page.setExtraHTTPHeaders({ 'User-Agent': userAgent });
      },
    ],
    async requestHandler({ request, page, log }) {
      log.info(`Processing ${request.url}...`);
      const title = await page.title();

      const content = await page.content();

      // Basic email extraction
      const emailMatches =
        content.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/gi) || [];
      const emails = [...new Set(emailMatches)];

      // Basic social media links extraction
      const links = await page.$$eval('a', (anchors: HTMLAnchorElement[]) =>
        anchors.map((a: HTMLAnchorElement) => a.href),
      );
      const socialMedia = [
        ...new Set(
          links.filter(
            (link: string) =>
              link.includes('linkedin.com') ||
              link.includes('twitter.com') ||
              link.includes('facebook.com') ||
              link.includes('instagram.com'),
          ),
        ),
      ];

      const result: CrawledPageSignals = {
        url: request.url,
        title,
        emails,
        socialMedia,
      };

      data.push(result);
    },
  });

  await crawler.run(safeUrls);
  return data;
}

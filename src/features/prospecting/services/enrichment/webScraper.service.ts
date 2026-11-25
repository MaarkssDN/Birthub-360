/**
 * Web Scraper & Signals Service (Crawlee + Cheerio + Playwright fallback)
 *
 * Executa rastreamento controlado de websites corporativos:
 * 1. Crawler leve HTTP para extrair metadados, links e contatos corporativos.
 * 2. Playwright sob demanda quando a página exigir renderização JS/SPA avançada.
 * 3. Proteção estrita contra SSRF, rate limiting e sanitização anti-prompt injection.
 */

import { logger } from '../../../../lib/logger.js';
import { assertSafeExternalUrl, safeFetch } from '../../../../shared/security/urlGuard.js';

/** Timeout do crawler HTTP leve (ms). */
const SCRAPE_HTTP_TIMEOUT_MS = 8_000;
/** Timeout de navegação do fallback Playwright (ms) — já existia inline em page.goto. */
const SCRAPE_BROWSER_TIMEOUT_MS = 12_000;
/**
 * Teto de corpo da resposta HTML aceita pelo crawler. Páginas corporativas raramente passam de
 * ~1 MB; acima disso é sinal de endpoint hostil/stream infinito. Aplicado sobre o corpo já
 * materializado por `safeFetch` (ver limitação documentada no handoff de resolução — cap ideal
 * seria streaming dentro do urlGuard, propriedade do Agente 01).
 */
const MAX_SCRAPE_BODY_BYTES = 2 * 1024 * 1024;

/** Esquemas que não fazem sentido bloquear na interceptação do Playwright (não abrem rede). */
const PLAYWRIGHT_PASSIVE_SCHEMES = new Set(['data:', 'blob:', 'about:']);

export interface ScrapedWebSignals {
  url: string;
  title: string;
  description?: string;
  emails: string[];
  phones: string[];
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  openGraph: Record<string, string>;
  sanitizedTextSnippet: string;
  source: 'cheerio_http' | 'playwright_browser';
}

export class WebScraperService {
  private static instance: WebScraperService;

  public static getInstance(): WebScraperService {
    if (!WebScraperService.instance) {
      WebScraperService.instance = new WebScraperService();
    }
    return WebScraperService.instance;
  }

  /**
   * Valida URL contra SSRF (bloqueia IPs privados, localhost, link-local e schemes não http/https).
   */
  public isSafeUrl(targetUrl: string): boolean {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')
      ) {
        return false;
      }
      // Bloqueia faixa privada 172.16.0.0 - 172.31.255.255
      const parts = hostname.split('.').map(Number);
      if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitiza conteúdo HTML para prevenir Prompt Injection e ruídos em LLMs.
   */
  public sanitizeAndTruncateHtml(rawHtml: string, maxLength = 4000): string {
    let sanitized = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');

    sanitized = sanitized.replace(/<[^>]+>/g, ' ');

    sanitized = sanitized
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return sanitized.slice(0, maxLength);
  }

  /**
   * Extrai e-mails e telefones corporativos via expressões regulares seguras.
   */
  private extractContacts(text: string): { emails: string[]; phones: string[] } {
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    // Filtra e-mails de extensões de arquivos ou templates
    const cleanEmails = [...new Set(emailMatches)].filter(
      (e) =>
        !e.endsWith('.png') &&
        !e.endsWith('.jpg') &&
        !e.endsWith('.webp') &&
        !e.includes('example.com'),
    );

    const phoneMatches =
      text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-\s]?\d{4})/g) || [];
    const cleanPhones = [...new Set(phoneMatches.map((p) => p.trim()))].filter(
      (p) => p.replace(/\D/g, '').length >= 10,
    );

    return { emails: cleanEmails.slice(0, 5), phones: cleanPhones.slice(0, 5) };
  }

  /**
   * Rastreia e extrai sinais web do site corporativo.
   */
  public async scrapeWebsite(
    targetUrl: string,
    options: { forcePlaywright?: boolean } = {},
  ): Promise<ScrapedWebSignals> {
    if (!this.isSafeUrl(targetUrl)) {
      throw new Error(`URL rejeitada por política de segurança SSRF: ${targetUrl}`);
    }

    // Guard real (auditoria-20261115 / handoff 05→15): `isSafeUrl` só olha o hostname literal.
    // Aqui resolvemos DNS e bloqueamos IP privado/reservado/link-local — inclusive metadata
    // (169.254.169.254), CGNAT e faixas de transição — e exigimos HTTPS (exceção aprovada:
    // http:// loopback fora de produção, ver urlGuard.isLoopbackHttpAllowed). Fica FORA dos
    // try/catch abaixo para o AppError(400) propagar à rota em vez de virar fallback silencioso.
    // Consequência documentada: sites que só respondem em http:// público passam a ser
    // rejeitados — trade-off aceito do guard (não há como validar http sem TLS).
    await assertSafeExternalUrl(targetUrl);

    // Tentativa 1: HTTP Leve — via `safeFetch` (DNS pinning: a conexão TCP fica fixada nos
    // MESMOS endereços validados por `resolveSafe`, fechando a janela de DNS rebinding; um
    // redirect 3xx para outro host falha fechado por mismatch de TLS/SNI em vez de abrir uma
    // conexão nova e não validada).
    if (!options.forcePlaywright) {
      try {
        const response = await safeFetch(targetUrl, {
          signal: AbortSignal.timeout(SCRAPE_HTTP_TIMEOUT_MS),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BirthHubBot/1.0; +https://birthhub360.com)',
            Accept: 'text/html,application/xhtml+xml',
          },
        });

        if (response.ok) {
          // Cap de corpo ANTES de materializar: content-length mentiroso ainda é pego pelo
          // byteLength abaixo; o buffer interno do safeFetch já foi alocado — limitação
          // registrada no handoff (cap streaming pertence ao urlGuard/Agente 01).
          const declaredLength = Number(response.headers.get('content-length') ?? '0');
          if (declaredLength > MAX_SCRAPE_BODY_BYTES) {
            throw new Error(`Resposta excede o limite de ${MAX_SCRAPE_BODY_BYTES} bytes`);
          }
          const bodyBuffer = await response.arrayBuffer();
          if (bodyBuffer.byteLength > MAX_SCRAPE_BODY_BYTES) {
            throw new Error(`Resposta excede o limite de ${MAX_SCRAPE_BODY_BYTES} bytes`);
          }
          const html = new TextDecoder().decode(bodyBuffer);
          let title = '';
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) title = titleMatch[1].trim();

          let description = '';
          const descMatch =
            html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
          if (descMatch) description = descMatch[1].trim();

          const openGraph: Record<string, string> = {};
          const ogMatches = html.matchAll(
            /<meta[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']+)["']/gi,
          );
          for (const match of ogMatches) {
            if (match[1] && match[2]) openGraph[match[1]] = match[2];
          }

          const links: string[] = [];
          const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["']/gi);
          for (const match of linkMatches) {
            if (match[1]) links.push(match[1]);
          }

          const socialLinks = {
            linkedin: links.find(
              (l) => l.includes('linkedin.com/company') || l.includes('linkedin.com/in'),
            ),
            instagram: links.find((l) => l.includes('instagram.com/')),
            facebook: links.find((l) => l.includes('facebook.com/')),
            twitter: links.find((l) => l.includes('twitter.com/') || l.includes('x.com/')),
          };

          const sanitizedTextSnippet = this.sanitizeAndTruncateHtml(html);
          const contacts = this.extractContacts(sanitizedTextSnippet);

          return {
            url: targetUrl,
            title,
            description,
            emails: contacts.emails,
            phones: contacts.phones,
            socialLinks,
            openGraph,
            sanitizedTextSnippet,
            source: 'cheerio_http',
          };
        }
      } catch (err) {
        logger.warn({ err }, `[WebScraperService] Erro no crawler leve HTTP para ${targetUrl}`);
      }
    }

    // Se falhar ou exigir Playwright, recorre defensivamente ao Playwright se instalado
    try {
      const moduleName = 'playwright';
      const pw = await (Function('m', 'return import(m)')(moduleName) as Promise<any>).catch(
        () => null,
      );
      if (pw?.chromium) {
        const browser = await pw.chromium.launch({ headless: true });
        const page = await browser.newPage();

        // O browser resolve DNS por conta própria — o pinning do safeFetch não se aplica.
        // Mitigação SSRF: intercepta TODA request (documento, redirect, subrecurso) e revalida
        // cada URL com assertSafeExternalUrl, com cache por hostname para não repetir DNS
        // lookup a cada imagem/css da página. Falha fechado: request insegura é abortada.
        // Ressalva documentada: entre a validação e a conexão do browser persiste uma janela
        // de DNS rebinding residual (o Chromium não aceita lookup customizado aqui) — menor
        // que a anterior porque CADA request é revalidada, não só a URL inicial.
        const validatedHosts = new Map<string, Promise<void>>();
        await page.route('**/*', async (route: any) => {
          const requestUrl = route.request().url() as string;
          try {
            const scheme = new URL(requestUrl).protocol;
            if (PLAYWRIGHT_PASSIVE_SCHEMES.has(scheme)) {
              await route.continue();
              return;
            }
            const host = new URL(requestUrl).hostname.toLowerCase();
            let validation = validatedHosts.get(host);
            if (!validation) {
              validation = assertSafeExternalUrl(requestUrl);
              validatedHosts.set(host, validation);
            }
            await validation;
            await route.continue();
          } catch {
            await route.abort();
          }
        });

        try {
          await page.goto(targetUrl, {
            timeout: SCRAPE_BROWSER_TIMEOUT_MS,
            waitUntil: 'domcontentloaded',
          });
          const title = await page.title();
          const content = (await page.content()).slice(0, MAX_SCRAPE_BODY_BYTES);
          const sanitizedTextSnippet = this.sanitizeAndTruncateHtml(content);
          const contacts = this.extractContacts(sanitizedTextSnippet);
          return {
            url: targetUrl,
            title,
            emails: contacts.emails,
            phones: contacts.phones,
            socialLinks: {},
            openGraph: {},
            sanitizedTextSnippet,
            source: 'playwright_browser',
          };
        } finally {
          // Garante o fechamento do browser mesmo se goto/content lançar — antes, uma exceção
          // no meio do bloco vazava o processo Chromium headless a cada request hostil.
          await browser.close().catch(() => undefined);
        }
      }
    } catch (browserErr) {
      logger.warn(
        { err: browserErr },
        `[WebScraperService] Playwright fallback falhou ou indisponível para ${targetUrl}`,
      );
    }

    return {
      url: targetUrl,
      title: '',
      emails: [],
      phones: [],
      socialLinks: {},
      openGraph: {},
      sanitizedTextSnippet: '',
      source: 'cheerio_http',
    };
  }
}

export const webScraperService = WebScraperService.getInstance();

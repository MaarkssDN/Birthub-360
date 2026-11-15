import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `crawlee` não é dependência instalada do projeto (o crawler roda no worker Temporal com a
 * dependência própria do worker) — o teste mocka o módulo e exercita o CONTRATO de
 * `runCrawler`: filtro anti-SSRF, User-Agent institucional, timeouts configuráveis e a
 * estrutura `{ url, title, emails, socialMedia }` devolvida por página.
 */

interface FakePage {
  title: () => Promise<string>;
  content: () => Promise<string>;
  $$eval: () => Promise<string[]>;
  setExtraHTTPHeaders: (headers: Record<string, string>) => Promise<void>;
}

const crawlerInstances: Array<{
  options: Record<string, unknown>;
  run: (urls: string[]) => Promise<void>;
}> = [];

vi.mock('crawlee', () => ({
  PlaywrightCrawler: class {
    options: Record<string, unknown>;
    constructor(options: Record<string, unknown>) {
      this.options = options;
      crawlerInstances.push(this as never);
    }
    async run(urls: string[]) {
      const handler = this.options.requestHandler as (ctx: {
        request: { url: string };
        page: FakePage;
        log: { info: () => void };
      }) => Promise<void>;
      for (const url of urls) {
        const page: FakePage = {
          title: async () => 'Página da Empresa',
          content: async () =>
            '<html><body>Fale com vendas@empresa.com.br ou comercial@empresa.com.br</body></html>',
          $$eval: async () => [
            'https://linkedin.com/company/empresa',
            'https://instagram.com/empresa',
            'https://site-qualquer.com/nao-e-social',
          ],
          setExtraHTTPHeaders: async () => {},
        };
        await handler({ request: { url }, page, log: { info: () => {} } });
      }
    }
  },
}));

import { runCrawler } from '../crawler.js';

describe('runCrawler', () => {
  beforeEach(() => {
    crawlerInstances.length = 0;
  });

  it('retorna a estrutura { url, title, emails, socialMedia } por página', async () => {
    const result = await runCrawler(['https://empresa.com.br']);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      url: 'https://empresa.com.br',
      title: 'Página da Empresa',
      emails: ['vendas@empresa.com.br', 'comercial@empresa.com.br'],
      socialMedia: ['https://linkedin.com/company/empresa', 'https://instagram.com/empresa'],
    });
  });

  it('configura User-Agent institucional e timeouts no crawler', async () => {
    await runCrawler(['https://empresa.com.br']);

    const options = crawlerInstances[0].options;
    expect(options.navigationTimeoutSecs).toBe(30);
    expect(options.requestHandlerTimeoutSecs).toBe(300);
    expect(typeof options.preNavigationHooks).toBe('object');
    const hooks = options.preNavigationHooks as Array<(ctx: { page: FakePage }) => Promise<void>>;
    const setHeaders = vi.fn(async () => {});
    await hooks[0]({ page: { setExtraHTTPHeaders: setHeaders } as FakePage });
    expect(setHeaders).toHaveBeenCalledWith({
      'User-Agent': expect.stringContaining('BirthHubBot'),
    });
  });

  it('respeita CRAWLEE_USER_AGENT e timeouts via env', async () => {
    process.env.CRAWLEE_USER_AGENT = 'BirthHubTestBot/9.9';
    process.env.CRAWLEE_NAVIGATION_TIMEOUT_SECS = '7';
    process.env.CRAWLEE_REQUEST_HANDLER_TIMEOUT_SECS = '42';
    try {
      await runCrawler(['https://empresa.com.br']);
      const options = crawlerInstances[0].options;
      expect(options.navigationTimeoutSecs).toBe(7);
      expect(options.requestHandlerTimeoutSecs).toBe(42);
      const hooks = options.preNavigationHooks as Array<(ctx: { page: FakePage }) => Promise<void>>;
      const setHeaders = vi.fn(async () => {});
      await hooks[0]({ page: { setExtraHTTPHeaders: setHeaders } as FakePage });
      expect(setHeaders).toHaveBeenCalledWith({ 'User-Agent': 'BirthHubTestBot/9.9' });
    } finally {
      delete process.env.CRAWLEE_USER_AGENT;
      delete process.env.CRAWLEE_NAVIGATION_TIMEOUT_SECS;
      delete process.env.CRAWLEE_REQUEST_HANDLER_TIMEOUT_SECS;
    }
  });

  it('filtra URLs bloqueadas pela política anti-SSRF antes de crawlear', async () => {
    const result = await runCrawler(['http://localhost:3000/admin', 'http://192.168.0.1']);
    expect(result).toEqual([]);
    expect(crawlerInstances).toHaveLength(0); // nem instancia o crawler
  });
});

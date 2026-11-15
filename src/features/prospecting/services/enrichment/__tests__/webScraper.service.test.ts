import { beforeEach, describe, expect, it, vi } from 'vitest';

// Auditoria-20261115 (handoff 05→15): o scraper agora usa o guard real de
// src/shared/security/urlGuard.ts — mockado aqui no mesmo padrão de
// threecx.service.test.ts, para simular rejeição de SSRF/DNS sem rede real.
const assertSafeExternalUrlMock = vi.fn().mockResolvedValue(undefined);
const safeFetchMock = vi.fn();
vi.mock('../../../../../shared/security/urlGuard.js', () => ({
  assertSafeExternalUrl: (...args: unknown[]) => assertSafeExternalUrlMock(...args),
  safeFetch: (...args: unknown[]) => safeFetchMock(...args),
}));

import { WebScraperService } from '../webScraper.service.js';

const HTML_OK = `<!doctype html><html><head><title>Empresa X</title>
<meta name="description" content="Logística B2B"><meta property="og:title" content="OG T">
</head><body><h1>Contato</h1><a href="https://linkedin.com/company/x">in</a>
<p>Fale com vendas@empresa.com.br ou (11) 99999-0000</p></body></html>`;

function htmlResponse(body: string, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html', ...headers },
  });
}

describe('WebScraperService', () => {
  const service = WebScraperService.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
    assertSafeExternalUrlMock.mockResolvedValue(undefined);
  });

  it('bloqueia endereços inseguros via validação SSRF literal', () => {
    expect(service.isSafeUrl('http://localhost:3000')).toBe(false);
    expect(service.isSafeUrl('http://127.0.0.1:8080')).toBe(false);
    expect(service.isSafeUrl('http://192.168.1.1')).toBe(false);
    expect(service.isSafeUrl('http://10.0.0.1')).toBe(false);
    expect(service.isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(service.isSafeUrl('ftp://example.com')).toBe(false);
    expect(service.isSafeUrl('https://empresa.com.br')).toBe(true);
  });

  it('sanitiza e trunca HTML removendo scripts e tags perigosas', () => {
    const rawHtml = `
      <html>
        <head><title>Teste</title><script>alert('injection')</script></head>
        <body>
          <h1>Logística Moderna</h1>
          <p>Oferecemos serviços de transporte de carga em todo o Brasil.</p>
          <style>.hide { display: none; }</style>
        </body>
      </html>
    `;
    const sanitized = service.sanitizeAndTruncateHtml(rawHtml);
    expect(sanitized).not.toContain('alert');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Logística Moderna');
  });

  it('URL externa https válida passa pelo guard e retorna sinais via safeFetch', async () => {
    safeFetchMock.mockResolvedValue(htmlResponse(HTML_OK));

    const result = await service.scrapeWebsite('https://empresa.com.br');

    expect(assertSafeExternalUrlMock).toHaveBeenCalledWith('https://empresa.com.br');
    expect(safeFetchMock).toHaveBeenCalledTimes(1);
    // fetch global NÃO pode ser usado — só safeFetch (DNS pinning).
    expect(result.source).toBe('cheerio_http');
    expect(result.title).toBe('Empresa X');
    expect(result.description).toBe('Logística B2B');
    expect(result.openGraph['og:title']).toBe('OG T');
    expect(result.socialLinks.linkedin).toBe('https://linkedin.com/company/x');
    expect(result.emails).toContain('vendas@empresa.com.br');
  });

  it('rejeita URL que o guard bloqueia (ex.: metadata 169.254.169.254 passa no isSafeUrl literal mas cai no DNS/IP guard)', async () => {
    // 169.254.x não é coberto pelas faixas literais de isSafeUrl — é exatamente o gap que o
    // urlGuard fecha. Simulamos a rejeição do guard real.
    assertSafeExternalUrlMock.mockRejectedValue(
      new Error('Endereço não permitido (IP privado/reservado).'),
    );

    await expect(service.scrapeWebsite('https://169.254.169.254/latest/meta-data')).rejects.toThrow(
      'Endereço não permitido',
    );
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it('rejeita antes de qualquer fetch quando assertSafeExternalUrl falha (host privado via DNS)', async () => {
    assertSafeExternalUrlMock.mockRejectedValue(new Error('Endereço não permitido.'));

    await expect(service.scrapeWebsite('https://interno.example.com')).rejects.toThrow(
      'Endereço não permitido',
    );
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it('descarta resposta acima do limite de corpo (content-length declarado)', async () => {
    const huge = 'x'.repeat(10);
    safeFetchMock.mockResolvedValue(
      htmlResponse(huge, { 'content-length': String(3 * 1024 * 1024) }),
    );

    const result = await service.scrapeWebsite('https://grande.com.br');

    // Corpo rejeitado → cai no fallback Playwright (indisponível no ambiente de teste) →
    // resultado vazio, nunca devolve o payload hostil.
    expect(result.sanitizedTextSnippet).toBe('');
    expect(result.source).toBe('cheerio_http');
  });

  it('descarta resposta acima do limite mesmo com content-length ausente/menor (byteLength real)', async () => {
    const bigBody = `<html><body>${'a'.repeat(3 * 1024 * 1024)}</body></html>`;
    // Sem content-length — só o byteLength do corpo materializado pega.
    safeFetchMock.mockResolvedValue(htmlResponse(bigBody));

    const result = await service.scrapeWebsite('https://sem-length.com.br');

    expect(result.sanitizedTextSnippet).toBe('');
  });

  it('propaga falha do safeFetch para o fallback Playwright sem quebrar o contrato', async () => {
    safeFetchMock.mockRejectedValue(new Error('connection reset'));

    const result = await service.scrapeWebsite('https://instavel.com.br');

    expect(result.url).toBe('https://instavel.com.br');
    expect(result.sanitizedTextSnippet).toBe('');
  });
});

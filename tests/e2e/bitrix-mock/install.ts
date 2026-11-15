/**
 * install.ts — costura de teste que permite à suíte E2E exercitar a jornada REAL da Mesa de
 * Tratamento contra um portal Bitrix24 falso (ver portal.ts), sem mockar nenhum módulo do
 * produto.
 *
 * Como funciona:
 * 1. Sobe o portal mock em 127.0.0.1:E2E_BITRIX_MOCK_PORT (default 4799) neste processo.
 * 2. Substitui `globalThis.fetch` por um wrapper que reescreve chamadas destinadas a
 *    `https://203.0.113.10/...` (TEST-NET-3, RFC 5737 — "público" o suficiente para passar no
 *    guard de SSRF de safeFetch, mas nunca roteável) para o mock local. Todo o resto do
 *    tráfego é delegado ao fetch original.
 *
 * POR QUE ISTO É SEGURO COMO COSTURA OFICIAL: `safeFetch`
 * (src/shared/security/urlGuard.ts) já tem um branch explícito de teste — quando detecta que
 * `globalThis.fetch` é um mock (`_isMockFunction`/`.mock`/`mockRestore`/`getMockName`), ele
 * delega a chamada ao fetch global em vez do caminho undici com IP pinning. O wrapper abaixo
 * se apresenta com essas mesmas marcas, então TODO safeFetch do processo passa por ele — e o
 * wrapper só desvia o host do mock; qualquer outro destino segue para o fetch real.
 *
 * Efeito colateral assumido e delimitado: com E2E_BITRIX_MOCK=1, o pinning de DNS do
 * safeFetch fica desligado para TODO o processo de teste (o branch de mock não pina IP).
 * Isso só afeta o servidor Express efêmero do Playwright — nunca produção, onde a variável
 * não existe e este módulo é no-op.
 *
 * Ativado SOMENTE quando E2E_BITRIX_MOCK=1 (setado em playwright.config.ts → webServer.env).
 * Sem a variável, `maybeInstallBitrixMock()` é no-op e o servidor se comporta exatamente como
 * `npm run start:e2e` sempre se comportou.
 */
import { MOCK_BITRIX_HOST, MOCK_BITRIX_PORT, MOCK_BITRIX_WEBHOOK_URL } from './constants';
import { startBitrixMockPortal } from './portal';

export { MOCK_BITRIX_WEBHOOK_URL };

export function maybeInstallBitrixMock(): void {
  if (process.env.E2E_BITRIX_MOCK !== '1') return;

  const port = MOCK_BITRIX_PORT;
  startBitrixMockPortal(port);

  const originalFetch = globalThis.fetch.bind(globalThis);
  const wrapped = (async (input: unknown, init?: unknown) => {
    const href =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : ((input as { url?: string } | null | undefined)?.url ?? '');
    try {
      const url = new URL(href);
      if (url.hostname === MOCK_BITRIX_HOST) {
        return originalFetch(
          `http://127.0.0.1:${port}${url.pathname}${url.search}`,
          init as RequestInit | undefined,
        );
      }
    } catch {
      // href não-URL: cai no passthrough abaixo.
    }
    return originalFetch(input as Parameters<typeof fetch>[0], init as RequestInit | undefined);
  }) as typeof fetch;

  // Marcas que isGlobalFetchMocked (urlGuard.ts) procura — sem elas o safeFetch seguiria o
  // caminho undici e tentaria TLS de verdade contra o IP fake.
  Object.assign(wrapped, {
    _isMockFunction: true,
    mock: { calls: [] as unknown[] },
  });

  globalThis.fetch = wrapped;
}

maybeInstallBitrixMock();

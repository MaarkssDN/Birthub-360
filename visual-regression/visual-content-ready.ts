import { expect, type Page, type Request } from '@playwright/test';

/**
 * Espera o conteúdo visual assentar antes do snapshot: some o skeleton/`aria-busy`
 * e a rede HTTP fica quieta. Não usa `networkidle` do Playwright — no app um
 * EventSource (`/api/notifications/stream`) permanece aberto em /app/crm e a
 * rede nunca ociosa (ver waitForAppReady em tests/e2e/helpers.ts).
 *
 * Este módulo importa `expect` em runtime e deve ser usado só pelo spec visual.
 * O estado determinístico (sem `expect`) fica em deterministic-state.ts, para o
 * unitário do Vitest não carregar o Playwright.
 */
export async function waitForVisualContentReady(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('.bh-skeleton-shimmer')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText('Carregando pipeline comercial...')).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.locator('.animate-spin')).toHaveCount(0, { timeout: 15_000 });
  await waitForHttpQuietIgnoringSse(page);
}

function isLongLivedVisualRequest(request: Request): boolean {
  const type = request.resourceType();
  const url = request.url();
  return (
    type === 'eventsource' ||
    type === 'websocket' ||
    url.includes('/api/notifications/stream') ||
    url.includes('/notifications/stream')
  );
}

async function waitForHttpQuietIgnoringSse(page: Page, timeout = 15_000, quietMs = 400) {
  const pending = new Set<Request>();
  const onRequest = (request: Request) => {
    if (!isLongLivedVisualRequest(request)) pending.add(request);
  };
  const onDone = (request: Request) => {
    pending.delete(request);
  };
  page.on('request', onRequest);
  page.on('requestfinished', onDone);
  page.on('requestfailed', onDone);
  try {
    let quietSince: number | null = pending.size === 0 ? Date.now() : null;
    // Best-effort: o cockpit do dashboard (e similares) faz polling contínuo;
    // não falhamos o teste se a janela quieta não aparecer — o sinal
    // obrigatório já foi o fim do skeleton/`aria-busy`.
    await expect
      .poll(
        () => {
          if (pending.size === 0) {
            if (quietSince === null) quietSince = Date.now();
            return Date.now() - quietSince;
          }
          quietSince = null;
          return 0;
        },
        { timeout, intervals: [50, 100, 200] },
      )
      .toBeGreaterThanOrEqual(quietMs)
      .catch(() => undefined);
  } finally {
    page.off('request', onRequest);
    page.off('requestfinished', onDone);
    page.off('requestfailed', onDone);
  }
}

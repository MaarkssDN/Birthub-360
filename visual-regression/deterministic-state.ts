import { expect, type Page, type Request } from '@playwright/test';

// Freeze the displayed date, not timers: authentication, polling and transitions must still run.
export const VISUAL_REFERENCE_TIME = '2026-01-15T15:00:00.000Z';

export async function setupDeterministicState(page: Page, theme: 'light' | 'dark') {
  await page.clock.setFixedTime(new Date(VISUAL_REFERENCE_TIME));
  await page.addInitScript((selectedTheme) => {
    // Sincroniza tanto a chave canônica do ThemeContext quanto a legada
    window.localStorage.setItem('birthhub360_theme', selectedTheme);
    window.localStorage.setItem('atlas_theme', selectedTheme);
    window.localStorage.setItem('@prospector:has_seen_tour', 'true');
    const root = document.documentElement;
    root.dataset.theme = selectedTheme;
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, theme);

  // Desativa animações, transições e cursores piscando para determinismo absoluto nos snapshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        -moz-animation: none !important;
        -webkit-animation: none !important;
        animation: none !important;
        -moz-transition: none !important;
        -webkit-transition: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  }).catch(() => undefined);
}

// Call after navigation. Waiting on about:blank only waits for that empty document's fonts.
export async function waitForVisualFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Pequena pausa determinística para layout e font settling no Chromium
  await page.waitForTimeout(300);
}


/**
 * Espera o conteúdo visual assentar antes do snapshot: some o skeleton/`aria-busy`
 * e a rede HTTP fica quieta. Não usa `networkidle` do Playwright — no app um
 * EventSource (`/api/notifications/stream`) permanece aberto em /app/crm e a
 * rede nunca ociosa (ver waitForAppReady em tests/e2e/helpers.ts).
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
      .toBeGreaterThanOrEqual(quietMs);
  } finally {
    page.off('request', onRequest);
    page.off('requestfinished', onDone);
    page.off('requestfailed', onDone);
  }
}

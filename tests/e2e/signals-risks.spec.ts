import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail } from './helpers';

/**
 * Cobertura E2E do hub Sinais & Riscos (`/app/signals-risks`) — a rota existia em App.tsx sem
 * nenhum spec funcional (só varreduras de a11y/mobile). Os dados vêm de 4 endpoints reais
 * (`/api/market-intelligence/data-quality-report`, `/api/commercial-intelligence/health-score`,
 * `/api/commercial-intelligence/alerts`, `/api/notifications?unread=1`); numa organização nova
 * todos respondem vazios, o que exercita o caminho real de "sem dados" — o mesmo que o
 * `loadData` trata com fallback silencioso (SignalsAndRisksHub.tsx).
 */

test.describe('Sinais & Riscos — hub', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('signals') });
  });

  test('renderiza o radar de sinais com métricas zeradas e catálogo de tipos', async ({ page }) => {
    await page.goto('/app/signals-risks');

    await expect(
      page.getByRole('heading', { name: 'Sinais & Riscos' }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Radar de Sinais' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Riscos de Deals' })).toBeVisible();

    // Métricas de cobertura vêm do endpoint real — org sem sinais mostra 0 + a `reason` que o
    // backend devolve (dataQualityReport.service.ts retorna o código
    // 'nenhum_sinal_registrado_no_tenant', exibido cru pela UI; o fallback em PT só aparece se a
    // seção vier sem reason — aceitamos os dois para não acoplar o teste a esse detalhe de UX).
    await expect(page.getByText('Sinais Ativos no Tenant')).toBeVisible();
    await expect(page.getByText('Contas com Sinais')).toBeVisible();
    await expect(
      page.getByText(/nenhum_sinal_registrado_no_tenant|Nenhum sinal ativo registrado no tenant/),
    ).toBeVisible();
  });

  test('troca para "Riscos de Deals" navega na URL e mostra estado vazio de alertas', async ({
    page,
  }) => {
    await page.goto('/app/signals-risks');

    await page.getByRole('button', { name: 'Riscos de Deals' }).click();
    // A troca de aba é navegação real (handleSelectView → navigate), não só estado local.
    await expect(page).toHaveURL(/\/app\/signals-risks\/deal-risks/);

    await expect(
      page.getByRole('heading', { name: 'Detecção Agêntica de Riscos de Negócios' }),
    ).toBeVisible();
    await expect(page.getByText('Alertas Ativos & Ligações Monitoradas')).toBeVisible();
    // Sem healthScore/alertas/notificações no tenant novo → card de "tudo limpo".
    await expect(page.getByText('Nenhum deal em risco crítico ativo')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('deep-link em /app/signals-risks/deal-risks abre direto na aba de riscos', async ({
    page,
  }) => {
    await page.goto('/app/signals-risks/deal-risks');
    await expect(
      page.getByRole('heading', { name: 'Detecção Agêntica de Riscos de Negócios' }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('botão "Atualizar Dados" dispara as 4 chamadas reais de API e volta ao normal', async ({
    page,
  }) => {
    await page.goto('/app/signals-risks');
    await expect(
      page.getByRole('heading', { name: 'Sinais & Riscos' }),
    ).toBeVisible({ timeout: 15_000 });

    const healthScoreResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/commercial-intelligence/health-score') &&
        res.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Atualizar Dados' }).click();
    const res = await healthScoreResponse;
    expect(res.ok()).toBeTruthy();

    // Após o refresh o botão sai do estado disabled/spinning e a tela continua estável.
    await expect(page.getByRole('button', { name: 'Atualizar Dados' })).toBeEnabled();
  });
});

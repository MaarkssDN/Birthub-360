import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail } from './helpers';

/**
 * Cobertura E2E do cockpit de gamificação (`/app/gamification`) — rota existia em App.tsx sem
 * nenhum spec funcional (só testes de unidade/integração do service). Os dados vêm dos endpoints
 * reais `/api/gamification/leaderboard` e `/api/gamification/seller-profile`; numa organização
 * nova o ranking vem vazio e o perfil zerado, exercitando o caminho real de "sem atividade" —
 * o `loadData` captura erro e renderiza os defaults (GamificationView.tsx).
 */

test.describe('Gamificação — cockpit comercial', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('gamification') });
  });

  test('renderiza ranking vazio e perfil do vendedor com dados reais zerados', async ({ page }) => {
    await page.goto('/app/gamification');

    await expect(
      page.getByRole('heading', { name: /Gamificação & Aceleração de Vendas/ }),
    ).toBeVisible({ timeout: 15_000 });

    // Ranking Geral da Equipe com estado vazio real (org sem atividades comerciais).
    await expect(page.getByText('Ranking Geral da Equipe')).toBeVisible();
    await expect(
      page.getByText(/Nenhuma atividade comercial registrada neste período/),
    ).toBeVisible({ timeout: 15_000 });

    // Perfil do vendedor logado: nível default e contadores zerados vindos do seller-profile.
    await expect(page.getByText('Nível 1')).toBeVisible();
    await expect(page.getByText('Consultor Trainee')).toBeVisible();
  });

  test('troca de período refaz a chamada real ao leaderboard com o período selecionado', async ({
    page,
  }) => {
    await page.goto('/app/gamification');
    await expect(
      page.getByText(/Nenhuma atividade comercial registrada neste período/),
    ).toBeVisible({ timeout: 15_000 });

    // Default é 'month'; clicar em "Esta Semana" deve disparar GET ...?period=week.
    const weekResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/gamification/leaderboard') &&
        res.url().includes('period=week') &&
        res.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Esta Semana', exact: true }).click();
    const res = await weekResponse;
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.period).toBe('week');
  });

  test('aba "War Room Arena" renderiza o cockpit de roleplay e volta para o ranking', async ({
    page,
  }) => {
    await page.goto('/app/gamification');
    await expect(
      page.getByRole('heading', { name: /Gamificação & Aceleração de Vendas/ }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /War Room Arena/ }).click();
    await expect(
      page.getByRole('heading', { name: /Arena Interativa de War Room/ }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Ranking & Perfil/ }).click();
    await expect(page.getByText('Ranking Geral da Equipe')).toBeVisible();
  });
});

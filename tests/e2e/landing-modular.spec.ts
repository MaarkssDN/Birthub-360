import { test, expect } from '@playwright/test';

test.describe('Landing Page Modular E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve renderizar a HeroSection com a headline oficial e botão de acesso', async ({ page }) => {
    await expect(page.locator('.lp-hero h1')).toContainText('Revenue Command Center');
    const ctaButton = page
      .locator('.lp-hero-acts button', { hasText: 'Acessar plataforma' })
      .first();
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.lp-login-card')).toBeVisible();
  });

  test('deve navegar corretamente pelas seções de âncora', async ({ page }) => {
    for (const [label, anchor] of [
      ['Módulos', '#modules'],
      ['Como funciona', '#how'],
      ['Segurança', '#security'],
    ] as const) {
      await page.locator('.lp-nav a', { hasText: label }).click();
      await expect(page.locator(anchor)).toBeInViewport();
    }
  });

  test('deve exibir os 11 módulos integrados e abrir o detalhe do pilar', async ({ page }) => {
    const cards = page.locator('.lp-cards-grid .lp-card');
    await expect(cards).toHaveCount(11);
    await cards.first().scrollIntoViewIfNeeded();
    await cards.first().click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveCount(1);
    await expect(page.locator('#b360-dialog-title')).toContainText('01. Hub Comercial');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});

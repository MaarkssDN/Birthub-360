import { test, expect } from '@playwright/test';

test.describe('Landing Page Modular E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve renderizar a HeroSection com a headline oficial e botão de acesso', async ({ page }) => {
    await expect(page.locator('.b360-hero-title')).toContainText(/Pare de perder vendas|Dados que Conectam/i);
    const ctaButton = page.locator('.b360-topbar button', { hasText: 'Acessar Plataforma' });
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('deve navegar corretamente pelas seções de âncora', async ({ page }) => {
    for (const [label, anchor] of [
      ['11 módulos', '#destaques'],
      ['IA Comercial', '#ia'],
      ['Integrações', '#ecossistema'],
    ] as const) {
      await page.locator('.b360-topnav a', { hasText: label }).click();
      await expect(page.locator(anchor)).toBeInViewport();
    }
  });

  test('deve exibir os 11 módulos integrados e abrir o detalhe do pilar', async ({ page }) => {
    const cards = page.locator('.b360-bento-grid .b360-feature-card');
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

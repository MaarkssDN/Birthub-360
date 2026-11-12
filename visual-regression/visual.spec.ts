import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail, waitForAppReady } from '../tests/e2e/helpers';
import {
  setupDeterministicState,
  waitForVisualContentReady,
  waitForVisualFonts,
} from './deterministic-state';

// Configs for screenshot masks
const MASKS = {
  dashboard: (page: import('@playwright/test').Page) => [
    page.getByTestId('dashboard-greeting'),
    page.getByTestId('clock-calendar-widget'),
    page.getByTestId('dashboard-analytics-chart'),
    page.getByTestId('revenue-signal-orb'),
  ],
  admin: (page: import('@playwright/test').Page) => [
    page.locator('table tbody tr th'),
  ],
};

const SCREENSHOT_OPTIONS = {
  fullPage: true,
  maxDiffPixels: 1300,
  animations: 'disabled' as const,
};

test.describe('Visual Regression', () => {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`Theme: ${theme}`, () => {
      test('Login', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await page.goto('/login');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`login-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Dashboard', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-dash-${theme}`) });
        await page.goto('/app/dashboard');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        // O card usa "Volume em Pipeline" no DOM; o visual em caixa alta vem do CSS.
        await expect(page.getByText(/Volume em Pipeline/i)).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByRole('button', { name: /Abrir Cockpit CRM/i })).toBeVisible({
          timeout: 15_000,
        });
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`dashboard-${theme}.png`, {
          ...SCREENSHOT_OPTIONS,
          mask: MASKS.dashboard(page),
        });
      });

      test('Workspace', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-workspace-${theme}`) });
        await page.goto('/app/workspace');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`workspace-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('CRM', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-crm-${theme}`) });
        await page.goto('/app/crm');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await expect(page.getByText(/Leads e pré-vendas|Negócios e fechamento/)).toBeVisible({
          timeout: 15_000,
        });
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`crm-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Prospecção', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-prospect-${theme}`) });
        await page.goto('/app/prospect');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await expect(page.getByRole('heading', { name: /Busca Direta/ })).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByRole('button', { name: /Consultar CNPJ/ })).toBeVisible({
          timeout: 15_000,
        });
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`prospect-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Inteligência', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-intelligence-${theme}`) });
        await page.goto('/app/intelligence');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`intelligence-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Analytics', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-analytics-${theme}`) });
        await page.goto('/app/analytics');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`analytics-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Integrações', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-integrations-${theme}`) });
        await page.goto('/app/integrations');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await expect(page.getByRole('button', { name: /Conectar WhatsApp/ })).toBeVisible({
          timeout: 15_000,
        });
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`integrations-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Calendário', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-calendar-${theme}`) });
        await page.goto('/app/calendar');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`calendar-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Automações', async ({ page }) => {
        await setupDeterministicState(page, theme);
        await signUp(page, { email: uniqueTestEmail(`visual-automations-${theme}`) });
        await page.goto('/app/automations');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`automations-${theme}.png`, SCREENSHOT_OPTIONS);
      });

      test('Administração - Module Access', async ({ page }) => {
        await setupDeterministicState(page, theme);
        // Nome curto e único: o default de signUp (`E2E Test User ${email}`) é longo e
        // quebra a célula em tablet/mobile; um nome fixo igual em todos os workers
        // colide com Organization.name (única, derivada do primeiro usuário).
        const adminEmail = uniqueTestEmail(`visual-admin-${theme}`);
        const adminName = `E2E ${adminEmail.split('@')[0].slice(-10)}`;
        await signUp(page, { email: adminEmail, name: adminName });
        await page.goto('/app/module-access');
        await waitForAppReady(page);
        await waitForVisualContentReady(page);
        // Garante que o painel carregou a linha real (spinner sumiu e a célula existe)
        await expect(page.locator('.animate-spin')).toHaveCount(0, { timeout: 15_000 });
        const userCell = page.locator('table tbody tr th').first();
        await expect(userCell).toBeVisible({ timeout: 15_000 });
        await expect(userCell.locator('span.font-bold.text-ink')).toHaveText(adminName);
        await expect(userCell.locator('div.text-xs')).toHaveText(/@birthhub360\.com\.br$/);

        // Pin do nome/e-mail só depois dos dados assentarem. O seletor antigo
        // `span.font-bold` também acertava o badge de papel ("Administrador"), e um
        // re-render tardio do React às vezes restaurava o e-mail único longo — a
        // caixa da célula mascarada ia de 60px para 106px no tablet entre runs.
        const pinUserCell = async () => {
          await userCell.evaluate((th) => {
            const name = th.querySelector('span.font-bold.text-ink');
            if (name) name.textContent = 'E2E Admin';
            const email = th.querySelector(':scope > div.text-xs');
            if (email) email.textContent = 'admin@birthhub360.com.br';
          });
        };
        await expect
          .poll(
            async () => {
              await pinUserCell();
              return userCell.locator('div.text-xs').innerText();
            },
            { timeout: 5_000 },
          )
          .toBe('admin@birthhub360.com.br');
        await expect(userCell.locator('span.font-bold.text-ink')).toHaveText('E2E Admin');
        // O badge de papel precisa permanecer o rótulo do produto, não o fixture de nome
        await expect(userCell.locator('span.font-bold').nth(1)).toHaveText('Administrador');

        await waitForVisualFonts(page);
        await expect(page).toHaveScreenshot(`admin-module-access-${theme}.png`, {
          ...SCREENSHOT_OPTIONS,
          mask: MASKS.admin(page),
        });
      });
    });
  }
});

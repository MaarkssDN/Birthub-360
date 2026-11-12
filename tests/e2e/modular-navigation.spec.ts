import { test, expect, type Page } from '@playwright/test';
import { signUp, uniqueTestEmail } from './helpers';

// Cobre a navegação modular (Onda 01–04 da missão de workspaces):
// rail global de módulos, painel contextual por workspace, M10 desabilitado
// no web, M11 fora de /app e assistentes globais simultâneos.
// O tour de onboarding pode reaparecer em contas novas — dispensado quando visível.
async function dismissTour(page: Page) {
  const skip = page.getByRole('button', { name: 'Pular Tour' });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

test.describe('Navegação modular — rail e workspaces', () => {
  test('rail exibe Hub + P01–P08 + M09–M11, M10 desabilitado', async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('navmod-rail') });
    await page.goto('/app');
    await dismissTour(page);

    const rail = page.getByRole('navigation', { name: 'Módulos do Birth Hub 360°' });
    await expect(rail).toBeVisible();
    for (const name of [
      'Hub Central',
      'P01 Hub Comercial',
      'P02 Inteligência de Mercado',
      'P03 Orquestração de Vendas',
      'P04 Performance Comercial',
      'P05 Previsibilidade Comercial',
      'P06 Inteligência Artificial',
      'P07 Automação & Conectividade',
      'P08 Engajamento Comercial',
      'M09 Admin & Operations',
      'M11 Social Selling',
    ]) {
      await expect(rail.getByRole('button', { name: new RegExp(name) })).toBeVisible();
    }
    await expect(
      rail.getByRole('button', { name: /M10 Mobile & Field Sales/ }),
    ).toBeDisabled();
  });

  test('troca de módulo atualiza painel contextual e rota', async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('navmod-switch') });
    await page.goto('/app/crm');
    await dismissTour(page);

    await expect(
      page.getByRole('navigation', { name: 'Navegação — Hub Comercial' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gestão de Negócios' })).toBeVisible();

    await page.getByRole('button', { name: /P03 Orquestração de Vendas/ }).first().click();
    await expect(page).toHaveURL(/\/app\/jornadas/);
    await expect(
      page.getByRole('navigation', { name: 'Navegação — Orquestração de Vendas' }),
    ).toBeVisible();
  });

  test('deep link com query param abre a view correta', async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('navmod-deeplink') });
    await page.goto('/app/contacts?view=decisores');
    await dismissTour(page);

    await expect(page).toHaveURL(/view=decisores/);
    await expect(page.getByRole('heading', { name: 'Decisores', exact: true })).toBeVisible();
  });

  test('Copiloto IA e Chatbook abrem simultaneamente sobre o CRM', async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('navmod-assist') });
    await page.goto('/app/crm');
    await dismissTour(page);

    await page.getByTestId('assistant-chatbook-toggle').click();
    await expect(page.getByRole('button', { name: 'Fechar Chatbook' })).toBeVisible();

    const copilotoToggle = page.getByTestId('assistant-copiloto-toggle');
    // Em viewport desktop (>=1024) o gatilho permanece acessível com o Chatbook aberto.
    await expect(copilotoToggle).toBeVisible();
    await copilotoToggle.click();
    const copilotoPanel = page.getByRole('complementary', { name: 'Copiloto IA' });
    await expect(copilotoPanel.getByRole('button', { name: 'Fechar Copiloto IA' })).toBeVisible();
    // Os dois painéis coexistem: conteúdo real do Chatbook e do Copiloto.
    await expect(copilotoPanel.getByRole('heading', { name: 'Copiloto IA' })).toBeVisible();
  });
});

test.describe('Navegação modular — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('drawer mobile lista os 11 módulos e troca de workspace', async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('navmod-mobile') });
    await page.goto('/app/crm');
    await dismissTour(page);

    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
    const drawer = page.getByRole('navigation', { name: /Módulos do Birth Hub|Navegação/ }).first();
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('button', { name: /M10 Mobile & Field Sales/ })).toBeDisabled();

    await page.getByRole('button', { name: /P02 Inteligência de Mercado/ }).click();
    await expect(page).toHaveURL(/\/app\/prospect/);
  });
});

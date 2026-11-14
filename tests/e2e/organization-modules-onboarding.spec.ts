import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail } from './helpers';

test.describe('Onboarding de Módulos da Organização', () => {
  test('O administrador é obrigado a configurar a org no primeiro acesso e o acesso fica restrito', async ({ page }) => {
    const email = uniqueTestEmail('onboarding-modules');
    const name = `E2E Org Onboarding ${email}`;

    // Cadastro e login reais; mantém o wizard para testar sua configuração neste spec.
    await signUp(page, { email, name, completeOnboarding: false });

    // 2. Garante que estamos na tela do wizard
    await expect(page).toHaveURL(/\/setup/);
    await expect(page.locator('text=Bem-vindo(a) ao Birth Hub 360')).toBeVisible();

    // 3. Escolhe módulos
    // O módulo base CRM Comercial é obrigatório (alwaysActive) e já vem pré-selecionado.
    // Seleciona um módulo opcional (Social Selling)
    const socialSellingCard = page.getByRole('button', { name: /Social Selling/i });
    await socialSellingCard.click();

    // 4. Continua o fluxo
    await page.getByRole('button', { name: /Continuar/i }).click();
    await expect(page.locator('text=Confirmar configuração')).toBeVisible();
    await page.getByRole('button', { name: /(Salvar e )?ir para o Dashboard/i }).click();

    // 5. Após setup, deve ir para /app
    await page.waitForURL('**/app');

    // 6. O Hub Central permanece acessível no rail e no painel contextual.
    const rail = page.getByRole('navigation', { name: 'Módulos do Birth Hub 360°' });
    await expect(rail).toBeVisible();
    await expect(rail.getByTestId('module-rail-hub')).toHaveAttribute('aria-current', 'page');
    const hubNavigation = page.getByRole('navigation', { name: 'Navegação — Hub Central' });
    await expect(hubNavigation).toBeVisible();
    // O registry do Hub Central (moduleRegistry.ts) não tem mais item "Visão Geral" —
    // os itens atuais são "Portal dos 11 Módulos", "Cockpit Operacional", "Meu Espaço",
    // "Plano Diário" e "Notificações".
    await expect(
      hubNavigation.getByRole('button', { name: 'Portal dos 11 Módulos', exact: true }),
    ).toBeVisible();

    // 7. Se recarregar a página, não pode voltar pro setup
    await page.goto('/app');
    await page.waitForURL('**/app');
    await expect(page).not.toHaveURL(/\/setup/);
  });
});

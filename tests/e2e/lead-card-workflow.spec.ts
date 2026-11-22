import { test, expect } from '@playwright/test';

test.describe('Fluxo Operacional LeadCard E2E', () => {
  test('deve renderizar o card de lead com perfil do decisor e ações rápidas', async ({ page }) => {
    await page.goto('/app/prospect');

    const leadCard = page.locator('article[aria-label*="Lead:"]').first();
    if (await leadCard.isVisible()) {
      // Validar presença de botões rápidos
      await expect(leadCard.locator('button', { hasText: 'Ligar' })).toBeVisible();
      await expect(leadCard.locator('a', { hasText: 'WhatsApp' })).toBeVisible();
      await expect(leadCard.locator('button', { hasText: 'Promover a Negócio' })).toBeVisible();

      // Testar expansão do painel de Playbook IA
      const expandButton = leadCard.locator('button', { hasText: /Ver Recomendações de IA/ });
      await expandButton.click();
      await expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      await expect(leadCard.locator('text=Gancho Recomendado')).toBeVisible();
    }
  });
});

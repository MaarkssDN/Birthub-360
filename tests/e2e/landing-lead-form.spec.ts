import { expect, test, type Page } from '@playwright/test';

async function openLeadForm(page: Page) {
  await page.goto('/');
  await page.locator('#demonstracao').scrollIntoViewIfNeeded();
  await expect(page.locator('#lead-nome')).toBeVisible();
}

async function fillLeadForm(page: Page, options?: { consent?: boolean }) {
  await page.locator('#lead-nome').fill('Mariana Albuquerque');
  await page.locator('#lead-email').fill('mariana@vanguarda.com.br');
  await page.locator('#lead-whatsapp').fill('(11) 99999-9999');
  if (options?.consent ?? true) {
    await page.locator('#lead-consent').check();
  }
}

async function submitLeadForm(page: Page) {
  await page.getByRole('button', { name: /GARANTIR MINHA DEMONSTRAÇÃO GRATUITA/i }).click();
}

async function mockDemoLeads(page: Page, status: number, body: unknown) {
  await page.route('**/api/public/demo-leads', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

test.describe('Formulário de lead da landing', () => {
  test('deve iniciar o consentimento desmarcado e bloquear o envio sem opt-in', async ({
    page,
  }) => {
    const posts: string[] = [];
    await page.route('**/api/public/demo-leads', async (route) => {
      if (route.request().method() === 'POST') {
        posts.push(route.request().url());
        await route.abort();
        return;
      }
      await route.continue();
    });

    await openLeadForm(page);
    const consent = page.locator('#lead-consent');
    await expect(consent).not.toBeChecked();

    await fillLeadForm(page, { consent: false });
    await submitLeadForm(page);

    await expect(page.locator('#lead-consent-error')).toBeVisible();
    await expect(consent).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByText(/Recebemos seus dados\. Nossa equipe vai entrar em contato\./i),
    ).toHaveCount(0);
    expect(posts).toHaveLength(0);
  });

  test('deve exibir sucesso honesto após 202 com ok:true', async ({ page }) => {
    await mockDemoLeads(page, 202, { ok: true });
    await openLeadForm(page);
    await fillLeadForm(page);
    await submitLeadForm(page);

    await expect(
      page.getByText(/Recebemos seus dados\. Nossa equipe vai entrar em contato\./i),
    ).toBeVisible();
  });

  test('deve exibir erro de campo quando o endpoint responde 400 com fields', async ({
    page,
  }) => {
    await mockDemoLeads(page, 400, {
      ok: false,
      error: 'invalid_payload',
      fields: { email: 'invalid' },
    });
    await openLeadForm(page);
    await fillLeadForm(page);
    await submitLeadForm(page);

    await expect(page.locator('#lead-email-error')).toBeVisible();
    await expect(page.locator('#lead-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByText(/Recebemos seus dados\. Nossa equipe vai entrar em contato\./i),
    ).toHaveCount(0);
  });

  test('deve exibir mensagem específica em 429 rate_limited', async ({ page }) => {
    await mockDemoLeads(page, 429, { ok: false, error: 'rate_limited' });
    await openLeadForm(page);
    await fillLeadForm(page);
    await submitLeadForm(page);

    await expect(page.locator('#lead-form-alert')).toContainText(/5 envios a cada 15 minutos/i);
  });

  test('deve exibir mensagem específica em 503 unavailable', async ({ page }) => {
    await mockDemoLeads(page, 503, { ok: false, error: 'unavailable' });
    await openLeadForm(page);
    await fillLeadForm(page);
    await submitLeadForm(page);

    await expect(page.locator('#lead-form-alert')).toContainText(/temporariamente indisponível/i);
  });
});

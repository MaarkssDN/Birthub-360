import { expect, test } from '@playwright/test';

test.describe('Birthub 360 — Landing Regeneration V4', () => {
  test('hero legível, seções, cards e acesso ao login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const hero = page.locator('.lp-hero');
    await expect(hero.locator('h1')).toContainText('Revenue Command Center');
    await expect(hero.locator('.lp-hero-sub')).toContainText('CRM B2B');

    // Títulos de seção usam cor temática (não preto/branco puro).
    const headings = await page
      .locator('.lp-sec-hdr h2, .lp-cta h2')
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.getBoundingClientRect().width > 0)
          .map((element) => getComputedStyle(element).color),
      );
    expect(headings.length).toBeGreaterThan(3);
    for (const color of headings) {
      expect(color).not.toBe('rgb(0, 0, 0)');
      expect(color).not.toBe('rgb(255, 255, 255)');
    }

    const cards = page.locator('.lp-cards-grid .lp-card');
    await expect(cards).toHaveCount(11);
    await expect(cards.first()).toBeVisible();

    // Seções estruturais da landing atual.
    await expect(page.locator('#modules')).toBeAttached();
    await expect(page.locator('#how')).toBeAttached();
    await expect(page.locator('#security')).toBeAttached();
    await expect(page.locator('.lp-cmd-panel')).toBeAttached();
    await expect(page.locator('.lp-flow-step')).toHaveCount(4);
    await expect(page.locator('.lp-chip')).toHaveCount(10);
    await expect(page.locator('.lp-sec-item')).toHaveCount(4);

    for (const section of await page.locator('.lp-sec, .lp-cta').all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await test.info().attach('landing-v4-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await page.getByRole('button', { name: 'Acessar plataforma', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.lp-login-card')).toBeVisible();
    await expect(page.getByPlaceholder('seu@email.com', { exact: true })).toBeVisible();
  });

  test('mobile sem estouro horizontal e movimento reduzido', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('.lp-hero h1')).toContainText('Revenue Command Center');
    await expect(page.locator('.lp-cards-grid .lp-card')).toHaveCount(11);
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);

    for (const section of await page.locator('.lp-sec, .lp-cta').all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await test.info().attach('landing-v4-mobile', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});

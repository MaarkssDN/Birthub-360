import { expect, test } from '@playwright/test';

test.describe('Birthub 360 — Landing Regeneration V4', () => {
  test('hero legível, títulos cromáticos, cards e acesso ao login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const hero = page.locator('.b360-hero-title');
    await expect(hero).toBeVisible();
    const lines = hero.locator('.b360-hero-line');
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(0)).toContainText('Dados que conectam.');
    await expect(lines.nth(1)).toContainText('Inteligência que decide.');
    await expect(lines.nth(2)).toContainText('Execução que acontece.');

    // O espaço entre palavras não pode depender de whitespace colapsado.
    const spacing = await lines.first().locator('.b360-word').evaluateAll((words) => {
      if (words.length < 2) return 0;
      const first = words[0].getBoundingClientRect();
      const second = words[1].getBoundingClientRect();
      return second.left - first.right;
    });
    expect(spacing).toBeGreaterThan(2);

    const headings = await page.locator('.b360-adaptive-landing :is(h1,h2,h3,h4,h5,h6)').evaluateAll((elements) =>
      elements
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => getComputedStyle(element).color),
    );
    expect(headings.length).toBeGreaterThan(3);
    for (const color of headings) {
      expect(color).not.toBe('rgb(0, 0, 0)');
      expect(color).not.toBe('rgb(255, 255, 255)');
    }

    const cards = page.locator('.b360-bento-grid .b360-feature-card');
    await expect(cards).toHaveCount(11);
    await expect(cards.first()).toBeVisible();
    await expect(page.locator('.b360-gravity-section')).toHaveCount(0);
    await expect(page.locator('.b360-fan-deck')).toHaveCount(0);

    await test.info().attach('landing-v4-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await page.locator('.b360-hero-neon-btn').click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('mobile sem estouro horizontal e movimento reduzido', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('.b360-hero-title')).toBeVisible();
    await expect(page.locator('.b360-bento-grid .b360-feature-card')).toHaveCount(11);
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
    const words = page.locator('.b360-hero-title .b360-word');
    if (await words.count()) {
      const opacity = await words.first().evaluate((element) => getComputedStyle(element).opacity);
      expect(opacity).toBe('1');
    }

    await test.info().attach('landing-v4-mobile', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});

// Captura de evidências visuais da Landing (atual) e do protótipo V2.
// Uso: node docs/landing-v2/scripts/capture.mjs <before|proto>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const mode = process.argv[2] ?? 'before';
const root = path.resolve('docs/landing-v2');
const out = path.join(root, 'evidence', mode);
mkdirSync(out, { recursive: true });

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
const themes = ['light', 'dark'];

const url =
  mode === 'before'
    ? 'http://localhost:5199/'
    : pathToFileURL(path.join(root, 'prototype', 'index.html')).href;

const browser = await chromium.launch();
for (const [vpName, vp] of Object.entries(viewports)) {
  for (const theme of themes) {
    const ctx = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: vpName === 'mobile' ? 2 : 1,
      colorScheme: theme,
      reducedMotion: 'reduce',
    });
    await ctx.addInitScript((t) => {
      window.localStorage.setItem('birthhub360_theme', t);
      window.localStorage.setItem('bh-proto-theme', t);
    }, theme);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    // Força o tema (protótipo usa data-theme; app usa classe .light)
    if (mode === 'proto') {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    }
    // Carrega imagens lazy percorrendo a página
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const base = `${vpName}-${theme}`;
    await page.screenshot({ path: path.join(out, `${base}-full.png`), fullPage: true });
    await page.screenshot({ path: path.join(out, `${base}-hero.png`) });

    if (mode === 'proto') {
      // Oculta nav fixa durante recortes de seções internas para não sobrepor títulos nas evidências
      await page.evaluate(() => {
        const nav = document.querySelector('.nav-wrap');
        if (nav) nav.style.display = 'none';
      });
      for (const id of ['pilares', 'problema', 'comando', 'jornada', 'ia', 'ecossistema', 'cta', 'rodape']) {
        const el = page.locator(`#${id}`);
        if (await el.count()) {
          await el.first().scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          await el.first().screenshot({ path: path.join(out, `${base}-${id}.png`) });
        }
      }
    } else {
      for (const id of ['destaques', 'problema', 'plataforma', 'fluxo', 'ia', 'ecossistema']) {
        const el = page.locator(`#${id}`);
        if (await el.count()) {
          await el.first().scrollIntoViewIfNeeded();
          await page.waitForTimeout(250);
          await el.first().screenshot({ path: path.join(out, `${base}-${id}.png`) });
        }
      }
    }
    console.log('ok', base);
    await ctx.close();
  }
}
await browser.close();

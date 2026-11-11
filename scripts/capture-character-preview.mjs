// Captura evidência visual da galeria estática preview-29.html (29 personagens).
// Uso: node scripts/capture-character-preview.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.agents', 'runs', 'evidencias-personagens-29');
mkdirSync(OUT, { recursive: true });

const BASE =
  'file:///' +
  join(ROOT, 'identidade-visual', 'birthhub360', 'preview-29.html').replace(/\\/g, '/');

const shots = [
  ['galeria-dark-idle', 'theme=dark&state=idle'],
  ['galeria-light-idle', 'theme=light&state=idle'],
  ['galeria-dark-processing', 'theme=dark&state=processing'],
  ['galeria-dark-error', 'theme=dark&state=error'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
for (const [name, qs] of shots) {
  await page.goto(`${BASE}?${qs}`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log(`OK ${name}.png`);
}
await browser.close();

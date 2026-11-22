import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'file:///' + join(ROOT, 'identidade-visual', 'birthhub360', 'preview-29.html').replace(/\\/g, '/');
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(BASE);
await p.waitForTimeout(1200);
const r = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')];
  const broken = imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.src);
  return { total: imgs.length, loaded: imgs.length - broken.length, broken };
});
console.log(JSON.stringify(r, null, 2));
await b.close();

// Verificação em navegador real. Uso: NODE_PATH=/opt/node-tools/node_modules node _src/verificar.cjs <baseURL>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const base = process.argv[2] || 'http://localhost:8791'; const url = base + '/design-lab/identidade-v2/02-brandbook/index.html';
const out = path.join(__dirname, '..', 'evidencias');
(async () => {
  const b = await chromium.launch(); const res = { url, runs: [] };
  for (const [name, w, h] of [['desktop-1440', 1440, 900], ['tablet-768', 768, 1024], ['mobile-390', 390, 844]]) {
    for (const theme of ['dark', 'light']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
      const errs = [], failed = [];
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
      p.on('requestfailed', r => failed.push(r.url())); p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
      await p.goto(url, { waitUntil: 'networkidle' });
      if (theme === 'light') await p.click('#theme-btn');
      await p.waitForTimeout(1300);
      const info = await p.evaluate(async () => {
        await Promise.all(Array.from(document.images).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
        const imgs = Array.from(document.images); const brokenImgs = imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));
        const ids = new Set(Array.from(document.querySelectorAll('[id]')).map(e => e.id));
        const badLinks = Array.from(document.querySelectorAll('a[href^="#"]')).map(a => a.getAttribute('href').slice(1)).filter(h => h && !ids.has(h));
        const dupIds = Array.from(document.querySelectorAll('[id]')).map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i);
        const fonts = Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const wide = Array.from(document.querySelectorAll('main *')).filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 2 && r.width > 0 && !e.closest('.tbl,.cm-wrap'); }).slice(0, 5).map(e => e.tagName + '.' + e.className);
        return { theme: document.documentElement.dataset.theme, crCheck: document.documentElement.dataset.crCheck, rules: document.querySelectorAll('.rule').length, imgs: imgs.length, brokenImgs, badLinks, dupIds, chars: document.querySelectorAll('.ch-i').length, overflow, wide, seal: document.querySelector('.draft').innerText.slice(0, 40), mismatch: document.querySelectorAll('[data-cr-mismatch]').length, fonts: fonts.length };
      });
      await p.screenshot({ path: `${out}/${name}-${theme}-topo.png` });
      if (w !== 768) { await p.screenshot({ path: `${out}/${name}-${theme}-pagina.png`, fullPage: true }); }
      res.runs.push({ name, theme, errs, failed, ...info }); await ctx.close();
    }
  }
  // interações (desktop)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'networkidle' });
  const inter = {};
  await p.click('[data-filter="provisoria"]'); inter.filtroProv = await p.evaluate(() => Array.from(document.querySelectorAll('.rule')).filter(r => !r.hidden).length);
  await p.click('[data-filter="confirmada"]'); inter.filtroConf = await p.evaluate(() => Array.from(document.querySelectorAll('.rule')).filter(r => !r.hidden).length);
  await p.click('[data-filter="all"]');
  await p.click('[data-brand-sim="alt"]'); inter.grafiaAlt = await p.evaluate(() => [document.title, document.querySelector('h1 [data-brand]').textContent, document.querySelectorAll('[data-brand]').length]);
  await p.click('[data-brand-sim="main"]');
  await p.click('.rail a[href="#paleta"]'); await p.waitForTimeout(900); inter.scrollspy = await p.evaluate(() => document.querySelector('.rail a[aria-current="true"]')?.textContent);
  await p.keyboard.press('Tab'); inter.focoVisivel = await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return e.tagName + ' outline:' + s.outlineStyle + ' ' + s.outlineWidth; });
  const rm = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const q = await rm.newPage(); await q.goto(url, { waitUntil: 'networkidle' });
  inter.reducedMotion = await q.evaluate(() => getComputedStyle(document.querySelector('.dial .orb')).animationDuration);
  const mob = await b.newContext({ viewport: { width: 390, height: 844 } }); const m = await mob.newPage(); await m.goto(url, { waitUntil: 'networkidle' });
  await m.click('#menu-btn'); await m.waitForTimeout(400); inter.menuMobile = await m.evaluate(() => document.getElementById('rail').classList.contains('open') + ' expanded=' + document.getElementById('menu-btn').getAttribute('aria-expanded'));
  await m.screenshot({ path: `${out}/mobile-390-dark-menu.png` });
  res.interacoes = inter;
  // assets referenciados em arquivo
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'); const missing = [];
  for (const mm of html.matchAll(/(?:src|href)="(\.\.?\/[^"#]+)"/g)) { if (!fs.existsSync(path.resolve(path.join(__dirname, '..'), mm[1]))) missing.push(mm[1]); }
  res.arquivosAusentes = missing;
  fs.writeFileSync(path.join(out, 'verificacao.json'), JSON.stringify(res, null, 2));
  console.log(JSON.stringify(res, null, 1).slice(0, 6000)); await b.close();
})();

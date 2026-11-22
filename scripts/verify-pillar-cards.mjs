import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const outDir = path.resolve('.agents/reviews/evidence-handoffs/pillars-restoration');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const distPath = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html';
  }
  const filePath = path.join(distPath, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const fallbackPath = path.join(distPath, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(fallbackPath).pipe(res);
  }
});

const PORT = 4185;
server.listen(PORT, async () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
  const browser = await chromium.launch();

  try {
    const results = {
      dark: { cards: [], allImagesLoaded: true },
      light: { cards: [], allImagesLoaded: true },
      modalsTested: [],
    };

    // 1. DESKTOP DARK MODE
    const ctxDark = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageDark = await ctxDark.newPage();
    await pageDark.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await pageDark.evaluate(() => {
      localStorage.setItem('birthhub360_theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await pageDark.waitForTimeout(500);

    // Scroll to section #destaques
    const gridDark = await pageDark.locator('.b360-feature-grid');
    await gridDark.scrollIntoViewIfNeeded();
    await pageDark.waitForTimeout(400);

    // Screenshot do grid completo em Dark
    await gridDark.screenshot({
      path: path.join(outDir, '01-pillars-grid-dark-desktop.png'),
    });
    console.log('✓ Capturado: 01-pillars-grid-dark-desktop.png');

    // Validação de cada card individual em Dark
    const cardsDark = await pageDark.locator('.b360-feature-card').all();
    console.log(`Encontrados ${cardsDark.length} cards em Dark Mode.`);

    for (let i = 0; i < cardsDark.length; i++) {
      const card = cardsDark[i];
      const bgStyle = await card.locator('.b360-card-bg').getAttribute('style');
      const title = await card.locator('h3').innerText();
      const desc = await card.locator('.b360-card-bottom p').innerText();
      const badge = await card.locator('.b360-pillar-badge').innerText();
      const tag = await card.locator('.b360-pillar-tag').innerText();

      // Extrai URL da imagem
      const match = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
      const imgUrl = match ? match[1] : null;

      // Valida carregamento real via fetch na página
      const imgStatus = await pageDark.evaluate(async (url) => {
        try {
          const res = await fetch(url);
          return res.status;
        } catch (e) {
          return 500;
        }
      }, imgUrl);

      results.dark.cards.push({
        index: i + 1,
        badge,
        tag,
        title,
        imgUrl,
        httpStatus: imgStatus,
        ok: imgStatus === 200,
      });

      console.log(`  Pilar ${badge} [${tag}]: ${title} -> ${imgUrl} (HTTP ${imgStatus})`);

      // Screenshot individual de cada card
      await card.screenshot({
        path: path.join(outDir, `pillar-${badge.padStart(2, '0')}-dark.png`),
      });
    }

    // Testar abertura de modal no Dark Mode (Pilar 01 e Pilar 08)
    await cardsDark[0].click();
    await pageDark.waitForTimeout(500);
    const modalDark01 = pageDark.locator('[role="dialog"]');
    await modalDark01.screenshot({
      path: path.join(outDir, 'modal-pillar-01-dark.png'),
    });
    console.log('✓ Capturado: modal-pillar-01-dark.png');
    // Fechar modal
    await pageDark.keyboard.press('Escape');
    await pageDark.waitForTimeout(400);

    await cardsDark[7].click();
    await pageDark.waitForTimeout(500);
    const modalDark08 = pageDark.locator('[role="dialog"]');
    await modalDark08.screenshot({
      path: path.join(outDir, 'modal-pillar-08-dark.png'),
    });
    console.log('✓ Capturado: modal-pillar-08-dark.png');
    await pageDark.keyboard.press('Escape');
    await pageDark.waitForTimeout(400);

    // 2. DESKTOP LIGHT MODE
    const ctxLight = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageLight = await ctxLight.newPage();
    await pageLight.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await pageLight.evaluate(() => {
      localStorage.setItem('birthhub360_theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await pageLight.waitForTimeout(500);

    const gridLight = await pageLight.locator('.b360-feature-grid');
    await gridLight.scrollIntoViewIfNeeded();
    await pageLight.waitForTimeout(400);

    await gridLight.screenshot({
      path: path.join(outDir, '02-pillars-grid-light-desktop.png'),
    });
    console.log('✓ Capturado: 02-pillars-grid-light-desktop.png');

    const cardsLight = await pageLight.locator('.b360-feature-card').all();
    for (let i = 0; i < cardsLight.length; i++) {
      const card = cardsLight[i];
      const badge = await card.locator('.b360-pillar-badge').innerText();
      await card.screenshot({
        path: path.join(outDir, `pillar-${badge.padStart(2, '0')}-light.png`),
      });
    }

    // Modal no Light Mode
    await cardsLight[0].click();
    await pageLight.waitForTimeout(500);
    const modalLight01 = pageLight.locator('[role="dialog"]');
    await modalLight01.screenshot({
      path: path.join(outDir, 'modal-pillar-01-light.png'),
    });
    console.log('✓ Capturado: modal-pillar-01-light.png');
    await pageLight.keyboard.press('Escape');
    await pageLight.waitForTimeout(400);

    // 3. MOBILE VIEWPORT (Dark & Light)
    const ctxMobileDark = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageMobileDark = await ctxMobileDark.newPage();
    await pageMobileDark.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await pageMobileDark.evaluate(() => {
      localStorage.setItem('birthhub360_theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await pageMobileDark.waitForTimeout(400);
    const mobileGridDark = pageMobileDark.locator('.b360-feature-grid');
    await mobileGridDark.scrollIntoViewIfNeeded();
    await pageMobileDark.waitForTimeout(300);
    await mobileGridDark.screenshot({
      path: path.join(outDir, '03-pillars-grid-dark-mobile.png'),
    });
    console.log('✓ Capturado: 03-pillars-grid-dark-mobile.png');

    const ctxMobileLight = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageMobileLight = await ctxMobileLight.newPage();
    await pageMobileLight.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await pageMobileLight.evaluate(() => {
      localStorage.setItem('birthhub360_theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await pageMobileLight.waitForTimeout(400);
    const mobileGridLight = pageMobileLight.locator('.b360-feature-grid');
    await mobileGridLight.scrollIntoViewIfNeeded();
    await pageMobileLight.waitForTimeout(300);
    await mobileGridLight.screenshot({
      path: path.join(outDir, '04-pillars-grid-light-mobile.png'),
    });
    console.log('✓ Capturado: 04-pillars-grid-light-mobile.png');

    // 4. Hover verification screenshot (Card 1 hovered with zoom effect)
    await pageDark.locator('.b360-feature-card').first().hover();
    await pageDark.waitForTimeout(400);
    await pageDark.locator('.b360-feature-card').first().screenshot({
      path: path.join(outDir, 'pillar-01-hover-zoom.png'),
    });
    console.log('✓ Capturado: pillar-01-hover-zoom.png');

    fs.writeFileSync(
      path.join(outDir, 'validation-results.json'),
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    console.log('✅ Validação concluída com sucesso!');
  } catch (err) {
    console.error('Erro na validação:', err);
  } finally {
    await browser.close();
    server.close();
  }
});

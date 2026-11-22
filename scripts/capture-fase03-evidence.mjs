import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const outDir = path.resolve('.agents/reviews/evidence-handoffs/fase-03');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Servidor estático simples para a pasta dist
const distPath = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
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
    // Fallback SPA para index.html
    const fallbackPath = path.join(distPath, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(fallbackPath).pipe(res);
  }
});

const PORT = 4173;
server.listen(PORT, async () => {
  console.log(`Servidor de preview rodando em http://localhost:${PORT}`);
  const browser = await chromium.launch();

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  try {
    for (const vp of viewports) {
      // 1. Landing Dark Mode
      const contextDark = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const pageDark = await contextDark.newPage();
      await pageDark.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
      // Assegurar tema dark
      await pageDark.evaluate(() => {
        localStorage.setItem('birthhub360_theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await pageDark.waitForTimeout(500);
      await pageDark.screenshot({
        path: path.join(outDir, `landing-dark-${vp.name}.png`),
        fullPage: vp.name === 'mobile',
      });
      console.log(`✓ Capturado: landing-dark-${vp.name}.png`);

      // 2. Landing Light Mode
      const contextLight = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const pageLight = await contextLight.newPage();
      await pageLight.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
      await pageLight.evaluate(() => {
        localStorage.setItem('birthhub360_theme', 'light');
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      });
      await pageLight.waitForTimeout(500);
      await pageLight.screenshot({
        path: path.join(outDir, `landing-light-${vp.name}.png`),
        fullPage: vp.name === 'mobile',
      });
      console.log(`✓ Capturado: landing-light-${vp.name}.png`);

      // 3. Login Screen (Dark & Light)
      if (vp.name !== 'tablet') {
        // Login Dark
        const pageLoginDark = await contextDark.newPage();
        await pageLoginDark.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle' });
        await pageLoginDark.evaluate(() => {
          localStorage.setItem('birthhub360_theme', 'dark');
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          document.documentElement.setAttribute('data-theme', 'dark');
        });
        await pageLoginDark.waitForTimeout(500);
        await pageLoginDark.screenshot({
          path: path.join(outDir, `login-dark-${vp.name}.png`),
        });
        console.log(`✓ Capturado: login-dark-${vp.name}.png`);

        // Login Light
        const pageLoginLight = await contextLight.newPage();
        await pageLoginLight.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle' });
        await pageLoginLight.evaluate(() => {
          localStorage.setItem('birthhub360_theme', 'light');
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        });
        await pageLoginLight.waitForTimeout(500);
        await pageLoginLight.screenshot({
          path: path.join(outDir, `login-light-${vp.name}.png`),
        });
        console.log(`✓ Capturado: login-light-${vp.name}.png`);
      }

      await contextDark.close();
      await contextLight.close();
    }

    // 4. Capturar Detalhe dos Pilares (Modal) em Dark e Light
    const contextPillars = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const pagePillar = await contextPillars.newPage();
    await pagePillar.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await pagePillar.evaluate(() => {
      localStorage.setItem('birthhub360_theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
    await pagePillar.waitForTimeout(500);
    // Clicar no primeiro pilar
    const firstPillar = await pagePillar.$('.b360-feature-card');
    if (firstPillar) {
      await firstPillar.click();
      await pagePillar.waitForTimeout(500);
      await pagePillar.screenshot({
        path: path.join(outDir, 'modal-pilar-01-dark-desktop.png'),
      });
      console.log('✓ Capturado: modal-pilar-01-dark-desktop.png');
    }

    // Modal Light
    await pagePillar.evaluate(() => {
      localStorage.setItem('birthhub360_theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    });
    await pagePillar.waitForTimeout(500);
    await pagePillar.screenshot({
      path: path.join(outDir, 'modal-pilar-01-light-desktop.png'),
    });
    console.log('✓ Capturado: modal-pilar-01-light-desktop.png');

    await contextPillars.close();
    console.log('🎉 Todas as evidências visuais foram capturadas com sucesso!');
  } catch (err) {
    console.error('Erro ao capturar evidências:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});

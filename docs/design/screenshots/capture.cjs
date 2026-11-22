const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  const capture = async (path, viewport, name) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Allow animations to settle
    await page.screenshot({ path: `docs/design/screenshots/current-redesign/${name}`, fullPage: true });
    await context.close();
    console.log(`Captured ${name}`);
  };

  const desktop = { width: 1440, height: 900 };
  const mobile = devices['iPhone 12'].viewport; // 390x844

  const routes = [
    { path: '/#/', folder: '01-core', name: 'dashboard' },
    { path: '/#/login', folder: '01-core', name: 'login' },
    { path: '/#/intelligence', folder: '02-intelligence', name: 'intelligence' },
    { path: '/#/agent-registry', folder: '03-voice-hub', name: 'agent-registry' },
    { path: '/#/observability', folder: '03-voice-hub', name: 'observability' },
    { path: '/#/results', folder: '03-voice-hub', name: 'results' },
    { path: '/#/developers', folder: '03-voice-hub', name: 'developers' },
    { path: '/#/hub', folder: '04-hub', name: 'hub' },
    { path: '/#/prospecting', folder: '05-prospecting', name: 'prospecting' },
    { path: '/#/style-showcase', folder: '06-ui-components', name: 'style-showcase' },
    { path: '/#/landing-innovative', folder: '03-voice-hub', name: 'landing-innovative' },
  ];

  for (const r of routes) {
    await capture(r.path, desktop, `${r.folder}/${r.name}-desktop.png`);
    await capture(r.path, mobile, `07-mobile/${r.name}-mobile.png`);
  }

  await browser.close();
})();

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3024';

const ROUTES = [
  { path: '/', name: 'Welcome Screen', public: true },
  { path: '/login', name: 'Login Screen', public: true },
  { path: '/welcome', name: 'Welcome Screen (alias)', public: true },
  { path: '/privacy', name: 'Privacy Policy', public: true },
  { path: '/terms', name: 'Terms of Use', public: true },
  { path: '/social-selling', name: 'Social Selling Hub', public: false },
  { path: '/app', name: 'Dashboard', public: false },
  { path: '/app/dashboard', name: 'Dashboard (alias)', public: false },
  { path: '/app/workspace', name: 'Workspace Home', public: false },
  { path: '/app/prospect', name: 'Prospecting Hub', public: false },
  { path: '/app/crm', name: 'CRM Board', public: false },
  { path: '/app/crm360', name: 'CRM360 Overview', public: false },
  { path: '/app/mesa-tratamento', name: 'Mesa de Tratamento', public: false },
  { path: '/app/intelligence', name: 'Intelligence Hub', public: false },
  { path: '/app/companies', name: 'Companies List', public: false },
  { path: '/app/contacts', name: 'Contacts List', public: false },
  { path: '/app/activities', name: 'Activities List', public: false },
  { path: '/app/voice-hub', name: 'Voice Studio', public: false },
  { path: '/app/cadence', name: 'Cadence Hub', public: false },
  { path: '/app/playbooks', name: 'Playbooks Hub', public: false },
  { path: '/app/jornadas', name: 'Jornadas Comerciais', public: false },
  { path: '/app/processos', name: 'Processos de Vendas', public: false },
  { path: '/app/roteiros', name: 'Roteiros Hub', public: false },
  { path: '/app/chatbook', name: 'Chatbook Hub', public: false },
  { path: '/app/roleplay', name: 'Roleplay Hub', public: false },
  { path: '/app/qualification_matrix', name: 'Qualification Matrix', public: false },
  { path: '/app/objections_matrix', name: 'Objections Matrix', public: false },
  { path: '/app/topic_training', name: 'Topic Training Academy', public: false },
  { path: '/app/bitrix', name: 'Bitrix Guide Hub', public: false },
  { path: '/app/reports', name: 'Reports Hub', public: false },
  { path: '/app/integrations', name: 'Integrations', public: false },
  { path: '/app/knowledge', name: 'Knowledge Base', public: false },
  { path: '/app/analytics', name: 'Analytics', public: false },
  { path: '/app/winloss', name: 'Win/Loss Analysis', public: false },
  { path: '/app/market-intelligence', name: 'Market Intelligence', public: false },
  { path: '/app/market-intelligence/hub', name: 'Inteligência de Mercado Hub', public: false },
  { path: '/app/prospect/inteligente', name: 'Prospecção Inteligente', public: false },
  { path: '/app/commercial_intelligence', name: 'Commercial Intelligence', public: false },
  { path: '/app/daily-plan', name: 'Daily Plan', public: false },
  { path: '/app/sdr-diagnostic', name: 'SDR Diagnostic', public: false },
  { path: '/app/calendar', name: 'Calendar', public: false },
  { path: '/app/notifications', name: 'Notifications', public: false },
  { path: '/app/automations', name: 'Automations', public: false },
  { path: '/app/usage', name: 'Usage (Admin)', public: false },
  { path: '/app/editor', name: 'Document Editor', public: false },
  { path: '/app/team', name: 'Team (Admin)', public: false },
  { path: '/app/module-access', name: 'Module Access (Admin)', public: false },
  { path: '/app/settings', name: 'Settings', public: false },
  { path: '/app/forecast', name: 'Forecast Hub', public: false },
  { path: '/app/metas', name: 'Metas Hub', public: false },
  { path: '/app/pipeline_ponderado', name: 'Pipeline Ponderado', public: false },
];

test.describe('Visual Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
  });

  ROUTES.forEach((route) => {
    test(`Capture: ${route.name} (${route.path})`, async ({ page }) => {
      const url = `${BASE_URL}${route.path}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for page to be ready
        await page.waitForTimeout(2000);

        // Take full page screenshot
        const safeName = route.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await page.screenshot({
          path: `C:\\Github\\Birthub-360\\visual-audit\\${safeName}.png`,
          fullPage: true,
        });

        // Capture accessibility tree
        const accessibilityTree = await page.accessibility.snapshot();

        // Capture page title
        const title = await page.title();

        // Capture URL
        const currentUrl = page.url();

        // Save metadata
        const metadata = {
          route: route.path,
          name: route.name,
          title,
          url: currentUrl,
          public: route.public,
          timestamp: new Date().toISOString(),
          accessible: !!accessibilityTree,
        };

        // Save metadata to JSON
        const fs = await import('fs');
        const path = await import('path');
        const metadataPath = path.join(
          'C:\\Github\\Birthub-360\\visual-audit',
          `${safeName}-metadata.json`
        );
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        console.log(`✓ Captured: ${route.name}`);
      } catch (error) {
        console.error(`✗ Failed: ${route.name}`, error.message);
        // Save error metadata
        const fs = await import('fs');
        const path = await import('path');
        const safeName = route.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const errorMetadata = {
          route: route.path,
          name: route.name,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
        const errorPath = path.join(
          'C:\\Github\\Birthub-360\\visual-audit',
          `${safeName}-error.json`
        );
        fs.writeFileSync(errorPath, JSON.stringify(errorMetadata, null, 2));
      }
    });
  });
});

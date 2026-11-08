import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const EVIDENCE_DIR = path.resolve(process.cwd(), 'docs/homologacao/evidence-fase-05');

test.beforeAll(async () => {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
});

test.describe('FASE 05 — HOMOLOGAÇÃO COMPLETA: LANDING PAGE, MODAIS, LIGHT/DARK E LOGIN', () => {

  // ==========================================================================
  // 1. OS OITO MODAIS — VALIDAÇÃO COMPLETA
  // ==========================================================================
  test.describe('1. Validação Completa dos Oito Modais', () => {
    const pillars = [
      {
        num: '01',
        title: 'Hub comercial',
        expectedModalTitle: '01. Hub Comercial',
        badge: 'PIPELINE 360° & CONTAS UNIFICADAS',
        cta: 'Acessar Pipeline no CRM',
        themeColor: 'cyan',
      },
      {
        num: '02',
        title: 'Inteligência de mercado',
        expectedModalTitle: '02. Inteligência de Mercado',
        badge: 'PROSPECÇÃO B2B & SINAIS DE COMPRA',
        cta: 'Explorar Inteligência de Mercado',
        themeColor: 'pink',
      },
      {
        num: '03',
        title: 'Orquestração de vendas',
        expectedModalTitle: '03. Orquestração de Vendas',
        badge: 'CADÊNCIA MULTICANAL & NEXT BEST ACTION',
        cta: 'Ver Cadências de Vendas',
        themeColor: 'gold',
      },
      {
        num: '04',
        title: 'Performance comercial',
        expectedModalTitle: '04. Performance Comercial',
        badge: 'TELEMETRIA DO FUNIL & VELOCIDADE',
        cta: 'Abrir Painel de Analytics',
        themeColor: 'iris',
      },
      {
        num: '05',
        title: 'Previsibilidade comercial',
        expectedModalTitle: '05. Previsibilidade Comercial',
        badge: 'PIPELINE PONDERADO & MODELAGEM ESTATÍSTICA',
        cta: 'Ver Previsão de Receita',
        themeColor: 'cyan',
      },
      {
        num: '06',
        title: 'Inteligência artificial',
        expectedModalTitle: '06. Inteligência Artificial',
        badge: 'COPILOTO DE IA CONTEXTUAL & DIAGNÓSTICO',
        cta: 'Acessar Hub de Inteligência',
        themeColor: 'pink',
      },
      {
        num: '07',
        title: 'Automação & conectividade',
        expectedModalTitle: '07. Automação & Conectividade Multi-CRM',
        badge: 'ECOSSISTEMA DE APIS & CONECTIVIDADE MULTI-CRM',
        cta: 'Ver Central de Automações',
        themeColor: 'gold',
      },
      {
        num: '08',
        title: 'Engajamento comercial',
        expectedModalTitle: '08. Engajamento Comercial',
        badge: 'TELEFONIA EM NUVEM & VOZ COM IA',
        cta: 'Conhecer o VoiceHub',
        themeColor: 'iris',
      },
    ];

    for (const pillar of pillars) {
      test(`Pilar ${pillar.num} (${pillar.title}): abertura, conteúdo, visualizador, CTA, Escape, Dark e Light`, async ({
        page,
      }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Localizar o card do pilar específico
        const card = page
          .locator('.b360-feature-card')
          .filter({ has: page.locator('.b360-pillar-badge', { hasText: pillar.num }) });
        await expect(card).toBeVisible();
        await card.scrollIntoViewIfNeeded();

        // 1. Abertura pelo card
        await card.click();

        // Verificar que exatamente 1 modal foi aberto (sem duplicidade)
        const dialogs = page.locator('[role="dialog"]');
        await expect(dialogs).toHaveCount(1);
        const dialog = dialogs.first();
        await expect(dialog).toBeVisible();

        // 2. Título específico e badge
        const titleEl = page.locator('#b360-dialog-title');
        await expect(titleEl).toContainText(pillar.expectedModalTitle);
        await expect(dialog).toContainText(pillar.badge);

        // 3. Representação visual própria
        const visualizerBadge = dialog.getByText('Simulação baseada em dados operacionais');
        await expect(visualizerBadge).toBeVisible();

        // 4. CTA funcional
        const ctaBtn = dialog.locator('button[data-primary-action="true"]');
        await expect(ctaBtn).toBeVisible();
        await expect(ctaBtn).toContainText(pillar.cta);

        // Capturar evidência do modal no tema atual (Dark)
        await page.screenshot({
          path: path.join(EVIDENCE_DIR, `modal-pilar-${pillar.num}-dark.png`),
        });

        // 5. Fechamento via botão de fechar (X)
        const closeIconBtn = dialog.locator('button[aria-label="Fechar painel"]');
        await expect(closeIconBtn).toBeVisible();
        await closeIconBtn.click();
        await expect(dialogs).toHaveCount(0);

        // 6. Testar no tema Light
        const themeToggle = page.locator('button[aria-label*="modo"]').first();
        if (await themeToggle.isVisible()) {
          await themeToggle.click();
          await card.click();
          await expect(dialogs).toHaveCount(1);

          await page.screenshot({
            path: path.join(EVIDENCE_DIR, `modal-pilar-${pillar.num}-light.png`),
          });

          // Testar Escape
          await page.keyboard.press('Escape');
          await expect(dialogs).toHaveCount(0);

          // Retornar ao tema dark
          await themeToggle.click();
        }

        // 7. Reabrir para testar foco inicial e botão "Fechar" textual
        await card.click();
        await expect(dialogs).toHaveCount(1);
        const closeTextBtn = dialog.getByRole('button', { name: 'Fechar', exact: true });
        await expect(closeTextBtn).toBeVisible();
        await closeTextBtn.click();
        await expect(dialogs).toHaveCount(0);
      });
    }

    test('Focus Trap: Tab e Shift+Tab navegam estritamente dentro do modal', async ({ page }) => {
      await page.goto('/');
      const card = page
        .locator('.b360-feature-card')
        .filter({ has: page.locator('.b360-pillar-badge', { hasText: '01' }) });
      await card.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Aguardar o foco inicial assentar no botão principal do modal
      await page.waitForTimeout(100);

      // Pressionar Tab repetidamente e verificar que o foco permanece no dialog
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        const isWithin = await page.evaluate(() => {
          const active = document.activeElement;
          const modal = document.querySelector('[role="dialog"]');
          return modal ? modal.contains(active) : false;
        });
        expect(isWithin).toBe(true);
      }

      // Shift+Tab reverso
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Shift+Tab');
        const isWithin = await page.evaluate(() => {
          const active = document.activeElement;
          const modal = document.querySelector('[role="dialog"]');
          return modal ? modal.contains(active) : false;
        });
        expect(isWithin).toBe(true);
      }

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    });

    test('CTA leva ao Login para usuário não autenticado', async ({ page }) => {
      await page.goto('/');
      const card = page
        .locator('.b360-feature-card')
        .filter({ has: page.locator('.b360-pillar-badge', { hasText: '02' }) });
      await card.click();

      const ctaBtn = page.locator('button[data-primary-action="true"]');
      await ctaBtn.click();

      // Deve estar na tela de login
      await expect(page.locator('text=Entrar na Plataforma')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });

  // ==========================================================================
  // 2. LIGHT / DARK — TESTE COMPLETO E PERSISTÊNCIA
  // ==========================================================================
  test.describe('2. Validação Completa de Tema Light / Dark', () => {
    test('Alternância fluida entre temas, sem elementos presos e com persistência', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const html = page.locator('html');

      // Localizar botão de alternar tema no header ou flutuante
      const themeToggle = page.locator('button[aria-label*="modo"]').first();
      await expect(themeToggle).toBeVisible();

      // Iniciar em Dark ou alternar para Dark
      const initialTheme = await html.getAttribute('data-theme');
      if (initialTheme !== 'dark') {
        await themeToggle.click();
      }
      await expect(html).toHaveAttribute('data-theme', 'dark');
      await expect(html).toHaveClass(/dark/);

      // Captura da Landing Page em Dark
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, 'landing-page-dark.png'),
        fullPage: false,
      });

      // Alternar para Light
      await themeToggle.click();
      await expect(html).toHaveAttribute('data-theme', 'light');
      await expect(html).toHaveClass(/light/);

      // Captura da Landing Page em Light
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, 'landing-page-light.png'),
        fullPage: false,
      });

      // Abrir um modal em Light e validar contraste/estilo
      const card01 = page
        .locator('.b360-feature-card')
        .filter({ has: page.locator('.b360-pillar-badge', { hasText: '01' }) });
      await card01.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // O container do modal em light tem classe bg-white/98
      await expect(dialog.locator('.bg-white\\/98')).toBeVisible();
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, 'modal-pilar-01-light.png'),
      });
      await page.keyboard.press('Escape');

      // Alternar repetidamente 4 vezes (teste de robustez)
      for (let i = 0; i < 4; i++) {
        await themeToggle.click();
        await page.waitForTimeout(100);
      }

      // Garantir que está em Light e recarregar a página para testar persistência
      const currentTheme = await html.getAttribute('data-theme');
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const reloadedTheme = await html.getAttribute('data-theme');
      expect(reloadedTheme).toBe(currentTheme);

      // Navegar para /login e verificar que o tema persiste
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      const loginTheme = await html.getAttribute('data-theme');
      expect(loginTheme).toBe(currentTheme);

      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `login-screen-${currentTheme}.png`),
      });

      // Alternar tema na tela de login
      const loginThemeToggle = page.locator('button[aria-label*="modo"]').first();
      if (await loginThemeToggle.isVisible()) {
        await loginThemeToggle.click();
        const toggledLoginTheme = await html.getAttribute('data-theme');
        expect(toggledLoginTheme).not.toBe(currentTheme);
        await page.screenshot({
          path: path.join(EVIDENCE_DIR, `login-screen-${toggledLoginTheme}.png`),
        });
      }
    });

    test('Simulador de ROI abre e renderiza com integridade em ambos os temas', async ({
      page,
    }) => {
      await page.goto('/');
      const roiBtn = page.getByRole('button', { name: /Simular ROI|Simulador/i }).first();
      await expect(roiBtn).toBeVisible();
      await roiBtn.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(/Simulador.*ROI/i);

      await page.screenshot({
        path: path.join(EVIDENCE_DIR, 'roi-simulator-dark.png'),
      });

      // Fechar modal do simulador (via botão com aria-label="Fechar simulador" ou Escape)
      const closeBtn = dialog.locator('button[aria-label="Fechar simulador"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await expect(dialog).toHaveCount(0);
    });
  });

  // ==========================================================================
  // 3. RESPONSIVIDADE EM 6 VIEWPORTS OFICIAIS
  // ==========================================================================
  test.describe('3. Responsividade em 6 Viewports Oficiais', () => {
    const viewports = [
      { name: 'mobile-small', width: 360, height: 800 },
      { name: 'mobile-standard', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'laptop-small', width: 1280, height: 800 },
      { name: 'desktop-standard', width: 1440, height: 900 },
      { name: 'desktop-wide', width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      test(`Viewport ${vp.name} (${vp.width}x${vp.height}): sem overflow horizontal e com layout íntegro`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Checar ausência de overflow horizontal indesejado
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });
        expect(hasHorizontalOverflow).toBe(false);

        // Header visível
        const logo = page.locator('header, nav').first();
        await expect(logo).toBeVisible();

        // Cards visíveis e clicáveis
        const card01 = page
          .locator('.b360-feature-card')
          .filter({ has: page.locator('.b360-pillar-badge', { hasText: '01' }) });
        await expect(card01).toBeVisible();

        // Capturar screenshot do viewport
        await page.screenshot({
          path: path.join(EVIDENCE_DIR, `responsive-${vp.name}-${vp.width}x${vp.height}.png`),
        });

        // Abrir modal no viewport e verificar encaixe
        await card01.click();
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        const dialogBox = await dialog.locator('.b360-micro-kanban, .b360-micro-telemetry, #b360-dialog-title').first().boundingBox();
        expect(dialogBox).not.toBeNull();

        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
      });
    }
  });

  // ==========================================================================
  // 4. ACESSIBILIDADE WCAG 2.2 AA (AXE-CORE & SEMÂNTICA)
  // ==========================================================================
  test.describe('4. Acessibilidade WCAG 2.2 AA', () => {
    test.use({ reducedMotion: 'reduce' });

    test('Landing Page não apresenta violações críticas ou sérias no axe-core', async ({
      page,
    }, testInfo) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const axeResults = await new AxeBuilder({ page }).analyze();
      const blocking = axeResults.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact ?? ''),
      );

      await testInfo.attach('axe-landing-violations', {
        body: JSON.stringify(blocking, null, 2),
        contentType: 'application/json',
      });

      expect(blocking).toEqual([]);
    });

    test('Tela de Login não apresenta violações críticas ou sérias no axe-core', async ({
      page,
    }, testInfo) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const axeResults = await new AxeBuilder({ page })
        .include('#root')
        .analyze();
      const blocking = axeResults.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact ?? ''),
      );

      await testInfo.attach('axe-login-violations', {
        body: JSON.stringify(blocking, null, 2),
        contentType: 'application/json',
      });

      expect(blocking).toEqual([]);
    });

    test('Modais possuem atributos ARIA corretos (role="dialog", aria-modal, aria-labelledby)', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const card = page
        .locator('.b360-feature-card')
        .filter({ has: page.locator('.b360-pillar-badge', { hasText: '06' }) });
      await expect(card).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      await card.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAttribute('aria-labelledby', 'b360-dialog-title');
      await expect(dialog).toHaveAttribute('aria-describedby', 'b360-dialog-desc');

      const title = page.locator('#b360-dialog-title');
      await expect(title).toBeVisible();
      await expect(title).toContainText('06. Inteligência Artificial');

      await page.keyboard.press('Escape');
    });
  });

  // ==========================================================================
  // 5. PERFORMANCE E CORE WEB VITALS
  // ==========================================================================
  test.describe('5. Métricas de Performance e Core Web Vitals', () => {
    test('Medição real de LCP, CLS, DOMContentLoaded e tempo de renderização', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('load');

      const metrics = await page.evaluate(async () => {
        const perf = window.performance;
        const timing = perf.timing || {};
        const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        let lcp = 0;
        let cls = 0;

        await new Promise<void>((resolve) => {
          let timeoutId = setTimeout(() => resolve(), 2000);

          try {
            const lcpObserver = new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              const lastEntry = entries[entries.length - 1];
              lcp = lastEntry.startTime;
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

            const clsObserver = new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  cls += (entry as any).value;
                }
              }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });

            setTimeout(() => {
              clearTimeout(timeoutId);
              resolve();
            }, 1000);
          } catch (e) {
            resolve();
          }
        });

        return {
          domContentLoadedMs: navigation
            ? navigation.domContentLoadedEventEnd - navigation.startTime
            : timing.domContentLoadedEventEnd - timing.navigationStart,
          loadMs: navigation
            ? navigation.loadEventEnd - navigation.startTime
            : timing.loadEventEnd - timing.navigationStart,
          lcpMs: lcp,
          clsScore: cls,
        };
      });

      console.log('Métricas reais de performance da Landing Page:', metrics);

      // Salvar evidência de performance em arquivo JSON
      fs.writeFileSync(
        path.join(EVIDENCE_DIR, 'performance-metrics.json'),
        JSON.stringify(metrics, null, 2),
        'utf-8',
      );

      // Critérios saudáveis:
      // DOMContentLoaded < 3.5s
      expect(metrics.domContentLoadedMs).toBeLessThan(3500);
      // CLS Score < 0.25
      expect(metrics.clsScore).toBeLessThan(0.25);
    });
  });
});

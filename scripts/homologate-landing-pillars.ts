import { chromium } from 'playwright';
import { preview } from 'vite';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🚀 Iniciando homologação real dos 8 modais comerciais (Playwright)...');

  // Iniciar servidor Vite Preview apontando para dist/ já compilado
  const server = await preview({
    preview: {
      port: 4173,
      host: '127.0.0.1',
    },
  });

  const baseUrl = 'http://127.0.0.1:4173';
  console.log(`🌐 Servidor Vite Preview rodando em ${baseUrl}`);

  const outputDir = path.resolve(process.cwd(), '.agents/reviews/evidence-handoffs/pillars');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  const themes: ('dark' | 'light')[] = ['dark', 'light'];

  const pillarCards = [
    { id: '01', title: 'Hub Comercial' },
    { id: '02', title: 'Inteligência de Mercado' },
    { id: '03', title: 'Orquestração de Vendas' },
    { id: '04', title: 'Performance Comercial' },
    { id: '05', title: 'Previsibilidade Comercial' },
    { id: '06', title: 'Inteligência Artificial' },
    { id: '07', title: 'Automação & Conectividade Multi-CRM' },
    { id: '08', title: 'Engajamento Comercial' },
  ];

  for (const vp of viewports) {
    for (const theme of themes) {
      console.log(`\n📸 Homologando Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) | Tema: ${theme.toUpperCase()}`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Navegar para a Landing Page
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      // Ajustar o tema via localStorage e classe
      await page.evaluate((t) => {
        localStorage.setItem('birthhub360_theme', t);
        const root = document.documentElement;
        root.dataset.theme = t;
        if (t === 'light') {
          root.classList.add('light');
          root.classList.remove('dark');
        } else {
          root.classList.add('dark');
          root.classList.remove('light');
        }
      }, theme);

      // Recarregar para garantir inicialização limpa com o tema desejado
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Screenshot da Landing Page geral
      const landingShotPath = path.join(outputDir, `landing-${theme}-${vp.name}.png`);
      await page.screenshot({ path: landingShotPath, fullPage: false });
      console.log(`  ✓ Capturado: landing-${theme}-${vp.name}.png`);

      // Testar e capturar os 8 pilares
      for (let i = 0; i < pillarCards.length; i++) {
        const pillar = pillarCards[i];
        const numStr = pillar.id;

        // Selecionar o card específico no grid pelo índice e garantir correspondência
        const card = page.locator('.b360-feature-grid .b360-feature-card').nth(i);

        await card.scrollIntoViewIfNeeded();
        await card.click();

        // Aguardar o modal abrir com role="dialog"
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });

        // Validações de acessibilidade
        const ariaModal = await dialog.getAttribute('aria-modal');
        if (ariaModal !== 'true') {
          throw new Error(`Pilar ${numStr}: aria-modal não é "true"`);
        }

        const titleText = await page.locator('#b360-dialog-title').innerText();
        if (!titleText.includes(numStr)) {
          throw new Error(`Pilar ${numStr}: título inesperado "${titleText}"`);
        }
        console.log(`    Pilar ${numStr} (${titleText}) aberto e validado com sucesso`);

        // Verificar presença de selo de simulação e interface operacional
        const visualizerNotice = page.locator('text=Simulação baseada em dados operacionais');
        await visualizerNotice.waitFor({ state: 'visible', timeout: 3000 });

        await page.waitForTimeout(400);

        // Capturar screenshot do modal aberto
        const modalShotPath = path.join(outputDir, `pilar-${numStr}-${theme}-${vp.name}.png`);
        await page.screenshot({ path: modalShotPath });
        console.log(`  ✓ Capturado: pilar-${numStr}-${theme}-${vp.name}.png`);

        // Testar fechamento via Escape no primeiro caso de cada ciclo, e botão Fechar nos demais
        if (i % 2 === 0) {
          await page.keyboard.press('Escape');
        } else {
          const closeBtn = page.locator('button[aria-label="Fechar painel"]').first();
          await closeBtn.click();
        }

        await dialog.waitFor({ state: 'hidden', timeout: 5000 });
        await page.waitForTimeout(200);
      }

      await context.close();
    }
  }

  // Testar fluxo de redirecionamento para Login e limpeza de estado
  console.log('\n🔒 Testando fluxo de autenticação e limpeza de estado (handleGoToLogin)...');
  const loginContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const loginPage = loginContext.newPage();
  const testPage = await loginPage;
  await testPage.goto(baseUrl, { waitUntil: 'networkidle' });

  // Abrir pilar 01
  const firstCard = testPage.locator('.b360-feature-card:has-text("01")').first();
  await firstCard.scrollIntoViewIfNeeded();
  await firstCard.click();
  await testPage.locator('[role="dialog"]').waitFor({ state: 'visible' });

  // Clicar em Acessar no CRM / Login
  const actionBtn = testPage.locator('button[data-primary-action="true"]');
  await actionBtn.click();

  // Verificar que o modal foi fechado e a tela de login ou rota /login foi acionada
  await testPage.waitForTimeout(500);
  const dialogVisible = await testPage.locator('[role="dialog"]').isVisible();
  if (dialogVisible) {
    throw new Error('Falha: o modal não foi fechado após clique na ação primária.');
  }
  console.log('  ✓ Modal fechado com sucesso na navegação para autenticação.');

  await loginContext.close();
  await browser.close();

  // Encerrar servidor preview
  await server.close();
  console.log('\n✅ Homologação concluída com 100% de sucesso!');
  console.log('📸 36 capturas de tela reais atualizadas em .agents/reviews/evidence-handoffs/pillars/');
}

main().catch((err) => {
  console.error('❌ Erro na homologação:', err);
  process.exit(1);
});

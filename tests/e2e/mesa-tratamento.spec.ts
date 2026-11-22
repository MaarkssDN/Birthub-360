import { test, expect } from '@playwright/test';
import { setUserRole, signUp, uniqueTestEmail } from './helpers';

/**
 * Cobertura E2E funcional da Mesa de Tratamento SDR (`/app/mesa-tratamento`) — antes desta suíte a
 * rota só aparecia em varreduras de acessibilidade/mobile/visual (accessibility.spec.ts,
 * mobile-sweep.spec.ts, visual-audit.spec.ts), sem nenhum teste do comportamento real da tela.
 *
 * Limitação deliberada e documentada: a fila real depende de uma BitrixConnection + chamadas ao
 * portal Bitrix24 (`GET /api/mesa-tratamento/queue` → `findUnimportedBitrixLeadIds`,
 * `postCommentToBitrix`, `exportLeadToBitrixNow`), que não existe no ambiente de teste — não há
 * credenciais Bitrix nem como mockar HTTP de saída no processo do servidor Express (o E2E sobe o
 * backend real via `npm run start:e2e`, diferente dos specs de unit que mockam o service).
 * Por isso os specs abaixo cobrem o caminho que o backend REAL produz sem Bitrix: fila vazia com
 * `connectionId: null`, o EmptyState "Bitrix24 não conectado", o dashboard de métricas (que não
 * depende do Bitrix — lê `MesaTratamentoTreatment`/`PomodoroSession` do Prisma), o contrato de
 * validação do endpoint `/register` e o RBAC da rota. A jornada completa de triagem lead-a-lead
 * fica registrada como pendente no handoff 00-para-08-cobertura-testes-modulos.md.
 */

test.describe('Mesa de Tratamento — organização sem Bitrix conectado', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('mesa') });
  });

  test('fila mostra "Bitrix24 não conectado" e a API /queue confirma connectionId null', async ({
    page,
  }) => {
    const queueResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/mesa-tratamento/queue') && res.request().method() === 'GET',
    );
    await page.goto('/app/mesa-tratamento');

    // Contrato real do backend: organização nova não tem BitrixConnection → connectionId null.
    const queueResponse = await queueResponsePromise;
    expect(queueResponse.status()).toBe(200);
    const queueBody = await queueResponse.json();
    expect(queueBody.success).toBe(true);
    expect(queueBody.data.connectionId).toBeNull();
    expect(queueBody.data.queue).toEqual([]);
    expect(queueBody.data.current).toBeNull();

    // A UI reflete exatamente esse estado — não é um erro, é o EmptyState orientativo.
    await expect(page.getByText('Bitrix24 não conectado')).toBeVisible();
    await expect(
      page.getByText(/Conecte um portal Bitrix24 em Configurações/),
    ).toBeVisible();

    // Widgets da mesa continuam disponíveis mesmo sem fila (Pomodoro é local + log no fim do ciclo).
    await expect(page.getByRole('button', { name: 'Iniciar foco' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fila', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dashboard', exact: true })).toBeVisible();
  });

  test('aba Dashboard carrega KPIs zerados e a troca de período refaz a chamada com o período certo', async ({
    page,
  }) => {
    await page.goto('/app/mesa-tratamento');
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();

    // KPIs reais do endpoint /api/mesa-tratamento/dashboard — org nova = tudo zerado, mas os
    // cards precisam renderizar (prova que a aba não depende do Bitrix).
    await expect(page.getByText('Leads tratados', { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Conversão / reunião', { exact: true })).toBeVisible();
    await expect(page.getByText('Minutos em foco', { exact: true })).toBeVisible();
    await expect(page.getByText('Ciclos Pomodoro', { exact: true })).toBeVisible();

    // Troca de período é uma jornada real: novo GET com ?period=30d (default da tela é 7d).
    const periodResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/mesa-tratamento/dashboard') &&
        res.url().includes('period=30d') &&
        res.request().method() === 'GET',
    );
    // Os seletores de período são role="tab" dentro de um tablist (SdrDashboard),
    // não role="button" — getByRole('button') não os encontra.
    await page.getByRole('tab', { name: 'Últimos 30 dias' }).click();
    const res = await periodResponse;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.period).toBe('30d');
    expect(body.data.kpis.totalTratados).toBe(0);
  });

  test('API /register valida o contrato sem Bitrix: 400 sem outcome, 404 para lead inexistente', async ({
    page,
  }) => {
    await page.goto('/app'); // estabelece a sessão autenticada no contexto do page.request

    // Sem `outcome` → AppError 400 antes de qualquer acesso ao banco/Bitrix.
    const semOutcome = await page.request.post(
      '/api/mesa-tratamento/lead/lead-inexistente/register',
      { data: { note: 'tentativa sem resultado' } },
    );
    expect(semOutcome.status()).toBe(400);

    // Com outcome+note mas lead que não existe no tenant → 404 (o 400 de "sem BitrixLeadId"
    // nunca é alcançado porque o lead não é nem encontrado — ordem real das validações).
    const leadInexistente = await page.request.post(
      '/api/mesa-tratamento/lead/lead-inexistente/register',
      { data: { outcome: 'contato', note: 'Lead de teste inexistente' } },
    );
    expect(leadInexistente.status()).toBe(404);
  });
});

test.describe('Mesa de Tratamento — RBAC', () => {
  test('VISUALIZADOR vê "Acesso restrito" na rota e recebe 403 na API da fila', async ({
    page,
  }) => {
    const email = uniqueTestEmail('mesa-viewer');
    await signUp(page, { email });
    await setUserRole(email, 'VISUALIZADOR');
    // O client do better-auth cacheia a sessão — reload para refletir o novo papel
    // (mesmo padrão de commercial-intelligence-rbac.spec.ts).
    await page.reload();

    await page.goto('/app/mesa-tratamento');
    await expect(page.getByText('Acesso restrito')).toBeVisible();
    // A tela da mesa não monta para VISUALIZADOR (RequireRole barra antes do fetch da fila).
    await expect(page.getByText('Bitrix24 não conectado')).toHaveCount(0);

    const queueResponse = await page.request.get('/api/mesa-tratamento/queue');
    expect(queueResponse.status()).toBe(403);
  });
});

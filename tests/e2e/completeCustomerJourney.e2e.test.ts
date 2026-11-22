import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail } from './helpers';

/**
 * JORNADA COMERCIAL REAL PONTA A PONTA (ORDEM 05 — substitui o spec tautológico anterior,
 * que só afirmava literais em memória sem tocar servidor, banco ou navegador).
 *
 * Executa a jornada comercial prioritária da missão usando a API real do servidor de teste
 * (`page.request` compartilha a sessão de cookies do browser — auth real → authenticateToken
 * → requireTenant → controllers → Prisma/RLS → banco `prospectordb_test`):
 *
 *   Prospecção/CRM  → POST /api/leads + transições de status reais
 *   Oportunidade   → PUT /api/leads/:id (funnel Negócio + valor + previsão de fechamento)
 *   Proposta       → POST /api/crm/documents + GET /api/crm/documents?leadId= (persistida)
 *   Inteligência   → GET /api/commercial-intelligence/overview (módulo executivo, ADMIN)
 *   Automação      → POST /api/automations (regra persistida)
 *   Indicadores    → GET /api/analytics/overview + GET /api/gamification/profile
 *   Assistente     → GET /api/copiloto-ia/conversations (Copiloto acessível na jornada)
 *
 * Cada etapa prova que a anterior produziu efeito persistido e observável — nunca um mock.
 * O que este spec NÃO cobre (declarado): renderização das telas de cada etapa (coberta por
 * specs de UI próprias, ex.: crm360-proposta.spec.ts, leads-crud.spec.ts) e a execução de
 * workers/fila — aqui validamos API + persistência + RBAC ponta a ponta.
 */
test.describe('Jornada Comercial Completa — API real autenticada', () => {
  test('Prospecção → CRM → Oportunidade → Proposta → Forecast → Automação → Indicadores', async ({
    page,
  }) => {
    // Sessão real: cadastro pela UI + login (signUp retorna após autenticação confirmada).
    await signUp(page, { email: uniqueTestEmail('jornada-comercial') });

    // ── 1. PROSPECÇÃO → CRM: lead criado e persistido ──────────────────────────
    const createRes = await page.request.post('/api/leads', {
      data: {
        status: 'Lead Recebido',
        source: 'jornada-e2e',
        channel: 'E2E automatizado',
        owner: 'Vendedor Jornada E2E',
      },
    });
    expect(createRes.status(), 'POST /api/leads deve criar o lead').toBe(201);
    const created = (await createRes.json()).data;
    const leadId = created.id as string;
    expect(leadId).toBeTruthy();

    // ── 2. CRM: qualificação e conversão em oportunidade (transições reais) ────
    const qualifyRes = await page.request.put(`/api/leads/${leadId}`, {
      data: { status: 'Qualificação (SDR)' },
    });
    expect(qualifyRes.ok(), 'PUT status Qualificação (SDR)').toBeTruthy();

    const convertRes = await page.request.put(`/api/leads/${leadId}`, {
      data: { status: 'Convertido em Oportunidade' },
    });
    expect(convertRes.ok(), 'PUT status Convertido em Oportunidade').toBeTruthy();

    const afterConvert = await page.request.get(`/api/leads/${leadId}`);
    expect((await afterConvert.json()).data.status).toBe('Convertido em Oportunidade');

    // ── 3. OPORTUNIDADE: funil Negócio + valor + previsão de fechamento ────────
    const oppRes = await page.request.put(`/api/leads/${leadId}`, {
      data: {
        funnel: 'Negocio',
        status: 'Nova Oportunidade',
        amount: 75000,
        expectedCloseAt: '2026-11-30T00:00:00.000Z',
      },
    });
    expect(oppRes.ok(), 'PUT funil Negócio/oportunidade').toBeTruthy();

    const oppRead = await page.request.get(`/api/leads/${leadId}`);
    const oppLead = (await oppRead.json()).data;
    expect(oppLead.funnel).toBe('Negocio');
    expect(Number(oppLead.amount)).toBe(75000);

    // ── 4. PROPOSTA: documento comercial persistido e vinculado ao lead ────────
    const docRes = await page.request.post('/api/crm/documents', {
      data: {
        type: 'Proposta',
        title: `Proposta Jornada E2E ${Date.now()}`,
        lineItems: [{ name: 'Piloto comercial 90 dias', quantity: 1, unitPrice: 75000 }],
        leadId,
      },
    });
    expect(docRes.ok(), 'POST /api/crm/documents').toBeTruthy();
    const docBody = await docRes.json();
    const document = docBody.data ?? docBody;
    expect(document.id).toBeTruthy();
    expect(document.publicToken).toBeTruthy();

    const docsRes = await page.request.get(`/api/crm/documents?leadId=${leadId}`);
    expect(docsRes.ok(), 'GET /api/crm/documents?leadId=').toBeTruthy();
    const docsBody = await docsRes.json();
    const docs: Array<{ id: string }> = Array.isArray(docsBody)
      ? docsBody
      : (docsBody.data ?? []);
    expect(docs.map((d) => d.id)).toContain(document.id);

    // ── 5. INTELIGÊNCIA/FORECAST: overview executivo responde com a sessão ────
    const ciRes = await page.request.get('/api/commercial-intelligence/overview');
    expect(ciRes.status(), 'GET /api/commercial-intelligence/overview').toBe(200);

    // ── 6. AUTOMAÇÃO: regra persistida no tenant da sessão ─────────────────────
    const autoRes = await page.request.post('/api/automations', {
      data: {
        name: 'Jornada E2E — notificar equipe',
        trigger: 'Lead criado',
        action: 'Notificar equipe',
        actionConfig: { title: 'Novo lead da jornada E2E' },
      },
    });
    expect(autoRes.ok(), 'POST /api/automations').toBeTruthy();
    const automationsRes = await page.request.get('/api/automations');
    expect(automationsRes.ok(), 'GET /api/automations').toBeTruthy();
    const autosBody = await automationsRes.json();
    const autos: Array<{ name: string }> = Array.isArray(autosBody)
      ? autosBody
      : (autosBody.data ?? []);
    expect(autos.some((a) => a.name === 'Jornada E2E — notificar equipe')).toBe(true);

    // ── 7. INDICADORES + ASSISTENTE GLOBAL: APIs de leitura respondem ──────────
    const analyticsRes = await page.request.get('/api/analytics/overview');
    expect(analyticsRes.ok(), 'GET /api/analytics/overview').toBeTruthy();

    const gamificationRes = await page.request.get('/api/gamification/profile');
    expect(gamificationRes.ok(), 'GET /api/gamification/profile').toBeTruthy();

    const copilotRes = await page.request.get('/api/copiloto-ia/conversations');
    expect(copilotRes.ok(), 'GET /api/copiloto-ia/conversations').toBeTruthy();
  });
});

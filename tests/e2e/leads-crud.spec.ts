import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail } from './helpers';
import {
  countDbRows,
  expectDbRow,
  expectDbRowSoftDeleted,
} from './db-assertions';

// CRUD de lead ponta-a-ponta (item TEST-002 / 09-BACKLOG-EXECUTAVEL.md #20). A UI do Pipeline CRM
// (CrmBoard.tsx) não tem um formulário de criação direta de lead — leads nascem via o fluxo de
// prospecção — então este spec exercita a API real (/api/leads) autenticado com a sessão de
// cookies do browser (`page.request` compartilha o mesmo contexto/cookies de `page`), o que ainda
// cobre o caminho ponta-a-ponta que a UI usaria: auth real -> authenticateToken -> requireTenant ->
// LeadController -> Prisma/RLS -> resposta.
test.describe('CRUD de lead', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('leads') });
  });

  test('cria, lê, atualiza e (tenta) excluir um lead', async ({ page }) => {
    const createRes = await page.request.post('/api/leads', {
      data: { status: 'Lead Recebido', source: 'e2e-test', channel: 'Teste automatizado' },
    });
    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()).data;
    expect(created).toHaveProperty('id');
    expect(created.status).toBe('Lead Recebido');

    const leadId = created.id;

    // TAREFA-SANEAMENTO-039 (BT360-DT-0089): além do 201/GET, afirmar que a linha foi gravada de
    // fato no PostgreSQL — resposta HTTP sozinha não prova persistência.
    await expectDbRow('Lead', leadId, {
      status: 'Lead Recebido',
      source: 'e2e-test',
      channel: 'Teste automatizado',
      deletedAt: null,
    });

    const readRes = await page.request.get(`/api/leads/${leadId}`);
    expect(readRes.ok()).toBeTruthy();
    const read = (await readRes.json()).data;
    expect(read.id).toBe(leadId);
    expect(read.source).toBe('e2e-test');

    const updateRes = await page.request.put(`/api/leads/${leadId}`, {
      data: { status: 'Qualificação (SDR)', temperature: 'Quente' },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = (await updateRes.json()).data;
    expect(updated.status).toBe('Qualificação (SDR)');
    expect(updated.temperature).toBe('Quente');

    const readAgainRes = await page.request.get(`/api/leads/${leadId}`);
    const readAgain = (await readAgainRes.json()).data;
    expect(readAgain.status).toBe('Qualificação (SDR)');

    // O PUT devolveu 200 — mas só o banco prova que status/temperature foram realmente atualizados.
    await expectDbRow('Lead', leadId, {
      status: 'Qualificação (SDR)',
      temperature: 'Quente',
    });

    // lead.routes.ts:19 exige role ADMIN/GESTOR para DELETE. Quem se cadastra fundando uma
    // organização nova vira ADMIN dela (src/lib/auth.ts databaseHooks.user.create.before) — é a
    // única pessoa da organização nesse momento, então precisa conseguir administrar seus próprios
    // dados desde o início (sem isso, ninguém jamais poderia promovê-la). A exclusão aqui deve
    // funcionar de verdade.
    const deleteRes = await page.request.delete(`/api/leads/${leadId}`);
    expect(deleteRes.status()).toBe(204);

    // Soft delete (ver isAuditable/findUnique filtering em src/lib/prisma.ts) — o lead não aparece
    // mais em GET, mesmo continuando na tabela.
    const afterDeleteRes = await page.request.get(`/api/leads/${leadId}`);
    expect(afterDeleteRes.status()).toBe(404);

    // E a prova no banco: a linha continua existindo com deletedAt preenchido — o 404 sozinho não
    // distingue "soft delete persistido" de "registro nunca existiu".
    await expectDbRowSoftDeleted('Lead', leadId);
  });

  test('rejeita status de lead fora do enum aceito', async ({ page }) => {
    // Marcador único para provar no banco que a requisição rejeitada NÃO gravou nada.
    const marker = `e2e-status-invalido-${Date.now()}`;
    const res = await page.request.post('/api/leads', {
      data: { status: 'Status-Que-Nao-Existe', source: marker },
    });
    expect(res.status()).toBe(400);
    await expect(
      countDbRows('Lead', 'source', marker),
      'rejeição 400 não pode persistir nenhuma linha em Lead',
    ).resolves.toBe(0);
  });

  test('lead recém-criado aparece na listagem paginada de leads', async ({ page }) => {
    const createRes = await page.request.post('/api/leads', {
      data: { status: 'Lead Recebido', source: 'e2e-listagem' },
    });
    const created = (await createRes.json()).data;

    // LeadController.getLeads (BACK-004) devolve { success, data, meta } paginado.
    const listRes = await page.request.get('/api/leads');
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(list).toHaveProperty('meta');
    const ids: string[] = list.data.map((l: { id: string }) => l.id);
    expect(ids).toContain(created.id);
  });
});

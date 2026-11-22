import { test, expect } from '@playwright/test';
import { signUp, uniqueTestEmail, setUserRole } from './helpers';

// API real com sessão real. Estes casos não disparam consultas externas faturáveis.
test.describe('Turbo — autorização, validação e filtros salvos', () => {
  test('sessão ausente bloqueia descoberta', async ({ request }) => {
    const response = await request.post('/api/prospecting/discover', {
      data: { segmento: 'Engenharia', localizacao: 'Brasil', autorizarPagos: false },
    });
    expect(response.status()).toBe(401);
  });

  test('rejeita CNPJ inválido e intervalo invertido antes de consultar provedores', async ({ page }) => {
    await signUp(page, { email: uniqueTestEmail('turbo-invalid') });
    for (const invalid of [
      { cnpj: '00000000000000' },
      { faturamentoMin: 200, faturamentoMax: 100 },
    ]) {
      const response = await page.request.post('/api/prospecting/discover', {
        data: { segmento: 'Engenharia', localizacao: 'Brasil', modoPesquisa: 'economico', ...invalid },
      });
      expect(response.status()).toBe(400);
      expect((await response.json()).success).toBe(false);
    }
  });

  test('filtros estruturados persistem após recarregar e não aparecem para outra sessão', async ({ page, browser }) => {
    await signUp(page, { email: uniqueTestEmail('turbo-owner') });
    const criteria = {
      segmento: 'Engenharia', localizacao: 'São Paulo', modoPesquisa: 'economico', autorizarPagos: false,
      segmentoDetalhes: { produtos: ['projetos'], palavrasExcluir: ['residencial'] },
      personas: [{ cargoPrincipal: 'Diretor', cargosEquivalentes: ['Head'], departamentos: ['Compras'] }],
    };
    const response = await page.request.post('/api/prospecting/saved-searches', {
      data: { name: 'Turbo E2E fixture', criteria },
    });
    expect(response.status()).toBe(201);
    const saved = (await response.json()).data;
    try {
      await page.reload();
      const list = await page.request.get('/api/prospecting/saved-searches');
      expect(list.status()).toBe(200);
      const restored = (await list.json()).data.find((item: { id: string }) => item.id === saved.id);
      expect(restored.criteria).toEqual(criteria);

      const otherContext = await browser.newContext({
        baseURL: new URL(page.url()).origin,
        extraHTTPHeaders: { Origin: new URL(page.url()).origin },
      });
      try {
        const otherPage = await otherContext.newPage();
        await signUp(otherPage, { email: uniqueTestEmail('turbo-other-tenant') });
        const otherList = await otherPage.request.get('/api/prospecting/saved-searches');
        expect(otherList.status()).toBe(200);
        expect((await otherList.json()).data.map((item: { id: string }) => item.id)).not.toContain(saved.id);
        const run = await otherPage.request.post(`/api/prospecting/saved-searches/${saved.id}/run`, { data: {} });
        expect(run.status()).toBe(404);
      } finally {
        await otherContext.close();
      }
    } finally {
      const removed = await page.request.delete(`/api/prospecting/saved-searches/${saved.id}`);
      expect(removed.status()).toBe(200);
    }
  });

  test('VISUALIZADOR não pode iniciar descoberta, interpretação ou testes administrativos', async ({ page }) => {
    const email = uniqueTestEmail('turbo-readonly');
    await signUp(page, { email });
    await setUserRole(email, 'VISUALIZADOR');
    await page.reload();
    for (const [path, data] of [
      ['discover', { segmento: 'Engenharia', localizacao: 'Brasil', autorizarPagos: false }],
      ['interpret', { query: 'Empresas de engenharia', consent: true }],
      ['providers/test', {}],
    ] as const) {
      const response = await page.request.post(`/api/prospecting/${path}`, { data });
      expect(response.status()).toBe(403);
    }
  });
});

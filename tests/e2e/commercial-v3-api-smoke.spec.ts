import { test, expect, type Page } from '@playwright/test';
import { signUp, uniqueTestEmail, setUserRole } from './helpers';

// Smoke HTTP real (servidor start:e2e, sessão real) dos 8 endpoints da suíte comercial V3.1 (#144).
// O LLM fica em stub determinístico via COMMERCIAL_V3_LLM_STUB=true (.env.test da CI): o
// orquestrador devolve o envelope consultivo seguro sem chamar provedor externo.
// O limitador de IA é por organização (AI_RATE_LIMIT_MAX, padrão 30/15min); cada teste usa uma
// organização nova e fica bem abaixo do limite, exceto o teste de 429, que o esgota de propósito.
const BASE = '/api/agent/commercial-v3';

async function sessionAs(page: Page, prefix: string, role?: 'GESTOR' | 'CLOSER' | 'SDR' | 'VISUALIZADOR') {
  const email = uniqueTestEmail(prefix);
  await signUp(page, { email });
  if (role) await setUserRole(email, role);
  // Sai do app para que chamadas de fundo da UI não consumam a cota de IA da organização.
  await page.goto('about:blank');
  return email;
}

test.describe('Comercial V3.1 — smoke HTTP dos 8 endpoints', () => {
  test('sem sessão: leitura e escrita retornam 401', async ({ request }) => {
    expect((await request.get(`${BASE}/agents`)).status()).toBe(401);
    expect((await request.post(`${BASE}/context`, { data: { agentId: 'sdr' } })).status()).toBe(401);
    expect(
      (await request.post(`${BASE}/dispatch`, { data: { agentId: 'sdr', mission: 'x' } })).status(),
    ).toBe(401);
    expect((await request.post(`${BASE}/evaluate-redteam`, { data: {} })).status()).toBe(401);
  });

  test('ADMIN: GETs de catálogo, playbook, skills e política (200/400/404)', async ({ page }) => {
    await sessionAs(page, 'cv3-admin-get');
    const r = page.request;

    const agents = await r.get(`${BASE}/agents`);
    expect(agents.status()).toBe(200);
    expect((await agents.json()).data).toHaveLength(19);

    const detail = await r.get(`${BASE}/agents/supervisor`);
    expect(detail.status()).toBe(200);
    expect((await r.get(`${BASE}/agents/agente_invalido_xyz`)).status()).toBe(400);

    expect((await r.get(`${BASE}/playbooks/supervisor/P1`)).status()).toBe(200);
    expect((await r.get(`${BASE}/playbooks/invalido/P1`)).status()).toBe(400);
    expect((await r.get(`${BASE}/playbooks/supervisor/P999_INEXISTENTE`)).status()).toBe(404);

    const all = await r.get(`${BASE}/skills`);
    expect(all.status()).toBe(200);
    expect((await all.json()).total).toBe(463);
    const filtered = await r.get(`${BASE}/skills?agentId=sdr`);
    expect(filtered.status()).toBe(200);
    const filteredBody = await filtered.json();
    expect(filteredBody.total).toBeGreaterThan(0);
    expect(filteredBody.total).toBeLessThan(463);
    expect((await r.get(`${BASE}/skills?agentId=nao_existe`)).status()).toBe(400);

    expect((await r.get(`${BASE}/policy`)).status()).toBe(200);
  });

  test('SDR: contexto, dispatch consultivo em stub e limites da missão', async ({ page }) => {
    await sessionAs(page, 'cv3-sdr', 'SDR');
    const r = page.request;

    const skills = (await (await r.get(`${BASE}/skills?agentId=sdr`)).json()).data as Array<{ id: string }>;
    const other = (await (await r.get(`${BASE}/skills?agentId=icp`)).json()).data as Array<{ id: string }>;

    const ctx = await r.post(`${BASE}/context`, { data: { agentId: 'sdr', skillIds: [skills[0].id] } });
    expect(ctx.status()).toBe(200);
    const badSkill = await r.post(`${BASE}/context`, { data: { agentId: 'sdr', skillIds: [other[0].id] } });
    expect(badSkill.status()).toBe(400);

    const ok = await r.post(`${BASE}/dispatch`, {
      data: { agentId: 'sdr', mission: 'Qualificar o lead ACME para uma primeira abordagem consultiva.' },
    });
    expect(ok.status()).toBe(200);
    const envelope = (await ok.json()).data;
    expect(envelope.status).toBe('COMPLETED');
    expect(envelope.mode).toBe('CONSULTIVO');
    expect(envelope.sendEligible).toBe(false);

    expect((await r.post(`${BASE}/dispatch`, { data: { agentId: 'sdr', mission: '   ' } })).status()).toBe(400);
    expect(
      (await r.post(`${BASE}/dispatch`, { data: { agentId: 'sdr', mission: 'a'.repeat(4001) } })).status(),
    ).toBe(400);
    expect(
      (await r.post(`${BASE}/dispatch`, { data: { agentId: 'sdr', mission: 'a'.repeat(4000) } })).status(),
    ).toBe(200);
    expect(
      (await r.post(`${BASE}/dispatch`, { data: { agentId: 'nao_existe', mission: 'oi' } })).status(),
    ).toBe(400);

    // evaluate-redteam é só ADMIN/GESTOR.
    expect((await r.post(`${BASE}/evaluate-redteam`, { data: { agentId: 'supervisor' } })).status()).toBe(403);
  });

  test('VISUALIZADOR: escrita retorna 403', async ({ page }) => {
    await sessionAs(page, 'cv3-viewer', 'VISUALIZADOR');
    const r = page.request;
    expect((await r.post(`${BASE}/context`, { data: { agentId: 'sdr' } })).status()).toBe(403);
    expect((await r.post(`${BASE}/dispatch`, { data: { agentId: 'sdr', mission: 'oi' } })).status()).toBe(403);
    expect((await r.post(`${BASE}/evaluate-redteam`, { data: { agentId: 'supervisor' } })).status()).toBe(403);
  });

  test('GESTOR: evaluate-redteam do supervisor em stub', async ({ page }) => {
    await sessionAs(page, 'cv3-gestor', 'GESTOR');
    const res = await page.request.post(`${BASE}/evaluate-redteam`, { data: { agentId: 'supervisor' } });
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test('rate limit de IA por organização devolve 429', async ({ page }) => {
    await sessionAs(page, 'cv3-ratelimit');
    let limitedAt = -1;
    for (let i = 0; i < 80; i++) {
      const res = await page.request.get(`${BASE}/policy`);
      if (res.status() === 429) {
        limitedAt = i;
        break;
      }
      expect(res.status()).toBe(200);
    }
    expect(limitedAt, 'o limitador de IA deveria responder 429 antes de 80 requisições').toBeGreaterThan(0);
  });
});

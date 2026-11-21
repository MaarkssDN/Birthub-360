import { expect, test, type Page } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import { signUp, uniqueTestEmail, waitForAppReady } from './helpers';

// Handoff `.agents/handoffs/00-para-17-07-orquestracao-sem-demo.md`, item 08 (QA/E2E):
// "E2E cobrindo overview real vs estado vazio."
//
// Contrato verificado no backend (`src/features/sales-orchestration/server/SalesOrchestrationService.ts`,
// P0 #693): `GET /api/sales-orchestration/overview` devolve `meta.source: 'real' | 'none'`,
// métricas sem cálculo real vêm `null` (listadas em `meta.unavailableMetrics`) e jornadas/
// processos/roteiros vêm `[]` (`meta.emptySections`) — nunca número inventado.
//
// Este spec prova, contra Postgres real e UI real (PlaybooksHub consome o mesmo hook
// `useOrchestrationOverview` das outras 3 telas do módulo):
//   (a) org recém-cadastrada (sem PlaybookInsight/CadenceSequence) → `source: 'none'`,
//       banner "Sem dados reais ainda", empty state honesto, KPIs zerados/"Indisponível";
//   (b) org com PlaybookInsight + CadenceSequence reais → `source: 'real'`, título do
//       playbook e contagens reais renderizados, sem badge Demo.

const OVERVIEW_URL = '/api/sales-orchestration/overview';

interface OverviewResponse {
  success: boolean;
  data: {
    kpis: {
      playbooksAtivos: number;
      aderenciaPlaybook: number | null;
      speedToLeadMin: number | null;
      cadenciasAtivas: number;
    };
    playbooks: Array<{ id: string; title: string; status: string; complianceRate: number | null }>;
    jornadas: unknown[];
    processos: unknown[];
    roteiros: unknown[];
    meta: {
      source: 'real' | 'none';
      unavailableMetrics: string[];
      emptySections?: string[];
    };
  };
}

async function gotoPlaybooks(page: Page) {
  const overviewPromise = page.waitForResponse(
    (res) => new URL(res.url()).pathname === OVERVIEW_URL && res.request().method() === 'GET',
  );
  await page.goto('/app/playbooks');
  const overviewResponse = await overviewPromise;
  expect(overviewResponse.ok(), 'overview deve responder 200').toBe(true);
  const body = (await overviewResponse.json()) as OverviewResponse;
  await waitForAppReady(page);
  return body.data;
}

async function orgIdOf(email: string): Promise<string> {
  requestContext.enterWith({ bypassRls: true });
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { organizationId: true },
  });
  expect(user.organizationId, 'usuário e2e deve pertencer a uma organização').toBeTruthy();
  return user.organizationId!;
}

/** Semeia os dois modelos que alimentam o overview — mesmo padrão de bypass/tenant de
 *  tests/e2e/workspace.spec.ts (setup de teste direto no banco, nunca em código de produto).
 *  `tenantId` (não `bypassRls`) porque `PlaybookInsight` não está no allowlist de bypass. */
async function seedRealOrchestrationData(organizationId: string) {
  requestContext.enterWith({ tenantId: organizationId });
  await prisma.cadenceSequence.create({
    data: {
      organizationId,
      name: 'Sequência E2E Orquestração',
      description: 'Cadência real criada pelo spec de overview.',
      active: true,
      touches: [
        {
          order: 1,
          channel: 'whatsapp',
          delayHoursFromPrevious: 0,
          templateRef: 'Olá! Tudo bem?',
        },
      ],
    },
  });
  await prisma.playbookInsight.create({
    data: {
      organizationId,
      sellerId: 'e2e-seller-08',
      segment: 'Varejo',
      patternTitle: 'Follow-up em 24h fecha mais no varejo',
      patternDescription:
        'Leads de varejo com retorno em até 24h tiveram mais desfechos positivos.',
      suggestedScript: 'Script sugerido pelo insight real.',
      evidenceCount: 7,
      sourceActionIds: [],
      status: 'BROADCAST',
    },
  });
}

test.describe('Orquestração de Vendas — overview real vs estado vazio', () => {
  test('org sem dados: meta.source none, listas vazias e KPIs honestos (nada inventado)', async ({
    page,
  }) => {
    const email = uniqueTestEmail('orch-empty');
    await signUp(page, { email });

    const overview = await gotoPlaybooks(page);

    // Contrato da API: nada de seed/template — listas vazias e métricas null.
    expect(overview.meta.source).toBe('none');
    expect(overview.playbooks).toEqual([]);
    expect(overview.jornadas).toEqual([]);
    expect(overview.processos).toEqual([]);
    expect(overview.roteiros).toEqual([]);
    expect(overview.kpis.playbooksAtivos).toBe(0);
    expect(overview.kpis.cadenciasAtivas).toBe(0);
    expect(overview.kpis.aderenciaPlaybook).toBeNull();
    expect(overview.kpis.speedToLeadMin).toBeNull();
    expect(overview.meta.unavailableMetrics).toEqual(
      expect.arrayContaining(['kpis.aderenciaPlaybook', 'kpis.speedToLeadMin']),
    );
    expect(overview.meta.emptySections).toEqual(
      expect.arrayContaining(['jornadas', 'processos', 'roteiros']),
    );

    // UI: banner honesto "Sem dados reais" + empty state, sem badge Demo nem números inventados.
    await expect(page.getByLabel('Sem dados reais')).toBeVisible();
    await expect(page.getByText('Sem dados reais ainda')).toBeVisible();
    await expect(page.getByText('Nenhum playbook cadastrado')).toBeVisible();
    await expect(page.getByText('Conteúdo de exemplo')).toHaveCount(0);

    // KPI "Playbooks Listados" mostra 0 real; métricas sem cálculo aparecem "Indisponível".
    const playbooksKpi = page.locator('.bh-platform-card', { hasText: 'Playbooks Listados' });
    await expect(playbooksKpi.locator('h3')).toHaveText('0');
    await expect(page.getByText('Indisponível').first()).toBeVisible();
    await expect(page.getByText('Indisponível').nth(2)).toBeVisible();
  });

  test('org com dados reais: playbook e cadência renderizam conteúdo real (source real)', async ({
    page,
  }) => {
    const email = uniqueTestEmail('orch-real');
    await signUp(page, { email });
    const organizationId = await orgIdOf(email);
    await seedRealOrchestrationData(organizationId);

    const overview = await gotoPlaybooks(page);

    // Contrato da API: dados reais do tenant, métricas fabricadas continuam null.
    expect(overview.meta.source).toBe('real');
    expect(overview.playbooks).toHaveLength(1);
    expect(overview.playbooks[0]).toMatchObject({
      title: 'Follow-up em 24h fecha mais no varejo',
      segment: 'Varejo',
      evidenceCount: 7,
      status: 'Ativo',
      complianceRate: null,
    });
    expect(overview.kpis.playbooksAtivos).toBe(1);
    expect(overview.kpis.cadenciasAtivas).toBe(1);
    expect(overview.kpis.aderenciaPlaybook).toBeNull();
    expect(overview.kpis.speedToLeadMin).toBeNull();

    // UI: conteúdo real renderizado — título do insight, badge de status real,
    // KPI com contagem real, e NENHUM aviso de demo/dados vazios.
    await expect(page.getByText('Follow-up em 24h fecha mais no varejo')).toBeVisible();
    // `segment` não é renderizado como texto solto no card (o Badge usa `category`, sempre null
    // no contrato honesto) — a asserção de segmento fica na resposta da API acima.
    await expect(page.getByLabel('Sem dados reais')).toHaveCount(0);
    await expect(page.getByText('Conteúdo de exemplo')).toHaveCount(0);

    const playbooksKpi = page.locator('.bh-platform-card', { hasText: 'Playbooks Listados' });
    await expect(playbooksKpi.locator('h3')).toHaveText('1');
    // Métricas sem cálculo seguem honestas mesmo com dados reais.
    await expect(page.getByText('Indisponível').first()).toBeVisible();
  });
});

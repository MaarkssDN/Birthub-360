import { expect, test } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import {
  getBitrixMockRequests,
  mockBitrixLead,
  MOCK_BITRIX_WEBHOOK_URL,
  resetBitrixMock,
  setBitrixMockState,
} from './bitrix-mock/control';
import { setUserRole, signUp, uniqueTestEmail } from './helpers';

/**
 * Jornada E2E completa da Mesa de Tratamento SDR contra um portal Bitrix24 FALSO real
 * (tests/e2e/bitrix-mock/): o servidor Express de teste sobe com um stub de fetch que
 * desvia as chamadas safeFetch do webhook mock para um portal HTTP local — todo o resto do
 * caminho é o código de produção (rotas → bitrix.service → callBitrix → safeFetch → HTTP).
 *
 * O que este spec prova que o spec mesa-tratamento.spec.ts não cobria:
 *  - importação automática Bitrix → Atlas na montagem da fila (crm.lead.list/get/status/fields/user);
 *  - registro de resultado com escrita de volta ao Bitrix (crm.timeline.comment.add +
 *    crm.lead.update) e persistência local (MesaTratamentoTreatment);
 *  - painel de gestão: reatribuir (ASSIGNED_BY_ID), comentar na timeline, decidir;
 *  - escopo SDR "só meus leads" (filtro ASSIGNED_BY_ID + owner = User.id);
 *  - caminhos de erro: falha do Bitrix não grava nada local (sem divergência Atlas×Bitrix).
 *
 * Pré-requisito de ambiente: o webServer do playwright.config.ts precisa ter subido o
 * e2e-server.ts COM E2E_BITRIX_MOCK=1 (é o default do config). Se um servidor já estiver
 * rodando na PORTA sem o stub (reuseExistingServer local), os testes desta suíte falham —
 * derrube o processo e rode de novo.
 */

const ADMIN_BITRIX_USER = { ID: '101', NAME: 'Ana', LAST_NAME: 'Admin', EMAIL: '', ACTIVE: true };
const SECOND_BITRIX_USER = {
  ID: '102',
  NAME: 'Bruno',
  LAST_NAME: 'Vendedor',
  EMAIL: 'bruno.vendedor@birthhub360.com.br',
  ACTIVE: true,
};

async function organizationIdOf(email: string): Promise<string> {
  requestContext.enterWith({ bypassRls: true });
  const user = await prisma.user.findUnique({
    where: { email },
    select: { organizationId: true, id: true },
  });
  if (!user?.organizationId) throw new Error(`usuário ${email} sem organizationId`);
  return user.organizationId;
}

/** Persiste a BitrixConnection do tenant apontando para o portal mock (webhookUrl cifrada
 *  transparentemente pela extensão Prisma, igual a uma conexão real). */
async function seedConnection(organizationId: string): Promise<void> {
  requestContext.enterWith({ bypassRls: true });
  await prisma.bitrixConnection.create({
    data: { organizationId, webhookUrl: MOCK_BITRIX_WEBHOOK_URL, label: 'Bitrix Mock E2E' },
  });
}

test.describe('Mesa de Tratamento — jornada completa com Bitrix mock', () => {
  test.beforeEach(async () => {
    await resetBitrixMock();
  });

  test('ADMIN: fila importa leads do Bitrix, registra resultado com escrita de volta e usa o painel de gestão', async ({
    page,
  }) => {
    const email = uniqueTestEmail('mesa-e2e-admin');
    await signUp(page, { email });
    const organizationId = await organizationIdOf(email);

    await setBitrixMockState({
      leads: [
        mockBitrixLead({ ID: '9001', TITLE: 'Transportadora Horizonte Ltda' }),
        mockBitrixLead({ ID: '9002', TITLE: 'Log Express Cargo', ASSIGNED_BY_ID: '102' }),
      ],
      users: [ADMIN_BITRIX_USER, SECOND_BITRIX_USER],
    });
    await seedConnection(organizationId);

    // A fila dispara a importação automática: crm.status.list + crm.lead.list +
    // crm.lead.fields + user.get + crm.lead.get por lead ainda não importado.
    const queueResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/mesa-tratamento/queue') && res.request().method() === 'GET',
    );
    await page.goto('/app/mesa-tratamento');
    const queueResponse = await queueResponsePromise;
    expect(queueResponse.status()).toBe(200);
    const queueBody = await queueResponse.json();
    expect(queueBody.data.connectionId).toBeTruthy();
    expect(queueBody.data.queue).toHaveLength(2);
    const currentLeadId = queueBody.data.current.id as string;
    expect(queueBody.data.current.title).toBeTruthy();

    // O lead "atual" é escolhido por score de prioridade — descobre o bitrixLeadId real dele
    // no Atlas para amarrar as asserções do portal mock ao registro certo.
    requestContext.enterWith({ bypassRls: true });
    const currentAtlasLead = await prisma.lead.findUnique({
      where: { id: currentLeadId },
      select: { bitrixLeadId: true },
    });
    const currentBitrixId = currentAtlasLead?.bitrixLeadId;
    expect(currentBitrixId).toBeTruthy();

    // Prova de que a importação Bitrix→Atlas aconteceu de verdade no portal mock.
    const getCalls = await getBitrixMockRequests('crm.lead.get');
    expect(getCalls.map((c) => String((c.params as { id?: string }).id)).sort()).toEqual([
      '9001',
      '9002',
    ]);

    // O lead atual aparece no card com dados vindos do Bitrix (via importação).
    await expect(page.getByText('Registrar atendimento')).toBeVisible({ timeout: 15_000 });

    // ── Registrar resultado (jornada feliz do SDR) ──────────────────────────
    await page.locator('#mesa-outcome').selectOption('reuniao_agendada');
    await page.locator('#mesa-note').fill('Falei com a Marina; pediu proposta até sexta.');
    const registerResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/mesa-tratamento/lead/') &&
        res.url().endsWith('/register') &&
        res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Registrar no Bitrix e liberar próximo' }).click();
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(200);
    expect((await registerResponse.json()).data.registered).toBe(true);

    // Escrita de volta ao Bitrix: comentário na timeline + update do lead — prova no log
    // do portal mock, não só no banco.
    const comments = await getBitrixMockRequests('crm.timeline.comment.add');
    const registerComment = comments.find(
      (c) =>
        (c.params.fields as Record<string, unknown>)?.ENTITY_ID === currentBitrixId &&
        String((c.params.fields as Record<string, unknown>)?.COMMENT ?? '').includes(
          'Mesa de Tratamento SDR',
        ),
    );
    expect(registerComment, 'comentário de resultado deve chegar ao Bitrix').toBeTruthy();
    expect(
      String((registerComment!.params.fields as Record<string, unknown>).COMMENT),
    ).toContain('reuniao_agendada');

    const updates = await getBitrixMockRequests('crm.lead.update');
    expect(updates.some((c) => String(c.params.id) === currentBitrixId)).toBe(true);

    // Persistência local: histórico do desfecho (alimenta o dashboard).
    const treatment = await prisma.mesaTratamentoTreatment.findFirst({
      where: { organizationId, leadId: currentLeadId, outcome: 'reuniao_agendada' },
    });
    expect(treatment, 'MesaTratamentoTreatment deve ter sido gravado').toBeTruthy();

    // Dashboard reflete o atendimento — mesmo sem Bitrix, a métrica vem do Prisma.
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    const dashResponse = await page.waitForResponse(
      (res) =>
        res.url().includes('/api/mesa-tratamento/dashboard') && res.request().method() === 'GET',
    );
    expect((await dashResponse.json()).data.kpis.totalTratados).toBe(1);
    await page.getByRole('button', { name: 'Fila', exact: true }).click();

    // ── Painel de gestão (ADMIN) ────────────────────────────────────────────
    await expect(page.getByText('Painel de gestão')).toBeVisible();

    // Reatribuir: escolhe o usuário 102 do mock e confirma — o backend deve mandar
    // ASSIGNED_BY_ID=102 ao Bitrix (crm.lead.update) e comentar a reatribuição.
    await page.locator('#mgmt-reassign').selectOption('102');
    const reassignResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/reassign') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Reatribuir responsável' }).click();
    const reassignResponse = await reassignResponsePromise;
    expect(reassignResponse.status()).toBe(200);
    const reassignUpdates = (await getBitrixMockRequests('crm.lead.update')).filter(
      (c) => (c.params.fields as Record<string, unknown>)?.ASSIGNED_BY_ID === '102',
    );
    expect(reassignUpdates.length, 'crm.lead.update com ASSIGNED_BY_ID=102 esperado').toBeGreaterThan(0);

    // Comentar na timeline sem registrar resultado.
    await page.locator('#mgmt-comment').fill('Acompanhar de perto — cliente estratégico.');
    const commentResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/comment') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Comentar', exact: true }).click();
    expect((await commentResponsePromise).status()).toBe(200);
    const mgmtComments = await getBitrixMockRequests('crm.timeline.comment.add');
    expect(
      mgmtComments.some((c) =>
        String((c.params.fields as Record<string, unknown>)?.COMMENT ?? '').includes(
          'Acompanhar de perto',
        ),
      ),
    ).toBe(true);

    // Marcar como decidido pela gestão → histórico local com outcome próprio.
    await page.locator('#mgmt-decide').fill('Revisei com a liderança.');
    const decideResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/decide') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Marcar como decidido' }).click();
    expect((await decideResponsePromise).status()).toBe(200);
    const decided = await prisma.mesaTratamentoTreatment.findFirst({
      where: { organizationId, leadId: currentLeadId, outcome: 'decidido_pela_gestao' },
    });
    expect(decided, 'decisão da gestão deve gerar MesaTratamentoTreatment').toBeTruthy();
  });

  test('SDR: fila restrita aos leads atribuídos a ele no Bitrix e registro permitido no próprio lead', async ({
    page,
  }) => {
    const email = uniqueTestEmail('mesa-e2e-sdr');
    await signUp(page, { email });
    await setUserRole(email, 'SDR');
    // Sessão cacheada no client — reload para o novo papel valer (mesmo padrão do spec RBAC).
    await page.reload();

    const organizationId = await organizationIdOf(email);
    await setBitrixMockState({
      leads: [
        mockBitrixLead({
          ID: '9101',
          TITLE: 'Lead atribuído ao SDR',
          ASSIGNED_BY_ID: '201',
        }),
        mockBitrixLead({
          ID: '9102',
          TITLE: 'Lead de outro vendedor',
          ASSIGNED_BY_ID: '202',
        }),
      ],
      users: [
        { ID: '201', NAME: 'Carla', LAST_NAME: 'SDR', EMAIL: email, ACTIVE: true },
        { ID: '202', NAME: 'Diego', LAST_NAME: 'Outro', EMAIL: 'diego@x.com', ACTIVE: true },
      ],
    });
    await seedConnection(organizationId);

    const queueResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/mesa-tratamento/queue') && res.request().method() === 'GET',
    );
    await page.goto('/app/mesa-tratamento');
    const queueBody = await (await queueResponsePromise).json();

    // Escopo "só meus leads": só o lead com ASSIGNED_BY_ID=201 (e-mail = usuário logado) entra.
    expect(queueBody.data.queue).toHaveLength(1);
    expect(queueBody.data.queue[0].title).toContain('Lead atribuído ao SDR');
    expect(queueBody.data.queue[0].title).not.toContain('Lead de outro vendedor');
    // Painel de gestão NÃO aparece para SDR.
    await expect(page.getByText('Painel de gestão')).toHaveCount(0);

    const sdrLeadId = queueBody.data.current.id as string;

    // Registro no próprio lead passa pela checagem de posse (lead.owner === userId).
    const registerResponse = await page.request.post(
      `/api/mesa-tratamento/lead/${sdrLeadId}/register`,
      { data: { outcome: 'contato', note: 'SDR registrou contato com o lead dele.' } },
    );
    expect(registerResponse.status()).toBe(200);

    // E um lead de OUTRO vendedor não pode ser registrado nem por ID direto — mas aqui o
    // lead 9102 nem foi importado (não existe no Atlas), então o 404 já prova o isolamento.
    requestContext.enterWith({ bypassRls: true });
    const foreignLead = await prisma.lead.findFirst({
      where: { organizationId, bitrixLeadId: '9102' },
      select: { id: true },
    });
    expect(foreignLead, 'lead de outro vendedor não deve nem ser importado').toBeNull();
  });

  test('erros: falha do Bitrix no register não grava nada local; reassign com usuário inexistente → 400', async ({
    page,
  }) => {
    const email = uniqueTestEmail('mesa-e2e-errors');
    await signUp(page, { email });
    const organizationId = await organizationIdOf(email);

    await setBitrixMockState({
      leads: [mockBitrixLead({ ID: '9201', TITLE: 'Lead para teste de erro' })],
      users: [ADMIN_BITRIX_USER, SECOND_BITRIX_USER],
    });
    await seedConnection(organizationId);

    // Importa o lead via fluxo real da fila (prova a jornada até aqui).
    const queueResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/mesa-tratamento/queue') && res.request().method() === 'GET',
    );
    await page.goto('/app/mesa-tratamento');
    const queueBody = await (await queueResponsePromise).json();
    const leadId = queueBody.data.current.id as string;

    requestContext.enterWith({ bypassRls: true });
    const treatmentsBefore = await prisma.mesaTratamentoTreatment.count({
      where: { organizationId, leadId },
    });

    // Injeta falha definitiva do Bitrix no crm.lead.update — o comentário na timeline passa,
    // mas a atualização da etapa falha → register deve propagar erro e NÃO gravar nada local.
    await setBitrixMockState({
      failures: {
        'crm.lead.update': {
          mode: 'api-error',
          error: 'ACCESS_DENIED',
          error_description: 'Sem permissão para editar leads (injetado pelo mock)',
        },
      },
    });

    const failedRegister = await page.request.post(
      `/api/mesa-tratamento/lead/${leadId}/register`,
      { data: { outcome: 'contato', note: 'Vai falhar no Bitrix de propósito.' } },
    );
    expect(failedRegister.status()).toBeGreaterThanOrEqual(400);
    expect(failedRegister.status()).toBeLessThan(500);

    // Nada foi gravado: sem tratamento, lead continua com status aberto e sem lastInteraction
    // do atendimento (a escrita local só acontece depois das duas escritas no Bitrix).
    const treatmentsAfter = await prisma.mesaTratamentoTreatment.count({
      where: { organizationId, leadId },
    });
    expect(treatmentsAfter).toBe(treatmentsBefore);
    const leadAfter = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { status: true, lastInteraction: true, bitrixSyncStatus: true },
    });
    expect(leadAfter?.status).toBe('Lead_Recebido');
    expect(leadAfter?.bitrixSyncStatus).toBe('failed');

    // Reassign com bitrixUserId que não existe no portal → 400 antes de qualquer escrita.
    await setBitrixMockState({ failures: {} });
    const badReassign = await page.request.post(
      `/api/mesa-tratamento/lead/${leadId}/reassign`,
      { data: { bitrixUserId: '999-inexistente' } },
    );
    expect(badReassign.status()).toBe(400);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * POS4 — correção do IDOR em `completeDailyPlanItem` (POST /api/bitrix/daily-plan/complete).
 * Antes: qualquer `itemId` arbitrário era repassado ao Bitrix (`tasks.task.complete`,
 * `crm.activity.update`, `crm.timeline.comment.add`) sem verificar que o item pertencia ao
 * plano do usuário — um usuário autenticado concluía task/activity/lead de OUTRO responsável
 * do portal. Estes testes provam a validação de posse nas 4 frentes exigidas:
 * (a) item de outro usuário do mesmo tenant → negado;
 * (b) item fora do plano → negado;
 * (c) item legítimo → sucesso;
 * (d) organizationId divergente → negado.
 */

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { prismaMock, clientMock, connectionsMock, dealsMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    activity: { findFirst: vi.fn(), update: vi.fn() },
  },
  clientMock: {
    callBitrix: vi.fn(),
    getConnectionWebhookUrl: vi.fn(),
  },
  connectionsMock: {
    listBitrixConnections: vi.fn(),
  },
  // deals.ts puxa audit/enrichment/customFields — aqui só interessa getBitrixUsers (usado por
  // resolvePlanBitrixUser para resolver a identidade Bitrix do dono do plano).
  dealsMock: {
    getBitrixUsers: vi.fn(),
  },
}));
vi.mock('../../../../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../client.js', () => clientMock);
vi.mock('../connections.js', () => connectionsMock);
vi.mock('../deals.js', () => dealsMock);

import { completeDailyPlanItem } from '../dailyPlan.service.js';

const ORG = 'org-1';
const USER = 'user-1';
const WEBHOOK = 'https://portal.bitrix24.com/rest/1/token/';

/** callBitrix mockado por método — cada caso define o que o "get" de verificação devolve. */
function mockBitrixGet(method: string, result: unknown) {
  clientMock.callBitrix.mockImplementation(async (_url: string, m: string) => {
    if (m === method) return { result };
    return { result: {} };
  });
}

function bitrixCalls(method: string) {
  return clientMock.callBitrix.mock.calls.filter((c) => c[1] === method);
}

async function expectStatus(promise: Promise<unknown>, statusCode: number) {
  try {
    await promise;
    expect.unreachable('devia ter lançado AppError');
  } catch (err: any) {
    expect(err?.statusCode).toBe(statusCode);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  connectionsMock.listBitrixConnections.mockResolvedValue([{ id: 'conn-1' }]);
  clientMock.getConnectionWebhookUrl.mockResolvedValue(WEBHOOK);
  dealsMock.getBitrixUsers.mockResolvedValue([]);
  // Usuário com vínculo Bitrix explícito (User.bitrixUserId) → planoBitrixUserId = '77'.
  prismaMock.user.findUnique.mockResolvedValue({
    email: 'vendedor@empresa.com',
    name: 'Vendedor',
    bitrixUserId: 77,
  });
  clientMock.callBitrix.mockResolvedValue({ result: {} });
});

describe('completeDailyPlanItem — IDOR (POS4)', () => {
  it('(a) BITRIX_TASK de outro responsável do mesmo tenant → 404 e NENHUMA mutação no Bitrix', async () => {
    mockBitrixGet('tasks.task.get', { task: { id: '555', responsibleId: '88' } });

    await expectStatus(completeDailyPlanItem(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555'), 404);

    expect(bitrixCalls('tasks.task.complete')).toHaveLength(0);
    expect(bitrixCalls('tasks.task.get')).toHaveLength(1); // só a verificação de posse rodou
  });

  it('(b) BITRIX_ACTIVITY fora do plano (responsável diverso) → 404 e crm.activity.update não chamado', async () => {
    mockBitrixGet('crm.activity.get', { ID: '900', RESPONSIBLE_ID: '42' });

    await expectStatus(completeDailyPlanItem(ORG, USER, 'BITRIX_ACTIVITY', 'bitrix_act_900'), 404);

    expect(bitrixCalls('crm.activity.update')).toHaveLength(0);
  });

  it('BITRIX_LEAD atribuído a outro usuário → 404 e crm.timeline.comment.add não chamado', async () => {
    mockBitrixGet('crm.lead.get', { ID: '12', ASSIGNED_BY_ID: '5' });

    await expectStatus(completeDailyPlanItem(ORG, USER, 'BITRIX_LEAD', 'bitrix_lead_12'), 404);

    expect(bitrixCalls('crm.timeline.comment.add')).toHaveLength(0);
  });

  it('(c) BITRIX_TASK legítimo (responsável = usuário do plano) → tasks.task.complete executado', async () => {
    mockBitrixGet('tasks.task.get', { task: { id: '555', responsibleId: '77' } });

    const result = await completeDailyPlanItem(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555');

    expect(result.success).toBe(true);
    expect(bitrixCalls('tasks.task.complete')).toEqual([
      [WEBHOOK, 'tasks.task.complete', { taskId: '555' }],
    ]);
  });

  it('(c2) BITRIX_LEAD legítimo (ASSIGNED_BY_ID = usuário do plano) → comentário na timeline do lead', async () => {
    mockBitrixGet('crm.lead.get', { ID: '12', ASSIGNED_BY_ID: '77' });

    const result = await completeDailyPlanItem(ORG, USER, 'BITRIX_LEAD', 'bitrix_lead_12');

    expect(result.success).toBe(true);
    expect(bitrixCalls('crm.timeline.comment.add')).toHaveLength(1);
  });

  it('(d) organizationId divergente (sem conexão Bitrix do tenant) → 400 antes de qualquer mutação', async () => {
    connectionsMock.listBitrixConnections.mockResolvedValue([]); // org sem conexão

    await expectStatus(
      completeDailyPlanItem('org-intrusa', USER, 'BITRIX_TASK', 'bitrix_task_555'),
      400,
    );

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });

  it('(d2) LOCAL_ACTIVITY de outro usuário do mesmo tenant → 404 (owner divergente no where)', async () => {
    prismaMock.activity.findFirst.mockResolvedValue(null); // owner != userId ou outra org

    await expectStatus(completeDailyPlanItem(ORG, USER, 'LOCAL_ACTIVITY', 'local_act-1'), 404);

    // A busca já carrega organizationId + owner do usuário autenticado.
    expect(prismaMock.activity.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'act-1', organizationId: ORG, owner: USER }),
      }),
    );
    expect(prismaMock.activity.update).not.toHaveBeenCalled();
  });

  it('(c3) LOCAL_ACTIVITY legítimo → status Concluida', async () => {
    prismaMock.activity.findFirst.mockResolvedValue({ id: 'act-1' });

    const result = await completeDailyPlanItem(ORG, USER, 'LOCAL_ACTIVITY', 'local_act-1');

    expect(result.success).toBe(true);
    expect(prismaMock.activity.update).toHaveBeenCalledWith({
      where: { id: 'act-1' },
      data: { status: 'Concluida' },
    });
  });

  it('itemId com prefixo de OUTRO tipo (bitrix_lead_9 como BITRIX_TASK) → 400 sem chamar o Bitrix', async () => {
    await expectStatus(completeDailyPlanItem(ORG, USER, 'BITRIX_TASK', 'bitrix_lead_9'), 400);

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });

  it('usuário sem identidade Bitrix resolvida → 403 (fail-closed) antes da mutação', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: 'sem-vinculo@empresa.com',
      name: 'Sem Vínculo',
      bitrixUserId: null,
    });
    dealsMock.getBitrixUsers.mockResolvedValue([]); // e-mail/nome não casam com ninguém

    await expectStatus(completeDailyPlanItem(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555'), 403);

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });
});

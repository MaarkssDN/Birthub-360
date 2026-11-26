import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * MAIN-50-DAILYPLAN-NOTES-IDOR — porte para `main` da entrega `a08e841a0c` (branch
 * `agente/50-dailyplan-idor-s50`), adaptada ao fix POS4 que main já tinha em
 * `completeDailyPlanItem`. Cobre o que main AINDA não cobria:
 * - `addDailyPlanItemNote` ignorava `_userId`: qualquer usuário da org anotava atividade local
 *   de colega e postava comentário em task/activity/lead de qualquer responsável do portal;
 * - `fetchDailyPlanItemNotes` (GET /daily-plan/notes) nem recebia userId — IDOR de LEITURA;
 * - `entityType`/`entityId` do cliente iam direto para `crm.timeline.comment.*` sem allowlist;
 * - `createDailyPlanActivity` aceitava `leadId` de outra organização (vazamento via plano).
 */

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { prismaMock, clientMock, connectionsMock, dealsMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    activity: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    lead: { findFirst: vi.fn() },
  },
  clientMock: {
    callBitrix: vi.fn(),
    getConnectionWebhookUrl: vi.fn(),
  },
  connectionsMock: {
    listBitrixConnections: vi.fn(),
  },
  dealsMock: {
    getBitrixUsers: vi.fn(),
  },
}));
vi.mock('../../../../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../client.js', () => clientMock);
vi.mock('../connections.js', () => connectionsMock);
vi.mock('../deals.js', () => dealsMock);

import { addDailyPlanItemNote, createDailyPlanActivity } from '../dailyPlan.service.js';
import { fetchDailyPlanItemNotes } from '../dailyPlanNotes.service.js';

const ORG = 'org-1';
const USER = { id: 'user-1', email: 'vendedor@empresa.com', role: 'SDR' };
const MANAGER = { id: 'gestor-1', email: 'gestor@empresa.com', role: 'GESTOR' };
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
  // Vínculo Bitrix explícito → bitrixUserId '77' para o usuário SDR e para o gestor.
  prismaMock.user.findFirst.mockResolvedValue({
    name: 'Vendedor',
    bitrixUserId: 77,
  });
  prismaMock.user.findUnique.mockResolvedValue({
    email: 'vendedor@empresa.com',
    name: 'Vendedor',
    bitrixUserId: 77,
  });
  clientMock.callBitrix.mockResolvedValue({ result: {} });
});

describe('addDailyPlanItemNote — IDOR (notas)', () => {
  it('LOCAL_ACTIVITY de outro owner do mesmo tenant → 404 e update não chamado', async () => {
    prismaMock.activity.findFirst.mockResolvedValue(null); // owner != user.id

    await expectStatus(
      addDailyPlanItemNote(ORG, USER, 'LOCAL_ACTIVITY', 'local_act-1', 'anotação'),
      404,
    );

    expect(prismaMock.activity.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'act-1', organizationId: ORG, owner: USER.id }),
      }),
    );
    expect(prismaMock.activity.update).not.toHaveBeenCalled();
  });

  it('LOCAL_ACTIVITY legítimo → observação concatenada na atividade', async () => {
    prismaMock.activity.findFirst.mockResolvedValue({ id: 'act-1', observations: 'obs antiga' });

    const result = await addDailyPlanItemNote(
      ORG,
      USER,
      'LOCAL_ACTIVITY',
      'local_act-1',
      'nova nota',
    );

    expect(result.success).toBe(true);
    expect(prismaMock.activity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'act-1' },
        data: expect.objectContaining({ observations: expect.stringContaining('nova nota') }),
      }),
    );
  });

  it('BITRIX_TASK de outro responsável → 403 e task.commentitem.add não chamado', async () => {
    mockBitrixGet('tasks.task.get', { task: { ID: '555', RESPONSIBLE_ID: '88' } });

    await expectStatus(
      addDailyPlanItemNote(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555', 'nota'),
      403,
    );

    expect(bitrixCalls('task.commentitem.add')).toHaveLength(0);
  });

  it('BITRIX_TASK legítimo (RESPONSIBLE_ID = usuário) → comentário adicionado', async () => {
    mockBitrixGet('tasks.task.get', { task: { ID: '555', RESPONSIBLE_ID: '77' } });

    const result = await addDailyPlanItemNote(
      ORG,
      USER,
      'BITRIX_TASK',
      'bitrix_task_555',
      'liguei, cliente pediu proposta',
    );

    expect(result.success).toBe(true);
    expect(bitrixCalls('task.commentitem.add')).toEqual([
      [
        WEBHOOK,
        'task.commentitem.add',
        { taskId: '555', fields: { POST_MESSAGE: 'liguei, cliente pediu proposta' } },
      ],
    ]);
  });

  it('BITRIX_LEAD de outro atribuído → 403 e crm.timeline.comment.add não chamado', async () => {
    mockBitrixGet('crm.lead.get', { ID: '12', ASSIGNED_BY_ID: '5' });

    await expectStatus(
      addDailyPlanItemNote(ORG, USER, 'BITRIX_LEAD', 'bitrix_lead_12', 'nota'),
      403,
    );

    expect(bitrixCalls('crm.timeline.comment.add')).toHaveLength(0);
  });

  it('BITRIX_LEAD legítimo ignora entityType/entityId do cliente — comentário sempre no próprio lead', async () => {
    mockBitrixGet('crm.lead.get', { ID: '12', ASSIGNED_BY_ID: '77' });

    await addDailyPlanItemNote(
      ORG,
      USER,
      'BITRIX_LEAD',
      'bitrix_lead_12',
      'nota',
      'deal',
      '999',
    );

    expect(bitrixCalls('crm.timeline.comment.add')).toEqual([
      [
        WEBHOOK,
        'crm.timeline.comment.add',
        {
          fields: {
            ENTITY_ID: '12',
            ENTITY_TYPE: 'lead',
            COMMENT: 'nota',
          },
        },
      ],
    ]);
  });

  it('entityType fora da allowlist → 400 antes de qualquer chamada ao Bitrix', async () => {
    await expectStatus(
      addDailyPlanItemNote(ORG, USER, 'BITRIX_LEAD', 'bitrix_lead_12', 'nota', 'invoice', '1'),
      400,
    );

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });

  it('ADMIN/GESTOR operam item de outro responsável (bypass legítimo de gestor)', async () => {
    mockBitrixGet('tasks.task.get', { task: { ID: '555', RESPONSIBLE_ID: '88' } });

    const result = await addDailyPlanItemNote(
      ORG,
      MANAGER,
      'BITRIX_TASK',
      'bitrix_task_555',
      'nota do gestor',
    );

    expect(result.success).toBe(true);
    expect(bitrixCalls('task.commentitem.add')).toHaveLength(1);
    // Gestor não precisa nem resolver o próprio bitrixUserId.
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('usuário sem vínculo Bitrix → 400 (fail-closed) antes da mutação', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ name: 'Sem Vínculo', bitrixUserId: null });
    dealsMock.getBitrixUsers.mockResolvedValue([]);

    await expectStatus(
      addDailyPlanItemNote(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555', 'nota'),
      400,
    );

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });

  it('prefixo de outro itemType (bitrix_lead_9 como BITRIX_TASK) → 400 sem chamar o Bitrix', async () => {
    await expectStatus(
      addDailyPlanItemNote(ORG, USER, 'BITRIX_TASK', 'bitrix_lead_9', 'nota'),
      400,
    );

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });
});

describe('fetchDailyPlanItemNotes — IDOR de leitura', () => {
  it('LOCAL_ACTIVITY → [] sem tocar no Bitrix (observações já vêm no plano)', async () => {
    const notes = await fetchDailyPlanItemNotes(ORG, USER, 'LOCAL_ACTIVITY', 'local_act-1');

    expect(notes).toEqual([]);
    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });

  it('BITRIX_TASK de outro responsável → 403 e task.commentitem.getlist não chamado', async () => {
    mockBitrixGet('tasks.task.get', { task: { ID: '555', RESPONSIBLE_ID: '88' } });

    await expectStatus(
      fetchDailyPlanItemNotes(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555'),
      403,
    );

    expect(bitrixCalls('task.commentitem.getlist')).toHaveLength(0);
  });

  it('BITRIX_TASK legítimo → histórico de comentários retornado', async () => {
    mockBitrixGet('tasks.task.get', { task: { ID: '555', RESPONSIBLE_ID: '77' } });
    clientMock.callBitrix.mockImplementation(async (_url: string, m: string) => {
      if (m === 'tasks.task.get')
        return { result: { task: { ID: '555', RESPONSIBLE_ID: '77' } } };
      if (m === 'task.commentitem.getlist')
        return {
          result: [{ AUTHOR_NAME: 'Vendedor', POST_MESSAGE: 'ok', POST_DATE: '2026-11-20T10:00:00' }],
        };
      return { result: {} };
    });

    const notes = await fetchDailyPlanItemNotes(ORG, USER, 'BITRIX_TASK', 'bitrix_task_555');

    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('Vendedor: ok');
  });

  it('entityType inválido na query → 400', async () => {
    await expectStatus(
      fetchDailyPlanItemNotes(ORG, USER, 'BITRIX_LEAD', 'bitrix_lead_12', 'smart_invoice'),
      400,
    );

    expect(clientMock.callBitrix).not.toHaveBeenCalled();
  });
});

describe('createDailyPlanActivity — tenancy do leadId', () => {
  it('leadId de outra organização → 404 e activity.create não chamado', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);

    await expectStatus(
      createDailyPlanActivity(ORG, USER.id, USER.email, {
        title: 'Follow-up',
        channel: 'CALL',
        leadId: 'lead-de-outra-org',
      }),
      404,
    );

    expect(prismaMock.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'lead-de-outra-org', organizationId: ORG }),
      }),
    );
    expect(prismaMock.activity.create).not.toHaveBeenCalled();
  });

  it('leadId da organização → activity.create executado', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.activity.create.mockResolvedValue({ id: 'act-9' });
    connectionsMock.listBitrixConnections.mockResolvedValue([]); // sem Bitrix: só grava local

    const result = await createDailyPlanActivity(ORG, USER.id, USER.email, {
      title: 'Follow-up',
      channel: 'CALL',
      leadId: 'lead-1',
    });

    expect(result.success).toBe(true);
    expect(prismaMock.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: ORG, owner: USER.id, leadId: 'lead-1' }),
      }),
    );
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Regressão dos itens 1 e 2 do handoff 45-para-04-atividades-agenda-bugs.md (Agente 41,
 * ONDA3-41-ACTIVITIES):
 * - create/update gravavam `new Date('YYYY-MM-DD')` = meia-noite UTC → dia anterior em SP;
 * - `leadId` nunca era validado contra `organizationId` → Activity cross-tenant.
 */
const prismaMock = {
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  activity: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  timelineEvent: { create: vi.fn() },
  lead: { findFirst: vi.fn() },
};

vi.mock('../../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../../../lib/logger.js', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../automations/automation.engine.js', () => ({
  automationEngine: { handle: vi.fn().mockResolvedValue(undefined) },
}));

const { PrismaActivityRepository } = await import('../infra/PrismaActivityRepository.js');
const { activityService } = await import('../services/activity.service.js');

const VALID_ACTIVITY = {
  id: 'act-1',
  type: 'Ligacao',
  status: 'Pendente',
  owner: 'Maria',
  leadId: 'lead-1',
  date: new Date('2026-11-23T03:00:00.000Z'),
};

const CREATE_INPUT = {
  type: 'Ligação' as const,
  status: 'Pendente' as const,
  owner: 'Maria',
  leadId: 'lead-1',
  date: '2026-11-23',
  time: null,
  observations: null,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('PrismaActivityRepository.createWithTimeline — leadId cross-tenant', () => {
  it('rejeita leadId de outro tenant/soft-deletado antes de qualquer escrita', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null); // lead não existe no tenant
    const repo = new PrismaActivityRepository();

    await expect(repo.createWithTimeline('org-1', CREATE_INPUT as never)).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(prismaMock.activity.create).not.toHaveBeenCalled();
    expect(prismaMock.timelineEvent.create).not.toHaveBeenCalled();
  });

  it('valida o lead com organizationId + deletedAt null', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.activity.create.mockResolvedValue(VALID_ACTIVITY);
    prismaMock.timelineEvent.create.mockResolvedValue({ id: 'te-1' });
    const repo = new PrismaActivityRepository();

    await repo.createWithTimeline('org-1', CREATE_INPUT as never);

    expect(prismaMock.lead.findFirst).toHaveBeenCalledWith({
      where: { id: 'lead-1', organizationId: 'org-1', deletedAt: null },
      select: { id: true },
    });
  });
});

describe('PrismaActivityRepository.createWithTimeline — off-by-one de data', () => {
  it('date-only YYYY-MM-DD grava a meia-noite civil de America/Sao_Paulo, não UTC', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.activity.create.mockResolvedValue(VALID_ACTIVITY);
    prismaMock.timelineEvent.create.mockResolvedValue({ id: 'te-1' });
    const repo = new PrismaActivityRepository();

    await repo.createWithTimeline('org-1', CREATE_INPUT as never);

    const createArg = prismaMock.activity.create.mock.calls[0][0] as {
      data: { date: Date };
    };
    // Bug original: new Date('2026-11-23') === 2026-11-23T00:00:00.000Z → renderizava 22/11 em SP.
    expect(createArg.data.date.toISOString()).toBe('2026-11-23T03:00:00.000Z');
  });

  it('ISO completo (drag do calendário / tools de IA) passa inalterado', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.activity.create.mockResolvedValue(VALID_ACTIVITY);
    prismaMock.timelineEvent.create.mockResolvedValue({ id: 'te-1' });
    const repo = new PrismaActivityRepository();

    await repo.createWithTimeline('org-1', {
      ...CREATE_INPUT,
      date: '2026-11-23T17:30:00.000Z',
    } as never);

    const createArg = prismaMock.activity.create.mock.calls[0][0] as {
      data: { date: Date };
    };
    expect(createArg.data.date.toISOString()).toBe('2026-11-23T17:30:00.000Z');
  });
});

describe('PrismaActivityRepository.updateWithTimeline', () => {
  it('não edita atividade soft-deletada (deletedAt no pre-check)', async () => {
    prismaMock.activity.findFirst.mockResolvedValue(null);
    const repo = new PrismaActivityRepository();

    await expect(repo.updateWithTimeline('org-1', 'act-1', {} as never)).rejects.toThrow(
      'Activity not found',
    );
    expect(prismaMock.activity.findFirst).toHaveBeenCalledWith({
      where: { id: 'act-1', organizationId: 'org-1', deletedAt: null },
    });
    expect(prismaMock.activity.update).not.toHaveBeenCalled();
  });

  it('rejeita troca de leadId para lead de outro tenant', async () => {
    prismaMock.activity.findFirst.mockResolvedValue(VALID_ACTIVITY);
    prismaMock.lead.findFirst.mockResolvedValue(null);
    const repo = new PrismaActivityRepository();

    await expect(
      repo.updateWithTimeline('org-1', 'act-1', { leadId: 'lead-estrangeiro' } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.activity.update).not.toHaveBeenCalled();
  });
});

describe('ActivityService (legado, usado por tools de IA) — mesma proteção', () => {
  it('create rejeita leadId cross-tenant', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);

    await expect(activityService.create('org-1', CREATE_INPUT)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.activity.create).not.toHaveBeenCalled();
    expect(prismaMock.timelineEvent.create).not.toHaveBeenCalled();
  });

  it('create com date-only grava meia-noite civil SP', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.activity.create.mockResolvedValue(VALID_ACTIVITY);
    prismaMock.timelineEvent.create.mockResolvedValue({ id: 'te-1' });

    await activityService.create('org-1', CREATE_INPUT);

    const createArg = prismaMock.activity.create.mock.calls[0][0] as {
      data: { date: Date };
    };
    expect(createArg.data.date.toISOString()).toBe('2026-11-23T03:00:00.000Z');
  });

  it('findAll não devolve atividades soft-deletadas', async () => {
    prismaMock.activity.findMany.mockResolvedValue([]);
    prismaMock.activity.count.mockResolvedValue(0);

    await activityService.findAll('org-1');

    expect(prismaMock.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', deletedAt: null }),
      }),
    );
  });
});

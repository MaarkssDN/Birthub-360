import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    leadStageHistory: {
      findMany: vi.fn(),
    },
    voiceCallLog: {
      findMany: vi.fn(),
    },
    whatsAppMessage: {
      findMany: vi.fn(),
    },
    cadenceRun: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma.js';
import { PrismaAnalyticsRepository } from '@/features/analytics/infra/PrismaAnalyticsRepository.js';

type Mocked<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const lead = prisma.lead as unknown as Mocked<typeof prisma.lead>;
const activity = prisma.activity as unknown as Mocked<typeof prisma.activity>;
const stageHistory = prisma.leadStageHistory as unknown as Mocked<typeof prisma.leadStageHistory>;
const voiceCallLog = (prisma as any).voiceCallLog as unknown as Mocked<(typeof prisma)['lead']>;
const whatsAppMessage = (prisma as any).whatsAppMessage as unknown as Mocked<(typeof prisma)['lead']>;
const cadenceRun = (prisma as any).cadenceRun as unknown as Mocked<(typeof prisma)['lead']>;

const repo = new PrismaAnalyticsRepository();
const ORG = 'org-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PrismaAnalyticsRepository.sumOpenPipelineValue', () => {
  it('count vem da mesma condição usada para a soma — permite a camada de aplicação decidir null vs. valor real', async () => {
    lead.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });
    lead.count.mockResolvedValue(2);

    const result = await repo.sumOpenPipelineValue(ORG);

    expect(result).toEqual({ total: 50000, count: 2 });
    const aggregateWhere = lead.aggregate.mock.calls[0][0].where;
    const countWhere = lead.count.mock.calls[0][0].where;
    expect(aggregateWhere.amount).toEqual({ not: null });
    expect(countWhere.amount).toEqual({ not: null });
    expect(aggregateWhere.status.notIn).toEqual(
      expect.arrayContaining([
        'Negocios_Ganhos',
        'Negocios_Perdidos',
        'Lead_Desqualificado',
        'Piloto_Birthub360_Profile_Cancelado',
        'Piloto_Logistico_Cancelado',
      ]),
    );
  });
});

describe('PrismaAnalyticsRepository.sumWonRevenueSince', () => {
  it('soma amount de leads ganhos fechados desde since', async () => {
    lead.aggregate.mockResolvedValue({ _sum: { amount: 350000 } });
    lead.count.mockResolvedValue(5);

    const result = await repo.sumWonRevenueSince(ORG, new Date('2026-08-01'));

    expect(result).toEqual({ total: 350000, count: 5 });
    const where = lead.aggregate.mock.calls[0][0].where;
    expect(where.status).toBe('Negocios_Ganhos');
    expect(where.amount).toEqual({ not: null });
  });
});

describe('PrismaAnalyticsRepository.groupFunnelWithAmounts', () => {
  it('agrupa por status obtendo count e soma de amount', async () => {
    lead.groupBy.mockResolvedValue([
      { status: 'Lead_Recebido', _count: { _all: 10 }, _sum: { amount: 50000 } },
    ]);

    const result = await repo.groupFunnelWithAmounts(ORG);

    expect(result).toEqual([{ status: 'Lead_Recebido', count: 10, amount: 50000 }]);
  });
});

describe('PrismaAnalyticsRepository.countOpenLeads — exclui desqualificado e piloto cancelado, não só ganho/perdido', () => {
  it('a cláusula notIn cobre os 5 status terminais', async () => {
    lead.count.mockResolvedValue(0);

    await repo.countOpenLeads(ORG);

    const where = lead.count.mock.calls[0][0].where;
    expect(where.status.notIn).toEqual(
      expect.arrayContaining([
        'Negocios_Ganhos',
        'Negocios_Perdidos',
        'Lead_Desqualificado',
        'Piloto_Birthub360_Profile_Cancelado',
        'Piloto_Logistico_Cancelado',
      ]),
    );
  });
});

describe('PrismaAnalyticsRepository.findCallActivityTimestamps', () => {
  it('filtra pelo valor real do enum Prisma ("Ligacao"), não pelo literal "call" (bug legado)', async () => {
    activity.findMany.mockResolvedValue([{ createdAt: new Date('2026-08-12T14:00:00') }]);

    const result = await repo.findCallActivityTimestamps(ORG);

    expect(activity.findMany.mock.calls[0][0].where.type).toBe('Ligacao');
    expect(result).toHaveLength(1);
  });
});

describe('PrismaAnalyticsRepository.groupLostLeadsByReason', () => {
  it('agrupa por lossReason restrito a leads fechados sem venda', async () => {
    lead.groupBy.mockResolvedValue([{ lossReason: 'Preço', _count: { _all: 3 } }]);

    const result = await repo.groupLostLeadsByReason(ORG);

    expect(result).toEqual([{ value: 'Preço', count: 3 }]);
    const where = lead.groupBy.mock.calls[0][0].where;
    expect(where.status.in).toEqual(
      expect.arrayContaining([
        'Negocios_Perdidos',
        'Lead_Desqualificado',
        'Piloto_Birthub360_Profile_Cancelado',
        'Piloto_Logistico_Cancelado',
      ]),
    );
  });
});

describe('PrismaAnalyticsRepository.groupQualifiedLeadsByOwner', () => {
  it('exclui as duas primeiras etapas e o desqualificado', async () => {
    lead.groupBy.mockResolvedValue([{ owner: 'user-1', _count: { _all: 2 } }]);

    const result = await repo.groupQualifiedLeadsByOwner(ORG);

    expect(result).toEqual([{ value: 'user-1', count: 2 }]);
    const where = lead.groupBy.mock.calls[0][0].where;
    expect(where.status.notIn).toEqual(
      expect.arrayContaining(['Lead_Recebido', 'Cadencia_Iniciada', 'Lead_Desqualificado']),
    );
  });
});

describe('PrismaAnalyticsRepository.findWonLeadsForHeatmap', () => {
  it('busca leads ganhos fechados desde a data especificada', async () => {
    lead.findMany.mockResolvedValue([
      { closedAt: new Date('2026-10-01T15:00:00Z'), amount: 15000 },
    ]);

    const result = await repo.findWonLeadsForHeatmap(ORG, new Date('2026-10-01'));
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(15000);
  });
});

describe('PrismaAnalyticsRepository.getRealtimeCockpitData', () => {
  it('agrega contadores de hoje e baseline comparativo', async () => {
    lead.count.mockResolvedValueOnce(12) // leadsToday
      .mockResolvedValueOnce(3) // dealsWonToday
      .mockResolvedValueOnce(60) // leadsBaseline
      .mockResolvedValueOnce(15); // dealsWonBaseline

    lead.aggregate.mockResolvedValueOnce({ _sum: { amount: 75000 } });

    activity.count.mockResolvedValueOnce(45) // activitiesToday
      .mockResolvedValueOnce(200); // activitiesBaseline

    const today = new Date('2026-11-03T00:00:00Z');
    const baseline = new Date('2026-10-27T00:00:00Z');

    const result = await repo.getRealtimeCockpitData(ORG, today, baseline);

    expect(result.leadsToday).toBe(12);
    expect(result.dealsWonToday).toBe(3);
    expect(result.wonRevenueToday).toBe(75000);
    expect(result.activitiesToday).toBe(45);
    expect(result.baselineDays).toBe(7);
  });
});

describe('PrismaAnalyticsRepository.getUnifiedTimeline', () => {
  it('busca eventos de todas as fontes e aplica paginação e ordenação', async () => {
    const now = new Date('2026-11-03T12:00:00Z');

    activity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        type: 'Ligacao',
        date: now,
        status: 'Concluida',
        observations: 'Falou com decisor',
        owner: 'SDR 1',
        leadId: 'lead-1',
        lead: {
          title: 'Lead 1',
          company: { tradeName: 'Empresa A' },
          contact: { name: 'Contato A' },
        },
      },
      {
        id: 'act-2',
        type: 'WhatsApp',
        date: new Date(now.getTime() - 1000),
        status: 'Cancelada',
        lead: null,
      },
      {
        id: 'act-3',
        type: 'Email',
        date: new Date(now.getTime() - 2000),
        status: 'Pendente',
        lead: null,
      },
    ]);

    voiceCallLog.findMany.mockResolvedValue([
      {
        id: 'v-1',
        durationSeconds: 120,
        summary: 'Resumo da chamada IA',
        outcome: 'Completed sucesso',
        createdAt: new Date(now.getTime() - 3000),
        leadId: 'lead-1',
      },
      {
        id: 'v-2',
        durationSeconds: 10,
        summary: 'Falhou',
        outcome: 'falha busy',
        createdAt: new Date(now.getTime() - 4000),
        leadId: null,
      },
    ]);

    whatsAppMessage.findMany.mockResolvedValue([
      {
        id: 'w-1',
        direction: 'outbound',
        body: 'Olá, tudo bem?',
        receivedAt: new Date(now.getTime() - 5000),
        contact: { id: 'c-1', name: 'Maria' },
        lead: null,
      },
    ]);

    lead.findMany.mockResolvedValue([
      {
        id: 'l-1',
        createdAt: new Date(now.getTime() - 6000),
        status: 'Negocios_Ganhos',
        amount: 50000,
        owner: 'Closer 1',
        company: { tradeName: 'Tech Corp' },
        contact: null,
      },
    ]);

    cadenceRun.findMany.mockResolvedValue([
      {
        id: 'cad-1',
        startedAt: new Date(now.getTime() - 7000),
        status: 'Completed',
        currentTouchOrder: 3,
        leadId: 'l-1',
        sequence: { name: 'Sequência Outbound' },
        lead: { company: { tradeName: 'Tech Corp' } },
      },
    ]);

    const result = await repo.getUnifiedTimeline(ORG, {
      period: 'today',
      entityType: 'all',
      outcome: 'all',
      page: 1,
      limit: 10,
    });

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);

    // Test with search filter
    const searchResult = await repo.getUnifiedTimeline(ORG, {
      search: 'Tech Corp',
    });
    expect(searchResult.events.every((e) => e.title.includes('Tech Corp') || e.targetName?.includes('Tech Corp'))).toBe(true);

    // Test with entityType filter
    const callResult = await repo.getUnifiedTimeline(ORG, {
      entityType: 'call',
    });
    expect(callResult.events.every((e) => e.entityType === 'call')).toBe(true);
  });
});

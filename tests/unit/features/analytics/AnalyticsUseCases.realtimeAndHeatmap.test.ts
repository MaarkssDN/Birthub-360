import { describe, expect, it, vi } from 'vitest';
import { AnalyticsUseCases } from '@/features/analytics/application/AnalyticsUseCases';
import type {
  ActivityHeatmapRawRow,
  AnalyticsRepository,
  RealtimeCockpitRawData,
  WonLeadHeatmapRawRow,
} from '@/features/analytics/domain/Analytics';
import { AnalyticsController } from '@/features/analytics/presentation/AnalyticsController';

function buildFakeRepository(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  const base: AnalyticsRepository = {
    countCompanies: vi.fn().mockResolvedValue(0),
    countContacts: vi.fn().mockResolvedValue(0),
    countOpenLeads: vi.fn().mockResolvedValue(0),
    countAllLeads: vi.fn().mockResolvedValue(0),
    countActivities: vi.fn().mockResolvedValue(0),
    countPendingActivities: vi.fn().mockResolvedValue(0),
    countOverdueActivities: vi.fn().mockResolvedValue(0),
    countLeadsByStatusSince: vi.fn().mockResolvedValue(0),
    countLeadsByStatus: vi.fn().mockResolvedValue(0),
    averageOpenLeadScore: vi.fn().mockResolvedValue(null),
    sumOpenPipelineValue: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
    sumWonRevenueSince: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
    sumAllWonRevenue: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
    groupLeadsByStatus: vi.fn().mockResolvedValue([]),
    groupFunnelWithAmounts: vi.fn().mockResolvedValue([]),
    findLeadsCreatedSince: vi.fn().mockResolvedValue([]),
    findLeadsClosedSince: vi.fn().mockResolvedValue([]),
    groupLeadsByTemperature: vi.fn().mockResolvedValue([]),
    groupLeadsBySource: vi.fn().mockResolvedValue([]),
    groupLeadsByOwner: vi.fn().mockResolvedValue([]),
    groupWonAmountByOwner: vi.fn().mockResolvedValue([]),
    groupQualifiedLeadsByOwner: vi.fn().mockResolvedValue([]),
    groupActivitiesByType: vi.fn().mockResolvedValue([]),
    groupActivitiesByStatus: vi.fn().mockResolvedValue([]),
    groupLostLeadsByReason: vi.fn().mockResolvedValue([]),
    findCallActivityTimestamps: vi.fn().mockResolvedValue([]),
    findLeadsForCohort: vi.fn().mockResolvedValue([]),
    calculateRealTmq: vi.fn().mockResolvedValue(null),
    findActivitiesForHeatmap: vi.fn().mockResolvedValue([] as ActivityHeatmapRawRow[]),
    findWonLeadsForHeatmap: vi.fn().mockResolvedValue([] as WonLeadHeatmapRawRow[]),
    getRealtimeCockpitData: vi.fn().mockResolvedValue({
      leadsToday: 0,
      dealsWonToday: 0,
      wonRevenueToday: 0,
      activitiesToday: 0,
      leadsBaseline: 0,
      dealsWonBaseline: 0,
      activitiesBaseline: 0,
      baselineDays: 14,
    } as RealtimeCockpitRawData),
  };
  return { ...base, ...overrides };
}

const ORG = 'org-test-123';

describe('AnalyticsUseCases — Productivity Heatmap', () => {
  it('retorna uma matriz completa de 7 dias x 24 horas (168 slots)', async () => {
    const repo = buildFakeRepository();
    const useCases = new AnalyticsUseCases(repo);

    const slots = await useCases.productivityHeatmap(ORG);

    expect(slots).toHaveLength(168);
    expect(slots[0]).toEqual({
      dayOfWeek: 0,
      hour: 0,
      totalActivities: 0,
      calls: 0,
      meetings: 0,
      messages: 0,
      tasks: 0,
      conversions: 0,
    });
  });

  it('classifica e distribui atividades corretamente por categoria e horário', async () => {
    // Terça-feira (dia 2), 10:30
    const tuesday10am = new Date(2026, 10, 3, 10, 30, 0); // 3 de Novembro de 2026 é Terça-feira (getDay() === 2)
    const tuesday14pm = new Date(2026, 10, 3, 14, 15, 0);

    const repo = buildFakeRepository({
      findActivitiesForHeatmap: vi.fn().mockResolvedValue([
        { type: 'Ligacao', createdAt: tuesday10am },
        { type: 'Reuniao', createdAt: tuesday10am },
        { type: 'WhatsApp', createdAt: tuesday10am },
        { type: 'Tarefa', createdAt: tuesday14pm },
      ] as ActivityHeatmapRawRow[]),
      findWonLeadsForHeatmap: vi.fn().mockResolvedValue([
        { closedAt: tuesday10am, amount: 50000 },
      ] as WonLeadHeatmapRawRow[]),
    });

    const useCases = new AnalyticsUseCases(repo);
    const slots = await useCases.productivityHeatmap(ORG);

    const slot10am = slots.find((s) => s.dayOfWeek === 2 && s.hour === 10);
    expect(slot10am).toBeDefined();
    expect(slot10am?.totalActivities).toBe(3);
    expect(slot10am?.calls).toBe(1);
    expect(slot10am?.meetings).toBe(1);
    expect(slot10am?.messages).toBe(1);
    expect(slot10am?.conversions).toBe(1);

    const slot14pm = slots.find((s) => s.dayOfWeek === 2 && s.hour === 14);
    expect(slot14pm?.totalActivities).toBe(1);
    expect(slot14pm?.tasks).toBe(1);
  });
});

describe('AnalyticsUseCases — Realtime Cockpit & Detecção de Anomalias', () => {
  it('retorna métricas de hoje com estado estável quando sem anomalias', async () => {
    const repo = buildFakeRepository({
      getRealtimeCockpitData: vi.fn().mockResolvedValue({
        leadsToday: 10,
        dealsWonToday: 2,
        wonRevenueToday: 80000,
        activitiesToday: 25,
        leadsBaseline: 100,
        dealsWonBaseline: 20, // 20% taxa de conversão baseline
        activitiesBaseline: 280,
        baselineDays: 14,
      }),
    });

    const useCases = new AnalyticsUseCases(repo);
    const metrics = await useCases.realtimeCockpit(ORG);

    expect(metrics.leadsToday).toBe(10);
    expect(metrics.dealsWonToday).toBe(2);
    expect(metrics.wonRevenueToday).toBe(80000);
    expect(metrics.activitiesToday).toBe(25);
    expect(metrics.conversionRateToday).toBe(20);
    expect(metrics.anomaly.detected).toBe(false);
    expect(metrics.anomaly.type).toBe('NONE');
  });

  it('detecta anomalia de queda brusca de conversão quando taxa de hoje cai > 35%', async () => {
    const repo = buildFakeRepository({
      getRealtimeCockpitData: vi.fn().mockResolvedValue({
        leadsToday: 10,
        dealsWonToday: 0, // 0% de conversão hoje
        wonRevenueToday: 0,
        activitiesToday: 15,
        leadsBaseline: 100,
        dealsWonBaseline: 25, // 25% taxa no histórico de 14 dias
        activitiesBaseline: 200,
        baselineDays: 14,
      }),
    });

    const useCases = new AnalyticsUseCases(repo);
    const metrics = await useCases.realtimeCockpit(ORG);

    expect(metrics.conversionRateToday).toBe(0);
    expect(metrics.anomaly.detected).toBe(true);
    expect(metrics.anomaly.type).toBe('CONVERSION_DROP');
    expect(metrics.anomaly.severity).toBe('critical'); // queda de 100%
    expect(metrics.anomaly.deviationPct).toBe(100);
    expect(metrics.anomaly.benchmarkValue).toBe(25);
  });

  it('detecta anomalia de desaceleração de atividades no período da tarde', async () => {
    // 16h da tarde com pouquíssimas atividades
    const afternoon = new Date(2026, 10, 3, 16, 0, 0);

    const repo = buildFakeRepository({
      getRealtimeCockpitData: vi.fn().mockResolvedValue({
        leadsToday: 2,
        dealsWonToday: 0,
        wonRevenueToday: 0,
        activitiesToday: 2, // apenas 2 atividades
        leadsBaseline: 20,
        dealsWonBaseline: 2,
        activitiesBaseline: 280, // média de 20 atividades/dia
        baselineDays: 14,
      }),
    });

    const useCases = new AnalyticsUseCases(repo);
    const metrics = await useCases.realtimeCockpit(ORG, afternoon);

    expect(metrics.anomaly.detected).toBe(true);
    expect(metrics.anomaly.type).toBe('ACTIVITY_DROP');
    expect(metrics.anomaly.severity).toBe('warning');
    expect(metrics.anomaly.deviationPct).toBeGreaterThan(50);
  });
});

describe('AnalyticsController — Endpoints Heatmap e Realtime', () => {
  it('getProductivityHeatmap responde JSON 200 com array de slots', async () => {
    const repo = buildFakeRepository();
    const useCases = new AnalyticsUseCases(repo);
    const controller = new AnalyticsController(useCases);

    const req = {
      user: { organizationId: ORG },
      query: { days: '15' },
    } as any;

    const res = {
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await controller.getProductivityHeatmap(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array),
      }),
    );
  });

  it('getRealtimeCockpit responde JSON 200 com métricas de tempo real', async () => {
    const repo = buildFakeRepository({
      getRealtimeCockpitData: vi.fn().mockResolvedValue({
        leadsToday: 5,
        dealsWonToday: 1,
        wonRevenueToday: 25000,
        activitiesToday: 12,
        leadsBaseline: 50,
        dealsWonBaseline: 10,
        activitiesBaseline: 140,
        baselineDays: 14,
      }),
    });
    const useCases = new AnalyticsUseCases(repo);
    const controller = new AnalyticsController(useCases);

    const req = {
      user: { organizationId: ORG },
    } as any;

    const res = {
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await controller.getRealtimeCockpit(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          leadsToday: 5,
          dealsWonToday: 1,
          wonRevenueToday: 25000,
          activitiesToday: 12,
          conversionRateToday: 20,
        }),
      }),
    );
  });
});

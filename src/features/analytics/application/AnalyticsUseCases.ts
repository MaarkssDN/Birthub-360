import {
  fromPrismaActivityStatus,
  fromPrismaActivityType,
  fromPrismaLeadStatus,
} from '../../../lib/enumMap.js';
import {
  type AnalyticsDashboard,
  type AnalyticsRepository,
  type AnomalyAlert,
  type CohortRow,
  type DistributionSlice,
  FUNNEL_STAGES,
  type FunnelStage,
  type GroupCount,
  LOST,
  type MonthlyPoint,
  type OverviewMetrics,
  type PerformanceAgentRow,
  type ProductivityHeatmapSlot,
  type RealtimeCockpitMetrics,
  type SalesSummaryMetrics,
  WON,
} from '../domain/Analytics.js';
import {
  brazilMonthKey,
  brazilMonthRange,
  shiftBrazilMonth,
} from '../../../shared/time/brazilCalendar.js';

function startOfCurrentMonth(now: Date): Date {
  return brazilMonthRange(brazilMonthKey(now)).start;
}

/** Primeiro dia do mês, `monthsBack` meses atrás, sempre segundo Brasília. */
function startOfMonthsAgo(now: Date, monthsBack: number): Date {
  return brazilMonthRange(shiftBrazilMonth(brazilMonthKey(now), -monthsBack)).start;
}

function monthKey(date: Date): string {
  return brazilMonthKey(date);
}

/** Converte um agrupamento bruto do repositório numa distribuição ordenada por contagem. */
function toDistribution(
  rows: GroupCount[],
  translate: (raw: string) => string,
  fallbackLabel = 'Não informado',
): DistributionSlice[] {
  return rows
    .map((row) => ({
      label: row.value == null || row.value === '' ? fallbackLabel : translate(row.value),
      count: row.count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Serializa o relatório de cohort em CSV (mesmo dado de `cohortAnalysis`, nunca recalculado aqui). */
export function buildCohortCsv(rows: CohortRow[]): string {
  const header = 'Mes,Total de Leads,Ganhos em 30 dias,Ganhos em 60 dias';
  const lines = rows.map((row) => `${row.month},${row.total},${row.won30d},${row.won60d}`);
  return [header, ...lines].join('\n');
}

/** Agrupa timestamps de ligação em (dia da semana, hora), omitindo células sem nenhuma ligação. */
function buildCallHeatmap(
  callTimestamps: Date[],
): { dayOfWeek: number; hour: number; count: number }[] {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const createdAt of callTimestamps) {
    grid[createdAt.getDay()][createdAt.getHours()]++;
  }

  const result: { dayOfWeek: number; hour: number; count: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      if (grid[day][hour] > 0) result.push({ dayOfWeek: day, hour, count: grid[day][hour] });
    }
  }
  return result;
}

function buildPerformanceReport(
  assignedRows: GroupCount[],
  qualifiedRows: GroupCount[],
  wonAmountRows: GroupCount[] = [],
): PerformanceAgentRow[] {
  const qualifiedByOwner = new Map<string, number>();
  for (const row of qualifiedRows) qualifiedByOwner.set(row.value ?? '', row.count);

  const wonAmountByOwner = new Map<string, number>();
  for (const row of wonAmountRows) wonAmountByOwner.set(row.value ?? '', row.count);

  return assignedRows
    .map((row) => {
      const owner = row.value || '';
      const assigned = row.count;
      const qualified = qualifiedByOwner.get(owner) ?? 0;
      const wonAmount = wonAmountByOwner.get(owner) ?? 0;
      return {
        agent: owner || 'Sem Dono',
        isAi: owner.includes('IA') || owner.includes('SDR'),
        leadsAssigned: assigned,
        leadsQualified: qualified,
        conversionRate: assigned > 0 ? (qualified / assigned) * 100 : 0,
        wonAmount,
      };
    })
    .sort((a, b) => b.leadsQualified - a.leadsQualified);
}

export class AnalyticsUseCases {
  constructor(private repository: AnalyticsRepository) {}

  /**
   * Métricas de topo com agregações reais de funil e vendas.
   */
  async overview(organizationId: string, now = new Date()): Promise<OverviewMetrics> {
    const monthStart = startOfCurrentMonth(now);

    const [
      totalCompanies,
      totalContacts,
      openLeads,
      totalLeadsEver,
      totalActivities,
      pendingActivities,
      overdueActivities,
      closedThisMonth,
      lostThisMonth,
      wonEver,
      averageScore,
      pipeline,
      wonMonthRevenue,
      allWonRevenue,
    ] = await Promise.all([
      this.repository.countCompanies(organizationId),
      this.repository.countContacts(organizationId),
      this.repository.countOpenLeads(organizationId),
      this.repository.countAllLeads(organizationId),
      this.repository.countActivities(organizationId),
      this.repository.countPendingActivities(organizationId),
      this.repository.countOverdueActivities(organizationId, now),
      this.repository.countLeadsByStatusSince(organizationId, WON, monthStart),
      this.repository.countLeadsByStatusSince(organizationId, LOST, monthStart),
      this.repository.countLeadsByStatus(organizationId, WON),
      this.repository.averageOpenLeadScore(organizationId),
      this.repository.sumOpenPipelineValue(organizationId),
      this.repository.sumWonRevenueSince(organizationId, monthStart),
      this.repository.sumAllWonRevenue(organizationId),
    ]);

    const wonRevenueThisMonth = wonMonthRevenue.count > 0 ? wonMonthRevenue.total : null;
    const averageTicketThisMonth =
      closedThisMonth > 0 && wonRevenueThisMonth != null
        ? Math.round((wonRevenueThisMonth / closedThisMonth) * 100) / 100
        : null;
    const totalWonRevenueEver = allWonRevenue.count > 0 ? allWonRevenue.total : null;

    return {
      totalCompanies,
      totalContacts,
      totalLeads: openLeads,
      totalActivities,
      pendingActivities,
      overdueActivities,
      closedThisMonth,
      lostThisMonth,
      conversionRate: totalLeadsEver > 0 ? (wonEver / totalLeadsEver) * 100 : 0,
      averageScore,
      pipelineValue: pipeline.count > 0 ? pipeline.total : null,
      wonRevenueThisMonth,
      averageTicketThisMonth,
      totalWonRevenueEver,
    };
  }

  /**
   * Funil por etapa com contagem e volume financeiro real (soma de Lead.amount).
   */
  async funnel(organizationId: string): Promise<FunnelStage[]> {
    const rows = await this.repository.groupFunnelWithAmounts(organizationId);

    const counts = new Map<string, number>();
    const amounts = new Map<string, number>();
    for (const row of rows) {
      if (row.status) {
        counts.set(row.status, row.count);
        amounts.set(row.status, row.amount);
      }
    }

    const orderedStages = [...FUNNEL_STAGES];
    const wonCount = counts.get(WON) ?? 0;
    const wonAmount = amounts.get(WON) ?? 0;

    const cumulativeCounts = orderedStages.map((_stage, index) => {
      const downstream = orderedStages
        .slice(index)
        .reduce((sum, s) => sum + (counts.get(s) ?? 0), 0);
      return downstream + wonCount;
    });

    const cumulativeAmounts = orderedStages.map((_stage, index) => {
      const downstream = orderedStages
        .slice(index)
        .reduce((sum, s) => sum + (amounts.get(s) ?? 0), 0);
      return downstream + wonAmount;
    });

    return orderedStages.map((stage, index) => ({
      label: fromPrismaLeadStatus(stage),
      count: cumulativeCounts[index],
      amount: cumulativeAmounts[index],
      conversionFromPrevious:
        index === 0 || cumulativeCounts[index - 1] === 0
          ? null
          : (cumulativeCounts[index] / cumulativeCounts[index - 1]) * 100,
      conversionFromPreviousAmount:
        index === 0 || cumulativeAmounts[index - 1] === 0
          ? null
          : (cumulativeAmounts[index] / cumulativeAmounts[index - 1]) * 100,
    }));
  }

  /** Evolução mensal de leads criados, ganhos e perdidos nos últimos `months` meses. */
  async monthly(organizationId: string, months = 6, now = new Date()): Promise<MonthlyPoint[]> {
    const since = startOfMonthsAgo(now, months - 1);

    const [created, closed] = await Promise.all([
      this.repository.findLeadsCreatedSince(organizationId, since),
      this.repository.findLeadsClosedSince(organizationId, since),
    ]);

    const buckets = new Map<string, MonthlyPoint>();
    for (let i = months - 1; i >= 0; i--) {
      const key = monthKey(startOfMonthsAgo(now, i));
      buckets.set(key, { month: key, created: 0, won: 0, lost: 0 });
    }

    for (const lead of created) {
      const bucket = buckets.get(monthKey(lead.createdAt));
      if (bucket) bucket.created++;
    }
    for (const lead of closed) {
      const bucket = buckets.get(monthKey(lead.closedAt));
      if (!bucket) continue;
      if (lead.status === WON) bucket.won++;
      else bucket.lost++;
    }

    return [...buckets.values()];
  }

  async cohortAnalysis(
    organizationId: string,
    monthsBack = 6,
    now = new Date(),
  ): Promise<CohortRow[]> {
    const since = startOfMonthsAgo(now, monthsBack - 1);
    const leads = await this.repository.findLeadsForCohort(organizationId, since);

    const buckets = new Map<string, { total: number; won30d: number; won60d: number }>();
    for (let i = monthsBack - 1; i >= 0; i--) {
      buckets.set(monthKey(startOfMonthsAgo(now, i)), { total: 0, won30d: 0, won60d: 0 });
    }

    const DAY_MS = 24 * 60 * 60 * 1000;
    for (const lead of leads) {
      const bucket = buckets.get(monthKey(lead.createdAt));
      if (!bucket) continue;
      bucket.total++;
      if (lead.status === WON && lead.closedAt) {
        const daysToClose = (lead.closedAt.getTime() - lead.createdAt.getTime()) / DAY_MS;
        if (daysToClose <= 30) bucket.won30d++;
        if (daysToClose <= 60) bucket.won60d++;
      }
    }

    return [...buckets.entries()]
      .filter(([, bucket]) => bucket.total > 0)
      .map(([month, bucket]) => ({ month, ...bucket }));
  }

  /** Monta o dashboard inteiro com métricas de vendas e funil integradas. */
  async dashboard(
    organizationId: string,
    months = 6,
    now = new Date(),
  ): Promise<AnalyticsDashboard> {
    const [
      overview,
      funnel,
      monthly,
      temperatureRows,
      sourceRows,
      ownerRows,
      wonByOwnerRows,
      wonAmountByOwnerRows,
      qualifiedByOwnerRows,
      activityTypeRows,
      activityStatusRows,
      lostReasonRows,
      callTimestamps,
      tmqMetric,
    ] = await Promise.all([
      this.overview(organizationId, now),
      this.funnel(organizationId),
      this.monthly(organizationId, months, now),
      this.repository.groupLeadsByTemperature(organizationId),
      this.repository.groupLeadsBySource(organizationId),
      this.repository.groupLeadsByOwner(organizationId),
      this.repository.groupLeadsByOwner(organizationId, WON),
      this.repository.groupWonAmountByOwner(organizationId),
      this.repository.groupQualifiedLeadsByOwner(organizationId),
      this.repository.groupActivitiesByType(organizationId),
      this.repository.groupActivitiesByStatus(organizationId),
      this.repository.groupLostLeadsByReason(organizationId),
      this.repository.findCallActivityTimestamps(organizationId),
      this.repository.calculateRealTmq(organizationId),
    ]);

    const wonByOwner = new Map<string, number>();
    for (const row of wonByOwnerRows) {
      wonByOwner.set(row.value ?? '', row.count);
    }

    const wonAmountByOwner = new Map<string, number>();
    for (const row of wonAmountByOwnerRows) {
      wonAmountByOwner.set(row.value ?? '', row.count);
    }

    const byOwner = ownerRows
      .map((row) => {
        const owner = row.value || '';
        return {
          label: owner || 'Sem responsável',
          count: row.count,
          won: wonByOwner.get(owner) ?? 0,
          wonAmount: wonAmountByOwner.get(owner) ?? 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const salesSummary: SalesSummaryMetrics = {
      totalWonDeals: overview.closedThisMonth,
      totalWonRevenue: overview.wonRevenueThisMonth ?? 0,
      averageTicket: overview.averageTicketThisMonth ?? null,
      salesVelocityDays: tmqMetric,
    };

    const isEmpty =
      overview.totalCompanies === 0 &&
      overview.totalContacts === 0 &&
      overview.totalActivities === 0 &&
      funnel.every((stage) => stage.count === 0);

    return {
      overview,
      funnel,
      monthly,
      byTemperature: toDistribution(temperatureRows, (v) => v, 'Sem temperatura'),
      bySource: toDistribution(sourceRows, (v) => v, 'Origem não informada'),
      byOwner,
      activitiesByType: toDistribution(activityTypeRows, fromPrismaActivityType),
      activitiesByStatus: toDistribution(activityStatusRows, fromPrismaActivityStatus),
      tmqMetric,
      lostReasons: toDistribution(lostReasonRows, (v) => v, 'Sem motivo registrado'),
      callHeatmap: buildCallHeatmap(callTimestamps),
      performanceReport: buildPerformanceReport(
        ownerRows,
        qualifiedByOwnerRows,
        wonAmountByOwnerRows,
      ),
      salesSummary,
      isEmpty,
    };
  }

  /**
   * Agregação defensiva de métricas para /api/analytics.
   * Retorna { metrics: [], total: 0 } quando o banco está vazio ou ocorre erro.
   */
  async getMetrics(organizationId: string): Promise<{ metrics: unknown[]; total: number }> {
    try {
      const [leadsCount, funnelStages] = await Promise.all([
        this.repository.countAllLeads(organizationId),
        this.repository.groupFunnelWithAmounts(organizationId),
      ]);

      if (leadsCount === 0 && funnelStages.length === 0) {
        return { metrics: [], total: 0 };
      }

      const metrics = funnelStages.map((stage) => ({
        name: stage.status,
        value: stage.count,
        amount: stage.amount,
      }));

      return {
        metrics,
        total: leadsCount,
      };
    } catch {
      return { metrics: [], total: 0 };
    }
  }

  /**
   * Heatmap de produtividade por dia da semana (0-6) x hora (0-23)
   * categorizado por tipo de atividade e fechamento de vendas.
   */
  async productivityHeatmap(
    organizationId: string,
    days = 30,
    now = new Date(),
  ): Promise<ProductivityHeatmapSlot[]> {
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const [activities, wonLeads] = await Promise.all([
      this.repository.findActivitiesForHeatmap(organizationId, since),
      this.repository.findWonLeadsForHeatmap(organizationId, since),
    ]);

    const grid: ProductivityHeatmapSlot[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid.push({
          dayOfWeek: day,
          hour,
          totalActivities: 0,
          calls: 0,
          meetings: 0,
          messages: 0,
          tasks: 0,
          conversions: 0,
        });
      }
    }

    for (const act of activities) {
      const d = act.createdAt;
      const day = d.getDay();
      const hour = d.getHours();
      const slot = grid[day * 24 + hour];
      if (slot) {
        slot.totalActivities++;
        const typeLower = (act.type || '').toLowerCase();
        if (typeLower.includes('ligacao') || typeLower.includes('ligação')) {
          slot.calls++;
        } else if (
          typeLower.includes('reuniao') ||
          typeLower.includes('reunião') ||
          typeLower.includes('visita')
        ) {
          slot.meetings++;
        } else if (
          typeLower.includes('email') ||
          typeLower.includes('e-mail') ||
          typeLower.includes('whatsapp') ||
          typeLower.includes('mensagem')
        ) {
          slot.messages++;
        } else {
          slot.tasks++;
        }
      }
    }

    for (const lead of wonLeads) {
      if (lead.closedAt) {
        const d = lead.closedAt;
        const day = d.getDay();
        const hour = d.getHours();
        const slot = grid[day * 24 + hour];
        if (slot) {
          slot.conversions++;
        }
      }
    }

    return grid;
  }

  /**
   * Cockpit Executivo em tempo real com contadores do dia e detecção estatística de anomalias.
   */
  async realtimeCockpit(organizationId: string, now = new Date()): Promise<RealtimeCockpitMetrics> {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const baselineStart = new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000);

    const data = await this.repository.getRealtimeCockpitData(
      organizationId,
      todayStart,
      baselineStart,
    );

    const conversionRateToday =
      data.leadsToday > 0 ? (data.dealsWonToday / data.leadsToday) * 100 : 0;
    const baselineConversionRate =
      data.leadsBaseline > 0 ? (data.dealsWonBaseline / data.leadsBaseline) * 100 : 0;
    const baselineDailyActivities =
      data.baselineDays > 0 ? data.activitiesBaseline / data.baselineDays : 0;

    let anomaly: AnomalyAlert = {
      detected: false,
      type: 'NONE',
      severity: 'info',
      title: 'Operação Estável',
      message: 'Métricas de conversão e cadência dentro dos padrões operacionais esperados.',
      deviationPct: 0,
      benchmarkValue: Math.round(baselineConversionRate * 10) / 10,
      currentValue: Math.round(conversionRateToday * 10) / 10,
    };

    if (data.leadsBaseline >= 5 && baselineConversionRate > 0 && data.leadsToday >= 3) {
      if (conversionRateToday < baselineConversionRate * 0.65) {
        const dropPct = Math.round(
          ((baselineConversionRate - conversionRateToday) / baselineConversionRate) * 100,
        );
        anomaly = {
          detected: true,
          type: 'CONVERSION_DROP',
          severity: dropPct > 60 ? 'critical' : 'warning',
          title: 'Queda Brusca de Conversão',
          message: `Taxa de conversão de hoje (${conversionRateToday.toFixed(1)}%) está ${dropPct}% abaixo da média móvel dos últimos 14 dias (${baselineConversionRate.toFixed(1)}%).`,
          deviationPct: dropPct,
          benchmarkValue: Math.round(baselineConversionRate * 10) / 10,
          currentValue: Math.round(conversionRateToday * 10) / 10,
        };
      }
    } else if (baselineDailyActivities >= 5 && now.getHours() >= 15) {
      const expectedPace = baselineDailyActivities * (Math.min(now.getHours(), 19) / 19);
      if (data.activitiesToday < expectedPace * 0.4) {
        const dropPct = Math.round(((expectedPace - data.activitiesToday) / expectedPace) * 100);
        anomaly = {
          detected: true,
          type: 'ACTIVITY_DROP',
          severity: 'warning',
          title: 'Desaceleração Operacional',
          message: `Volume de atividades de hoje (${data.activitiesToday}) está ${dropPct}% abaixo do ritmo esperado (${Math.round(expectedPace)}).`,
          deviationPct: dropPct,
          benchmarkValue: Math.round(expectedPace),
          currentValue: data.activitiesToday,
        };
      }
    }

    return {
      leadsToday: data.leadsToday,
      dealsWonToday: data.dealsWonToday,
      wonRevenueToday: data.wonRevenueToday,
      activitiesToday: data.activitiesToday,
      conversionRateToday: Math.round(conversionRateToday * 100) / 100,
      anomaly,
      lastUpdated: now.toISOString(),
    };
  }
}

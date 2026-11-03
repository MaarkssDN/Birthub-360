import { api } from '../../lib/api.js';
import type { OverviewMetrics } from '../../shared/contracts/analytics.contract.js';

export type { OverviewMetrics };

export interface DistributionSlice {
  label: string;
  count: number;
}

export interface FunnelStage extends DistributionSlice {
  conversionFromPrevious: number | null;
  amount?: number;
  conversionFromPreviousAmount?: number | null;
}

export interface MonthlyPoint {
  month: string;
  created: number;
  won: number;
  lost: number;
}

export interface PerformanceAgentRow {
  agent: string;
  isAi: boolean;
  leadsAssigned: number;
  leadsQualified: number;
  conversionRate: number;
  wonAmount?: number;
}

export interface SalesSummaryMetrics {
  totalWonDeals: number;
  totalWonRevenue: number;
  averageTicket: number | null;
  salesVelocityDays: number | null;
}

export interface ProductivityHeatmapSlot {
  dayOfWeek: number;
  hour: number;
  totalActivities: number;
  calls: number;
  meetings: number;
  messages: number;
  tasks: number;
  conversions: number;
}

export interface AnomalyAlert {
  detected: boolean;
  type: 'CONVERSION_DROP' | 'ACTIVITY_DROP' | 'NONE';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  deviationPct: number;
  benchmarkValue: number;
  currentValue: number;
}

export interface RealtimeCockpitMetrics {
  leadsToday: number;
  dealsWonToday: number;
  wonRevenueToday: number;
  activitiesToday: number;
  conversionRateToday: number;
  anomaly: AnomalyAlert;
  lastUpdated: string;
}

export interface AnalyticsDashboard {
  overview: OverviewMetrics;
  funnel: FunnelStage[];
  byTemperature: DistributionSlice[];
  bySource: DistributionSlice[];
  byOwner: Array<DistributionSlice & { won: number; wonAmount?: number }>;
  activitiesByType: DistributionSlice[];
  activitiesByStatus: DistributionSlice[];
  monthly: MonthlyPoint[];
  tmqMetric: number | null;
  lostReasons: DistributionSlice[];
  callHeatmap: { dayOfWeek: number; hour: number; count: number }[];
  performanceReport: PerformanceAgentRow[];
  salesSummary?: SalesSummaryMetrics;
  isEmpty: boolean;
}

export const PERIOD_OPTIONS = [3, 6, 12, 24] as const;

/** Formata mês (YYYY-MM) para rótulo curto do eixo (ex: "jul/26"). */
export function formatMonthLabel(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return month;
  const [, year, monthNum] = match;
  const monthNames = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const monthIndex = parseInt(monthNum, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return month;
  return `${monthNames[monthIndex]}/${year.slice(2)}`;
}

export const analyticsApi = {
  dashboard: (months: number) =>
    api.get<AnalyticsDashboard>(`/api/analytics/dashboard?months=${months}`, {
      timeoutMs: 30_000,
    }),
  salesSummary: () =>
    api.get<SalesSummaryMetrics>('/api/analytics/sales-summary', {
      timeoutMs: 15_000,
    }),
  productivityHeatmap: (days = 30) =>
    api.get<ProductivityHeatmapSlot[]>(`/api/analytics/productivity-heatmap?days=${days}`, {
      timeoutMs: 15_000,
    }),
  realtimeCockpit: () =>
    api.get<RealtimeCockpitMetrics>('/api/analytics/realtime-cockpit', {
      timeoutMs: 15_000,
    }),
};

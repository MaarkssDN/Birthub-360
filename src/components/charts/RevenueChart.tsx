import React, { memo, useMemo } from 'react';

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  target?: number;
}

export interface RevenueChartProps {
  data: readonly RevenueDataPoint[];
  currencySymbol?: string;
  title?: string;
  onRenderTick?: () => void;
}

export interface NormalizedRevenueSummary {
  points: {
    period: string;
    revenue: number;
    target: number;
    percentOfMax: number;
  }[];
  totalRevenue: number;
  totalTarget: number;
  maxRevenue: number;
}

export function computeNormalizedRevenueDataset(
  data: readonly RevenueDataPoint[],
): NormalizedRevenueSummary {
  if (data.length === 0) {
    return { points: [], totalRevenue: 0, totalTarget: 0, maxRevenue: 0 };
  }

  let totalRevenue = 0;
  let totalTarget = 0;
  let maxRevenue = 0;

  for (const item of data) {
    const rev = Number.isFinite(item.revenue) ? Math.max(0, item.revenue) : 0;
    const tgt = Number.isFinite(item.target) ? Math.max(0, item.target ?? 0) : 0;
    totalRevenue += rev;
    totalTarget += tgt;
    if (rev > maxRevenue) maxRevenue = rev;
    if (tgt > maxRevenue) maxRevenue = tgt;
  }

  const denominator = maxRevenue > 0 ? maxRevenue : 1;
  const points = data.map((item) => {
    const rev = Number.isFinite(item.revenue) ? Math.max(0, item.revenue) : 0;
    const tgt = Number.isFinite(item.target) ? Math.max(0, item.target ?? 0) : 0;
    return {
      period: item.period,
      revenue: rev,
      target: tgt,
      percentOfMax: Math.round((rev / denominator) * 100),
    };
  });

  return {
    points,
    totalRevenue,
    totalTarget,
    maxRevenue,
  };
}

export function areRevenueChartPropsEqual(
  prev: RevenueChartProps,
  next: RevenueChartProps,
): boolean {
  if (prev.title !== next.title || prev.currencySymbol !== next.currencySymbol) {
    return false;
  }
  if (prev.data === next.data) {
    return true;
  }
  if (prev.data.length !== next.data.length) {
    return false;
  }
  for (let i = 0; i < prev.data.length; i++) {
    const a = prev.data[i];
    const b = next.data[i];
    if (a.period !== b.period || a.revenue !== b.revenue || (a.target ?? 0) !== (b.target ?? 0)) {
      return false;
    }
  }
  return true;
}

const RevenueChartBase: React.FC<RevenueChartProps> = ({
  data,
  currencySymbol = 'R$',
  title = 'Receita & Telemetria Comercial',
  onRenderTick,
}) => {
  onRenderTick?.();

  const datasetSignature = useMemo(
    () => data.map((d) => `${d.period}:${d.revenue}:${d.target ?? 0}`).join('|'),
    [data],
  );

  // Memoiza a agregação do dataset usando a assinatura estável para evitar recálculo
  // em ticks de WebSocket que enviem nova referência de array com os mesmos valores.
  const summary = useMemo(() => computeNormalizedRevenueDataset(data), [datasetSignature]);

  return (
    <section
      aria-label={title}
      data-testid="revenue-chart"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
    >
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <span
          data-testid="revenue-chart-total"
          className="text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {currencySymbol} {summary.totalRevenue.toLocaleString('pt-BR')}
        </span>
      </header>
      <div className="space-y-2" role="list">
        {summary.points.map((pt) => (
          <div
            key={pt.period}
            role="listitem"
            className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
          >
            <span className="w-20 font-medium">{pt.period}</span>
            <div className="flex-1 mx-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${pt.percentOfMax}%` }}
                className="h-full bg-indigo-600 dark:bg-indigo-400"
              />
            </div>
            <span className="w-24 text-right tabular-nums">
              {currencySymbol} {pt.revenue.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const RevenueChart = memo(RevenueChartBase, areRevenueChartPropsEqual);
RevenueChart.displayName = 'RevenueChart';

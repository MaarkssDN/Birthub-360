import { Activity, Flame, TrendingUp, Zap } from 'lucide-react';

export interface CrmBoardMetrics {
  totalAmount: number;
  totalCount: number;
  hotLeads: number;
  enrichedCount: number;
  winRate: number;
}

/** Faixa de vitais comerciais e telemetria do CrmBoard — extraída na
 *  TAREFA-SANEAMENTO-002 (W4). JSX preservado verbatim. */
export function CrmBoardMetricsBar({ metrics }: { metrics: CrmBoardMetrics }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-2 border-b border-line/60 bg-surface/50 dark:bg-[#101216]/50 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
        <span className="font-mono text-[10px] font-bold text-[#3B5A75] dark:text-[#94B3CD] uppercase">
          Diagnóstico:
        </span>
        <span className="font-bold text-[#0F2942] dark:text-[#E2F1FF]">Pipeline Saudável</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <TrendingUp className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
        <span className="font-mono text-[10px] font-bold text-[#3B5A75] dark:text-[#94B3CD] uppercase">
          Pipeline:
        </span>
        <span className="font-extrabold text-[#047857] dark:text-[#34D399]">
          {metrics.totalAmount > 0
            ? `R$ ${metrics.totalAmount.toLocaleString('pt-BR')}`
            : 'R$ 0,00'}
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <Activity className="w-3.5 h-3.5 text-[#00D4FF]" />
        <span className="font-mono text-[10px] font-bold text-[#3B5A75] dark:text-[#94B3CD] uppercase">
          Win Rate:
        </span>
        <span className="font-extrabold text-[#0284c7] dark:text-[#00D4FF]">
          {metrics.winRate}%
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span className="font-mono text-[10px] font-bold text-[#3B5A75] dark:text-[#94B3CD] uppercase">
          Quentes:
        </span>
        <span className="font-extrabold text-[#F59E0B]">{metrics.hotLeads}</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <Zap className="w-3.5 h-3.5 text-[#8B7DFF]" />
        <span className="font-mono text-[10px] font-bold text-[#3B5A75] dark:text-[#94B3CD] uppercase">
          Enriquecidos:
        </span>
        <span className="font-bold text-[#0F2942] dark:text-[#E2F1FF]">
          {metrics.enrichedCount}
        </span>
      </div>

      <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4F434]/15 border border-[#D4F434]/35 text-[#121316] dark:text-[#D4F434] text-xs font-mono font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4F434] shadow-[0_0_6px_#D4F434]" />
        <span>{metrics.totalCount} DEALS NO FUNIL</span>
      </div>
    </div>
  );
}

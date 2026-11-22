// Presentational subcomponents extracted from Dashboard/Overview.tsx
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063). No data fetching lives here — every component is a
// pure function of its props so the page shell stays thin and each widget is individually
// reviewable/testable.
import { AlertTriangle } from 'lucide-react';
import { Card, Skeleton, Tooltip } from '../../components/design-system/index.js';
import type { FetchStatus } from './overviewMetrics.js';

// A KPI card driven by real fetch status — never renders a placeholder number as
// if it were live data. Shows a skeleton while loading, an inline retry affordance on error, and
// the real computed value (or an explicit "—" + caption) once ready.
export interface RealStatCardProps {
  title: string;
  status: FetchStatus;
  value: string;
  caption: string;
  tooltip: string;
  onClick?: () => void;
}

export function RealStatCard({
  title,
  status,
  value,
  caption,
  tooltip,
  onClick,
}: RealStatCardProps) {
  return (
    <Tooltip text={tooltip}>
      <Card
        className={`p-4 hoverable space-y-2 relative overflow-hidden flex flex-col justify-between h-full group ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="space-y-1 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          {status === 'loading' ? (
            <Skeleton className="h-7 w-16" />
          ) : status === 'error' ? (
            <p className="text-sm font-bold text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Erro
            </p>
          ) : (
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
              {value}
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold text-slate-400">
          {status === 'ready'
            ? caption
            : status === 'error'
              ? 'Tentar novamente ao atualizar a página'
              : ' '}
        </span>
      </Card>
    </Tooltip>
  );
}

// An actionable pending item, computed from real state (not hardcoded copy).
export function PendingAlert({
  title,
  description,
  actionLabel,
  onAction,
  tone = 'red',
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  tone?: 'red' | 'amber';
}) {
  const toneClasses =
    tone === 'red'
      ? 'bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300'
      : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300';
  return (
    <div className={`p-3 border rounded-lg text-left ${toneClasses}`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold">{title}</p>
        <button
          type="button"
          onClick={onAction}
          className="text-[10px] font-bold text-brand hover:underline shrink-0 ml-2"
        >
          {actionLabel}
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{description}</p>
    </div>
  );
}

// Checklist Item
export interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  onClick: () => void;
}

export function ChecklistItem({ label, checked, onChange, onClick }: ChecklistItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-3.5 w-3.5 text-brand rounded border-slate-300 focus:ring-brand accent-brand cursor-pointer"
        />
        <button
          type="button"
          onClick={onClick}
          className={`font-semibold hover:text-brand transition-colors text-left ${checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}
        >
          {label}
        </button>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="text-[10px] font-bold text-slate-400 hover:text-brand transition-colors"
      >
        Ir
      </button>
    </div>
  );
}

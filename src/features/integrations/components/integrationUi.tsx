import { AlertTriangle, type CheckCircle2, Clock3, Eye, Pencil, PlugZap } from 'lucide-react';
import type { ReactNode } from 'react';

export type IntegrationCapabilityStatus =
  | 'connected'
  | 'read'
  | 'write'
  | 'stub'
  | 'error'
  | 'pending';

const CAPABILITY_STYLES: Record<
  IntegrationCapabilityStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  connected: {
    label: 'conectado',
    icon: PlugZap,
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  },
  read: {
    label: 'leitura real',
    icon: Eye,
    className:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
  },
  write: {
    label: 'escrita real',
    icon: Pencil,
    className:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
  },
  stub: {
    label: 'stub/local',
    icon: AlertTriangle,
    className:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  },
  error: {
    label: 'erro visível',
    icon: AlertTriangle,
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  },
  pending: {
    label: 'pendente de escopo',
    icon: Clock3,
    className: 'bg-surface-2 text-ink-2 border-line',
  },
};

export function CapabilityBadge({
  status,
  children,
}: {
  status: IntegrationCapabilityStatus;
  children?: string;
}) {
  const config = CAPABILITY_STYLES[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children ?? config.label}
    </span>
  );
}

export function IntegrationTruthBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-ink-2 space-y-2">
      {children}
    </div>
  );
}

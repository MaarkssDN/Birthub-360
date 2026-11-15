import { ArrowUpRight } from 'lucide-react';
import type React from 'react';
import { cn } from '../../lib/utils.js';

export interface StatItem {
  value: string;
  label: string;
  description?: string;
  trend?: string;
  highlightColor: string;
  titleColor: string;
  descColor: string;
}

export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  stats?: StatItem[];
}

const DEFAULT_STATS: StatItem[] = [
  {
    value: 'R$ 48.5M+',
    label: 'Pipeline Gerado e Auditado',
    description: 'Volume sob gestão ativa nas cadências multicanal do ecossistema',
    trend: '+42% MoM',
    highlightColor: 'var(--neon-lime)',
    titleColor: 'text-[#3f6212] dark:text-[var(--neon-lime)]',
    descColor: 'text-[var(--ink-2)]',
  },
  {
    value: '3.8x',
    label: 'Aceleração de Resposta SDR',
    description: 'Sinais de compra triados e qualificados em menos de 3 minutos',
    trend: 'Tempo Real',
    highlightColor: 'var(--orbit-blue)',
    titleColor: 'text-[var(--orbit-blue)]',
    descColor: 'text-[var(--ink-2)]',
  },
  {
    value: '99.4%',
    label: 'Acurácia de Enriquecimento',
    description: 'Decisores C-Level e telefones validados na Receita Federal',
    trend: 'Receita Federal & CNPJ',
    highlightColor: 'var(--pink)',
    titleColor: 'text-[var(--pink)]',
    descColor: 'text-[var(--ink-2)]',
  },
  {
    value: '< 100ms',
    label: 'Latência Multi-CRM',
    description: 'Sincronização bidirecional Bitrix24, Salesforce e HubSpot',
    trend: 'Zero Latência',
    highlightColor: 'var(--warn)',
    titleColor: 'text-[#d97706] dark:text-[var(--warn)]',
    descColor: 'text-[var(--ink-2)]',
  },
];

export function StatsGrid({ stats = DEFAULT_STATS, className, ...props }: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto',
        className,
      )}
      {...props}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="relative group rounded-3xl border border-black/5 dark:border-white/10 bg-[var(--surface)]/90 dark:bg-[var(--surface-2)]/90 backdrop-blur-xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-black/15 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
          style={{
            borderColor: `color-mix(in srgb, ${stat.highlightColor} 19%, transparent)`,
          }}
        >
          {/* Luz de acento sutil no canto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity"
            style={{ backgroundColor: stat.highlightColor }}
          />

          <div className="flex items-center justify-between mb-3">
            <span
              className="font-mono text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: stat.highlightColor,
                backgroundColor: `color-mix(in srgb, ${stat.highlightColor} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${stat.highlightColor} 21%, transparent)`,
              }}
            >
              Métrica 0{i + 1}
            </span>
            {stat.trend && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${stat.highlightColor} 9%, transparent)`,
                  color: stat.highlightColor,
                  border: `1px solid color-mix(in srgb, ${stat.highlightColor} 25%, transparent)`,
                }}
              >
                {stat.trend}
                <ArrowUpRight className="w-3 h-3" />
              </span>
            )}
          </div>

          <div
            className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
            style={{ color: stat.highlightColor }}
          >
            {stat.value}
          </div>

          <div
            className={cn('font-display font-bold text-base mb-1.5 leading-snug', stat.titleColor)}
          >
            {stat.label}
          </div>

          {stat.description && (
            <p className={cn('text-xs sm:text-sm leading-relaxed font-normal', stat.descColor)}>
              {stat.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

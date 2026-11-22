import { SoundFX } from '../../lib/soundEffects.js';
import { cn } from '../../lib/utils.js';
import { Trophy3DIcon } from './icons/Isometric3DIcons.js';

/* Generalizado a partir de `DealsGrid` com estética comercial 2026. */
export interface DealCardData {
  id: string;
  title: string;
  status: 'won' | 'lost' | 'open';
  statusLabel: string;
  value: number;
}

const defaultFormatValue = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function DealCard({
  deal,
  formatValue = defaultFormatValue,
  soundHover = false,
}: {
  deal: DealCardData;
  formatValue?: (value: number) => string;
  soundHover?: boolean;
}) {
  const { status, statusLabel, title, value } = deal;
  const isWon = status === 'won';
  const isLost = status === 'lost';

  const borderTone = isWon
    ? 'border-l-ok border-brand/25'
    : isLost
      ? 'border-l-critical border-line/70'
      : 'border-l-brand border-line/75';

  const badgeClass = isWon
    ? 'bg-ok/15 text-ok-active dark:text-ok border-ok/30'
    : isLost
      ? 'bg-critical/15 text-critical-active border-critical/30'
      : 'bg-surface text-ink-2 border border-line/80';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: feedback sonoro opcional de hover em card visual
    <div
      onMouseEnter={() => {
        if (soundHover) SoundFX.play('hover');
      }}
      className={cn(
        'group relative flex flex-col justify-between gap-2.5 rounded-2xl border border-l-[3.5px] bg-surface-elevated/85 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-card-hover overflow-hidden',
        borderTone,
        isWon && 'shadow-[0_4px_20px_rgba(16,185,129,0.12)]',
      )}
    >
      {/* Luz especular de topo para negócios ganhos */}
      {isWon && (
        <div className="absolute top-0 inset-x-3 h-[1.5px] bg-gradient-to-r from-transparent via-ok/60 to-transparent pointer-events-none rounded-t-2xl" />
      )}

      <div className="flex items-start gap-2">
        {isWon && (
          <span className="shrink-0 mt-0.5">
            <Trophy3DIcon size={18} animate />
          </span>
        )}
        <p className="min-h-[2.2em] text-xs font-bold leading-snug text-ink line-clamp-2 group-hover:text-brand transition-colors">
          {title}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
        <span
          className={cn(
            'whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
            badgeClass,
          )}
        >
          {statusLabel}
        </span>
        <span
          className={cn(
            'whitespace-nowrap font-mono text-sm font-black tabular-nums',
            isWon ? 'text-ok' : 'text-ink',
          )}
        >
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
}

export function DealsGrid({
  deals,
  emptyLabel = 'Nenhum negócio rastreado neste período.',
  formatValue,
}: {
  deals: DealCardData[];
  emptyLabel?: string;
  formatValue?: (value: number) => string;
}) {
  if (!deals.length) {
    return <p className="text-xs text-ink-2">{emptyLabel}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} formatValue={formatValue} />
      ))}
    </div>
  );
}

import { SoundFX } from '../../lib/soundEffects.js';
import { cn } from '../../lib/utils.js';

export interface FunnelBarItem {
  id: string;
  label: string;
  value: number;
  tone?: 'brand' | 'ok' | 'critical';
}

const TONE_BAR = {
  brand: 'bg-brand',
  ok: 'bg-ok',
  critical: 'bg-critical',
} as const;

export function FunnelBars({
  items,
  soundHover = false,
}: {
  items: FunnelBarItem[];
  soundHover?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const widthPct = Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0);
        return (
          <button
            type="button"
            key={item.id}
            onMouseEnter={() => {
              if (soundHover) SoundFX.play('hover');
            }}
            className="group grid grid-cols-[140px_1fr_44px] items-center gap-3 text-xs p-1 rounded-lg transition-colors hover:bg-surface-elevated/50"
          >
            <span className="truncate font-bold text-ink group-hover:text-brand transition-colors">
              {item.label}
            </span>
            <div
              role="img"
              aria-label={`${item.label}: ${item.value}`}
              className="h-3.5 overflow-hidden rounded-full bg-surface-2 border border-line/50 p-0.5 shadow-inner"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 relative overflow-hidden',
                  TONE_BAR[item.tone ?? 'brand'],
                )}
                style={{ width: `${widthPct}%` }}
              >
                {/* Linha especular interna */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
              </div>
            </div>
            <span className="text-right font-mono font-black tabular-nums text-ink">
              {item.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

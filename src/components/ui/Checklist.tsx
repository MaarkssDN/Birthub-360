import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { SoundFX } from '../../lib/soundEffects.js';
import { cn } from '../../lib/utils.js';

/* Primitivo — checklist de leitura/orientação com feedback tátil 2026. */
export interface ChecklistItemData {
  id: string;
  text: ReactNode;
  /** Marca o item como já cumprido — só muda o tom do ícone, não é interativo aqui. */
  checked?: boolean;
}

export function Checklist({
  items,
  soundHover = false,
}: {
  items: ChecklistItemData[];
  soundHover?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          onMouseEnter={() => {
            if (soundHover) SoundFX.play('hover');
          }}
          className="group flex items-start gap-3 rounded-xl border border-line/75 bg-surface/70 p-3 px-3.5 transition-all duration-200 hover:translate-x-1 hover:border-brand/35 hover:bg-surface-elevated hover:shadow-card backdrop-blur-xs"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-110',
              item.checked
                ? 'border-ok/35 bg-ok/15 text-ok shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'border-brand/25 bg-brand/10 text-brand shadow-xs',
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span className="text-[13px] leading-relaxed text-ink font-medium">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

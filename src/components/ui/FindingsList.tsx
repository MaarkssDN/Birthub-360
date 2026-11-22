import { motion, useReducedMotion } from 'framer-motion';
import type { ComponentType, ReactNode } from 'react';
import { SoundFX } from '../../lib/soundEffects.js';
import { cn } from '../../lib/utils.js';

/* Primitivo — "achados" (findings) de um relatório com estética tátil 2026. */
export interface Finding {
  id: string;
  tone: 'win' | 'gap';
  icon: ComponentType<{ className?: string }>;
  text: ReactNode;
  meta?: string;
  /** Pisca a borda do marcador 2x pra chamar atenção — nunca em loop. */
  emphasize?: boolean;
}

const TONE = {
  win: {
    border: 'border-l-ok',
    chip: 'bg-ok/15 text-ok-active dark:text-ok border-ok/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    ring: 'rgba(15,157,100,.55)',
  },
  gap: {
    border: 'border-l-critical',
    chip: 'bg-critical/15 text-critical border-critical/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    ring: 'rgba(214,69,69,.55)',
  },
} as const;

export function FindingsList({
  items,
  soundHover = false,
}: {
  items: Finding[];
  soundHover?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <FindingRow key={item.id} {...item} soundHover={soundHover} />
      ))}
    </div>
  );
}

function FindingRow({
  tone,
  icon: Icon,
  text,
  meta,
  emphasize,
  soundHover = false,
}: Finding & { soundHover?: boolean }) {
  const reduceMotion = useReducedMotion();
  const t = TONE[tone];
  const shouldEmphasize = Boolean(emphasize) && !reduceMotion;
  return (
    <button
      type="button"
      onMouseEnter={() => {
        if (soundHover) SoundFX.play('hover');
      }}
      className={cn(
        'group flex gap-3.5 rounded-xl border border-l-[3.5px] border-line/75 bg-surface/75 p-3.5 transition-all duration-200 hover:translate-x-1 hover:border-brand/35 hover:bg-surface-elevated hover:shadow-card backdrop-blur-xs',
        t.border,
      )}
    >
      <motion.span
        aria-hidden="true"
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-110',
          t.chip,
        )}
        animate={
          shouldEmphasize
            ? {
                boxShadow: [
                  `0 0 0 0 ${t.ring}`,
                  '0 0 0 12px rgba(0,0,0,0)',
                  '0 0 0 0 rgba(0,0,0,0)',
                ],
              }
            : undefined
        }
        transition={shouldEmphasize ? { duration: 1.4, ease: 'easeOut', repeat: 1 } : undefined}
      >
        <Icon className="h-3.5 w-3.5" />
      </motion.span>
      <div className="text-[13px] leading-relaxed text-ink font-medium">
        {text}
        {meta && <span className="mt-0.5 block text-[11px] text-ink-2 font-normal">{meta}</span>}
      </div>
    </button>
  );
}

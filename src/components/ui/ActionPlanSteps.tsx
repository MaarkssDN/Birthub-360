import type { ReactNode } from 'react';
import { SoundFX } from '../../lib/soundEffects.js';

/* Novo primitivo — "plano de ação" numerado (passo a passo). `<ol>/<li>` reais (não divs com
   número decorativo) pra leitor de tela anunciar "item 1 de N" — a contagem já vem da própria
   lista, sem precisar de contador CSS. */
export interface PlanStepDetail {
  label: string;
  value: ReactNode;
}

export interface PlanStep {
  id: string;
  text: ReactNode;
  details?: PlanStepDetail[];
}

export function ActionPlanSteps({
  steps,
  soundHover = false,
}: {
  steps: PlanStep[];
  soundHover?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((step, index) => (
        <li
          key={step.id}
          onMouseEnter={() => {
            if (soundHover) SoundFX.play('hover');
          }}
          className="group flex gap-3.5 rounded-xl border border-line/75 bg-surface/75 p-3.5 transition-all duration-200 hover:translate-x-1 hover:border-brand/35 hover:bg-surface-elevated hover:shadow-card backdrop-blur-xs"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand via-brand-2 to-brand font-mono text-xs font-black text-on-brand shadow-[0_2px_10px_rgba(212,175,55,0.3)] transition-transform duration-200 group-hover:scale-110"
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-relaxed text-ink font-medium">{step.text}</p>
            {step.details && step.details.length > 0 && (
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {step.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-lg border border-line/70 bg-surface/80 p-2 px-2.5 shadow-xs"
                  >
                    <p className="mb-0.5 text-[9px] font-extrabold uppercase tracking-wider text-brand">
                      {detail.label}
                    </p>
                    <p className="text-[11.5px] leading-snug text-ink">{detail.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

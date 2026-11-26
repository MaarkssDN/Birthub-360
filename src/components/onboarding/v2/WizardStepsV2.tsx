import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStepV2Item {
  id: string;
  label: string;
}

export interface WizardStepsV2Props {
  steps: readonly WizardStepV2Item[];
  /** Índice da etapa atual (0-based). */
  currentIndex: number;
  className?: string;
}

/**
 * WizardStepsV2 — indicador de etapas para wizards multi-step.
 * Agente 37 (Suri), Onda ONDA-DESIGN-PREMIUM. Semântico: <ol> + aria-current
 * na etapa ativa; visual premium com gold para progresso.
 */
export function WizardStepsV2({ steps, currentIndex, className }: WizardStepsV2Props) {
  return (
    <ol aria-label="Etapas do assistente" className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold transition-colors',
                done && 'border-gold-500 bg-gold-500 text-navy-900',
                active && 'border-gold-500 bg-gold-500/15 text-gold-700 dark:text-gold-300',
                !done && !active && 'border-border-strong text-muted-foreground',
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{index + 1}</span>
              )}
              <span className="sr-only">
                {step.label}
                {done ? ' (concluída)' : active ? ' (etapa atual)' : ''}
              </span>
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'h-px w-6',
                  index < currentIndex ? 'bg-gold-500' : 'bg-border-strong',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

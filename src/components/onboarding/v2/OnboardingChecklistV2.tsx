import { Check } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  buildOnboardingStorageKey,
  type OnboardingChecklistStep,
} from '@/features/onboarding/ui/Checklist';

export interface OnboardingChecklistV2Props {
  tenantId: string;
  userId: string;
  steps: readonly OnboardingChecklistStep[];
  title?: string;
  className?: string;
}

/**
 * OnboardingChecklistV2 — Agente 37 (Suri), Onda ONDA-DESIGN-PREMIUM.
 *
 * Checklist de ativação (TTV) com chrome premium: card `bg-card`, progresso
 * visível, checks com motion. Mesma persistência do v1
 * (buildOnboardingStorageKey + localStorage), mesmas props — drop-in.
 *
 * ATENÇÃO (regra do AGENTS de onboarding): marcar etapa concluída aqui é
 * preferência de UI do usuário — nunca substitui confirmação real de
 * integração/funcionalidade no backend.
 */
export function OnboardingChecklistV2({
  tenantId,
  userId,
  steps,
  title = 'Primeiros passos',
  className,
}: OnboardingChecklistV2Props) {
  const storageKey = buildOnboardingStorageKey(tenantId, userId);

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = globalThis.localStorage?.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify(completedIds));
    } catch {
      // Storage bloqueado → checklist funciona em memória
    }
  }, [storageKey, completedIds]);

  const toggleStep = useCallback((stepId: string) => {
    setCompletedIds((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId],
    );
  }, []);

  const progress = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round((completedIds.length / steps.length) * 100);
  }, [completedIds.length, steps.length]);

  return (
    <section
      data-testid="v2-onboarding-checklist"
      aria-labelledby="v2-onboarding-title"
      className={cn('rounded-xl border border-border-default bg-card p-5', className)}
    >
      <div className="flex items-center justify-between gap-4">
        <h3
          id="v2-onboarding-title"
          className="font-display text-sm font-semibold text-card-foreground"
        >
          {title}
        </h3>
        <span className="font-mono text-xs text-muted-foreground">
          {completedIds.length}/{steps.length}
        </span>
      </div>

      {/* Barra de progresso — largura via transform-friendly div, sem JS de medida */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da ativação"
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-offwhite-200"
      >
        <div
          className="h-full rounded-full bg-gold-500 transition-[width] duration-300 ease-standard"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1">
        {steps.map((step) => {
          const checked = completedIds.includes(step.id);
          return (
            <li key={step.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                  'hover:bg-offwhite-100',
                  checked ? 'text-muted-foreground' : 'text-card-foreground',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStep(step.id)}
                  data-testid={`v2-onboarding-step-${step.id}`}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500 peer-focus-visible:ring-offset-2',
                    checked
                      ? 'border-gold-500 bg-gold-500 text-navy-900'
                      : 'border-border-strong bg-transparent',
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className={cn(checked && 'line-through opacity-70')}>{step.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

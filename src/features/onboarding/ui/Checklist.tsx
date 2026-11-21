import React, { useCallback, useEffect, useState } from 'react';

export interface OnboardingChecklistStep {
  id: string;
  label: string;
}

export interface OnboardingChecklistProps {
  tenantId: string;
  userId: string;
  steps: readonly OnboardingChecklistStep[];
}

export function buildOnboardingStorageKey(tenantId: string, userId: string): string {
  return `birthhub360:onboarding:checklist:${tenantId.trim()}:${userId.trim()}`;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  tenantId,
  userId,
  steps,
}) => {
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
      // Ambientes com storage bloqueado continuam funcionando em memória
    }
  }, [storageKey, completedIds]);

  const toggleStep = useCallback((stepId: string) => {
    setCompletedIds((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId],
    );
  }, []);

  return (
    <div data-testid="onboarding-checklist" className="space-y-2">
      {steps.map((step) => {
        const checked = completedIds.includes(step.id);
        return (
          <label key={step.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleStep(step.id)}
              data-testid={`onboarding-step-${step.id}`}
            />
            <span>{step.label}</span>
          </label>
        );
      })}
    </div>
  );
};

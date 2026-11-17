import { Check, ChevronRight, ListChecks, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card.js';
import { useAuth } from '../../../contexts/AuthContext.js';
import { getFirstStepsForRole } from '../firstSteps.js';
import { cn } from '../../../lib/utils.js';
import { useI18n } from '../../../i18n/index.js';

function storageKeyFor(userId: string, role: string): string {
  return `@birthhub360:first-steps:${userId}:${role || 'unknown'}`;
}

function readCompletedIds(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(`${key}:completed`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(parsed.filter((v): v is string => typeof v === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

function readDismissed(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(`${key}:dismissed`) === 'true';
}

export function FirstStepsChecklist() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const role = currentUser?.role ?? '';
  const userId = currentUser?.id ?? 'anonymous';
  const storageKey = storageKeyFor(userId, role);

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => readCompletedIds(storageKey));
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed(storageKey));

  useEffect(() => {
    setCompletedIds(readCompletedIds(storageKey));
    setDismissed(readDismissed(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${storageKey}:completed`, JSON.stringify([...completedIds]));
    window.localStorage.setItem(`${storageKey}:dismissed`, String(dismissed));
  }, [completedIds, dismissed, storageKey]);

  const steps = useMemo(() => getFirstStepsForRole(role), [role]);

  const completedCount = steps.filter((step) => completedIds.has(step.id)).length;
  const allCompleted = steps.length > 0 && completedCount === steps.length;

  if (!currentUser || dismissed || allCompleted) return null;

  const toggleCompleted = (id: string) => {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progressPercent =
    steps.length === 0 ? 0 : Math.round((completedCount / steps.length) * 100);

  return (
    <Card variant="panel" padding="none" className="shadow-card">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-brand/10 p-2 text-brand">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">{t('firstSteps.title')}</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">{t('firstSteps.subtitle')}</CardDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          aria-label={t('firstSteps.dismiss')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('common.dismiss')}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div
            className="h-2 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completedCount}
            aria-label={t('firstSteps.progress', {
              completed: completedCount,
              total: steps.length,
            })}
          >
            <div
              className={cn('h-full rounded-full bg-brand transition-all')}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs font-medium text-ink-2">
            {t('firstSteps.progress', { completed: completedCount, total: steps.length })}
          </p>
        </div>

        <ul className="grid gap-3 md:grid-cols-2">
          {steps.map((step) => {
            const done = completedIds.has(step.id);
            return (
              <li
                key={step.id}
                className={cn(
                  'flex flex-col gap-3 rounded-2xl border p-4 transition-colors',
                  done ? 'border-ok/30 bg-ok/5' : 'border-line bg-surface-2/50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink">{t(step.titleKey)}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-2">
                      {t(step.descriptionKey)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompleted(step.id)}
                    aria-pressed={done}
                    aria-label={done ? t('firstSteps.completed') : t('firstSteps.complete')}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                      done
                        ? 'border-ok/40 bg-ok/15 text-ok'
                        : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-brand',
                    )}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-auto flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(step.path)}
                  >
                    {t('common.open')}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/Button.js';

export interface ErrorStateProps {
  title: string;
  message?: string;
  /** Quando presente, renderiza o botão de retry (falha recuperável, sem deslogar). */
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * `panel` (default) — bloco centralizado para substituir o conteúdo da seção.
   * `compact` — faixa inline para erros parciais dentro de um card/seção que
   *             continua exibindo o restante do conteúdo.
   */
  variant?: 'panel' | 'compact';
  className?: string;
}

/** Estado de erro canônico (S30-03). role="alert" anuncia assertivamente —
 *  erro é o único estado que justifica interrupção. Retry sempre visível quando
 *  a falha é recuperável. */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  variant = 'panel',
  className,
}: ErrorStateProps) {
  if (variant === 'compact') {
    return (
      <div
        role="alert"
        data-testid="feedback-error-state"
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger-active dark:text-danger',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            {message && <p className="mt-0.5 opacity-90">{message}</p>}
          </div>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      data-testid="feedback-error-state"
      className={cn(
        'my-6 flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-surface p-8 text-center sm:p-12',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10 text-danger"
      >
        <AlertTriangle className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <h3 className="mb-1.5 font-display text-lg font-bold text-ink">{title}</h3>
      {message && (
        <p className="mb-6 max-w-md text-sm leading-relaxed text-ink-2">{message}</p>
      )}
      {onRetry && (
        <Button variant="vancouver" onClick={onRetry} className="flex items-center gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

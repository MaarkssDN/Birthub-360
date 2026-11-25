import { Loader2 } from 'lucide-react';
import type React from 'react';
import { cn } from '../../lib/utils.js';
import { Skeleton } from '../ui/Skeleton.js';

export interface LoadingStateProps {
  /** Rótulo anunciado por leitores de tela (role="status" + aria-live). */
  label?: string;
  /**
   * `spinner` — indicador discreto para seções pequenas/inline.
   * `skeleton` — placeholder estrutural (default usa `Skeleton` do design system;
   *              passe `skeleton` custom para formatos específicos de lista/tabela).
   */
  variant?: 'spinner' | 'skeleton';
  /** Skeleton customizado — só usado quando variant="skeleton". */
  skeleton?: React.ReactNode;
  className?: string;
}

function DefaultSkeleton() {
  return (
    <div className="w-full space-y-3" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** Estado de carregamento canônico (S30-03). Sempre anunciado via role="status" +
 *  aria-live="polite" + aria-busy — substitui textos soltos "Carregando…" sem semântica. */
export function LoadingState({
  label = 'Carregando…',
  variant = 'spinner',
  skeleton,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="feedback-loading-state"
      className={cn('w-full', className)}
    >
      {variant === 'spinner' ? (
        <div className="flex items-center gap-2 text-ink-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm">{label}</span>
        </div>
      ) : (
        <>
          <span className="sr-only">{label}</span>
          <div aria-hidden="true">{skeleton ?? <DefaultSkeleton />}</div>
        </>
      )}
    </div>
  );
}

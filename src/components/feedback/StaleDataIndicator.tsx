import { Clock, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface StaleDataIndicatorProps {
  /** Quando os dados foram sincronizados pela última vez (string já formatada ou Date). */
  lastUpdated?: string | Date;
  /** Mensagem contextual — default assume cache local/offline. */
  message?: string;
  /** Callback de reconexão/refresh. Quando ausente, o indicador é somente informativo. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

function formatLastUpdated(lastUpdated: string | Date): string {
  if (typeof lastUpdated === 'string') return lastUpdated;
  return lastUpdated.toLocaleString('pt-BR');
}

/** Indicador de dados obsoletos (S30-03). role="status" + aria-live="polite": o aviso
 *  aparece sem roubar foco e sem interromper — diferente de ErrorState (role="alert").
 *  Não substitui os dados: é uma faixa sobre o conteúdo existente (padrão "stale-while-
 *  revalidate"), nunca uma tela de erro. */
export function StaleDataIndicator({
  lastUpdated,
  message = 'Dados em cache local — pode haver informação desatualizada.',
  onRefresh,
  isRefreshing = false,
  className,
}: StaleDataIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="feedback-stale-indicator"
      className={cn(
        'mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs font-medium text-warning-active dark:text-warning',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {message}
          {lastUpdated && (
            <span className="ml-1 opacity-80">
              Última sincronização: {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </span>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-warning/40 px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} aria-hidden="true" />
          {isRefreshing ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
      )}
    </div>
  );
}

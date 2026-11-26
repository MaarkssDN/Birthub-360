import { Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/v2/Button";

export interface StaleDataIndicatorV2Props {
  /** Última sincronização (string formatada ou Date). */
  lastUpdated?: string | Date;
  message?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

function formatLastUpdated(lastUpdated: string | Date): string {
  if (typeof lastUpdated === "string") return lastUpdated;
  return lastUpdated.toLocaleString("pt-BR");
}

/**
 * StaleDataIndicator v2 — Agente 32 (Ema). role="status" + aria-live="polite",
 * faixa informativa sobre o conteúdo (stale-while-revalidate), nunca tela de
 * erro. Paleta warning v2 (-100 tint + -700 texto, AA nos dois temas).
 */
export function StaleDataIndicatorV2({
  lastUpdated,
  message = "Dados em cache local — pode haver informação desatualizada.",
  onRefresh,
  isRefreshing = false,
  className,
}: StaleDataIndicatorV2Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="v2-stale-indicator"
      className={cn(
        "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-500/30 bg-warning-100 px-4 py-2.5 text-xs font-medium text-warning-700",
        className
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />
          {isRefreshing ? "Atualizando…" : "Atualizar"}
        </Button>
      )}
    </div>
  );
}

import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/v2/Button";

export interface ErrorStateV2Props {
  title: string;
  message?: string;
  /** Quando presente, renderiza o botão de retry (falha recuperável). */
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * `panel` — bloco centralizado; `compact` — faixa inline para erros
   * parciais dentro de um card/seção que continua exibindo o restante.
   */
  variant?: "panel" | "compact";
  className?: string;
}

/**
 * ErrorState v2 — Agente 32 (Ema). role="alert" (erro é o único estado que
 * justifica interrupção assertiva), retry sempre visível quando recuperável.
 */
export function ErrorStateV2({
  title,
  message,
  onRetry,
  retryLabel = "Tentar novamente",
  variant = "panel",
  className,
}: ErrorStateV2Props) {
  if (variant === "compact") {
    return (
      <div
        role="alert"
        data-testid="v2-error-state"
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-500/30 bg-danger-100 px-4 py-3 text-xs text-danger-700",
          className
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
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
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
      data-testid="v2-error-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-danger-500/30 bg-danger-100 p-8 text-center",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-danger-500/30 bg-card text-danger-500"
      >
        <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-base font-semibold text-danger-700">
        {title}
      </h3>
      {message && (
        <p className="mt-1 max-w-md text-sm text-danger-700/80">{message}</p>
      )}
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

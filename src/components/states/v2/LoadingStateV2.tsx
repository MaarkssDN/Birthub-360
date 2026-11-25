import type React from "react";
import { cn } from "@/lib/utils";

export interface LoadingStateV2Props {
  /** Rótulo anunciado por leitores de tela (role="status" + aria-live). */
  label?: string;
  /**
   * `spinner` — indicador discreto inline (usa .motion-v2-spinner);
   * `skeleton` — placeholder estrutural em `skeleton` custom ou default.
   */
  variant?: "spinner" | "skeleton";
  skeleton?: React.ReactNode;
  className?: string;
}

function DefaultSkeletonV2() {
  return (
    <div className="w-full space-y-3" aria-hidden="true">
      {["w-1/3", "w-full", "w-5/6", "w-2/3"].map((w) => (
        <div
          key={w}
          className={cn("h-4 animate-pulse rounded bg-offwhite-200", w)}
        />
      ))}
    </div>
  );
}

/**
 * LoadingState v2 — Agente 32 (Ema). role="status" + aria-live="polite" +
 * aria-busy; spinner usa a animação CSS v2 (desligada por
 * prefers-reduced-motion via motion-v2.css).
 */
export function LoadingStateV2({
  label = "Carregando…",
  variant = "spinner",
  skeleton,
  className,
}: LoadingStateV2Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="v2-loading-state"
      className={cn("w-full", className)}
    >
      {variant === "spinner" ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span
            aria-hidden="true"
            className="motion-v2-spinner inline-block h-4 w-4 rounded-full border-2 border-border-strong border-t-gold-500"
          />
          <span className="text-sm">{label}</span>
        </div>
      ) : (
        <>
          <span className="sr-only">{label}</span>
          <div aria-hidden="true">{skeleton ?? <DefaultSkeletonV2 />}</div>
        </>
      )}
    </div>
  );
}

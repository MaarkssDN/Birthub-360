import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/v2/Card";

export interface KpiCardV2Props {
  label: string;
  /** Valor formatado (string já localizada). */
  value: string;
  /** Variação percentual — undefined quando não há base de comparação. */
  delta?: number;
  deltaLabel?: string;
  /** "up" é bom por padrão; passe invertTrend para métricas onde cair é bom (ex.: churn). */
  invertTrend?: boolean;
  icon?: ReactNode;
  /** Dado ausente → mostra "—" honesto em vez de zero (padrão anti-SaaS-genérico). */
  isEmpty?: boolean;
  className?: string;
}

/**
 * KpiCardV2 — Agente 38 (Nara), Onda ONDA-DESIGN-PREMIUM-2026-11-24.
 *
 * Card de KPI premium: hierarquia tipográfica (label pequeno → valor display
 * em IBM Plex Mono para dados), delta com seta + texto (nunca só cor —
 * WCAG 1.4.1), e "—" quando o dado não existe (honestidade de dados).
 */
export function KpiCardV2({
  label,
  value,
  delta,
  deltaLabel,
  invertTrend = false,
  icon,
  isEmpty = false,
  className,
}: KpiCardV2Props) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const direction = hasDelta ? Math.sign(delta as number) : 0;
  const positive = invertTrend ? direction < 0 : direction > 0;
  const neutral = direction === 0;

  return (
    <Card variant="default" padding="md" className={cn("h-full", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border-default bg-offwhite-100 text-muted-foreground"
          >
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-card-foreground">
        {isEmpty ? "—" : value}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {hasDelta ? (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                neutral
                  ? "text-muted-foreground"
                  : positive
                    ? "text-success-700 dark:text-success-400"
                    : "text-danger-700 dark:text-danger-400"
              )}
            >
              {direction > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : direction < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {Math.abs(delta as number).toFixed(1)}%
            </span>
            {deltaLabel && (
              <span className="text-muted-foreground">{deltaLabel}</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">{deltaLabel ?? "—"}</span>
        )}
      </div>
    </Card>
  );
}

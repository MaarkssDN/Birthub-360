/**
 * chartThemeV2 — Agente 38 (Nara), Onda ONDA-DESIGN-PREMIUM-2026-11-24.
 *
 * Paleta e chrome de gráficos para superfícies v2 (cards navy).
 * Cores fixas (não reagem a tema) porque o chrome de gráfico v2 é
 * calibrado para a superfície escura premium — mesma filosofia do
 * chartPalette.ts v1 (validação ΔE em CVD/visão normal).
 */

/** Acento primário — gold da marca v2. */
export const CHART_V2_PRIMARY = "#fbbf24";

/** Série secundária — azul steel, par complementar do gold. */
export const CHART_V2_SECONDARY = "#7dd3fc";

/** Série terciária — verde suave para métricas positivas. */
export const CHART_V2_POSITIVE = "#34d399";

/** Série de atenção — âmbar/sinal. */
export const CHART_V2_WARNING = "#f59e0b";

/** Série crítica — vermelho suave. */
export const CHART_V2_CRITICAL = "#f87171";

/** Tema categórico (slots 1–5) para múltiplas séries. */
export const SERIES_V2 = [
  CHART_V2_PRIMARY,
  CHART_V2_SECONDARY,
  CHART_V2_POSITIVE,
  CHART_V2_WARNING,
  CHART_V2_CRITICAL,
] as const;

/** Tinta e chrome recessivos sobre navy-800 (#0f172a). */
export const INK_V2 = {
  /** Labels de eixo/tooltip — slate-300, ~7:1 sobre navy-800. */
  muted: "#cbd5e1",
  /** Grid lines — branco a 6%, discreto. */
  grid: "rgba(255,255,255,0.06)",
  /** Eixo — branco a 12%. */
  axis: "rgba(255,255,255,0.12)",
  /** Tooltip surface. */
  tooltipBg: "#0a0f1e",
  tooltipBorder: "rgba(255,255,255,0.10)",
} as const;

/** Estilo do tooltip Recharts v2. */
export const tooltipStyleV2 = {
  backgroundColor: INK_V2.tooltipBg,
  border: `1px solid ${INK_V2.tooltipBorder}`,
  borderRadius: 12,
  fontSize: 12,
  color: "#f1f5f9",
} as const;

/** Cor de linha de referência/meta (ex.: target line). */
export const REFERENCE_V2 = "rgba(148,163,184,0.5)";

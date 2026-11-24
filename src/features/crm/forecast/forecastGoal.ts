import {
  calculateWeightedForecast,
  type ForecastDealInput,
  type StageHistoricalConversion,
  type WeightedForecastSummary,
} from './forecast.service.js';

/**
 * Agente 46 · Sofia — Forecast vs. Metas Comerciais (Squad 40).
 *
 * Complementa `forecast.service.ts` (que já produz o forecast ponderado por
 * probabilidade efetiva de etapa) com a comparação contra a meta do período.
 *
 * Modelo:
 * - `projectedTotalRevenueCents` = closedWonCents + weightedForecastCents
 *   (receita já ganha + pipeline aberto ponderado pela conversão histórica
 *   suavizada por Bayes em `computeEffectiveStageProbability`).
 * - `attainmentRatio` = projected / goal. Não é probabilidade nem intervalo de
 *   confiança: é o razão entre projeção determinística e meta. A incerteza do
 *   forecast está embutida nos pesos por etapa (probabilidade efetiva entre 0 e 1).
 * - `elapsedFraction` (0..1) é a fração do período já decorrida (ex.: dia 15 de
 *   um mês de 30 → 0.5). Quando informada, `paceRatio = attainmentRatio /
 *   elapsedFraction` mede se a projeção está no ritmo esperado.
 *
 * Status (somente quando há meta e período decorrido informado):
 * - EXCEEDED: projeção já cobre a meta (attainmentRatio >= 1).
 * - ON_TRACK: paceRatio >= 1 (ritmo suficiente para bater a meta no fim do período).
 * - AT_RISK: 0.75 <= paceRatio < 1.
 * - OFF_TRACK: paceRatio < 0.75.
 * Sem `elapsedFraction`, o status reflete apenas o attainmentRatio:
 * - EXCEEDED (>= 1), ON_TRACK (>= 0.8) ou AT_RISK (< 0.8) — projeção parcial.
 * Sem meta (`goalCents` null/<=0), status é NO_GOAL e os campos de meta ficam null.
 */

export type GoalAttainmentStatus = 'NO_GOAL' | 'EXCEEDED' | 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';

export interface GoalAttainment {
  /** Meta do período em centavos; null quando não há meta configurada. */
  goalCents: number | null;
  /** Projeção total (won + forecast ponderado) em centavos. */
  projectedTotalRevenueCents: number;
  /** projectedTotalRevenueCents / goalCents; null sem meta. */
  attainmentRatio: number | null;
  /** goalCents - projectedTotalRevenueCents (mínimo 0); null sem meta. */
  gapToGoalCents: number | null;
  /** Fração do período decorrida (0..1); eco do input, null quando ausente. */
  elapsedFraction: number | null;
  /** attainmentRatio / elapsedFraction; null sem meta ou sem elapsedFraction. */
  paceRatio: number | null;
  status: GoalAttainmentStatus;
}

export interface ForecastGoalReport {
  forecast: WeightedForecastSummary;
  goal: GoalAttainment;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function computeGoalAttainment(params: {
  goalCents: number | null | undefined;
  projectedTotalRevenueCents: number;
  elapsedFraction?: number | null;
}): GoalAttainment {
  const goalCents =
    params.goalCents != null && Number.isFinite(params.goalCents) && params.goalCents > 0
      ? Math.round(params.goalCents)
      : null;

  const projected = Number.isFinite(params.projectedTotalRevenueCents)
    ? Math.max(0, Math.round(params.projectedTotalRevenueCents))
    : 0;

  const elapsedFraction =
    params.elapsedFraction != null &&
    Number.isFinite(params.elapsedFraction) &&
    params.elapsedFraction > 0
      ? clamp01(params.elapsedFraction)
      : null;

  if (goalCents == null) {
    return {
      goalCents: null,
      projectedTotalRevenueCents: projected,
      attainmentRatio: null,
      gapToGoalCents: null,
      elapsedFraction,
      paceRatio: null,
      status: 'NO_GOAL',
    };
  }

  const attainmentRatio = Number((projected / goalCents).toFixed(4));
  const gapToGoalCents = Math.max(0, goalCents - projected);
  const paceRatio =
    elapsedFraction != null && elapsedFraction > 0
      ? Number((attainmentRatio / elapsedFraction).toFixed(4))
      : null;

  let status: GoalAttainmentStatus;
  if (attainmentRatio >= 1) {
    status = 'EXCEEDED';
  } else if (elapsedFraction != null && paceRatio != null) {
    if (paceRatio >= 1) status = 'ON_TRACK';
    else if (paceRatio >= 0.75) status = 'AT_RISK';
    else status = 'OFF_TRACK';
  } else {
    // Sem fração do período não há como medir ritmo: usa attainment como proxy.
    status = attainmentRatio >= 0.8 ? 'ON_TRACK' : 'AT_RISK';
  }

  return {
    goalCents,
    projectedTotalRevenueCents: projected,
    attainmentRatio,
    gapToGoalCents,
    elapsedFraction,
    paceRatio,
    status,
  };
}

/**
 * Relatório único: forecast ponderado do pipeline + comparação com a meta.
 * É a fatia mínima que conecta `calculateWeightedForecast` (já existente) à meta
 * comercial, sem depender de storage — o caller injeta deals, estágios e meta.
 */
export function buildForecastGoalReport(params: {
  deals: readonly ForecastDealInput[];
  stages: readonly StageHistoricalConversion[];
  goalCents?: number | null;
  elapsedFraction?: number | null;
}): ForecastGoalReport {
  const forecast = calculateWeightedForecast(params.deals, params.stages);
  const goal = computeGoalAttainment({
    goalCents: params.goalCents ?? null,
    projectedTotalRevenueCents: forecast.projectedTotalRevenueCents,
    elapsedFraction: params.elapsedFraction ?? null,
  });
  return { forecast, goal };
}

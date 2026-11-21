export interface ForecastDealInput {
  id: string;
  stageId: string;
  valueCents: number;
  status: 'OPEN' | 'WON' | 'LOST';
}

export interface StageHistoricalConversion {
  stageId: string;
  defaultProbability: number;
  historicalEnteredCount: number;
  historicalWonCount: number;
}

export interface StageForecastBreakdown {
  stageId: string;
  openDealsCount: number;
  grossValueCents: number;
  effectiveConversionProbability: number;
  weightedValueCents: number;
}

export interface WeightedForecastSummary {
  totalOpenDeals: number;
  grossPipelineCents: number;
  weightedForecastCents: number;
  closedWonCents: number;
  projectedTotalRevenueCents: number;
  stages: StageForecastBreakdown[];
}

const MIN_HISTORICAL_SAMPLE_SIZE = 10;

export function computeEffectiveStageProbability(stage: StageHistoricalConversion): number {
  const clamp = (val: number) => Math.min(1, Math.max(0, val));
  const fallback = clamp(stage.defaultProbability);

  if (
    !Number.isFinite(stage.historicalEnteredCount) ||
    stage.historicalEnteredCount <= 0 ||
    stage.historicalWonCount < 0
  ) {
    return fallback;
  }

  const historicalRate = clamp(stage.historicalWonCount / stage.historicalEnteredCount);

  // Suavização Bayesiana / credibilidade proporcional à amostra até MIN_HISTORICAL_SAMPLE_SIZE
  const credibility = Math.min(1, stage.historicalEnteredCount / MIN_HISTORICAL_SAMPLE_SIZE);
  const blended = credibility * historicalRate + (1 - credibility) * fallback;
  return Number(clamp(blended).toFixed(4));
}

export function calculateWeightedForecast(
  deals: readonly ForecastDealInput[],
  stages: readonly StageHistoricalConversion[],
): WeightedForecastSummary {
  const stageMap = new Map<string, StageHistoricalConversion>();
  for (const s of stages) {
    stageMap.set(s.stageId, s);
  }

  let closedWonCents = 0;
  let totalOpenDeals = 0;
  let grossPipelineCents = 0;
  let weightedForecastCents = 0;

  const groupedOpenByStage = new Map<string, { count: number; grossCents: number }>();

  for (const deal of deals) {
    const value = Number.isFinite(deal.valueCents) ? Math.max(0, deal.valueCents) : 0;
    if (deal.status === 'WON') {
      closedWonCents += value;
      continue;
    }
    if (deal.status !== 'OPEN') {
      continue;
    }

    totalOpenDeals += 1;
    grossPipelineCents += value;

    const entry = groupedOpenByStage.get(deal.stageId) ?? { count: 0, grossCents: 0 };
    entry.count += 1;
    entry.grossCents += value;
    groupedOpenByStage.set(deal.stageId, entry);
  }

  const breakdowns: StageForecastBreakdown[] = [];

  for (const [stageId, group] of groupedOpenByStage.entries()) {
    const stageConfig = stageMap.get(stageId) ?? {
      stageId,
      defaultProbability: 0.25,
      historicalEnteredCount: 0,
      historicalWonCount: 0,
    };
    const effectiveConversionProbability = computeEffectiveStageProbability(stageConfig);
    const weightedValueCents = Math.round(group.grossCents * effectiveConversionProbability);
    weightedForecastCents += weightedValueCents;

    breakdowns.push({
      stageId,
      openDealsCount: group.count,
      grossValueCents: group.grossCents,
      effectiveConversionProbability,
      weightedValueCents,
    });
  }

  return {
    totalOpenDeals,
    grossPipelineCents,
    weightedForecastCents,
    closedWonCents,
    projectedTotalRevenueCents: closedWonCents + weightedForecastCents,
    stages: breakdowns,
  };
}

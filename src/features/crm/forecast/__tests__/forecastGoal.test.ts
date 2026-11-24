import { describe, expect, it } from 'vitest';
import type { ForecastDealInput, StageHistoricalConversion } from '../forecast.service.js';
import { buildForecastGoalReport, computeGoalAttainment } from '../forecastGoal.js';

const STAGES: StageHistoricalConversion[] = [
  {
    stageId: 'prospecting',
    defaultProbability: 0.1,
    historicalEnteredCount: 0,
    historicalWonCount: 0,
  },
  {
    stageId: 'proposal',
    defaultProbability: 0.5,
    historicalEnteredCount: 0,
    historicalWonCount: 0,
  },
  {
    stageId: 'negotiation',
    defaultProbability: 0.8,
    historicalEnteredCount: 0,
    historicalWonCount: 0,
  },
];

function deal(
  id: string,
  stageId: string,
  valueCents: number,
  status: ForecastDealInput['status'] = 'OPEN',
): ForecastDealInput {
  return { id, stageId, valueCents, status };
}

describe('[46 · Sofia] computeGoalAttainment — forecast vs meta comercial', () => {
  it('retorna NO_GOAL quando meta é null, zero ou inválida', () => {
    for (const goalCents of [null, undefined, 0, -100, Number.NaN]) {
      const result = computeGoalAttainment({ goalCents, projectedTotalRevenueCents: 500_000 });
      expect(result.status).toBe('NO_GOAL');
      expect(result.goalCents).toBeNull();
      expect(result.attainmentRatio).toBeNull();
      expect(result.gapToGoalCents).toBeNull();
      expect(result.paceRatio).toBeNull();
      expect(result.projectedTotalRevenueCents).toBe(500_000);
    }
  });

  it('marca EXCEEDED quando a projeção já cobre a meta', () => {
    const result = computeGoalAttainment({
      goalCents: 100_000,
      projectedTotalRevenueCents: 120_000,
      elapsedFraction: 0.5,
    });
    expect(result.status).toBe('EXCEEDED');
    expect(result.attainmentRatio).toBe(1.2);
    expect(result.gapToGoalCents).toBe(0);
    expect(result.paceRatio).toBe(2.4);
  });

  it('classifica ON_TRACK / AT_RISK / OFF_TRACK pelo paceRatio com elapsedFraction', () => {
    const goalCents = 100_000;
    const elapsedFraction = 0.5;

    // attainment 0.9 → pace 1.8 → ON_TRACK
    expect(
      computeGoalAttainment({ goalCents, projectedTotalRevenueCents: 90_000, elapsedFraction })
        .status,
    ).toBe('ON_TRACK');

    // attainment 0.4 → pace 0.8 → AT_RISK (>= 0.75)
    expect(
      computeGoalAttainment({ goalCents, projectedTotalRevenueCents: 40_000, elapsedFraction })
        .status,
    ).toBe('AT_RISK');

    // attainment 0.3 → pace 0.6 → OFF_TRACK (< 0.75)
    const off = computeGoalAttainment({
      goalCents,
      projectedTotalRevenueCents: 30_000,
      elapsedFraction,
    });
    expect(off.status).toBe('OFF_TRACK');
    expect(off.gapToGoalCents).toBe(70_000);
  });

  it('sem elapsedFraction usa attainmentRatio como proxy de status', () => {
    expect(
      computeGoalAttainment({ goalCents: 100_000, projectedTotalRevenueCents: 85_000 }).status,
    ).toBe('ON_TRACK');
    expect(
      computeGoalAttainment({ goalCents: 100_000, projectedTotalRevenueCents: 50_000 }).status,
    ).toBe('AT_RISK');
  });

  it('trata projeção negativa/inválida como zero e faz clamp de elapsedFraction', () => {
    const result = computeGoalAttainment({
      goalCents: 100_000,
      projectedTotalRevenueCents: Number.NaN,
      elapsedFraction: 1.7,
    });
    expect(result.projectedTotalRevenueCents).toBe(0);
    expect(result.elapsedFraction).toBe(1);
    expect(result.paceRatio).toBe(0);
    expect(result.status).toBe('OFF_TRACK');
  });
});

describe('[46 · Sofia] buildForecastGoalReport — pipeline ponderado vs meta', () => {
  it('combina forecast ponderado e attainment em um único relatório', () => {
    const deals = [
      deal('d1', 'proposal', 200_000),
      deal('d2', 'negotiation', 100_000),
      deal('d3', 'prospecting', 50_000),
      deal('d4', 'proposal', 80_000, 'WON'),
      deal('d5', 'negotiation', 60_000, 'LOST'),
    ];

    const report = buildForecastGoalReport({
      deals,
      stages: STAGES,
      goalCents: 300_000,
      elapsedFraction: 0.5,
    });

    // OPEN: proposal 200k*0.5=100k + negotiation 100k*0.8=80k + prospecting 50k*0.1=5k
    expect(report.forecast.totalOpenDeals).toBe(3);
    expect(report.forecast.weightedForecastCents).toBe(185_000);
    expect(report.forecast.closedWonCents).toBe(80_000);
    expect(report.forecast.projectedTotalRevenueCents).toBe(265_000);

    // attainment = 265k/300k ≈ 0.8833; pace = 1.7667 → ON_TRACK
    expect(report.goal.status).toBe('ON_TRACK');
    expect(report.goal.attainmentRatio).toBeCloseTo(0.8833, 4);
    expect(report.goal.gapToGoalCents).toBe(35_000);
    // attainmentRatio é arredondado a 4 casas antes do pace: 0.8833/0.5 = 1.7666
    expect(report.goal.paceRatio).toBeCloseTo(1.7666, 4);
  });

  it('tolera pipeline vazio e ausência de meta', () => {
    const report = buildForecastGoalReport({ deals: [], stages: STAGES });
    expect(report.forecast.totalOpenDeals).toBe(0);
    expect(report.forecast.weightedForecastCents).toBe(0);
    expect(report.goal.status).toBe('NO_GOAL');
    expect(report.goal.projectedTotalRevenueCents).toBe(0);
  });

  it('usa probabilidade default 0.25 para etapa sem histórico nem config', () => {
    const report = buildForecastGoalReport({
      deals: [deal('d1', 'etapa-desconhecida', 100_000)],
      stages: STAGES,
      goalCents: 40_000,
    });
    expect(report.forecast.weightedForecastCents).toBe(25_000);
    // attainment = 25k/40k = 0.625 < 0.8 e sem elapsedFraction → AT_RISK
    expect(report.goal.status).toBe('AT_RISK');
    expect(report.goal.attainmentRatio).toBeCloseTo(0.625, 4);
  });
});

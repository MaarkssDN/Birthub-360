// Unit tests for the pure metric derivations extracted from Dashboard/Overview.tsx
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063). Covers the success path (real aggregates) and the
// failure/edge paths (empty inputs, unparseable durations, stale SLA samples, missing AI
// telemetry) — the page must keep showing honest empty states, never fabricated numbers.
import { describe, expect, it } from 'vitest';
import {
  AI_COST_METRIC,
  AI_LATENCY_METRIC,
  AI_TOKENS_METRIC,
  calculateChecklistProgress,
  describeSlaFailure,
  deriveOverviewMetrics,
  formatMs,
  formatSecondsAsDuration,
  formatTokens,
  formatUsd,
  parseDurationToSeconds,
  SLA_READY_CHECK_METRIC,
  type AgentRecord,
  type CallLogEntry,
  type MetricEntry,
} from './overviewMetrics.js';

const NOW = new Date('2026-11-12T15:00:00-03:00').getTime();
const TODAY_ISO = '2026-11-12T10:00:00-03:00';
const YESTERDAY_ISO = '2026-11-11T10:00:00-03:00';

function metric(name: string, value: number, timestamp: string, tags?: Record<string, unknown>): MetricEntry {
  return { id: `${name}-${timestamp}-${value}`, name, value, timestamp, tags };
}

describe('parseDurationToSeconds', () => {
  it('parses "mm:ss" durations', () => {
    expect(parseDurationToSeconds('02:30')).toBe(150);
    expect(parseDurationToSeconds('00:45')).toBe(45);
  });

  it('rejects malformed or missing durations instead of coercing to 0', () => {
    expect(parseDurationToSeconds(undefined)).toBeNull();
    expect(parseDurationToSeconds('')).toBeNull();
    expect(parseDurationToSeconds('1h30')).toBeNull();
    expect(parseDurationToSeconds('abc')).toBeNull();
  });
});

describe('formatSecondsAsDuration', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatSecondsAsDuration(150)).toBe('02:30');
    expect(formatSecondsAsDuration(59.4)).toBe('00:59');
  });
});

describe('describeSlaFailure', () => {
  it('returns null for healthy or missing samples', () => {
    expect(describeSlaFailure(undefined)).toBeNull();
    expect(describeSlaFailure(metric(SLA_READY_CHECK_METRIC, 1, TODAY_ISO))).toBeNull();
  });

  it('names the failed components from tags', () => {
    const sample = metric(SLA_READY_CHECK_METRIC, 0, TODAY_ISO, {
      database: 'error',
      redis: 'ok',
    });
    expect(describeSlaFailure(sample)).toBe('banco de dados');

    const both = metric(SLA_READY_CHECK_METRIC, 0, TODAY_ISO, {
      database: 'error',
      redis: 'error',
    });
    expect(describeSlaFailure(both)).toBe('banco de dados e Redis');
  });
});

describe('calculateChecklistProgress', () => {
  it('returns 0 for null/empty checklists (never NaN)', () => {
    expect(calculateChecklistProgress(null)).toBe(0);
    expect(calculateChecklistProgress({})).toBe(0);
  });

  it('computes the percentage of done keys', () => {
    expect(
      calculateChecklistProgress({ a: true, b: false, c: true, d: true }),
    ).toBe(75);
  });
});

describe('deriveOverviewMetrics — empty state (failure path: no data yet)', () => {
  it('produces honest nulls/zeros, never fabricated values', () => {
    const m = deriveOverviewMetrics([], [], [], NOW);
    expect(m.totalAgents).toBe(0);
    expect(m.totalCalls).toBe(0);
    expect(m.callsToday).toBe(0);
    expect(m.completionRate).toBeNull();
    expect(m.avgDuration).toBeNull();
    expect(m.slaUptimePercent).toBeNull();
    expect(m.slaCaption).toBe('Ainda sem amostras suficientes');
    expect(m.aiTotalCost).toBeNull();
    expect(m.aiTotalTokens).toBeNull();
    expect(m.aiAvgLatency).toBeNull();
    expect(m.aiCallCount).toBe(0);
  });
});

describe('deriveOverviewMetrics — real aggregates (success path)', () => {
  const calls: CallLogEntry[] = [
    {
      id: 'c1',
      status: 'Concluído',
      duration: '02:00',
      timestamp: TODAY_ISO,
    },
    {
      id: 'c2',
      status: 'Concluído',
      duration: '04:00',
      timestamp: TODAY_ISO,
    },
    {
      id: 'c3',
      status: 'Não atendida',
      duration: 'não-numérico',
      timestamp: YESTERDAY_ISO,
    },
    { id: 'c4', status: 'Concluído' }, // sem timestamp nem duração → excluída dos agregados de tempo
  ];
  const agents: AgentRecord[] = [
    { id: 'a1', name: 'Sofia', model: 'gpt-x', phoneNumber: '+5511' },
    { id: 'a2', name: 'Rex', model: 'gpt-y' },
  ];
  const metrics: MetricEntry[] = [
    metric(SLA_READY_CHECK_METRIC, 1, TODAY_ISO),
    metric(SLA_READY_CHECK_METRIC, 1, TODAY_ISO),
    metric(SLA_READY_CHECK_METRIC, 0, TODAY_ISO, { database: 'ok', redis: 'error' }),
    metric(AI_COST_METRIC, 0.01, TODAY_ISO),
    metric(AI_COST_METRIC, 0.02, TODAY_ISO),
    metric(AI_TOKENS_METRIC, 100, TODAY_ISO),
    metric(AI_TOKENS_METRIC, 300, TODAY_ISO),
    metric(AI_LATENCY_METRIC, 200, TODAY_ISO),
    metric(AI_LATENCY_METRIC, 400, TODAY_ISO),
    // Ruído de outro evento não pode vazar para os cards de IA/SLA:
    metric('unrelated_event', 999, TODAY_ISO),
  ];

  it('aggregates calls, agents, SLA window and AI telemetry correctly', () => {
    const m = deriveOverviewMetrics(calls, agents, metrics, NOW);

    expect(m.totalAgents).toBe(2);
    expect(m.agentsWithPhone).toBe(1);
    expect(m.totalCalls).toBe(4);
    expect(m.callsToday).toBe(2);
    expect(m.completedCalls).toBe(3);
    expect(m.completionRate).toBeCloseTo(75);
    // Somente durações "mm:ss" válidas entram na média: (120 + 240) / 2 = 180s → 03:00
    expect(m.avgDuration).toBe('03:00');
    expect(m.parsedDurationCount).toBe(2);

    // SLA: 2 amostras ok de 3 na janela de 24h → 66.66...%; última amostra (mais recente por
    // timestamp empatado — ordenação estável por valor não garantida) — caption menciona falha
    // quando a amostra mais recente é a de falha. Aqui os timestamps são iguais, então o
    // importante é a proporção e a legenda honesta.
    expect(m.slaUptimePercent).toBeCloseTo((2 / 3) * 100);
    expect(m.slaCaption).toContain('3 amostras (24h)');

    expect(m.aiTotalCost).toBeCloseTo(0.03);
    expect(m.aiTotalTokens).toBe(400);
    expect(m.aiAvgLatency).toBe(300);
    expect(m.aiCallCount).toBe(2);
  });

  it('ignora amostras de SLA fora da janela de 24h', () => {
    const stale = metric(SLA_READY_CHECK_METRIC, 1, '2026-10-01T00:00:00-03:00');
    const fresh = metric(SLA_READY_CHECK_METRIC, 1, TODAY_ISO);
    const m = deriveOverviewMetrics([], [], [stale, fresh], NOW);
    expect(m.slaUptimePercent).toBe(100);
    expect(m.slaCaption).toContain('1 amostra (24h)');
  });

  it('sem amostras de IA mostra caption honesta de "sem chamadas"', () => {
    const m = deriveOverviewMetrics([], [], [], NOW);
    expect(m.aiCallCount).toBe(0);
  });
});

describe('format helpers', () => {
  it('formats currency, tokens and latency', () => {
    expect(formatUsd(1.5)).toContain('US$');
    expect(formatTokens(1234)).toBe((1234).toLocaleString('pt-BR'));
    expect(formatMs(1234.4)).toContain('ms');
  });
});

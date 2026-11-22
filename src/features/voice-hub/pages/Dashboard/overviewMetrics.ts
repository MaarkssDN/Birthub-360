// Pure derivation helpers for Dashboard/Overview.tsx (TAREFA-SANEAMENTO-008 /
// BT360-DT-0063). Extracted verbatim from the page component so every metric shown on the
// executive dashboard is unit-testable without rendering React. Nothing here fabricates a
// value: empty inputs produce `null`/`0` exactly as the inline code did before.

export interface CallLogEntry {
  id: string;
  contactName?: string;
  duration?: string;
  agent?: string;
  status?: string;
  time?: string;
  timestamp?: string;
}

export interface AgentRecord {
  id: string;
  name: string;
  model: string;
  phoneNumber?: string;
  updatedAt?: string;
}

export interface ReadyChecks {
  database: 'ok' | 'error';
  redis: 'ok' | 'error';
}

// One row of GET /api/metrics — see prisma/schema.prisma `Metric`. For SLA we only care about
// `name === 'platform_ready_check'` rows (Agente 10, src/services/slaScheduler.ts): a real
// Postgres+Redis health check sampled every ~5 minutes and persisted per tenant, never fabricated.
export interface MetricEntry {
  id: string;
  name: string;
  value: number;
  tags?: Record<string, unknown>;
  timestamp: string;
}

export type FetchStatus = 'loading' | 'ready' | 'error';

export const SLA_READY_CHECK_METRIC = 'platform_ready_check';
export const SLA_WINDOW_MS = 24 * 60 * 60 * 1000; // last 24h — see handoff onda-4/10-para-02-sla-telemetria-overview.md

// AI call telemetry event names persisted by lib/voice-runtime/providers/LLMGateway.ts
// (tenant-wide, userId: null) — one row per successful call to a real provider. See
// .agents/handoffs/onda-4/04-para-02-telemetria-custo-ia-disponivel.md. Only written when a
// provider actually returned a response — never for a consent-blocked call or a full failover
// failure, so an empty result here means "no AI calls yet", not "pipeline missing".
export const AI_COST_METRIC = 'ai_call_cost_usd';
export const AI_TOKENS_METRIC = 'ai_call_tokens';
export const AI_LATENCY_METRIC = 'ai_call_latency_ms';

export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function formatTokens(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatMs(value: number): string {
  return `${Math.round(value).toLocaleString('pt-BR')} ms`;
}

// Names which real component(s) failed on a given platform_ready_check sample, from its `tags`
// (`{ database: 'ok'|'error', redis: 'ok'|'error' }`). Returns null when the sample was healthy.
export function describeSlaFailure(sample: MetricEntry | undefined): string | null {
  if (sample?.value !== 0) return null;
  const tags = sample.tags ?? {};
  const failed: string[] = [];
  if (tags.database && tags.database !== 'ok') failed.push('banco de dados');
  if (tags.redis && tags.redis !== 'ok') failed.push('Redis');
  return failed.length > 0 ? failed.join(' e ') : 'componente não identificado';
}

// Parses a "mm:ss" call-duration string into whole seconds. Real call durations are free-text
// (see prisma CallLog.duration / callLogRepository.createCallLog) so not every value is
// guaranteed to match — anything that doesn't parse is simply excluded from the average rather
// than silently coerced to 0, which would understate real call length.
export function parseDurationToSeconds(duration?: string): number | null {
  if (!duration) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(duration.trim());
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

export function formatSecondsAsDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Percentage of checklist keys marked done (0-100). `null`/empty checklist → 0, never NaN.
export function calculateChecklistProgress(
  currentList: Record<string, boolean> | null = null,
): number {
  if (!currentList) return 0;
  const keys = Object.keys(currentList);
  if (keys.length === 0) return 0;
  const completed = keys.filter((k) => currentList[k]).length;
  return (completed / keys.length) * 100;
}

export interface OverviewDerivedMetrics {
  totalAgents: number;
  agentsWithPhone: number;
  totalCalls: number;
  callsToday: number;
  completedCalls: number;
  completionRate: number | null;
  avgDuration: string | null;
  parsedDurationCount: number;
  slaUptimePercent: number | null;
  slaCaption: string;
  aiTotalCost: number | null;
  aiTotalTokens: number | null;
  aiAvgLatency: number | null;
  aiCallCount: number;
}

// All KPI/widget numbers shown on the "Visão Geral" tab, derived once from the three fetch
// results. Pure and deterministic — `now` is injectable so tests don't depend on the clock.
export function deriveOverviewMetrics(
  calls: CallLogEntry[],
  agents: AgentRecord[],
  metrics: MetricEntry[],
  now: number = Date.now(),
): OverviewDerivedMetrics {
  const totalAgents = agents.length;
  const agentsWithPhone = agents.filter((a) => !!a.phoneNumber).length;

  const totalCalls = calls.length;
  const today = new Date(now);
  const callsToday = calls.filter((c) => {
    if (!c.timestamp) return false;
    const d = new Date(c.timestamp);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  const completedCalls = calls.filter((c) => c.status === 'Concluído').length;
  const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : null;

  const parsedDurations = calls
    .map((c) => parseDurationToSeconds(c.duration))
    .filter((v): v is number => v !== null);
  const avgDuration =
    parsedDurations.length > 0
      ? formatSecondsAsDuration(parsedDurations.reduce((a, b) => a + b, 0) / parsedDurations.length)
      : null;

  // SLA (disponibilidade) — real uptime approximation from platform_ready_check samples in the
  // last 24h, never a fabricated percentage. Empty (not zero) until the scheduler has produced at
  // least one sample for this tenant — see .agents/handoffs/onda-4/10-para-02-sla-telemetria-overview.md.
  const slaSamples = metrics
    .filter((m) => m.name === SLA_READY_CHECK_METRIC)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const slaWindowSamples = slaSamples.filter(
    (m) => now - new Date(m.timestamp).getTime() <= SLA_WINDOW_MS,
  );
  const slaUptimePercent =
    slaWindowSamples.length > 0
      ? (slaWindowSamples.filter((m) => m.value === 1).length / slaWindowSamples.length) * 100
      : null;
  const slaLastFailure = describeSlaFailure(slaSamples[0]);
  const slaCaption =
    slaUptimePercent !== null
      ? `${slaWindowSamples.length} amostra${slaWindowSamples.length === 1 ? '' : 's'} (24h) · a cada 5 min${slaLastFailure ? ` · última falha: ${slaLastFailure}` : ''}`
      : 'Ainda sem amostras suficientes';

  // Telemetria de IA (custo, tokens, latência) — real, tenant-wide, gravada por
  // lib/voice-runtime/providers/LLMGateway.ts a cada chamada que efetivamente atingiu um provedor.
  // Ver .agents/handoffs/onda-4/04-para-02-telemetria-custo-ia-disponivel.md. Nunca fabricado: sem
  // nenhuma linha ainda, os cards mostram "—" com uma legenda honesta de "ainda sem chamadas" (o
  // pipeline existe, só não houve chamada de IA neste tenant ainda).
  const aiCostSamples = metrics.filter((m) => m.name === AI_COST_METRIC);
  const aiTokensSamples = metrics.filter((m) => m.name === AI_TOKENS_METRIC);
  const aiLatencySamples = metrics.filter((m) => m.name === AI_LATENCY_METRIC);

  const aiTotalCost =
    aiCostSamples.length > 0 ? aiCostSamples.reduce((sum, m) => sum + m.value, 0) : null;
  const aiTotalTokens =
    aiTokensSamples.length > 0 ? aiTokensSamples.reduce((sum, m) => sum + m.value, 0) : null;
  const aiAvgLatency =
    aiLatencySamples.length > 0
      ? aiLatencySamples.reduce((sum, m) => sum + m.value, 0) / aiLatencySamples.length
      : null;
  // Total de chamadas de IA reportadas = nº de amostras de latência (uma por chamada bem-sucedida
  // a um provedor real — ver contrato do handoff do Agente 04).
  const aiCallCount = aiLatencySamples.length;

  return {
    totalAgents,
    agentsWithPhone,
    totalCalls,
    callsToday,
    completedCalls,
    completionRate,
    avgDuration,
    parsedDurationCount: parsedDurations.length,
    slaUptimePercent,
    slaCaption,
    aiTotalCost,
    aiTotalTokens,
    aiAvgLatency,
    aiCallCount,
  };
}

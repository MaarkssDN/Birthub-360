import type { MetricEntry } from './overviewTypes.js';

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

/** Progresso do checklist de onboarding (0-100). `null`/vazio => 0. */
export function calculateOnboardingProgress(currentList: Record<string, boolean> | null): number {
  if (!currentList) return 0;
  const keys = Object.keys(currentList);
  if (keys.length === 0) return 0;
  const completed = keys.filter((k) => currentList[k]).length;
  return (completed / keys.length) * 100;
}

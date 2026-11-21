export interface OutboundWebhookBackoffConfig {
  baseDelayMs?: number;
  maxDelayMs?: number;
  randomFn?: () => number;
}

/**
 * Calcula atraso de retentativa com Exponential Backoff + Full Jitter para evitar
 * tempestade de requisições (thundering herd) quando o endpoint do cliente volta do ar.
 */
export function computeOutboundWebhookBackoffWithJitter(
  attempt: number,
  config: OutboundWebhookBackoffConfig = {},
): number {
  const baseDelayMs = Math.max(100, config.baseDelayMs ?? 1_000);
  const maxDelayMs = Math.max(baseDelayMs, config.maxDelayMs ?? 60_000);
  const rand = config.randomFn ?? Math.random;

  const expCap = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const jitterFloor = Math.floor(expCap * 0.5);
  const jitterSpan = expCap - jitterFloor;
  return jitterFloor + Math.floor(rand() * (jitterSpan + 1));
}

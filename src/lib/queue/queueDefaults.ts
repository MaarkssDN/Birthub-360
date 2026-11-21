/**
 * DEBT/WRK-02 — Opções padrão de job por classe de fila.
 *
 * Classes:
 * - SCHEDULER_SCAN_DEFAULTS: ticks/scans recorrentes (idempotentes por natureza —
 *   reexecutar o scan não duplica efeito externo). Retry curto cobre falha transitória
 *   de Redis/DB sem esperar o próximo ciclo.
 * - OUTBOUND defaults já existem inline nas filas outbound (attempts:10 + backoff
 *   exponencial de 10s) — não duplicar aqui.
 *
 * Jobs com efeito externo não-idempotente (ex.: coldCall — ligações de voz)
 * NÃO devem herdar retry: mantêm `attempts: 1` explícito no opts do job,
 * que tem precedência sobre defaultJobOptions da fila.
 */
import type { JobsOptions } from 'bullmq';

export const SCHEDULER_SCAN_DEFAULTS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 60_000 },
  removeOnComplete: { age: 24 * 60 * 60 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};

import { Queue, Worker } from 'bullmq';
import { getRedisConnectionOptions } from '../lib/env.js';
import { logger } from '../../../lib/logger.js';
import { purgeExpiredCallLogs } from './callLogService.js';
import { registerQueueForMetrics } from '../../../lib/queue/metrics.js';

/**
 * Schedules the daily CallLog retention purge described in
 * `.agents/handoffs/onda-1/05-para-00-callLog-retention-scheduling.md`. The Agente 05 handoff
 * implemented `callLogService.purgeExpiredCallLogs()` (LGPD-driven retention window, default 365
 * days, configurable via `CALL_LOG_RETENTION_DAYS`) but deliberately did not self-schedule it —
 * owning cadence/failure-handling for a periodic job is an infrastructure concern. This module is
 * that infrastructure: a BullMQ repeatable job on the same Redis-backed queue infrastructure as
 * `webhook.worker.ts`, run once a day.
 */

const QUEUE_NAME = 'callLogRetention';
const JOB_NAME = 'purge';
// Once every 24h. A repeatable cron job (rather than a fixed `every` interval) so BullMQ anchors
// runs to a stable wall-clock time (00:00) instead of drifting off whenever the process last
// restarted.
const REPEAT_CRON = '0 0 * * *';

let queue: Queue | null = null;
let worker: Worker | null = null;

/**
 * Registers the repeatable job and starts the worker that processes it. Safe to call once during
 * process startup, next to `startWebhookWorker()`. Never throws: a Redis outage at startup should
 * degrade to "retention purge temporarily unscheduled", not crash the web process — the next
 * successful call (e.g. after a restart) re-registers the repeatable job idempotently (BullMQ
 * dedupes identical repeat configs for a given job name).
 */
export function startRetentionScheduler(): { queue: Queue; worker: Worker } | undefined {
  try {
    const connection = { ...getRedisConnectionOptions(), maxRetriesPerRequest: null };

    queue = new Queue(QUEUE_NAME, { connection });
    registerQueueForMetrics(QUEUE_NAME, queue);

    worker = new Worker(
      QUEUE_NAME,
      async () => {
        const { deletedCount, cutoff } = await purgeExpiredCallLogs();
        logger.info(
          {
            deletedCount,
            cutoff: cutoff.toISOString(),
          },
          '[RetentionScheduler] Purge job completed',
        );
        return { deletedCount };
      },
      { connection },
    );

    worker.on('failed', (job, err) => {
      // Logged, not rethrown/crashed: a failed purge run should not take down the web process —
      // BullMQ will retry the next job occurrence on the following day's schedule regardless.
      logger.error(`[RetentionScheduler] Job ${job?.id} failed. Reason: ${err.message}`);
    });

    // BullMQ v6 removeu `repeat` de JobsOptions — jobs recorrentes agora são "job schedulers"
    // upsertados por id estável (upsertJobScheduler é idempotente: re-register no boot só atualiza).
    queue
      .upsertJobScheduler(
        `${QUEUE_NAME}-${JOB_NAME}`,
        { pattern: REPEAT_CRON },
        {
          name: JOB_NAME,
          data: {},
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      )
      .then(() => {
        logger.info(
          {
            cron: REPEAT_CRON,
          },
          '[RetentionScheduler] Registered daily CallLog retention purge job',
        );
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`[RetentionScheduler] Failed to register repeatable job: ${msg}`);
      });

    return { queue, worker };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[RetentionScheduler] Failed to start: ${msg}`);
    return undefined;
  }
}

/** Test/shutdown helper: stops the worker and closes the queue connection. */
export async function stopRetentionScheduler(): Promise<void> {
  await worker?.close();
  await queue?.close();
  worker = null;
  queue = null;
}

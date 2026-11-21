import { type Job, Queue, Worker } from 'bullmq';
import { logger } from '../../../lib/logger.js';
import { isFinalAttempt, recordDeadLetter } from '../../../lib/queue/deadLetter.js';
import { recordQueueJobCompleted, registerQueueForMetrics } from '../../../lib/queue/metrics.js';
import { connection, queuesEnabled } from '../../../lib/queue/redis.js';

export const BITRIX_WEBHOOK_QUEUE_NAME = 'bitrix-webhook-inbound';

/**
 * Payload do job. NUNCA carrega webhookUrl/segredos (ficariam em claro no Redis): o worker
 * recarrega a conexão dentro do contexto do tenant (`organizationId`), preservando a RLS.
 */
export interface BitrixWebhookJobData {
  organizationId: string;
  connectionId: string;
  eventType: string;
  bitrixRecordId: string;
  deliveryFingerprint: string;
}

export const bitrixWebhookQueue = queuesEnabled
  ? new Queue<BitrixWebhookJobData>(BITRIX_WEBHOOK_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 24 * 60 * 60 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    })
  : null;

registerQueueForMetrics(BITRIX_WEBHOOK_QUEUE_NAME, bitrixWebhookQueue);

bitrixWebhookQueue?.on('error', (err) =>
  logger.warn({ message: err.message }, 'bitrixWebhookQueue offline'),
);

/**
 * Enfileira o evento. Retorna `false` quando as filas estão desligadas (sem Redis) — o chamador
 * decide o fallback. `jobId` = fingerprint da entrega: reentregas idênticas não duplicam o job.
 */
export async function enqueueBitrixWebhookEvent(data: BitrixWebhookJobData): Promise<boolean> {
  if (!bitrixWebhookQueue) return false;
  await bitrixWebhookQueue.add('process-event', data, {
    jobId: `bitrix-webhook-${data.deliveryFingerprint}`,
  });
  return true;
}

export function createBitrixWebhookWorker(
  processor: (data: BitrixWebhookJobData) => Promise<void>,
) {
  const worker = new Worker<BitrixWebhookJobData>(
    BITRIX_WEBHOOK_QUEUE_NAME,
    async (job: Job<BitrixWebhookJobData>) => processor(job.data),
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Bitrix webhook job failed');
    if (!job || !isFinalAttempt(job.attemptsMade, job.opts.attempts)) return;
    void recordDeadLetter({
      queue: BITRIX_WEBHOOK_QUEUE_NAME,
      jobId: job.id,
      jobName: job.name,
      organizationId: job.data?.organizationId ?? null,
      attemptsMade: job.attemptsMade,
      error: err,
      data: job.data,
    });
  });

  worker.on('completed', () => recordQueueJobCompleted(BITRIX_WEBHOOK_QUEUE_NAME));

  return worker;
}

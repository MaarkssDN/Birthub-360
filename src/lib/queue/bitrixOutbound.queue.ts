import { type Job, Queue, Worker } from 'bullmq';
import { pushLeadToBitrix } from '../../features/integrations/bitrix/service/outboundSync.js';
import { requestContext } from '../async-context.js';
import { logger } from '../logger.js';
import { isFinalAttempt, recordDeadLetter } from './deadLetter.js';
import { recordQueueJobCompleted, registerQueueForMetrics } from './metrics.js';
import { connection, queuesEnabled } from './redis.js';

export const BITRIX_OUTBOUND_QUEUE_NAME = 'bitrix-outbound-sync';

/** QUEUE-001: Retries com backoff exponencial para lidar com limites de taxa do Bitrix24 e instabilidades da API. */
export const bitrixOutboundQueue = queuesEnabled
  ? new Queue(BITRIX_OUTBOUND_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 10,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: { age: 24 * 60 * 60 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    })
  : null;

registerQueueForMetrics(BITRIX_OUTBOUND_QUEUE_NAME, bitrixOutboundQueue);

bitrixOutboundQueue?.on('error', (err) =>
  logger.warn({ message: err.message }, 'bitrixOutboundQueue offline'),
);

interface BitrixOutboundJobData {
  organizationId: string;
  leadId: string;
}

export async function queueLeadPushToBitrix(organizationId: string, leadId: string): Promise<void> {
  if (!bitrixOutboundQueue) {
    // Fallback gracioso se a fila estiver desligada. `pushLeadToBitrix` relança o erro (o worker
    // BullMQ precisa dele para reagendar o retry), então aqui — sem worker — o `.catch` é o que
    // mantém o fire-and-forget: sem ele a falha viraria unhandled rejection.
    void pushLeadToBitrix(organizationId, leadId).catch((err) =>
      logger.warn({ err, organizationId, leadId }, '[bitrix] Push direto falhou (fila desligada)'),
    );
    return;
  }

  const jobId = `bitrix-push-${organizationId}-${leadId}`;
  await removeTerminalJob(bitrixOutboundQueue, jobId);
  await bitrixOutboundQueue.add('push-lead', { organizationId, leadId }, { jobId });
  logger.info({ organizationId, leadId }, '[bitrix] Push enfileirado com sucesso');
}

/**
 * ONDA3-23 (dedup jobId vs. retenção): um job `completed`/`failed` continua ocupando o `jobId`
 * enquanto `removeOnComplete`/`removeOnFail` (24h/7d) não o expurgam — e `Queue.add` deduplica
 * contra QUALQUER job com o mesmo id, não só os pendentes. Sem esta remoção, uma segunda mudança
 * de etapa dentro da janela de retenção era engolida silenciosamente e o Bitrix ficava com o
 * estado antigo para sempre. O worker relê o lead do banco na execução, então descartar o registro
 * terminal e re-enfileirar é seguro; jobs ainda `waiting`/`delayed`/`active` são mantidos (o `add`
 * abaixo deduplica contra eles, e um job pendente já empurra o estado mais recente do lead).
 */
async function removeTerminalJob(
  queue: NonNullable<typeof bitrixOutboundQueue>,
  jobId: string,
): Promise<void> {
  const existing = await queue.getJob(jobId);
  if (!existing) return;
  const state = await existing.getState();
  if (state === 'completed' || state === 'failed') {
    await existing
      .remove()
      .catch((err) =>
        logger.warn(
          { err, jobId },
          '[bitrix] Falha ao remover job terminal antes de re-enfileirar push',
        ),
      );
  }
}

export function createBitrixOutboundWorker() {
  const worker = new Worker<BitrixOutboundJobData>(
    BITRIX_OUTBOUND_QUEUE_NAME,
    async (job: Job<BitrixOutboundJobData>) => {
      const { organizationId, leadId } = job.data;
      logger.info({ jobId: job.id, organizationId, leadId }, 'Processing bitrix outbound sync job');

      await requestContext.run({ tenantId: organizationId }, async () => {
        try {
          await pushLeadToBitrix(organizationId, leadId);
          logger.info({ organizationId, leadId }, 'Bitrix outbound job completed successfully');
        } catch (error: any) {
          logger.error({ err: error, jobId: job.id, leadId }, 'Bitrix outbound job failed');
          throw error;
        }
      });
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Bitrix outbound worker job permanently failed');
    if (!job || !isFinalAttempt(job.attemptsMade, job.opts.attempts)) return;
    void recordDeadLetter({
      queue: BITRIX_OUTBOUND_QUEUE_NAME,
      jobId: job.id,
      jobName: job.name,
      organizationId: job.data?.organizationId ?? null,
      attemptsMade: job.attemptsMade,
      error: err,
      data: job.data,
    });
  });

  worker.on('completed', () => recordQueueJobCompleted(BITRIX_OUTBOUND_QUEUE_NAME));

  return worker;
}

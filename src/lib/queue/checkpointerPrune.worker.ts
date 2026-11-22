import { Queue, Worker } from 'bullmq';
import { Pool } from 'pg';
import { env } from '../../config/env.js';
import { checkpointer } from '../ai/checkpointer.js';
import { logger } from '../logger.js';
import { connection, queuesEnabled } from './redis.js';

export const CHECKPOINTER_PRUNE_QUEUE_NAME = 'checkpointer-prune';

export const checkpointerPruneQueue = queuesEnabled
  ? new Queue(CHECKPOINTER_PRUNE_QUEUE_NAME, { connection })
  : null;

if (checkpointerPruneQueue) {
  checkpointerPruneQueue.on('error', (err) =>
    logger.warn({ message: err.message }, 'checkpointerPruneQueue offline'),
  );
}

const PRUNE_EVERY_MS = 24 * 60 * 60 * 1000; // 1 day
const THREAD_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createCheckpointerPruneWorker(): Worker | null {
  if (!queuesEnabled) return null;

  const worker = new Worker(
    CHECKPOINTER_PRUNE_QUEUE_NAME,
    async () => {
      logger.info('Starting LangGraph checkpointer prune job...');
      const pool = new Pool({
        connectionString: env.DATABASE_URL || process.env.DATABASE_URL || '',
      });

      try {
        const client = await pool.connect();
        try {
          // A tabela de checkpoints gerada pelo PostgresSaver do LangGraph
          const res = await client.query('SELECT DISTINCT thread_id FROM checkpoints');
          let deletedCount = 0;
          const cutoffDate = Date.now() - THREAD_MAX_AGE_MS;

          for (const row of res.rows) {
            const threadId = row.thread_id as string;
            // thread_id geralmente est no formato 'organizationId:session-agentType-1700000000000'
            const match = threadId.match(/-(\d{13})$/);
            if (match) {
              const ts = parseInt(match[1], 10);
              if (ts < cutoffDate) {
                await checkpointer.deleteThread(threadId);
                deletedCount++;
              }
            }
          }

          logger.info(`Pruned ${deletedCount} old LangGraph threads.`);
        } finally {
          client.release();
        }
      } catch (error) {
        logger.error({ err: error }, 'Failed to prune checkpointer');
        throw error;
      } finally {
        await pool.end();
      }
    },
    { connection, concurrency: 1 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'LangGraph checkpointer prune job failed');
  });

  return worker;
}

export async function scheduleCheckpointerPrune(): Promise<void> {
  if (!checkpointerPruneQueue) return;

  await checkpointerPruneQueue.upsertJobScheduler(
    'checkpointer-prune-scheduler',
    { every: PRUNE_EVERY_MS },
    {
      name: 'run-checkpointer-prune',
      opts: {
        removeOnComplete: true,
        attempts: 1,
      },
    },
  );
}

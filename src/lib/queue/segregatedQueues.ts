import { Queue, type QueueOptions } from 'bullmq';
import { logger } from '../logger.js';
import { registerQueueForMetrics } from './metrics.js';
import { connection, queuesEnabled } from './redis.js';

/**
 * Segregação de Filas BullMQ — Agente 23 (Pina)
 *
 * Separação física e lógica de cargas de trabalho críticas vs massivas:
 * 1. `critical-mail`: emails transacionais de alta prioridade (recuperação de senha, 2FA, alertas críticos).
 *    Configuração: alta prioridade, retry agressivo rápido (backoff exponencial 2s), baixa retenção.
 * 2. `batch-reports`: relatórios analíticos, exportações CSV massivas, BI e dumps de dados.
 *    Configuração: baixa prioridade, limites de taxa de execução para proteger memória e CPU, isolada
 *    para NUNCA bloquear ou postergar a fila crítica.
 */

export const CRITICAL_MAIL_QUEUE_NAME = 'critical-mail';
export const BATCH_REPORTS_QUEUE_NAME = 'batch-reports';

const criticalMailOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
};

const batchReportsOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 15_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { age: 3 * 24 * 3600 },
  },
};

export const criticalMailQueue = queuesEnabled
  ? new Queue(CRITICAL_MAIL_QUEUE_NAME, criticalMailOptions)
  : null;

export const batchReportsQueue = queuesEnabled
  ? new Queue(BATCH_REPORTS_QUEUE_NAME, batchReportsOptions)
  : null;

if (criticalMailQueue) {
  registerQueueForMetrics(CRITICAL_MAIL_QUEUE_NAME, criticalMailQueue);
  criticalMailQueue.on('error', (err) =>
    logger.warn({ err: err.message }, 'criticalMailQueue offline ou erro de conexão'),
  );
}

if (batchReportsQueue) {
  registerQueueForMetrics(BATCH_REPORTS_QUEUE_NAME, batchReportsQueue);
  batchReportsQueue.on('error', (err) =>
    logger.warn({ err: err.message }, 'batchReportsQueue offline ou erro de conexão'),
  );
}

export interface EnqueueCriticalMailInput {
  organizationId: string;
  to: string;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
  priority?: number;
}

export interface EnqueueBatchReportInput {
  organizationId: string;
  reportType: string;
  requestedByUserId: string;
  parameters: Record<string, unknown>;
}

export async function enqueueCriticalMail(data: EnqueueCriticalMailInput): Promise<string | null> {
  if (!criticalMailQueue) {
    logger.warn({ to: data.to, subject: data.subject }, 'Filas desabilitadas; critical mail ignorado');
    return null;
  }
  const job = await criticalMailQueue.add('send-critical-mail', data, {
    priority: data.priority ?? 1,
  });
  return job.id ?? null;
}

export async function enqueueBatchReport(data: EnqueueBatchReportInput): Promise<string | null> {
  if (!batchReportsQueue) {
    logger.warn(
      { reportType: data.reportType, userId: data.requestedByUserId },
      'Filas desabilitadas; batch report ignorado',
    );
    return null;
  }
  const job = await batchReportsQueue.add('generate-batch-report', data, {
    priority: 10, // Menor prioridade relativa
  });
  return job.id ?? null;
}

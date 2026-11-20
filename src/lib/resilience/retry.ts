/**
 * Webhook Resilience & Dead Letter Queue (DLQ) Engine
 * Requisito Ivo (Squad 20 - Agente 24)
 *
 * Implementa política de retries com backoff exponencial e Dead Letter Queue (DLQ) no BullMQ.
 * Webhooks de pagamentos que falham repetidamente são encaminhados para a DLQ após a 5ª tentativa,
 * emitindo evento de alerta crítico para investigação do time financeiro/SRE.
 */

import type { Job, Queue } from 'bullmq';
import { logger } from '../logger.js';

export const MAX_WEBHOOK_RETRIES = 5;
export const PAYMENT_WEBHOOK_DLQ_NAME = 'payment-webhooks-dlq';

export interface WebhookDlqEntry<T = unknown> {
  originalJobId: string;
  queueName: string;
  data: T;
  attemptsMade: number;
  reason: 'max_retries_exceeded' | 'unrecoverable_failure';
  errorMessage: string;
  failedAt: string;
}

export interface WebhookExecutionResult<T = unknown> {
  success: boolean;
  attemptsMade: number;
  sentToDlq: boolean;
  dlqEntry?: WebhookDlqEntry<T>;
  error?: string;
}

/**
 * Processa um job de webhook com tolerância a falhas e encaminhamento para DLQ na 5ª falha.
 */
export async function executeWebhookJobWithDlq<T>(
  job: Pick<Job<T>, 'id' | 'data' | 'attemptsMade' | 'queueName'>,
  handler: (data: T) => Promise<void>,
  dlqQueue?: Pick<Queue, 'add'>,
): Promise<WebhookExecutionResult<T>> {
  const attempts = job.attemptsMade + 1;

  try {
    await handler(job.data);
    return {
      success: true,
      attemptsMade: attempts,
      sentToDlq: false,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Se ainda não atingiu o limite de 5 tentativas, relança para o BullMQ aplicar backoff
    if (attempts < MAX_WEBHOOK_RETRIES) {
      logger.warn(
        { jobId: job.id, attemptsMade: attempts, maxRetries: MAX_WEBHOOK_RETRIES, err },
        'WebhookResilience: Falha transitória em webhook de pagamento. Agendando retry com backoff.',
      );
      throw err;
    }

    // Atingiu 5 falhas: Encaminhar para Dead Letter Queue (DLQ)
    const dlqEntry: WebhookDlqEntry<T> = {
      originalJobId: job.id ?? 'unknown',
      queueName: job.queueName ?? 'unknown',
      data: job.data,
      attemptsMade: attempts,
      reason: 'max_retries_exceeded',
      errorMessage,
      failedAt: new Date().toISOString(),
    };

    logger.fatal(
      { jobId: job.id, attemptsMade: attempts, dlqEntry },
      'CRITICAL_ALERT [Ivo]: Webhook de pagamento falhou 5 vezes consecutivas. Encaminhado para a DLQ!',
    );

    if (dlqQueue) {
      await dlqQueue.add('dead-letter-webhook', dlqEntry);
    }

    return {
      success: false,
      attemptsMade: attempts,
      sentToDlq: true,
      dlqEntry,
      error: errorMessage,
    };
  }
}

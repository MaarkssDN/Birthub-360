import { type Job, UnrecoverableError, Worker } from 'bullmq';
import {
  initWhatsApp,
  logoutWhatsApp,
  sendWhatsAppMessage,
} from '../../features/integrations/whatsapp/whatsapp.service.js';
import { logger } from '../logger.js';
import { isFinalAttempt, recordDeadLetter } from './deadLetter.js';
import { recordQueueDlqMessage, recordQueueJobCompleted } from './metrics.js';
import { connection } from './redis.js';
import {
  enqueueWhatsAppDlq,
  WHATSAPP_COMMAND_QUEUE_NAME,
  type WhatsAppCommand,
} from './whatsappCommand.queue.js';

const PERMANENT_HTTP_STATUS_CODES = new Set([400, 401, 403, 404, 410, 422]);
const PERMANENT_ERROR_PATTERNS = [
  /n[aã]o est[aá] registrado no whatsapp/i,
  /optou por n[aã]o receber mensagens/i,
  /opt-out registrado/i,
  /invalid.*number/i,
  /number.*blocked/i,
  /n[uú]mero.*inv[aá]lido/i,
  /n[uú]mero.*bloqueado/i,
];

/**
 * Determina se um erro de envio no WhatsApp é permanente (ex.: HTTP 400/404/422, número
 * inválido/inexistente no WhatsApp, opt-out do destinatário) ou transiente (timeout, 5xx,
 * sessão reconectando). Erros permanentes não devem ser retentados no worker.
 */
export function isPermanentWhatsAppError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof UnrecoverableError) return true;

  const candidate = err as {
    statusCode?: number;
    status?: number;
    code?: string | number;
    isPermanent?: boolean;
    message?: string;
    output?: { statusCode?: number };
  };

  if (candidate.isPermanent === true) return true;

  const statusCode = candidate.statusCode ?? candidate.status ?? candidate.output?.statusCode;

  if (typeof statusCode === 'number' && PERMANENT_HTTP_STATUS_CODES.has(statusCode)) {
    return true;
  }

  const message = typeof candidate.message === 'string' ? candidate.message : String(err);

  return PERMANENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export async function processWhatsAppCommandJob(job: Job<WhatsAppCommand>): Promise<void> {
  const command = job.data;
  try {
    switch (command.type) {
      case 'connect':
        await initWhatsApp(command.organizationId);
        return;
      case 'disconnect':
        await logoutWhatsApp(command.organizationId);
        return;
      case 'send':
        await sendWhatsAppMessage(
          command.organizationId,
          command.number,
          command.text,
          command.buttons,
          { ...command.context, fromWorker: true },
        );
        return;
    }
  } catch (err) {
    if (isPermanentWhatsAppError(err)) {
      const msg = err instanceof Error ? err.message : String(err);
      const unrecoverable = new UnrecoverableError(msg);
      if (err instanceof Error && err.stack) {
        unrecoverable.stack = err.stack;
      }
      throw unrecoverable;
    }
    throw err;
  }
}

export async function handleWhatsAppJobFailure(
  job: Job<WhatsAppCommand> | undefined,
  err: Error,
): Promise<void> {
  if (!job) return;
  const permanent = isPermanentWhatsAppError(err);
  const finalAttempt = isFinalAttempt(job.attemptsMade, job.opts.attempts);

  if (!permanent && !finalAttempt) return;

  const reason = permanent ? 'permanent' : 'max_retries_exceeded';

  logger.error(
    { err, jobId: job.id, command: job.name, reason, attemptsMade: job.attemptsMade },
    'WhatsApp command moved to DLQ',
  );

  recordQueueDlqMessage(WHATSAPP_COMMAND_QUEUE_NAME, reason);

  await Promise.allSettled([
    recordDeadLetter({
      queue: WHATSAPP_COMMAND_QUEUE_NAME,
      jobId: job.id,
      jobName: job.name,
      organizationId: job.data.organizationId,
      attemptsMade: job.attemptsMade,
      correlationId: job.data.correlationId,
      error: err,
      data: job.data,
    }),
    enqueueWhatsAppDlq({
      originalJobId: job.id,
      jobName: job.name,
      organizationId: job.data.organizationId,
      correlationId: job.data.correlationId,
      attemptsMade: job.attemptsMade,
      reason,
      errorMessage: err.message,
      command: job.data,
      failedAt: new Date().toISOString(),
    }),
  ]);
}

export function createWhatsAppCommandWorker(): Worker<WhatsAppCommand> {
  const worker = new Worker<WhatsAppCommand>(
    WHATSAPP_COMMAND_QUEUE_NAME,
    processWhatsAppCommandJob,
    { connection, concurrency: 4 },
  );

  worker.on('completed', () => recordQueueJobCompleted(WHATSAPP_COMMAND_QUEUE_NAME));
  worker.on('failed', (job, err) => {
    void handleWhatsAppJobFailure(job, err);
  });

  return worker;
}

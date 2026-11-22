import { Redis } from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { createAuditLog } from '../repositories/auditLogRepository.js';
import { logger } from '../../../lib/logger.js';
import { getRedisUrl, getRedisRetryStrategy } from '../lib/env.js';

const redisUrl = getRedisUrl();
// BullMQ requires maxRetriesPerRequest: null on its connection; enqueue failures are still caught
// below so a Redis outage degrades to "audit log skipped" rather than blocking the request path.
// retryStrategy caps reconnect attempts at 10s apart so a real outage doesn't log-storm.
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  connectTimeout: 2000,
  retryStrategy: getRedisRetryStrategy(),
});
connection.on('error', (err) => logger.error({ err }, 'Audit Redis connection error'));

const auditQueue = new Queue('auditLogs', { connection });

new Worker(
  'auditLogs',
  async (job) => {
    await createAuditLog(job.data);
  },
  { connection },
);

export function writeAuditLog(
  organizationId: string | undefined,
  userId: string | undefined,
  action: string,
  details: unknown,
) {
  // AuditLog.tenantId é NOT NULL no schema canônico — sem organizationId não existe linha
  // válida para gravar (e a RLS falharia fechado de qualquer forma). Pular o enqueue aqui é
  // mais honesto que enfileirar um job condenado a falhar; o warning mantém o evento observável.
  if (!organizationId) {
    logger.warn({ action, userId }, 'writeAuditLog ignorado: organizationId ausente');
    return;
  }
  auditQueue
    .add(
      'log',
      { organizationId, userId, action, details },
      { removeOnComplete: true, removeOnFail: 100 },
    )
    .catch((err) => logger.error({ err }, 'Audit queue enqueue failure'));
}

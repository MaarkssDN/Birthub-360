import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';

export interface RetentionPolicy {
  aiLogDays: number;
  syncLogDays: number;
  auditLogDays: number;
}

export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  aiLogDays: 90,
  syncLogDays: 60,
  auditLogDays: 365,
};

export interface PurgeOptions {
  organizationId?: string;
  policy?: Partial<RetentionPolicy>;
  batchSize?: number;
  sleepBetweenBatchesMs?: number;
  now?: Date;
}

export interface PurgeResult {
  deletedAILogs: number;
  deletedBitrixSyncLogs: number;
  deletedExternalCrmSyncLogs: number;
  batchesExecuted: number;
  durationMs: number;
  cutoffDates: {
    aiLog: Date;
    syncLog: Date;
    auditLog: Date;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Serviço de Purga e Retenção Assíncrona de Logs (DIV-AGENTE-01A-002)
 *
 * Executa deleções em fatias delimitadas (`batchSize`), intercaladas com pequenas pausas
 * (`sleepBetweenBatchesMs`), evitando contenda de lock em disco e preservando a capacidade
 * de inserções concorrentes do sistema durante a janela noturna de manutenção.
 */
export async function executeRetentionPurge(options: PurgeOptions = {}): Promise<PurgeResult> {
  const startTime = Date.now();
  const now = options.now ?? new Date();
  const batchSize = Math.max(10, Math.min(options.batchSize ?? 500, 5000));
  const sleepMs = options.sleepBetweenBatchesMs ?? 50;

  const policy: RetentionPolicy = {
    ...DEFAULT_RETENTION_POLICY,
    ...options.policy,
  };

  const aiCutoff = new Date(now.getTime() - policy.aiLogDays * 24 * 60 * 60 * 1000);
  const syncCutoff = new Date(now.getTime() - policy.syncLogDays * 24 * 60 * 60 * 1000);
  const auditCutoff = new Date(now.getTime() - policy.auditLogDays * 24 * 60 * 60 * 1000);

  let deletedAILogs = 0;
  let deletedBitrixSyncLogs = 0;
  let deletedExternalCrmSyncLogs = 0;
  let batchesExecuted = 0;

  // 1. Purga de AILog em batches
  try {
    let hasMore = true;
    while (hasMore) {
      const records = await prisma.aILog.findMany({
        where: {
          createdAt: { lt: aiCutoff },
          ...(options.organizationId ? { organizationId: options.organizationId } : {}),
        },
        select: { id: true },
        take: batchSize,
      });

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      const ids = records.map((r) => r.id);
      const deleteResult = await prisma.aILog.deleteMany({
        where: { id: { in: ids } },
      });

      deletedAILogs += deleteResult.count;
      batchesExecuted++;

      if (records.length < batchSize) {
        hasMore = false;
      } else if (sleepMs > 0) {
        await sleep(sleepMs);
      }
    }
  } catch (err) {
    logger.warn({ err }, '[retentionPurge] Falha na purga de AILog');
  }

  // 2. Purga de BitrixSyncLog em batches
  try {
    let hasMore = true;
    while (hasMore) {
      const records = await prisma.bitrixSyncLog.findMany({
        where: {
          createdAt: { lt: syncCutoff },
          ...(options.organizationId ? { organizationId: options.organizationId } : {}),
        },
        select: { id: true },
        take: batchSize,
      });

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      const ids = records.map((r) => r.id);
      const deleteResult = await prisma.bitrixSyncLog.deleteMany({
        where: { id: { in: ids } },
      });

      deletedBitrixSyncLogs += deleteResult.count;
      batchesExecuted++;

      if (records.length < batchSize) {
        hasMore = false;
      } else if (sleepMs > 0) {
        await sleep(sleepMs);
      }
    }
  } catch (err) {
    logger.warn({ err }, '[retentionPurge] Falha na purga de BitrixSyncLog');
  }

  // 3. Purga de ExternalCrmSyncLog em batches
  try {
    let hasMore = true;
    while (hasMore) {
      const records = await prisma.externalCrmSyncLog.findMany({
        where: {
          createdAt: { lt: syncCutoff },
          ...(options.organizationId ? { organizationId: options.organizationId } : {}),
        },
        select: { id: true },
        take: batchSize,
      });

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      const ids = records.map((r) => r.id);
      const deleteResult = await prisma.externalCrmSyncLog.deleteMany({
        where: { id: { in: ids } },
      });

      deletedExternalCrmSyncLogs += deleteResult.count;
      batchesExecuted++;

      if (records.length < batchSize) {
        hasMore = false;
      } else if (sleepMs > 0) {
        await sleep(sleepMs);
      }
    }
  } catch (err) {
    logger.warn({ err }, '[retentionPurge] Falha na purga de ExternalCrmSyncLog');
  }

  const durationMs = Date.now() - startTime;

  logger.info(
    {
      deletedAILogs,
      deletedBitrixSyncLogs,
      deletedExternalCrmSyncLogs,
      batchesExecuted,
      durationMs,
      organizationId: options.organizationId ?? 'all',
    },
    '[retentionPurge] Ciclo de purga concluído com sucesso.',
  );

  return {
    deletedAILogs,
    deletedBitrixSyncLogs,
    deletedExternalCrmSyncLogs,
    batchesExecuted,
    durationMs,
    cutoffDates: {
      aiLog: aiCutoff,
      syncLog: syncCutoff,
      auditLog: auditCutoff,
    },
  };
}

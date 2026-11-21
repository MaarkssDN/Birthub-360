export interface RetentionBatchDeletionPort {
  deleteExpiredChunk(params: {
    tenantId: string;
    cutoffDate: Date;
    limit: number;
  }): Promise<number>;
}

export const DEFAULT_RETENTION_BATCH_SIZE = 250;
export const DEFAULT_RETENTION_PAUSE_MS = 500;

export async function runPartitionedRetentionCleanupJob(params: {
  tenantId: string;
  cutoffDate: Date;
  batchSize?: number;
  pauseMs?: number;
  maxBatches?: number;
  port: RetentionBatchDeletionPort;
  sleepFn?: (ms: number) => Promise<void>;
}): Promise<{ totalDeleted: number; batchesExecuted: number; pausesApplied: number }> {
  if (!params.tenantId?.trim()) {
    throw new Error('tenantId é obrigatório no job de retenção e expurgo.');
  }
  const batchSize = Math.min(Math.max(1, params.batchSize ?? DEFAULT_RETENTION_BATCH_SIZE), 2_000);
  const pauseMs = Math.max(0, params.pauseMs ?? DEFAULT_RETENTION_PAUSE_MS);
  const maxBatches = Math.max(1, params.maxBatches ?? 100);
  const sleep =
    params.sleepFn ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  let totalDeleted = 0;
  let batchesExecuted = 0;
  let pausesApplied = 0;

  while (batchesExecuted < maxBatches) {
    const deletedInBatch = await params.port.deleteExpiredChunk({
      tenantId: params.tenantId,
      cutoffDate: params.cutoffDate,
      limit: batchSize,
    });
    batchesExecuted += 1;
    totalDeleted += deletedInBatch;

    if (deletedInBatch < batchSize) {
      break;
    }

    if (batchesExecuted < maxBatches && pauseMs > 0) {
      await sleep(pauseMs);
      pausesApplied += 1;
    }
  }

  return { totalDeleted, batchesExecuted, pausesApplied };
}

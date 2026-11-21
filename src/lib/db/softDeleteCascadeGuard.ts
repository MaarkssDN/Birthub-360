export interface SoftDeleteMetadata {
  deletedAt: Date;
  deletedBy: string;
  deleteReason: string;
}

export interface SoftDeleteBatchPort {
  softDeleteActivitiesByLead(params: {
    tenantId: string;
    leadId: string;
    meta: SoftDeleteMetadata;
    batchSize: number;
  }): Promise<number>;
  softDeleteTimelineByLead(params: {
    tenantId: string;
    leadId: string;
    meta: SoftDeleteMetadata;
    batchSize: number;
  }): Promise<number>;
  softDeleteLead(params: {
    tenantId: string;
    leadId: string;
    meta: SoftDeleteMetadata;
  }): Promise<boolean>;
}

export const DEFAULT_SOFT_DELETE_BATCH_SIZE = 500;

/**
 * [11 · Pietro] Evita locks exclusivos severos causados por `ON DELETE CASCADE` em tabelas
 * volumosas (`Activity`, `TimelineEvent`) aplicando soft-delete paginado/em lote antes da
 * desativação da entidade pai (`Lead`).
 */
export async function executeSafeLeadSoftDelete(params: {
  tenantId: string;
  leadId: string;
  deletedBy: string;
  deleteReason?: string;
  batchSize?: number;
  port: SoftDeleteBatchPort;
  now?: Date;
}): Promise<{
  leadSoftDeleted: boolean;
  activitiesArchivedCount: number;
  timelineEventsArchivedCount: number;
}> {
  if (!params.tenantId?.trim() || !params.leadId?.trim()) {
    throw new Error('tenantId e leadId são obrigatórios para soft delete seguro.');
  }
  if (!params.deletedBy?.trim()) {
    throw new Error('deletedBy é obrigatório para rastreabilidade de auditoria no soft delete.');
  }

  const meta: SoftDeleteMetadata = {
    deletedAt: params.now ?? new Date(),
    deletedBy: params.deletedBy.trim(),
    deleteReason: params.deleteReason?.trim() || 'SOFT_DELETE_CASCADE_PREVENTION',
  };
  const batchSize = Math.min(Math.max(1, params.batchSize ?? DEFAULT_SOFT_DELETE_BATCH_SIZE), 5000);

  const activitiesArchivedCount = await params.port.softDeleteActivitiesByLead({
    tenantId: params.tenantId,
    leadId: params.leadId,
    meta,
    batchSize,
  });

  const timelineEventsArchivedCount = await params.port.softDeleteTimelineByLead({
    tenantId: params.tenantId,
    leadId: params.leadId,
    meta,
    batchSize,
  });

  const leadSoftDeleted = await params.port.softDeleteLead({
    tenantId: params.tenantId,
    leadId: params.leadId,
    meta,
  });

  return {
    leadSoftDeleted,
    activitiesArchivedCount,
    timelineEventsArchivedCount,
  };
}

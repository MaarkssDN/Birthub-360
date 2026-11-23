export interface AsyncLeadScoringJobPayload {
  tenantId: string;
  leadId: string;
  idempotencyKey: string;
  triggeredAt: string;
}

export interface LeadScoringQueueProducerPort {
  enqueue(
    jobName: 'calculate-lead-score',
    payload: AsyncLeadScoringJobPayload,
  ): Promise<{
    jobId: string;
  }>;
}

export async function enqueueAsyncLeadScoringOnCreation(params: {
  tenantId: string;
  leadId: string;
  queue: LeadScoringQueueProducerPort;
  now?: Date;
}): Promise<{ queued: true; jobId: string; idempotencyKey: string }> {
  if (!params.tenantId?.trim() || !params.leadId?.trim()) {
    throw new Error('tenantId e leadId são obrigatórios para enfileirar cálculo de Lead Scoring.');
  }
  const idempotencyKey = `lead-score:${params.tenantId.trim()}:${params.leadId.trim()}`;
  const { jobId } = await params.queue.enqueue('calculate-lead-score', {
    tenantId: params.tenantId.trim(),
    leadId: params.leadId.trim(),
    idempotencyKey,
    triggeredAt: (params.now ?? new Date()).toISOString(),
  });

  return {
    queued: true,
    jobId,
    idempotencyKey,
  };
}

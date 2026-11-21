export interface DealRecord {
  id: string;
  tenantId: string;
  title: string;
  stageId: string;
  valueCents: number;
  version: number;
  updatedAt: Date;
}

export interface DealUpdatePatch {
  title?: string;
  stageId?: string;
  valueCents?: number;
}

export interface DealRepositoryPort {
  findById(tenantId: string, dealId: string): Promise<DealRecord | null>;
  /**
   * Atualiza o deal atomicamente somente se `id`, `tenantId` e `version === expectedVersion`
   * coincidirem, incrementando `version` em +1 (`version: { increment: 1 }`).
   * Retorna o registro atualizado ou `null` quando a versão não bate (concorrência detectada).
   */
  updateIfVersionMatches(params: {
    tenantId: string;
    dealId: string;
    expectedVersion: number;
    patch: DealUpdatePatch;
  }): Promise<DealRecord | null>;
  runInTransaction<T>(fn: (txRepo: DealRepositoryPort) => Promise<T>): Promise<T>;
}

export class OptimisticLockConflictError extends Error {
  readonly code = 'OPTIMISTIC_LOCK_CONFLICT';
  readonly dealId: string;
  readonly expectedVersion: number;

  constructor(dealId: string, expectedVersion: number) {
    super(
      `Conflito de concorrência ao atualizar o Deal "${dealId}" (expectedVersion=${expectedVersion}). Recarregue os dados antes de tentar novamente.`,
    );
    this.name = 'OptimisticLockConflictError';
    this.dealId = dealId;
    this.expectedVersion = expectedVersion;
  }
}

export class DealsService {
  constructor(private readonly repo: DealRepositoryPort) {}

  async updateDealWithOptimisticLock(params: {
    tenantId: string;
    dealId: string;
    expectedVersion: number;
    patch: DealUpdatePatch;
  }): Promise<DealRecord> {
    if (!params.tenantId?.trim()) {
      throw new Error('tenantId é obrigatório para atualizar um Deal.');
    }
    if (!Number.isInteger(params.expectedVersion) || params.expectedVersion < 1) {
      throw new Error('expectedVersion deve ser um inteiro positivo (>= 1).');
    }

    const updated = await this.repo.updateIfVersionMatches(params);
    if (!updated) {
      throw new OptimisticLockConflictError(params.dealId, params.expectedVersion);
    }
    return updated;
  }

  async batchUpdateDealStagesAtomically(params: {
    tenantId: string;
    targetStageId: string;
    deals: readonly { dealId: string; expectedVersion: number }[];
  }): Promise<DealRecord[]> {
    if (!params.tenantId?.trim()) {
      throw new Error('tenantId é obrigatório para atualização em lote de Deals.');
    }
    return this.repo.runInTransaction(async (txRepo) => {
      const results: DealRecord[] = [];
      for (const item of params.deals) {
        const updated = await txRepo.updateIfVersionMatches({
          tenantId: params.tenantId,
          dealId: item.dealId,
          expectedVersion: item.expectedVersion,
          patch: { stageId: params.targetStageId },
        });
        if (!updated) {
          throw new OptimisticLockConflictError(item.dealId, item.expectedVersion);
        }
        results.push(updated);
      }
      return results;
    });
  }
}

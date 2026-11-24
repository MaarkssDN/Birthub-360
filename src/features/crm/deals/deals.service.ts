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

export class InvalidDealPatchError extends Error {
  readonly code = 'INVALID_DEAL_PATCH';

  constructor(reason: string) {
    super(`Patch de Deal inválido: ${reason}`);
    this.name = 'InvalidDealPatchError';
  }
}

function assertValidDealPatch(patch: DealUpdatePatch): void {
  const keys = Object.keys(patch).filter(
    (k) => (patch as Record<string, unknown>)[k] !== undefined,
  );
  if (keys.length === 0) {
    // Patch vazio não deve queimar um incremento de `version` nem gravar no-op.
    throw new InvalidDealPatchError('o patch não pode ser vazio.');
  }
  if (patch.title !== undefined && (!patch.title.trim() || patch.title.length > 500)) {
    throw new InvalidDealPatchError('title deve ser uma string não vazia (máx. 500 caracteres).');
  }
  if (patch.stageId !== undefined && !patch.stageId.trim()) {
    throw new InvalidDealPatchError('stageId deve ser uma string não vazia quando informado.');
  }
  if (
    patch.valueCents !== undefined &&
    (!Number.isInteger(patch.valueCents) || patch.valueCents < 0)
  ) {
    throw new InvalidDealPatchError('valueCents deve ser um inteiro >= 0 (centavos).');
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
    if (!params.dealId?.trim()) {
      throw new Error('dealId é obrigatório para atualizar um Deal.');
    }
    if (!Number.isInteger(params.expectedVersion) || params.expectedVersion < 1) {
      throw new Error('expectedVersion deve ser um inteiro positivo (>= 1).');
    }
    assertValidDealPatch(params.patch);

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
    if (!params.targetStageId?.trim()) {
      throw new Error('targetStageId é obrigatório para atualização em lote de Deals.');
    }
    if (!Array.isArray(params.deals) || params.deals.length === 0) {
      throw new Error('A lista de deals para atualização em lote não pode ser vazia.');
    }
    // dealId duplicado na mesma leva faria a 2ª tentativa falhar com
    // OptimisticLockConflictError (a versão já foi incrementada pela 1ª) — erro enganoso
    // para o que é um defeito de entrada do cliente. Detectar antes de abrir a transação.
    const seen = new Set<string>();
    for (const item of params.deals) {
      if (!item.dealId?.trim()) {
        throw new Error('dealId é obrigatório em cada item do lote de Deals.');
      }
      if (seen.has(item.dealId)) {
        throw new InvalidDealPatchError(
          `dealId "${item.dealId}" aparece duplicado na atualização em lote.`,
        );
      }
      seen.add(item.dealId);
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

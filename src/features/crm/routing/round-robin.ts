export interface SalesRepCandidate {
  id: string;
  name: string;
  active: boolean;
  onVacation: boolean;
}

export interface WeightedSalesRepCandidate extends SalesRepCandidate {
  /**
   * Peso de conversão ou performance (1 a 5, default 1).
   * Vendedores seniores ou com maior taxa de conversão recebem peso maior para leads quentes.
   */
  performanceWeight?: number;
}

export function assignLeadRoundRobinAvailableOnly(params: {
  candidates: readonly SalesRepCandidate[];
  lastAssignedIndex: number;
}): { assignedRep: SalesRepCandidate; nextIndex: number } {
  const available = params.candidates.filter((c) => c.active && !c.onVacation);
  if (available.length === 0) {
    throw new Error(
      'Nenhum vendedor ativo e disponível (fora de férias) para atribuição round-robin.',
    );
  }
  const nextIndex = (params.lastAssignedIndex + 1) % available.length;
  return {
    assignedRep: available[nextIndex],
    nextIndex,
  };
}

/**
 * Trilha C.2 (Squad 40 — CRM & Pipeline / Agentes 44 Lola & 47 Dante).
 * Distribuição inteligente de leads com base no score/temperatura do lead em tempo real:
 * - Leads quentes (score >= 75) são distribuídos em round-robin entre os closers de alta performance (peso >= 2).
 * - Caso não haja top performers disponíveis ou o lead tenha score padrão, distribui entre todos os closers disponíveis.
 */
export function assignLeadWeightedByScore(params: {
  candidates: readonly WeightedSalesRepCandidate[];
  leadScore: number;
  lastAssignedIndex: number;
}): { assignedRep: WeightedSalesRepCandidate; nextIndex: number } {
  const available = params.candidates.filter((c) => c.active && !c.onVacation);
  if (available.length === 0) {
    throw new Error(
      'Nenhum vendedor ativo e disponível (fora de férias) para atribuição round-robin.',
    );
  }

  if (params.leadScore >= 75) {
    const topPerformers = available.filter((c) => (c.performanceWeight ?? 1) >= 2);
    if (topPerformers.length > 0) {
      const nextIndex = (params.lastAssignedIndex + 1) % topPerformers.length;
      return {
        assignedRep: topPerformers[nextIndex],
        nextIndex,
      };
    }
  }

  const nextIndex = (params.lastAssignedIndex + 1) % available.length;
  return {
    assignedRep: available[nextIndex],
    nextIndex,
  };
}

/**
 * Trilha de decisão retornada por `selectTenantRoundRobinDeterministic` — usada para
 * auditoria e para persistir o `nextCursor` no store do chamador (Redis INCR, DB etc.).
 * Não contém PII: apenas ids de candidatos e metadados da decisão.
 */
export interface TenantRoutingDecision {
  /** Id do candidato selecionado. */
  assignedRepId: string;
  /** Cursor a ser persistido pelo chamador para a próxima atribuição deste tenant. */
  nextCursor: number;
  /** Offset determinístico derivado do tenantId (descorrelaciona tenants distintos). */
  tenantOffset: number;
  /** Ids dos candidatos elegíveis na ordem canônica (ordenados por id). */
  eligibleRepIds: readonly string[];
  /** Motivo legível da decisão, para trilha de auditoria. */
  reason: string;
}

/**
 * Hash estável (FNV-1a 32-bit) de uma string. Determinístico entre processos e
 * plataformas — usado apenas para derivar um offset de partição por tenant.
 */
function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Round-robin determinístico escopado por tenant (SQUAD40-47-ROUTING).
 *
 * Propriedades:
 * - **Determinístico**: mesma `(tenantId, cursor, conjunto de candidatos)` sempre
 *   produz o mesmo candidato, independentemente da ordem do array de entrada
 *   (ordenação canônica por `id`).
 * - **Sem estado global**: a função é pura; o cursor é injetado e devolvido em
 *   `nextCursor`. Persistência/concorrência ficam a cargo do chamador (ex.:
 *   `INCR roundrobin:<tenant>:cursor` em Redis, como em `leadAssignment.service.ts`).
 * - **Descorrelacionado por tenant**: `tenantOffset = stableHash(tenantId) % n`
 *   faz tenants distintos começarem em pontos diferentes do rodízio, sem estado
 *   compartilhado.
 * - **Distribuição equilibrada**: `cursor` conta as atribuições já realizadas
 *   (0 = nenhuma). Como `cursor` incrementa de 1 em 1, em `n` atribuições
 *   consecutivas cada elegível recebe exatamente 1 lead (±1 quando a
 *   disponibilidade muda entre chamadas — ver testes de redistribuição).
 *
 * Lança erro quando não há candidato `active && !onVacation` (ausência observável,
 * nunca atribuição silenciosa).
 */
export function selectTenantRoundRobinDeterministic(params: {
  tenantId: string;
  candidates: readonly SalesRepCandidate[];
  /** Quantidade de atribuições já realizadas pelo tenant (0 = primeira). */
  cursor: number;
}): TenantRoutingDecision {
  if (!Number.isInteger(params.cursor)) {
    throw new Error(`Cursor de roteamento inválido: ${params.cursor} (esperado inteiro).`);
  }
  if (params.tenantId.trim().length === 0) {
    throw new Error('tenantId é obrigatório para roteamento round-robin determinístico.');
  }

  // Ordem canônica por id: elimina dependência da ordem de chegada do array.
  const eligible = params.candidates
    .filter((c) => c.active && !c.onVacation)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  if (eligible.length === 0) {
    throw new Error(
      'Nenhum vendedor ativo e disponível (fora de férias) para atribuição round-robin.',
    );
  }

  const tenantOffset = stableHash(params.tenantId) % eligible.length;
  const index =
    (((params.cursor + tenantOffset) % eligible.length) + eligible.length) % eligible.length;
  const assigned = eligible[index];

  return {
    assignedRepId: assigned.id,
    nextCursor: params.cursor + 1,
    tenantOffset,
    eligibleRepIds: eligible.map((c) => c.id),
    reason: `round-robin tenant=${params.tenantId} cursor=${params.cursor} offset=${tenantOffset} eligible=${eligible.length}`,
  };
}

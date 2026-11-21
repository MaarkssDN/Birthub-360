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

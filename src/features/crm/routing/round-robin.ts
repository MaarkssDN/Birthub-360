export interface SalesRepCandidate {
  id: string;
  name: string;
  active: boolean;
  onVacation: boolean;
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

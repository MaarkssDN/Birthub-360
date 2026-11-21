import { describe, expect, it } from 'vitest';
import {
  assignLeadRoundRobinAvailableOnly,
  assignLeadWeightedByScore,
  type SalesRepCandidate,
  type WeightedSalesRepCandidate,
} from '../round-robin.js';

describe('Trilha C.2 — Round-Robin de Distribuição de Leads', () => {
  const candidates: readonly SalesRepCandidate[] = [
    { id: 'rep-1', name: 'Ana', active: true, onVacation: false },
    { id: 'rep-2', name: 'Carlos', active: true, onVacation: true }, // Férias
    { id: 'rep-3', name: 'Beatriz', active: false, onVacation: false }, // Inativo
    { id: 'rep-4', name: 'Daniel', active: true, onVacation: false },
  ];

  it('assignLeadRoundRobinAvailableOnly: ignora vendedores inativos ou de férias', () => {
    // Disponíveis: Ana (rep-1) e Daniel (rep-4)
    const first = assignLeadRoundRobinAvailableOnly({
      candidates,
      lastAssignedIndex: -1,
    });
    expect(first.assignedRep.id).toBe('rep-1');
    expect(first.nextIndex).toBe(0);

    const second = assignLeadRoundRobinAvailableOnly({
      candidates,
      lastAssignedIndex: first.nextIndex,
    });
    expect(second.assignedRep.id).toBe('rep-4');
    expect(second.nextIndex).toBe(1);

    const third = assignLeadRoundRobinAvailableOnly({
      candidates,
      lastAssignedIndex: second.nextIndex,
    });
    expect(third.assignedRep.id).toBe('rep-1');
    expect(third.nextIndex).toBe(0);
  });

  it('assignLeadRoundRobinAvailableOnly: lança erro se não houver vendedor disponível', () => {
    expect(() =>
      assignLeadRoundRobinAvailableOnly({
        candidates: [{ id: 'rep-x', name: 'X', active: false, onVacation: false }],
        lastAssignedIndex: 0,
      }),
    ).toThrow('Nenhum vendedor ativo e disponível');
  });

  describe('assignLeadWeightedByScore — roteamento ponderado por score', () => {
    const weightedCandidates: readonly WeightedSalesRepCandidate[] = [
      { id: 'rep-junior-1', name: 'Junior 1', active: true, onVacation: false, performanceWeight: 1 },
      { id: 'rep-senior-1', name: 'Senior 1', active: true, onVacation: false, performanceWeight: 3 }, // Top performer
      { id: 'rep-junior-2', name: 'Junior 2', active: true, onVacation: false, performanceWeight: 1 },
      { id: 'rep-senior-2', name: 'Senior 2', active: true, onVacation: false, performanceWeight: 2 }, // Top performer
    ];

    it('direciona leads quentes (score >= 75) para os top performers (peso >= 2)', () => {
      // Top performers: Senior 1 e Senior 2
      const first = assignLeadWeightedByScore({
        candidates: weightedCandidates,
        leadScore: 90,
        lastAssignedIndex: -1,
      });
      expect(first.assignedRep.id).toBe('rep-senior-1');

      const second = assignLeadWeightedByScore({
        candidates: weightedCandidates,
        leadScore: 80,
        lastAssignedIndex: first.nextIndex,
      });
      expect(second.assignedRep.id).toBe('rep-senior-2');
    });

    it('distribui leads normais (score < 75) entre todos os disponíveis', () => {
      // Todos os 4 disponíveis
      const first = assignLeadWeightedByScore({
        candidates: weightedCandidates,
        leadScore: 50,
        lastAssignedIndex: -1,
      });
      expect(first.assignedRep.id).toBe('rep-junior-1');

      const second = assignLeadWeightedByScore({
        candidates: weightedCandidates,
        leadScore: 40,
        lastAssignedIndex: first.nextIndex,
      });
      expect(second.assignedRep.id).toBe('rep-senior-1');
    });

    it('faz fallback para distribuição normal se não houver top performer disponível', () => {
      const juniorsOnly: readonly WeightedSalesRepCandidate[] = [
        { id: 'rep-j1', name: 'J1', active: true, onVacation: false, performanceWeight: 1 },
        { id: 'rep-j2', name: 'J2', active: true, onVacation: false, performanceWeight: 1 },
      ];

      const res = assignLeadWeightedByScore({
        candidates: juniorsOnly,
        leadScore: 95,
        lastAssignedIndex: -1,
      });
      expect(res.assignedRep.id).toBe('rep-j1');
    });
  });
});

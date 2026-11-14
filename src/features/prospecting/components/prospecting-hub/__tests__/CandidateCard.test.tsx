// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProspectCandidate } from '../../../services/prospecting.service.js';
import { CandidateCard } from '../CandidateCard.js';

vi.mock('../../../../lib/api.js', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../../lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));
vi.mock('../DecisionMakerSearch.js', () => ({
  DecisionMakerSearch: () => null,
}));

const baseCandidate: ProspectCandidate = {
  tradeName: 'Padaria Pão Quente',
  legalNameGuess: null,
  cnpjGuess: '12.345.678/0001-90',
  segment: 'Alimentação',
  size: 'Pequeno',
  location: 'São Paulo, SP',
  fitScoreEstimate: 60,
  suggestedContact: null,
  rationale: 'Perfil compatível com o ICP.',
};

function renderCard(candidate: ProspectCandidate) {
  return render(
    <CandidateCard
      candidate={candidate}
      onPromote={vi.fn()}
      isPromoting={false}
      promoted={false}
    />,
  );
}

describe('CandidateCard — badges de proveniência', () => {
  it('mostra CONFIRMADO para provenance reported e INFERIDO para estimated', () => {
    renderCard({
      ...baseCandidate,
      provenance: {
        cnpjGuess: {
          source: 'receita_federal',
          queriedAt: '2026-11-14T00:00:00.000Z',
          status: 'reported',
        },
        segment: {
          source: 'heuristica_portal',
          queriedAt: '2026-11-14T00:00:00.000Z',
          status: 'estimated',
        },
      },
    });

    // Badge aparece no campo (cnpjGuess/segment) e de novo na lista do <details>.
    expect(screen.getAllByText(/CONFIRMADO/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/INFERIDO/).length).toBeGreaterThan(0);
  });

  it('mostra NÃO VERIFICADO para provenance unverified', () => {
    renderCard({
      ...baseCandidate,
      provenance: {
        location: {
          source: 'googlePlaces',
          queriedAt: '2026-11-14T00:00:00.000Z',
          status: 'unverified',
        },
      },
    });

    expect(screen.getAllByText(/NÃO VERIFICADO/).length).toBeGreaterThan(0);
  });

  it('mostra HUNTER para e-mail de decisor com emailSource hunter e APOLLO para apollo', () => {
    renderCard({
      ...baseCandidate,
      decisionMakers: [
        {
          name: 'Ana Souza',
          title: 'Proprietária',
          email: 'ana@paoquente.com.br',
          emailSource: 'hunter',
          phone: null,
          linkedinUrl: null,
        },
        {
          name: 'Bruno Lima',
          title: 'Gerente',
          email: 'bruno@paoquente.com.br',
          emailSource: 'apollo',
          phone: null,
          linkedinUrl: null,
        },
      ],
    });

    expect(screen.getByText('HUNTER')).toBeInTheDocument();
    expect(screen.getByText('APOLLO')).toBeInTheDocument();
    // "verificação não informada" continua explícito — badge de origem não finge verificação.
    expect(screen.getAllByText(/verificação não informada/)).toHaveLength(2);
  });

  it('não exibe badge de proveniência quando o candidato não tem provenance nem decisores', () => {
    renderCard(baseCandidate);

    expect(screen.queryByText(/CONFIRMADO/)).not.toBeInTheDocument();
    expect(screen.queryByText(/INFERIDO/)).not.toBeInTheDocument();
    expect(screen.queryByText('HUNTER')).not.toBeInTheDocument();
    expect(screen.queryByText('APOLLO')).not.toBeInTheDocument();
  });
});

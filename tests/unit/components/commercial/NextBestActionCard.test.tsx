import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const persistDecision = vi.fn();

vi.mock('../../../../src/services/ai/recommendations.service.js', () => ({
  commercialRecommendationsService: {
    persistDecision: (...args: unknown[]) => persistDecision(...args),
  },
}));

import { NextBestActionCard } from '../../../../src/components/commercial/NextBestActionCard.js';

describe('NextBestActionCard', () => {
  beforeEach(() => {
    persistDecision.mockReset();
    persistDecision.mockResolvedValue(undefined);
  });

  it('aceita a recomendação e notifica o consumidor', async () => {
    const onDecisionChange = vi.fn();
    render(
      <NextBestActionCard
        recommendationId="rec-1"
        organizationId="org-1"
        title="Ligar para o decisor"
        description="Speed-to-lead abaixo do SLA"
        onDecisionChange={onDecisionChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Aceitar Sugestao/i }));
    await waitFor(() =>
      expect(persistDecision).toHaveBeenCalledWith({
        recommendationId: 'rec-1',
        organizationId: 'org-1',
        decision: 'ACCEPTED',
      }),
    );
    expect(await screen.findByTestId('nba-status-accepted')).toHaveTextContent(/Acao Aceita/i);
    expect(onDecisionChange).toHaveBeenCalledWith('ACCEPTED');
  });

  it('descarta a recomendação e some o card', async () => {
    render(
      <NextBestActionCard
        recommendationId="rec-2"
        organizationId="org-1"
        title="Enviar proposta"
        description="Gate comercial aprovado"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Descartar/i }));
    expect(await screen.findByTestId('nba-card-dismissed')).toHaveTextContent(/Descartado/i);
  });

  it('já começa descartado quando initialStatus é REJECTED', () => {
    render(
      <NextBestActionCard
        recommendationId="rec-3"
        organizationId="org-1"
        title="Ignorar"
        description="—"
        initialStatus="REJECTED"
      />,
    );
    expect(screen.getByTestId('nba-card-dismissed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aceitar/i })).toBeNull();
  });
});

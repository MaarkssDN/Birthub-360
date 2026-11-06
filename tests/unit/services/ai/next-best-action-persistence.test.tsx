// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NextBestActionCard } from '../../../../src/components/commercial/NextBestActionCard.js';
import { commercialRecommendationsService } from '../../../../src/services/ai/recommendations.service.js';

describe('NextBestActionCard — Real Persistence (B-08)', () => {
  it('persiste decisao de aceitar sugestao no servico de recomendacoes', async () => {
    render(
      <NextBestActionCard
        recommendationId="rec-1"
        organizationId="org-test"
        title="Follow-up Recomendado"
        description="Ligar para o lead apos 3 dias de inatividade"
      />,
    );

    const acceptBtn = screen.getByRole('button', { name: /Aceitar Sugestao/i });
    fireEvent.click(acceptBtn);

    const statusEl = await screen.findByTestId('nba-status-accepted');
    expect(statusEl).toBeInTheDocument();

    // Validacao de persistencia real em backend/service (nao eh apenas estado local React)
    const persisted = await commercialRecommendationsService.getDecision('org-test', 'rec-1');
    expect(persisted).not.toBeNull();
    expect(persisted?.decision).toBe('ACCEPTED');
  });

  it('persiste descarte de sugestao no servico e oculta o card', async () => {
    render(
      <NextBestActionCard
        recommendationId="rec-2"
        organizationId="org-test"
        title="Enviar WhatsApp"
        description="Oferta especial para o lead"
      />,
    );

    const rejectBtn = screen.getByRole('button', { name: /Descartar/i });
    fireEvent.click(rejectBtn);

    const dismissed = await screen.findByTestId('nba-card-dismissed');
    expect(dismissed).toBeInTheDocument();

    const persisted = await commercialRecommendationsService.getDecision('org-test', 'rec-2');
    expect(persisted).not.toBeNull();
    expect(persisted?.decision).toBe('REJECTED');
  });
});

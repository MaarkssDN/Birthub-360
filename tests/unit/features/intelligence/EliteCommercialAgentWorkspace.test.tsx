// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { EliteCommercialAgentWorkspace } from '../../../../src/features/intelligence/components/EliteCommercialAgentWorkspace.js';

describe('EliteCommercialAgentWorkspace — Honest Metrics & Reality (B-06)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('exibe estado de carregamento inicial', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<EliteCommercialAgentWorkspace />);
    expect(screen.getByText(/Carregando Agente Comercial de Elite/i)).toBeInTheDocument();
  });

  it('exibe estado de erro honesto se o backend falhar', async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Database unavailable' }),
      } as Response;
    });

    render(<EliteCommercialAgentWorkspace />);

    await waitFor(() => {
      expect(screen.getByText(/Falha ao carregar Workspace Comercial/i)).toBeInTheDocument();
    });
  });

  it('renderiza dados reais retornados pelo backend sem valores ficticios mockados', async () => {
    const mockOverview = {
      sellerId: 'user-1',
      sellerName: 'Vendedor Teste',
      metrics: {
        monthTarget: 100000,
        closedWon: 75000,
        targetCompletionPercent: 75,
        openPipeline: 250000,
        winRatePercent: 32,
        avgTicket: 15000,
      },
      activeMissionsCount: 3,
      pipelineCoverageRatio: 2.5,
      targetPacingPercentage: 88,
      urgencyHighCount: 1,
      riskDormantCount: 0,
      recentMissions: [],
      nextBestAction: {
        actionId: 'act-1',
        accountName: 'Acme Corporacao',
        actionType: 'LIGACAO_URGENTE',
        reasoning: 'Risco de churn iminente',
        reasons: ['Lead inativo ha 5 dias', 'Valor estrategico de pipeline'],
        targetContact: 'Carlos Diretor',
        phone: '+5511999998888',
        email: 'carlos@acme.com',
        opportunityScore: {
          score: 85,
          tier: 'HOT',
          drivers: ['Forte engajamento recente'],
        },
      },
    };

    vi.mocked(fetch).mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/workspace')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockOverview }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
      } as Response;
    });

    render(<EliteCommercialAgentWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corporacao')).toBeInTheDocument();
      expect(screen.getByText(/R\$ 100K/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 75K/i)).toBeInTheDocument();
    });
  });
});

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SinglePageDashboard } from '@/features/dashboard/components/SinglePageDashboard';

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseAnalyticsDashboard = vi.fn();
vi.mock('@/hooks/useDatabase', () => ({
  useAnalyticsDashboard: (months: number) => mockUseAnalyticsDashboard(months),
  useRealtimeCockpit: () => ({
    data: null,
    loading: false,
    error: null,
    isLiveConnected: false,
    refetch: vi.fn(),
  }),
  useProductivityHeatmap: () => ({
    data: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUnifiedTimeline: () => ({
    events: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

let mockIsOnline = true;
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockIsOnline,
}));

let mockBitrixConnections: Array<{ id: string; label: string }> = [];
vi.mock('@/hooks/useBitrixIntegration', () => ({
  useBitrixIntegration: () => ({ bitrixConnections: mockBitrixConnections }),
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/app/dashboard']}>
      <SinglePageDashboard />
    </MemoryRouter>,
  );
}

describe('SinglePageDashboard — estados de loading, error e verdade operacional', () => {
  beforeEach(() => {
    mockIsOnline = true;
    mockBitrixConnections = [];
    mockUseAuth.mockReturnValue({
      currentUser: { name: 'Mariana Silva', role: 'GESTOR' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renderiza o estado de loading (esqueletos) enquanto os dados estão sendo carregados', () => {
    mockUseAnalyticsDashboard.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderDashboard();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText(/Volume em Pipeline/i)).not.toBeInTheDocument();
  });

  it('exibe estado de erro explícito com botão de retry quando a API falha', () => {
    const refetch = vi.fn();
    mockUseAnalyticsDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: 'Falha na conexão com o banco de dados',
      refetch,
    });

    renderDashboard();

    expect(screen.getByText('Falha ao carregar indicadores comerciais')).toBeInTheDocument();
    expect(screen.getByText('Falha na conexão com o banco de dados')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Tentar novamente/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renderiza dados reais consolidados de pipeline, conversão e conectores', () => {
    mockBitrixConnections = [{ id: 'bx-1', label: 'Bitrix Prod' }];
    mockUseAnalyticsDashboard.mockReturnValue({
      data: {
        overview: {
          pipelineValue: 450000,
          totalLeads: 12,
          conversionRate: 25.5,
          pendingActivities: 4,
          closedThisMonth: 3,
          totalCompanies: 8,
        },
        funnel: [
          { label: 'Prospecção', count: 12, conversionFromPrevious: null, amount: 450000 },
          { label: 'Qualificação', count: 6, conversionFromPrevious: 50, amount: 250000 },
        ],
        byTemperature: [
          { label: 'Quente', count: 5 },
          { label: 'Morno', count: 7 },
        ],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Saudação personalizada
    expect(screen.getByText(/, Mariana\./i)).toBeInTheDocument();

    // Métricas do card
    expect(screen.getByText('12 oportunidades ativas')).toBeInTheDocument();
    expect(screen.getByText('25.5%')).toBeInTheDocument();
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(1);

    // Indicadores reais de conectores
    expect(screen.getByText('Rede Conectada')).toBeInTheDocument();
    expect(screen.getByText('Bitrix24 Ativo')).toBeInTheDocument();
  });

  it('exibe Bitrix24 Pendente e Modo Offline quando desconectado', () => {
    mockIsOnline = false;
    mockBitrixConnections = [];
    mockUseAnalyticsDashboard.mockReturnValue({
      data: {
        overview: {
          pipelineValue: 0,
          totalLeads: 0,
          conversionRate: 0,
          pendingActivities: 0,
          closedThisMonth: 0,
          totalCompanies: 0,
        },
        funnel: [],
        byTemperature: [],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByText('Modo Offline')).toBeInTheDocument();
    expect(screen.getByText('Bitrix24 Pendente')).toBeInTheDocument();
  });
});

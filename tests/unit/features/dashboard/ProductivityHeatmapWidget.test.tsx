import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductivityHeatmapWidget } from '@/features/dashboard/components/ProductivityHeatmapWidget';
import * as dbHooks from '@/hooks/useDatabase';

vi.mock('@/hooks/useDatabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useDatabase')>();
  return {
    ...actual,
    useProductivityHeatmap: vi.fn(),
  };
});

describe('ProductivityHeatmapWidget', () => {
  const mockSlots = [
    {
      dayOfWeek: 1,
      hour: 10,
      totalActivities: 5,
      calls: 3,
      meetings: 1,
      messages: 1,
      conversions: 2,
    },
    {
      dayOfWeek: 2,
      hour: 14,
      totalActivities: 0,
      calls: 0,
      meetings: 0,
      messages: 0,
      conversions: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza skeleton quando loading é true e não há dados', () => {
    vi.mocked(dbHooks.useProductivityHeatmap).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<ProductivityHeatmapWidget />);
    expect(container.querySelector('.shadow-card')).toBeDefined();
  });

  it('renderiza erro e botão de recarregar quando error está presente', () => {
    const refetch = vi.fn();
    vi.mocked(dbHooks.useProductivityHeatmap).mockReturnValue({
      data: null,
      loading: false,
      error: 'Falha no banco',
      refetch,
    });

    render(<ProductivityHeatmapWidget />);
    expect(screen.getByText(/Falha ao carregar mapa de calor/i)).toBeDefined();

    const reloadBtn = screen.getByRole('button');
    fireEvent.click(reloadBtn);
    expect(refetch).toHaveBeenCalled();
  });

  it('renderiza o mapa de calor com dados e permite alternar filtros', () => {
    vi.mocked(dbHooks.useProductivityHeatmap).mockReturnValue({
      data: mockSlots as any,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ProductivityHeatmapWidget />);

    expect(screen.getByText(/Heatmap de Produtividade/i)).toBeDefined();
    expect(screen.getByText('Todas')).toBeDefined();
    expect(screen.getByText('Ligações')).toBeDefined();

    // Alternar métrica para Ligações
    const callsBtn = screen.getByText('Ligações');
    fireEvent.click(callsBtn);

    // Alternar para 24h
    const toggle24hBtn = screen.getByText(/Ver 24 horas completas/i);
    fireEvent.click(toggle24hBtn);
    expect(screen.getByText(/Ver horário comercial/i)).toBeDefined();
  });
});

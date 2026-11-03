import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnifiedTimelineWidget } from '../../../../src/features/dashboard/components/UnifiedTimelineWidget.js';
import type { UnifiedTimelineEvent } from '../../../../src/hooks/useDatabase.js';

const mockRefetch = vi.fn();
let mockEvents: UnifiedTimelineEvent[] = [];
let mockLoading = false;
let mockError: string | null = null;

vi.mock('@/hooks/useDatabase', () => ({
  useUnifiedTimeline: () => ({
    events: mockEvents,
    loading: mockLoading,
    error: mockError,
    refetch: mockRefetch,
  }),
}));

describe('UnifiedTimelineWidget — Visualização e Filtros de Auditoria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading = false;
    mockError = null;
    mockEvents = [
      {
        id: 'act_101',
        timestamp: new Date().toISOString(),
        entityType: 'call',
        title: 'Ligação: Apresentação Executiva',
        description: 'Demonstração de produto realizada com sucesso.',
        actor: 'Pedro SDR',
        targetName: 'Clínica Saúde Vital',
        targetId: 'lead_101',
        outcome: 'success',
      },
      {
        id: 'deal_102',
        timestamp: new Date().toISOString(),
        entityType: 'deal',
        title: 'Negócio Ganho: Contrato Anual',
        description: 'Assinatura eletrônica concluída.',
        actor: 'Ana Closer',
        targetName: 'Hospital Metropolitano',
        targetId: 'lead_102',
        outcome: 'success',
      },
    ];
  });

  it('renderiza o cabeçalho com ações de exportação e auditoria', () => {
    render(<UnifiedTimelineWidget />);

    expect(screen.getByText('Timeline Unificada Cross-Entity')).toBeInTheDocument();
    expect(screen.getByText('Auditoria 360°')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excel \/ CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auditoria PDF/i })).toBeInTheDocument();
  });

  it('renderiza os eventos da timeline com seus badges e informações', () => {
    render(<UnifiedTimelineWidget />);

    expect(screen.getByText('Ligação: Apresentação Executiva')).toBeInTheDocument();
    expect(screen.getByText('Pedro SDR')).toBeInTheDocument();
    expect(screen.getByText('Clínica Saúde Vital')).toBeInTheDocument();

    expect(screen.getByText('Negócio Ganho: Contrato Anual')).toBeInTheDocument();
    expect(screen.getByText('Ana Closer')).toBeInTheDocument();
    expect(screen.getByText('Hospital Metropolitano')).toBeInTheDocument();
  });

  it('exibe estado vazio quando não há registros para os filtros', () => {
    mockEvents = [];
    render(<UnifiedTimelineWidget />);

    expect(screen.getByText('Nenhum evento localizado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar Filtros' })).toBeInTheDocument();
  });

  it('exibe estado de erro e permite tentar novamente', () => {
    mockEvents = [];
    mockError = 'Falha ao conectar com o serviço de auditoria';
    render(<UnifiedTimelineWidget />);

    expect(screen.getByText('Falha ao conectar com o serviço de auditoria')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});

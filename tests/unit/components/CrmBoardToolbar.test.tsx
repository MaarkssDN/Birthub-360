// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CrmBoardBatchBar,
  CrmBoardFiltersBar,
  CrmBoardHeader,
  CrmBoardVitals,
  type PipelineMetrics,
} from '../../../src/components/CrmBoardToolbar.js';

/**
 * CrmBoardToolbar.tsx foi extraído de CrmBoard.tsx no saneamento de hotspot
 * (TAREFA-SANEAMENTO-002). Os 4 blocos são presentacionais: este teste cobre
 * markup, estados condicionais e dispatch de todos os handlers — sem mocks de
 * integração, pois nenhum handler aqui faz I/O.
 */

const baseMetrics: PipelineMetrics = {
  totalAmount: 1250000,
  totalCount: 42,
  hotLeads: 7,
  enrichedCount: 30,
  winRate: 35,
};

function renderHeader(overrides: Partial<Parameters<typeof CrmBoardHeader>[0]> = {}) {
  const props = {
    funnel: 'Lead' as const,
    showFunnelToggle: true,
    handleFunnelChange: vi.fn(),
    setIsSavedViewsOpen: vi.fn(),
    selectionMode: false,
    setSelectionMode: vi.fn(),
    setSelectedLeadIds: vi.fn(),
    setIsBitrixModalOpen: vi.fn(),
    handleBatchExportBitrix: vi.fn(),
    handleBatchEnrich: vi.fn(),
    loading: false,
    handleExportCsv: vi.fn(),
    ...overrides,
  };
  render(<CrmBoardHeader {...props} />);
  return props;
}

describe('CrmBoardHeader', () => {
  it('renderiza título do funil Lead com toggle Leads/Negócios e dispara handleFunnelChange', () => {
    const props = renderHeader();

    expect(screen.getByText('Leads e pré-vendas')).toBeInTheDocument();
    expect(screen.getByText(/Qualifique, nutra e converta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Negócios' }));
    expect(props.handleFunnelChange).toHaveBeenCalledWith('Negocio');
    fireEvent.click(screen.getByRole('button', { name: 'Leads' }));
    expect(props.handleFunnelChange).toHaveBeenCalledWith('Lead');
  });

  it('renderiza título do funil Negocio sem toggle quando showFunnelToggle=false', () => {
    renderHeader({ funnel: 'Negocio', showFunnelToggle: false });

    expect(screen.getByText('Negócios e fechamento')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Funil do pipeline' })).not.toBeInTheDocument();
  });

  it('dispara todos os handlers de ação da toolbar', () => {
    const props = renderHeader();

    fireEvent.click(screen.getByText('Views Salvas'));
    expect(props.setIsSavedViewsOpen).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText('Seleção em Lote'));
    expect(props.setSelectionMode).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Receber do Bitrix/));
    expect(props.setIsBitrixModalOpen).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText(/Enviar para Bitrix/));
    expect(props.handleBatchExportBitrix).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Enriquecer leads não enriquecidos em lote'));
    expect(props.handleBatchEnrich).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Exportar CSV'));
    expect(props.handleExportCsv).toHaveBeenCalledTimes(1);
  });

  it('ao desativar o modo de seleção limpa o conjunto de leads selecionados', () => {
    const props = renderHeader({ selectionMode: true });

    expect(screen.getByText('Cancelar Seleção')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancelar Seleção'));
    expect(props.setSelectionMode).toHaveBeenCalledWith(false);
    // Ao sair do modo seleção o board zera o conjunto de ids selecionados.
    expect(props.setSelectedLeadIds).toHaveBeenCalledWith(new Set());
  });

  it('desabilita "Enriquecer lote" enquanto loading', () => {
    renderHeader({ loading: true });
    const btn = screen.getByTitle('Enriquecer leads não enriquecidos em lote');
    expect(btn).toBeDisabled();
  });
});

describe('CrmBoardVitals', () => {
  it('formata pipeline em BRL e exibe win rate, quentes, enriquecidos e total', () => {
    render(<CrmBoardVitals pipelineMetrics={baseMetrics} />);

    expect(screen.getByText('Pipeline Saudável')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.250\.000/)).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('42 DEALS NO FUNIL')).toBeInTheDocument();
  });

  it('exibe R$ 0,00 quando não há valor no pipeline', () => {
    render(
      <CrmBoardVitals
        pipelineMetrics={{
          totalAmount: 0,
          totalCount: 0,
          hotLeads: 0,
          enrichedCount: 0,
          winRate: 0,
        }}
      />,
    );
    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    expect(screen.getByText('0 DEALS NO FUNIL')).toBeInTheDocument();
  });
});

function renderFilters(overrides: Partial<Parameters<typeof CrmBoardFiltersBar>[0]> = {}) {
  const props = {
    searchQuery: '',
    handleSearchQueryChange: vi.fn(),
    ownerFilter: '',
    handleOwnerFilterChange: vi.fn(),
    users: [
      { id: 'u1', name: 'Ana Vendas' },
      { id: 'u2', name: 'Bruno Closer' },
    ],
    enrichmentFilter: '',
    handleEnrichmentFilterChange: vi.fn(),
    temperatureFilter: '',
    handleTemperatureFilterChange: vi.fn(),
    handleClearFilters: vi.fn(),
    filteredCount: 3,
    totalCount: 10,
    ...overrides,
  };
  render(<CrmBoardFiltersBar {...props} />);
  return props;
}

describe('CrmBoardFiltersBar', () => {
  it('renderiza busca, selects de dono/enriquecimento/temperatura e usuários', () => {
    renderFilters();

    expect(screen.getByLabelText('Buscar por empresa ou contato')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrar por dono:')).toBeInTheDocument();
    expect(screen.getByText('Ana Vendas')).toBeInTheDocument();
    expect(screen.getByText('Bruno Closer')).toBeInTheDocument();
    expect(screen.getByText('Enriquecimento:')).toBeInTheDocument();
    expect(screen.getByText('Temperatura:')).toBeInTheDocument();
    // Sem filtro ativo: botão "Limpar filtros" e contador não aparecem.
    expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument();
    expect(screen.queryByText('3 de 10 leads')).not.toBeInTheDocument();
  });

  it('dispara handlers de cada filtro e mostra limpar + contador quando há filtro ativo', () => {
    const props = renderFilters({ searchQuery: 'acme', ownerFilter: 'u1' });

    fireEvent.change(screen.getByLabelText('Buscar por empresa ou contato'), {
      target: { value: 'globex' },
    });
    expect(props.handleSearchQueryChange).toHaveBeenCalledWith('globex');

    fireEvent.change(screen.getByLabelText('Filtrar por dono:'), { target: { value: 'u2' } });
    expect(props.handleOwnerFilterChange).toHaveBeenCalledWith('u2');

    fireEvent.change(screen.getByLabelText('Enriquecimento:'), { target: { value: 'Enriquecido' } });
    expect(props.handleEnrichmentFilterChange).toHaveBeenCalledWith('Enriquecido');

    fireEvent.change(screen.getByLabelText('Temperatura:'), { target: { value: 'Quente' } });
    expect(props.handleTemperatureFilterChange).toHaveBeenCalledWith('Quente');

    expect(screen.getByText('3 de 10 leads')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Limpar filtros'));
    expect(props.handleClearFilters).toHaveBeenCalledTimes(1);
  });
});

const stageOptions = [
  { value: 'NOVO' as const, label: 'Novo' },
  { value: 'QUALIFICADO' as const, label: 'Qualificado' },
];

function renderBatchBar(overrides: Partial<Parameters<typeof CrmBoardBatchBar>[0]> = {}) {
  const props = {
    selectedLeadIds: new Set(['l1', 'l2']),
    filteredCount: 5,
    handleSelectAll: vi.fn(),
    stageOptions,
    handleBatchMoveStage: vi.fn(),
    isBatchUpdating: false,
    users: [{ id: 'u1', name: 'Ana Vendas' }],
    handleBatchReassignOwner: vi.fn(),
    handleBatchEnrichSelected: vi.fn(),
    handleBatchExportBitrix: vi.fn(),
    handleClearSelection: vi.fn(),
    ...overrides,
  };
  const { container } = render(<CrmBoardBatchBar {...props} />);
  return { props, container };
}

describe('CrmBoardBatchBar', () => {
  it('não renderiza nada sem leads selecionados', () => {
    const { container } = renderBatchBar({ selectedLeadIds: new Set() });
    expect(container.firstChild).toBeNull();
  });

  it('renderiza contagem, ações em lote e dispara todos os handlers', () => {
    const { props } = renderBatchBar();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('selecionado(s)')).toBeInTheDocument();
    // selected(2) !== filteredCount(5) → label "Todos"
    fireEvent.click(screen.getByText('Todos'));
    expect(props.handleSelectAll).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Etapa:'), { target: { value: 'QUALIFICADO' } });
    expect(props.handleBatchMoveStage).toHaveBeenCalledWith('QUALIFICADO');

    fireEvent.change(screen.getByLabelText('Dono:'), { target: { value: 'u1' } });
    expect(props.handleBatchReassignOwner).toHaveBeenCalledWith('u1');

    fireEvent.click(screen.getByText('Enriquecer com IA'));
    expect(props.handleBatchEnrichSelected).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Enviar ao Bitrix24'));
    expect(props.handleBatchExportBitrix).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Desmarcar todos'));
    expect(props.handleClearSelection).toHaveBeenCalledTimes(1);
  });

  it('mostra "Desmarcar Todos" quando a seleção cobre todos os filtrados e desabilita ações durante batch', () => {
    const { props } = renderBatchBar({
      selectedLeadIds: new Set(['a', 'b', 'c', 'd', 'e']),
      filteredCount: 5,
      isBatchUpdating: true,
    });

    expect(screen.getByText('Desmarcar Todos')).toBeInTheDocument();
    expect(screen.getByLabelText('Etapa:')).toBeDisabled();
    expect(screen.getByLabelText('Dono:')).toBeDisabled();
    expect(screen.getByText('Enriquecer com IA')).toBeDisabled();
    expect(screen.getByText('Enviar ao Bitrix24')).toBeDisabled();
    expect(props.handleBatchMoveStage).not.toHaveBeenCalled();
  });
});

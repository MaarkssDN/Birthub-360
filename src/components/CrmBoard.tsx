/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- regiões roláveis focáveis por teclado */

import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BRAND } from '../config/brand.js';
import { BitrixImportModal } from '../features/crm/components/BitrixImportModal.js';
import { KanbanCard } from '../features/crm/components/KanbanCard.js';
import { KanbanColumn } from '../features/crm/components/KanbanColumn.js';
import { LeadDetailDrawer } from '../features/crm/components/LeadDetailDrawer.js';
import { type SavedViewItem, SavedViewsPanel } from '../features/crm/components/SavedViewsPanel.js';
import { useCrmBoardController } from '../hooks/useCrmBoardController.js';
import { clientLogger } from '../lib/clientLogger.js';
import { SoundFX } from '../lib/soundEffects.js';
import { toast } from '../lib/toast.js';
import type { Lead, LeadStatus } from '../types/index.js';
import { CrmBoardBatchBar } from './crm-board/CrmBoardBatchBar.js';
import { CrmBoardFiltersBar } from './crm-board/CrmBoardFiltersBar.js';
import { CrmBoardHeader } from './crm-board/CrmBoardHeader.js';
import { CrmBoardMetricsBar } from './crm-board/CrmBoardMetricsBar.js';
import { useCrmBoardBulkActions } from './crm-board/useCrmBoardBulkActions.js';
import { useCrmBoardDnD } from './crm-board/useCrmBoardDnD.js';
import { ContextualTip } from './ui/ContextualTip.js';
import { EmptyState } from './ui/EmptyState.js';

export { formatStageLabel, STAGE_DISPLAY_LABELS } from './crm-board/stageLabels.js';

const LEAD_COLUMNS: LeadStatus[] = [
  'Lead Recebido',
  'Cadência Iniciada',
  'Qualificação (SDR)',
  'Reunião Agendada',
  'Lead Desqualificado',
  'Convertido em Oportunidade',
];

const DEAL_COLUMNS: LeadStatus[] = [
  'Nova Oportunidade',
  'Proposta Enviada',
  'Call/Visita Agendada',
  'Piloto VTECH',
  'Piloto Birthub 360 Profile',
  'Piloto Birthub 360 Profile - Concluído',
  'Piloto Birthub 360 Profile - Cancelado',
  'Piloto Logística',
  'Piloto Logístico - Concluído',
  'Piloto Logístico - Cancelado',
  'Negócios Perdidos',
  'Negócios Ganhos',
];

interface CrmBoardProps {
  funnel?: 'Lead' | 'Negocio';
  embedded?: boolean;
}

export function CrmBoard({ funnel: funnelProp, embedded = false }: CrmBoardProps) {
  // (identidade da plataforma vem de BRAND)
  const [searchParams, setSearchParams] = useSearchParams();
  const funnel: 'Lead' | 'Negocio' =
    funnelProp ?? (searchParams.get('funnel') === 'Negocio' ? 'Negocio' : 'Lead');
  const columns = funnel === 'Lead' ? LEAD_COLUMNS : DEAL_COLUMNS;
  const {
    leads,
    setLeads,
    loading,
    error,
    fetchLeads,
    handleConvert,
    handleCardEnrich,
    handleBatchEnrich,
  } = useCrmBoardController(funnel);
  // Deep link do registro aberto: o lead/negócio selecionado vive no parâmetro `lead` da URL (não
  // em useState local) para que a URL seja a fonte de verdade — compartilhável, sobrevive a
  // reload, e o botão Voltar do navegador fecha o drawer antes de sair da tela (Onda A, Agente 00).
  const selectedLeadId = searchParams.get('lead');
  const [isBitrixModalOpen, setIsBitrixModalOpen] = useState(false);
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);

  // Onda B2a (Agente 00, Commercial AI OS) — filtros reais do pipeline (dono + busca), persistidos
  // na URL como `owner`/`q`, mesmo mecanismo já usado para `funnel`/`lead`.
  const ownerFilter = searchParams.get('owner') ?? '';
  const searchQuery = searchParams.get('q') ?? '';
  const enrichmentFilter = searchParams.get('enrichment') ?? '';
  const temperatureFilter = searchParams.get('temp') ?? '';

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      if (ownerFilter && lead.owner !== ownerFilter) return false;
      if (enrichmentFilter) {
        const status = lead.company?.enrichmentStatus || 'Pendente';
        if (enrichmentFilter === 'Enriquecido' && status !== 'Enriquecido') return false;
        if (enrichmentFilter === 'Pendente' && status !== 'Pendente') return false;
        if (enrichmentFilter === 'Falhou' && status !== 'Falhou') return false;
      }
      if (temperatureFilter && lead.temperature !== temperatureFilter) return false;
      if (query) {
        const haystack = [lead.company?.tradeName, lead.company?.legalName, lead.contact?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [leads, ownerFilter, searchQuery, enrichmentFilter, temperatureFilter]);

  const pipelineMetrics = useMemo(() => {
    const totalAmount = leads.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const hotLeads = leads.filter((l) => l.temperature === 'Quente').length;
    const enrichedCount = leads.filter((l) => l.company?.enrichmentStatus === 'Enriquecido').length;
    const winCount = leads.filter(
      (l) => l.status === 'Convertido em Oportunidade' || l.status === 'Negócios Ganhos',
    ).length;
    const winRate = leads.length > 0 ? Math.round((winCount / leads.length) * 100) : 0;

    return {
      totalAmount,
      totalCount: leads.length,
      hotLeads,
      enrichedCount,
      winRate,
    };
  }, [leads]);

  const {
    selectedLeadIds,
    setSelectedLeadIds,
    selectionMode,
    setSelectionMode,
    isBatchUpdating,
    users,
    ownerNameById,
    handleToggleSelect,
    handleSelectAll,
    handleClearSelection,
    handleBatchMoveStage,
    handleBatchReassignOwner,
    handleBatchExportBitrix,
    handleBatchEnrichSelected,
  } = useCrmBoardBulkActions({ filteredLeads, fetchLeads });

  const { activeLead, sensors, announcements, handleDragStart, handleDragEnd, handleDragCancel } =
    useCrmBoardDnD({ leads, setLeads, fetchLeads, columns });

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream', { withCredentials: true });
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'voice-qualified') {
          toast.success(data.message);
          // Atualiza a lista para refletir possíveis mudanças
          fetchLeads();
        } else if (data.type === 'company-enriched') {
          toast.info(data.message || 'Dados de empresa e lead enriquecidos!');
          fetchLeads();
        }
      } catch (err: any) {
        clientLogger.error({ err }, 'Erro ao processar evento SSE');
      }
    };
    return () => {
      eventSource.close();
    };
  }, [fetchLeads]);

  const handleCardClick = useCallback(
    (lead: Lead) => {
      if (selectionMode) {
        handleToggleSelect(lead.id);
        return;
      }
      // push (padrão do setSearchParams): abrir o drawer entra no histórico do navegador, então
      // Voltar fecha o drawer em vez de sair de /app/crm — ver handleCloseDrawer abaixo, que usa
      // replace ao fechar explicitamente para não empilhar uma entrada de histórico simétrica.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('lead', lead.id);
        return next;
      });
    },
    [selectionMode, handleToggleSelect, setSearchParams],
  );

  const handleCloseDrawer = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('lead');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handleFunnelChange = useCallback(
    (next: 'Lead' | 'Negocio') => {
      if (funnelProp) return; // funil fixado por prop — toggle não se aplica
      SoundFX.play('navigate');
      setSelectedLeadIds(new Set());
      // remove `lead` junto — evita manter aberto o drawer de um lead que já não está no funil
      // visível (mesmo comportamento de antes, agora expresso na URL em vez de em state local).
      setSearchParams(next === 'Lead' ? {} : { funnel: next }, { replace: true });
    },
    [funnelProp, setSearchParams, setSelectedLeadIds],
  );

  // Aplica funil+filtros de uma view salva de uma vez (Onda B2b) — mesma lógica de
  // handleFunnelChange (não se aplica com funnel fixado por prop, fecha o drawer aberto), mas
  // reconstrói a URL inteira em vez de alternar só o funil.
  const handleApplySavedView = useCallback(
    (view: SavedViewItem) => {
      if (funnelProp) return;
      SoundFX.play('navigate');
      setSelectedLeadIds(new Set());
      setSearchParams(
        (() => {
          const next = new URLSearchParams();
          if (view.funnel === 'Negocio') next.set('funnel', 'Negocio');
          if (view.filters.owner) next.set('owner', view.filters.owner);
          if (view.filters.q) next.set('q', view.filters.q);
          return next;
        })(),
        { replace: true },
      );
    },
    [funnelProp, setSearchParams, setSelectedLeadIds],
  );

  const handleOwnerFilterChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('owner', value);
          else next.delete('owner');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleEnrichmentFilterChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('enrichment', value);
          else next.delete('enrichment');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleTemperatureFilterChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('temp', value);
          else next.delete('temp');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('q', value);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('owner');
        next.delete('q');
        next.delete('enrichment');
        next.delete('temp');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handleExportCsv = async () => {
    try {
      const response = await fetch('/api/leads/export/csv', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Falha ao exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `leads_${BRAND.id}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar leads. Tente novamente.');
    }
  };

  const groupedLeads = useMemo(() => {
    const grouped: Partial<Record<LeadStatus, Lead[]>> = Object.fromEntries(
      columns.map((status) => [status, [] as Lead[]]),
    );
    filteredLeads.forEach((lead) => {
      grouped[lead.status]?.push(lead);
    });
    return grouped;
  }, [filteredLeads, columns]);

  return (
    <div
      className={`flex-1 flex flex-col bg-bg text-ink animate-in fade-in duration-500 overflow-hidden relative ${embedded ? 'min-h-[680px] h-full' : 'h-full'}`}
    >
      <CrmBoardHeader
        funnel={funnel}
        showFunnelToggle={!funnelProp}
        onFunnelChange={handleFunnelChange}
        onOpenSavedViews={() => setIsSavedViewsOpen(true)}
        selectionMode={selectionMode}
        onToggleSelectionMode={() => {
          setSelectionMode(!selectionMode);
          if (selectionMode) setSelectedLeadIds(new Set());
        }}
        onOpenBitrixModal={() => setIsBitrixModalOpen(true)}
        onBatchExportBitrix={handleBatchExportBitrix}
        onBatchEnrich={handleBatchEnrich}
        onExportCsv={handleExportCsv}
        loading={loading}
      />

      <CrmBoardMetricsBar metrics={pipelineMetrics} />

      {/* Barra de filtros do pipeline (Onda B2a) — busca por texto + dono, persistidos na URL. */}
      <CrmBoardFiltersBar
        searchQuery={searchQuery}
        ownerFilter={ownerFilter}
        enrichmentFilter={enrichmentFilter}
        temperatureFilter={temperatureFilter}
        users={users}
        onSearchQueryChange={handleSearchQueryChange}
        onOwnerFilterChange={handleOwnerFilterChange}
        onEnrichmentFilterChange={handleEnrichmentFilterChange}
        onTemperatureFilterChange={handleTemperatureFilterChange}
        onClearFilters={handleClearFilters}
        filteredCount={filteredLeads.length}
        totalCount={leads.length}
      />

      {/* Contextual Tip Banner */}
      {!embedded && (
        <div className="px-6 pt-4 shrink-0">
          <ContextualTip
            id="tip-crm-pipeline"
            title="💡 Dica de Gestão de Funil CRM"
            description="Passe o cursor sobre os cards para ver o tempo de estagnação e tecnologias. Use 'Seleção em Lote' para mover dezenas de leads simultaneamente ou exportá-los para o Bitrix24!"
          />
        </div>
      )}

      {/* Região com scroll horizontal do Kanban */}
      {/* role="region" torna o aria-label válido (div genérica não aceita nome acessível) e
          sinaliza a screen readers que é uma landmark navegável — não só satisfaz o linter.
          <section aria-label> produziria a mesma role region na árvore de acessibilidade, sem
          ganho real — não vale o risco de desalinhar abertura/fechamento num componente grande. */}
      {/* biome-ignore lint/a11y/useSemanticElements: ver comentário acima */}
      <div
        className="custom-scrollbar flex-1 min-h-[320px] overflow-x-auto overflow-y-hidden bg-bg p-4 pb-24 lg:p-6 lg:pb-24"
        role="region"
        // Div não-interativa com scroll — tabIndex é intencional (torna a região focável/rolável
        // via teclado), não um erro de a11y. Mesmo padrão de VirtualTable.tsx.
        // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll horizontal via teclado, ver comentário acima
        tabIndex={0}
        aria-label="Colunas do pipeline — role o conteúdo horizontalmente"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-ink-2 font-medium text-sm">Carregando pipeline comercial...</p>
            </div>
          </div>
        ) : error ? (
          <EmptyState
            icon={<WifiOff className="w-8 h-8 text-brand" />}
            title="Não foi possível carregar o pipeline"
            description={error}
            actionLabel="Tentar novamente"
            onAction={fetchLeads}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            accessibility={{ announcements }}
          >
            <div className="flex gap-6 h-full">
              {columns.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  leads={groupedLeads[status] ?? []}
                  onCardClick={handleCardClick}
                  onCardEnrich={handleCardEnrich}
                  onConvert={
                    funnel === 'Lead' && status === 'Convertido em Oportunidade'
                      ? handleConvert
                      : undefined
                  }
                  selectedLeadIds={selectedLeadIds}
                  onToggleSelect={handleToggleSelect}
                  selectionMode={selectionMode}
                  ownerNameById={ownerNameById}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? (
                <div className="w-[320px] rotate-2 scale-[1.03] opacity-95 shadow-2xl pointer-events-none">
                  <KanbanCard lead={activeLead} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Barra Flutuante de Ações em Lote (Fixa na parte inferior quando há leads selecionados) */}
      <CrmBoardBatchBar
        selectedCount={selectedLeadIds.size}
        allSelected={selectedLeadIds.size === filteredLeads.length}
        onSelectAll={handleSelectAll}
        columns={columns}
        users={users}
        isBatchUpdating={isBatchUpdating}
        onBatchMoveStage={handleBatchMoveStage}
        onBatchReassignOwner={handleBatchReassignOwner}
        onBatchEnrichSelected={handleBatchEnrichSelected}
        onBatchExportBitrix={handleBatchExportBitrix}
        onClearSelection={handleClearSelection}
      />

      {/* Modal de Importação Bitrix24 */}
      <BitrixImportModal
        isOpen={isBitrixModalOpen}
        onClose={() => setIsBitrixModalOpen(false)}
        onImportSuccess={fetchLeads}
      />

      <SavedViewsPanel
        isOpen={isSavedViewsOpen}
        onClose={() => setIsSavedViewsOpen(false)}
        currentFunnel={funnel}
        currentFilters={{ owner: ownerFilter || undefined, q: searchQuery || undefined }}
        ownerNameById={ownerNameById}
        onApply={handleApplySavedView}
      />

      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          onClose={handleCloseDrawer}
          onChanged={fetchLeads}
        />
      )}
    </div>
  );
}

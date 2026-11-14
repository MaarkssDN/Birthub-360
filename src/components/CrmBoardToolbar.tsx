import {
  Activity,
  Bookmark,
  CheckSquare,
  Download,
  Flame,
  Loader2,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { LeadStatus } from '../types/index.js';
import { Bitrix24Icon } from './brand/CompanyBrandIcon.js';
import { Button } from './ui/Button.js';
import { Tooltip } from './ui/Tooltip.js';

/**
 * Blocos de chrome do CrmBoard extraídos para reduzir o hotspot estrutural
 * (TAREFA-SANEAMENTO-002 / handoff 00→02, Onda 5): cabeçalho + toolbar de ações,
 * faixa de vitais do funil, barra de filtros e barra flutuante de ações em lote.
 * São componentes puramente presentacionais — todo o estado e os handlers
 * continuam em `CrmBoard.tsx` (dono do dnd-kit, filtros de URL e persistência).
 */

export interface PipelineMetrics {
  totalAmount: number;
  totalCount: number;
  hotLeads: number;
  enrichedCount: number;
  winRate: number;
}

export interface CrmBoardHeaderProps {
  funnel: 'Lead' | 'Negocio';
  /** `true` quando o board NÃO está travado a um funil via prop (toggle Leads/Negócios visível). */
  showFunnelToggle: boolean;
  handleFunnelChange: (funnel: 'Lead' | 'Negocio') => void;
  setIsSavedViewsOpen: Dispatch<SetStateAction<boolean>>;
  selectionMode: boolean;
  setSelectionMode: Dispatch<SetStateAction<boolean>>;
  setSelectedLeadIds: Dispatch<SetStateAction<Set<string>>>;
  setIsBitrixModalOpen: Dispatch<SetStateAction<boolean>>;
  handleBatchExportBitrix: () => void;
  handleBatchEnrich: () => void;
  loading: boolean;
  handleExportCsv: () => void;
}

export function CrmBoardHeader({
  funnel,
  showFunnelToggle,
  handleFunnelChange,
  setIsSavedViewsOpen,
  selectionMode,
  setSelectionMode,
  setSelectedLeadIds,
  setIsBitrixModalOpen,
  handleBatchExportBitrix,
  handleBatchEnrich,
  loading,
  handleExportCsv,
}: CrmBoardHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-b border-brand/25 bg-surface-elevated/92 p-4 backdrop-blur-xl sm:flex-row sm:items-center lg:px-6 lg:py-5">
      <div>
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-brand mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--color-ok)] animate-pulse" />
          <span>PIPELINE COMERCIAL REVENUE OS</span>
        </div>
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-ink">
          <Target className="h-5 w-5 text-brand" aria-hidden="true" />
          {funnel === 'Lead' ? 'Leads e pré-vendas' : 'Negócios e fechamento'}
        </h2>
        <p className="text-xs text-ink-2 mt-1 font-sans">
          {funnel === 'Lead'
            ? 'Qualifique, nutra e converta os leads prontos para o pipeline de negócios.'
            : 'Gerencie propostas, pilotos e receita em um funil separado.'}
        </p>
        {showFunnelToggle && (
          // Toolbar de botões toggle (não campos de formulário) — <fieldset> não traria ganho
          // real de acessibilidade aqui, só estilo (mesma justificativa da política de
          // useSemanticElements deste repositório).
          // biome-ignore lint/a11y/useSemanticElements: ver comentário acima
          <div
            className="inline-flex items-center gap-1 p-1 mt-3 bg-surface-2 rounded-xl border border-line shadow-xs"
            role="group"
            aria-label="Funil do pipeline"
          >
            <button
              type="button"
              onClick={() => handleFunnelChange('Lead')}
              aria-pressed={funnel === 'Lead'}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                funnel === 'Lead'
                  ? 'bg-brand text-on-brand shadow-sm'
                  : 'text-ink-2 hover:bg-surface hover:text-ink'
              }`}
            >
              Leads
            </button>
            <button
              type="button"
              onClick={() => handleFunnelChange('Negocio')}
              aria-pressed={funnel === 'Negocio'}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                funnel === 'Negocio'
                  ? 'bg-brand text-on-brand shadow-sm'
                  : 'text-ink-2 hover:bg-surface hover:text-ink'
              }`}
            >
              Negócios
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Views Salvas (Onda B2b) */}
        <Button
          magnetic
          onClick={() => setIsSavedViewsOpen(true)}
          variant="secondary"
          className="text-xs"
          title="Ver e salvar views do pipeline (funil + filtros)"
        >
          <Bookmark className="w-4 h-4 shrink-0" />
          <span>Views Salvas</span>
        </Button>

        {/* Botão de Modo de Seleção Múltipla */}
        <Tooltip content="Ativa a seleção múltipla de cards para mover de etapa, reatribuir ou exportar leads em lote.">
          <Button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedLeadIds(new Set());
            }}
            variant={selectionMode ? 'default' : 'secondary'}
            soundClick
            className="text-xs"
            title="Ativar seleção múltipla de cards no Kanban"
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>{selectionMode ? 'Cancelar Seleção' : 'Seleção em Lote'}</span>
          </Button>
        </Tooltip>

        {/* Botão Receber do Bitrix (Modal Manual) */}
        <Tooltip content="Abre o painel para buscar, filtrar e importar leads/negócios do Bitrix24 para o Birth Hub.">
          <Button
            onClick={() => setIsBitrixModalOpen(true)}
            variant="secondary"
            soundClick
            className="text-xs"
            title="Abrir painel para buscar e receber leads do Bitrix24"
          >
            <Download className="w-4 h-4 rotate-180 shrink-0 text-sky-500" />
            <span className="flex items-center gap-1.5">
              <Bitrix24Icon className="w-3.5 h-3.5 shrink-0" /> Receber do Bitrix
            </span>
          </Button>
        </Tooltip>

        {/* Botão Enviar para Bitrix (Manual) */}
        <Tooltip content="Dispara a sincronização manual e exportação dos leads do pipeline com o portal Bitrix24.">
          <Button
            onClick={handleBatchExportBitrix}
            variant="secondary"
            soundClick
            className="text-xs"
            title="Enviar leads para o portal Bitrix24"
          >
            <Send className="w-4 h-4 shrink-0 text-sky-500" />
            <span className="flex items-center gap-1.5">
              <Bitrix24Icon className="w-3.5 h-3.5 shrink-0" /> Enviar para Bitrix
            </span>
          </Button>
        </Tooltip>

        <Tooltip content="Enriquece dados cadastrais, tecnologias e decisores dos leads em lote usando IA.">
          <Button
            onClick={handleBatchEnrich}
            disabled={loading}
            variant="secondary"
            soundClick
            className="text-xs"
            title="Enriquecer leads não enriquecidos em lote"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-yellow-500" />
            <span className="hidden sm:inline">Enriquecer lote</span>
          </Button>
        </Tooltip>

        <Button
          onClick={handleExportCsv}
          variant="secondary"
          soundClick
          className="text-xs"
          title="Exportar todos os leads para uma planilha CSV"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
      </div>
    </div>
  );
}

export function CrmBoardVitals({ pipelineMetrics }: { pipelineMetrics: PipelineMetrics }) {
  return (
    /* Faixa de Vitais Comerciais e Telemetria (Ronas IT Cardiology / Spatial UI) */
    <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-2 border-b border-line/60 bg-surface/50 dark:bg-surface-2/50 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <span className="w-2 h-2 rounded-full bg-ok shadow-[0_0_8px_var(--color-ok)] animate-pulse" />
        <span className="font-mono text-[10px] font-bold text-ink-2 uppercase">Diagnóstico:</span>
        <span className="font-bold text-ink">Pipeline Saudável</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <TrendingUp className="w-3.5 h-3.5 text-ok" />
        <span className="font-mono text-[10px] font-bold text-ink-2 uppercase">Pipeline:</span>
        <span className="font-extrabold text-ok-active dark:text-ok">
          {pipelineMetrics.totalAmount > 0
            ? `R$ ${pipelineMetrics.totalAmount.toLocaleString('pt-BR')}`
            : 'R$ 0,00'}
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <Activity className="w-3.5 h-3.5 text-brand" />
        <span className="font-mono text-[10px] font-bold text-ink-2 uppercase">Win Rate:</span>
        <span className="font-extrabold text-sky-700 dark:text-brand">
          {pipelineMetrics.winRate}%
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <Flame className="w-3.5 h-3.5 text-warning" />
        <span className="font-mono text-[10px] font-bold text-ink-2 uppercase">Quentes:</span>
        <span className="font-extrabold text-warning">{pipelineMetrics.hotLeads}</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs">
        <Zap className="w-3.5 h-3.5 text-iris" />
        <span className="font-mono text-[10px] font-bold text-ink-2 uppercase">Enriquecidos:</span>
        <span className="font-bold text-ink">{pipelineMetrics.enrichedCount}</span>
      </div>

      <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-ok/15 border border-ok/35 text-ink dark:text-ok text-xs font-mono font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-ok shadow-[0_0_6px_var(--color-ok)]" />
        <span>{pipelineMetrics.totalCount} DEALS NO FUNIL</span>
      </div>
    </div>
  );
}

export interface CrmBoardFiltersBarProps {
  searchQuery: string;
  handleSearchQueryChange: (value: string) => void;
  ownerFilter: string;
  handleOwnerFilterChange: (value: string) => void;
  users: { id: string; name: string }[];
  enrichmentFilter: string;
  handleEnrichmentFilterChange: (value: string) => void;
  temperatureFilter: string;
  handleTemperatureFilterChange: (value: string) => void;
  handleClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function CrmBoardFiltersBar({
  searchQuery,
  handleSearchQueryChange,
  ownerFilter,
  handleOwnerFilterChange,
  users,
  enrichmentFilter,
  handleEnrichmentFilterChange,
  temperatureFilter,
  handleTemperatureFilterChange,
  handleClearFilters,
  filteredCount,
  totalCount,
}: CrmBoardFiltersBarProps) {
  return (
    /* Barra de filtros do pipeline (Onda B2a) — busca por texto + dono, persistidos na URL. */
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface-subtle px-4 py-3 lg:px-6">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <label htmlFor="crm-board-search" className="sr-only">
          Buscar por empresa ou contato
        </label>
        <Search className="w-4 h-4 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="crm-board-search"
          type="search"
          value={searchQuery}
          onChange={(e) => handleSearchQueryChange(e.target.value)}
          placeholder="Buscar por empresa ou contato..."
          className="w-full rounded-full border border-line/80 bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-2 focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 transition-all shadow-inner"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="crm-board-owner-filter" className="text-xs font-semibold text-ink-2">
          Filtrar por dono:
        </label>
        <select
          id="crm-board-owner-filter"
          value={ownerFilter}
          onChange={(e) => handleOwnerFilterChange(e.target.value)}
          className="rounded-control border border-line bg-surface-elevated px-2.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all"
        >
          <option value="">Todos os donos</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="crm-board-enrichment-filter" className="text-xs font-semibold text-ink-2">
          Enriquecimento:
        </label>
        <select
          id="crm-board-enrichment-filter"
          value={enrichmentFilter}
          onChange={(e) => handleEnrichmentFilterChange(e.target.value)}
          className="rounded-control border border-line bg-surface-elevated px-2.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all"
        >
          <option value="">Todos</option>
          <option value="Enriquecido">Enriquecidos</option>
          <option value="Pendente">Pendentes</option>
          <option value="Falhou">Falhou</option>
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="crm-board-temp-filter" className="text-xs font-semibold text-ink-2">
          Temperatura:
        </label>
        <select
          id="crm-board-temp-filter"
          value={temperatureFilter}
          onChange={(e) => handleTemperatureFilterChange(e.target.value)}
          className="rounded-control border border-line bg-surface-elevated px-2.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all"
        >
          <option value="">Todas</option>
          <option value="Quente">🔥 Quente</option>
          <option value="Morno">🌤️ Morno</option>
          <option value="Frio">❄️ Frio</option>
        </select>
      </div>
      {(ownerFilter || searchQuery || enrichmentFilter || temperatureFilter) && (
        <>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
          >
            Limpar filtros
          </button>
          <span className="text-xs text-ink-2 sm:ml-auto">
            {filteredCount} de {totalCount} leads
          </span>
        </>
      )}
    </div>
  );
}

export interface CrmBoardBatchBarProps {
  selectedLeadIds: Set<string>;
  filteredCount: number;
  handleSelectAll: () => void;
  stageOptions: { value: LeadStatus; label: string }[];
  handleBatchMoveStage: (stage: string) => void;
  isBatchUpdating: boolean;
  users: { id: string; name: string }[];
  handleBatchReassignOwner: (ownerId: string) => void;
  handleBatchEnrichSelected: () => void;
  handleBatchExportBitrix: () => void;
  handleClearSelection: () => void;
}

export function CrmBoardBatchBar({
  selectedLeadIds,
  filteredCount,
  handleSelectAll,
  stageOptions,
  handleBatchMoveStage,
  isBatchUpdating,
  users,
  handleBatchReassignOwner,
  handleBatchEnrichSelected,
  handleBatchExportBitrix,
  handleClearSelection,
}: CrmBoardBatchBarProps) {
  if (selectedLeadIds.size === 0) return null;
  return (
    /* Barra Flutuante de Ações em Lote (Fixa na parte inferior quando há leads selecionados) */
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface/95 backdrop-blur-xl border border-brand/30 shadow-elevated dark:shadow-[0_0_28px_rgba(0,212,255,0.18)] rounded-2xl p-3 px-5 flex flex-wrap items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2 pr-3 border-r border-line">
        <span className="w-6 h-6 rounded-full bg-brand text-on-brand text-xs font-black flex items-center justify-center">
          {selectedLeadIds.size}
        </span>
        <span className="text-xs font-bold text-ink">selecionado(s)</span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-[11px] font-bold text-brand hover:underline ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          {selectedLeadIds.size === filteredCount ? 'Desmarcar Todos' : 'Todos'}
        </button>
      </div>

      {/* Mover Etapa em Massa */}
      <Tooltip content="Transfere todos os leads selecionados para a nova etapa de funil indicada.">
        <div className="flex items-center gap-1.5 cursor-pointer">
          <label
            htmlFor="crm-board-batch-stage"
            className="text-[11px] font-semibold text-ink-2 cursor-pointer"
          >
            Etapa:
          </label>
          <select
            id="crm-board-batch-stage"
            onChange={(e) => {
              if (e.target.value) handleBatchMoveStage(e.target.value);
            }}
            disabled={isBatchUpdating}
            defaultValue=""
            className="px-2.5 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Mover para...
            </option>
            {stageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </Tooltip>

      {/* Reatribuir Vendedor */}
      <Tooltip content="Reatribui a responsabilidade dos leads selecionados para outro membro da equipe.">
        <div className="flex items-center gap-1.5 cursor-pointer">
          <label
            htmlFor="crm-board-batch-owner"
            className="text-[11px] font-semibold text-ink-2 cursor-pointer"
          >
            Dono:
          </label>
          <select
            id="crm-board-batch-owner"
            onChange={(e) => {
              if (e.target.value) handleBatchReassignOwner(e.target.value);
            }}
            disabled={isBatchUpdating}
            defaultValue=""
            className="px-2.5 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Atribuir a...
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </Tooltip>

      {/* Enriquecer Selecionados com IA */}
      <Tooltip content="Dispara o enriquecimento cadastral, firmográfico e Fit Score para os leads selecionados.">
        <button
          type="button"
          onClick={handleBatchEnrichSelected}
          disabled={isBatchUpdating}
          className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-on-brand rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          {isBatchUpdating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Enriquecer com IA
        </button>
      </Tooltip>

      {/* Enviar Selecionados para Bitrix */}
      <Tooltip content="Sincroniza e exporta imediatamente apenas os leads selecionados para o Bitrix24.">
        <button
          type="button"
          onClick={handleBatchExportBitrix}
          disabled={isBatchUpdating}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          {isBatchUpdating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Enviar ao Bitrix24
        </button>
      </Tooltip>

      <Tooltip content="Desmarcar todos os cards selecionados e fechar a barra de ações em lote.">
        <button
          type="button"
          onClick={handleClearSelection}
          className="p-1.5 rounded-xl hover:bg-surface-2 text-ink-2 hover:text-ink transition-colors"
          title="Desmarcar todos"
        >
          <X className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}

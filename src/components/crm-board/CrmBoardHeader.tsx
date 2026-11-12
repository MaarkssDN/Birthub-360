import { Bookmark, CheckSquare, Download, Send, Sparkles, Target } from 'lucide-react';
import { Bitrix24Icon } from '../brand/CompanyBrandIcon.js';
import { Button } from '../ui/Button.js';
import { Tooltip } from '../ui/Tooltip.js';

interface CrmBoardHeaderProps {
  funnel: 'Lead' | 'Negocio';
  showFunnelToggle: boolean;
  onFunnelChange: (next: 'Lead' | 'Negocio') => void;
  onOpenSavedViews: () => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  onOpenBitrixModal: () => void;
  onBatchExportBitrix: () => void;
  onBatchEnrich: () => void;
  onExportCsv: () => void;
  loading: boolean;
}

/** Header do CrmBoard (título, toggle de funil e toolbar de ações) — extraído na
 *  TAREFA-SANEAMENTO-002 (W4). JSX preservado verbatim. */
export function CrmBoardHeader({
  funnel,
  showFunnelToggle,
  onFunnelChange,
  onOpenSavedViews,
  selectionMode,
  onToggleSelectionMode,
  onOpenBitrixModal,
  onBatchExportBitrix,
  onBatchEnrich,
  onExportCsv,
  loading,
}: CrmBoardHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-b border-brand/25 bg-surface-elevated/92 p-4 backdrop-blur-xl sm:flex-row sm:items-center lg:px-6 lg:py-5">
      <div>
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0284c7] dark:text-[#00D4FF] mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4F434] shadow-[0_0_8px_#D4F434] animate-pulse" />
          <span>PIPELINE COMERCIAL REVENUE OS</span>
        </div>
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-[#0F2942] dark:text-[#E2F1FF]">
          <Target className="h-5 w-5 text-[#00D4FF]" aria-hidden="true" />
          {funnel === 'Lead' ? 'Leads e pré-vendas' : 'Negócios e fechamento'}
        </h2>
        <p className="text-xs text-[#3B5A75] dark:text-[#94B3CD] mt-1 font-sans">
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
              onClick={() => onFunnelChange('Lead')}
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
              onClick={() => onFunnelChange('Negocio')}
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
          onClick={onOpenSavedViews}
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
            onClick={onToggleSelectionMode}
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
            onClick={onOpenBitrixModal}
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
            onClick={onBatchExportBitrix}
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
            onClick={onBatchEnrich}
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
          onClick={onExportCsv}
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

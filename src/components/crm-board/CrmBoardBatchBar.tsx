import { Loader2, Send, Sparkles, X } from 'lucide-react';
import type { LeadStatus } from '../../types/index.js';
import { Tooltip } from '../ui/Tooltip.js';
import { formatStageLabel } from './stageLabels.js';

interface CrmBoardUser {
  id: string;
  name: string;
}

interface CrmBoardBatchBarProps {
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  columns: LeadStatus[];
  users: CrmBoardUser[];
  isBatchUpdating: boolean;
  onBatchMoveStage: (newStatus: string) => void;
  onBatchReassignOwner: (ownerId: string) => void;
  onBatchEnrichSelected: () => void;
  onBatchExportBitrix: () => void;
  onClearSelection: () => void;
}

/** Barra flutuante de ações em lote do CrmBoard — extraída na TAREFA-SANEAMENTO-002 (W4).
 *  JSX preservado verbatim; retorna null sem seleção (mesmo comportamento do
 *  condicional `{selectedLeadIds.size > 0 && ...}` original). */
export function CrmBoardBatchBar({
  selectedCount,
  allSelected,
  onSelectAll,
  columns,
  users,
  isBatchUpdating,
  onBatchMoveStage,
  onBatchReassignOwner,
  onBatchEnrichSelected,
  onBatchExportBitrix,
  onClearSelection,
}: CrmBoardBatchBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface/95 backdrop-blur-xl border border-brand/30 shadow-elevated dark:shadow-[0_0_28px_rgba(0,212,255,0.18)] rounded-2xl p-3 px-5 flex flex-wrap items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2 pr-3 border-r border-line">
        <span className="w-6 h-6 rounded-full bg-brand text-on-brand text-xs font-black flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-xs font-bold text-ink">selecionado(s)</span>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-[11px] font-bold text-brand hover:underline ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          {allSelected ? 'Desmarcar Todos' : 'Todos'}
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
              if (e.target.value) onBatchMoveStage(e.target.value);
            }}
            disabled={isBatchUpdating}
            defaultValue=""
            className="px-2.5 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Mover para...
            </option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {formatStageLabel(col)}
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
              if (e.target.value) onBatchReassignOwner(e.target.value);
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
          onClick={onBatchEnrichSelected}
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
          onClick={onBatchExportBitrix}
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
          onClick={onClearSelection}
          className="p-1.5 rounded-xl hover:bg-surface-2 text-ink-2 hover:text-ink transition-colors"
          title="Desmarcar todos"
        >
          <X className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}

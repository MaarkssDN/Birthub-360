/**
 * Alternador de modo (Negócios x Leads) + métricas de seleção + ações de importação
 * em lote. Extraído de BitrixImportPanel.tsx (TAREFA-SANEAMENTO-004 / BT360-DT-0030).
 */

import { Building2, DollarSign, Download, Edit3, Loader2, Users } from 'lucide-react';
import type { BitrixImportMode } from './types.js';

interface BitrixImportToolbarProps {
  mode: BitrixImportMode;
  onModeChange: (mode: BitrixImportMode) => void;
  totalSelectedValue: number;
  selectedCount: number;
  importing: boolean;
  onOpenBulkEdit: () => void;
  onImportSelected: () => void;
}

export function BitrixImportToolbar({
  mode,
  onModeChange,
  totalSelectedValue,
  selectedCount,
  importing,
  onOpenBulkEdit,
  onImportSelected,
}: BitrixImportToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-1.5 p-1.5 bg-surface-2 rounded-2xl border border-line w-fit">
        <button
          type="button"
          onClick={() => onModeChange('deals')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-colors ${mode === 'deals' ? 'bg-gradient-to-r from-brand-active to-brand-2 text-on-brand shadow-md shadow-brand-active/30' : 'text-ink-2 hover:text-ink'}`}
        >
          <Building2 className="w-4 h-4" />
          Negócios (Comercial)
        </button>
        <button
          type="button"
          onClick={() => onModeChange('leads')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-colors ${mode === 'leads' ? 'bg-gradient-to-r from-brand-active to-brand-2 text-on-brand shadow-md shadow-brand-active/30' : 'text-ink-2 hover:text-ink'}`}
        >
          <Users className="w-4 h-4" />
          Leads (Todos)
        </button>
      </div>

      {/* Métricas dos Selecionados */}
      <div className="flex items-center gap-3">
        {mode === 'deals' && totalSelectedValue > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold">
            <DollarSign className="w-4 h-4" />
            Total Selecionado: R$ {totalSelectedValue.toLocaleString('pt-BR')}
          </div>
        )}

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBulkEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-2 hover:bg-line text-ink text-xs font-bold rounded-xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar em Lote ({selectedCount})
            </button>
            <button
              type="button"
              onClick={onImportSelected}
              disabled={importing}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-active to-brand-2 hover:brightness-110 text-on-brand text-xs font-bold rounded-xl shadow-md shadow-brand-active/20 transition-colors disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {importing ? 'Importando...' : `Importar Selecionados (${selectedCount})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

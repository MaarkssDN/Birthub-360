/**
 * Card de Negócio (Deal) do importador Bitrix24.
 * Extraído de BitrixImportPanel.tsx (TAREFA-SANEAMENTO-004 / BT360-DT-0030).
 */

import { Building2, CalendarDays, Check, DollarSign, Loader2, Tag, Users, Zap } from 'lucide-react';
import type { BitrixDealSummary } from './types.js';

interface BitrixImportDealCardProps {
  deal: BitrixDealSummary;
  selected: boolean;
  importingBulk: boolean;
  importingSingle: boolean;
  userName: (id: string | null) => string | null;
  onToggle: () => void;
  onImportSingle: () => void;
}

export function BitrixImportDealCard({
  deal,
  selected,
  importingBulk,
  importingSingle,
  userName,
  onToggle,
  onImportSingle,
}: BitrixImportDealCardProps) {
  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border transition-colors ${
        deal.alreadyImported
          ? 'opacity-50 bg-surface-2 border-line'
          : selected
            ? 'bg-brand/10 border-brand/50 shadow-md shadow-brand/5 ring-1 ring-brand/30'
            : 'bg-surface border-line hover:border-brand/40 hover:bg-soft shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="pt-1 shrink-0">
          <input
            type="checkbox"
            checked={selected}
            disabled={deal.alreadyImported}
            onChange={onToggle}
            className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
          />
        </div>

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-soft text-brand-ink dark:text-brand flex items-center justify-center shrink-0 font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-ink text-sm truncate">{deal.title}</h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soft text-brand-ink dark:text-brand border border-brand/20 text-[10px] font-bold">
              <Tag className="w-3 h-3" />
              {deal.stageLabel}
            </span>
            {deal.alreadyImported && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 text-[10px] font-bold">
                <Check className="w-3 h-3" /> Já Importado
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-2">
            {deal.assignedById && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-ink-2" />
                {userName(deal.assignedById)}
              </span>
            )}
            {deal.opportunity && (
              <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                <DollarSign className="w-3.5 h-3.5" />
                R$ {Number(deal.opportunity).toLocaleString('pt-BR')}
              </span>
            )}
            {deal.dateCreate && (
              <span className="flex items-center gap-1 text-ink-2">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(deal.dateCreate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ação Individual de 1 Clique */}
      {!deal.alreadyImported && (
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          <button
            type="button"
            onClick={onImportSingle}
            disabled={importingSingle || importingBulk}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-soft hover:bg-brand/20 text-brand-ink dark:text-brand border border-brand/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            {importingSingle ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-brand" />
            )}
            {importingSingle ? 'Importando...' : 'Importar Agora'}
          </button>
        </div>
      )}
    </div>
  );
}

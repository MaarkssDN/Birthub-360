/**
 * Card de Lead do importador Bitrix24.
 * Extraído de BitrixImportPanel.tsx (TAREFA-SANEAMENTO-004 / BT360-DT-0030).
 */

import {
  CalendarDays,
  Check,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import type { BitrixLeadSummary } from './types.js';

interface BitrixImportLeadCardProps {
  lead: BitrixLeadSummary;
  selected: boolean;
  importingBulk: boolean;
  importingSingle: boolean;
  onToggle: () => void;
  onImportSingle: () => void;
}

export function BitrixImportLeadCard({
  lead,
  selected,
  importingBulk,
  importingSingle,
  onToggle,
  onImportSingle,
}: BitrixImportLeadCardProps) {
  const whatsappUrl = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}` : null;

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border transition-colors ${
        lead.alreadyImported
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
            disabled={lead.alreadyImported}
            onChange={onToggle}
            className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
          />
        </div>

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-soft text-brand-ink dark:text-brand flex items-center justify-center shrink-0 font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-ink text-sm truncate">{lead.title}</h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soft text-brand-ink dark:text-brand border border-brand/20 text-[10px] font-bold">
              <Tag className="w-3 h-3" />
              {lead.statusLabel}
            </span>
            {lead.alreadyImported && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 text-[10px] font-bold">
                <Check className="w-3 h-3" /> Já Importado
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink">
            {lead.contactName && (
              <span className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-ink-2" />
                {lead.contactName}
              </span>
            )}

            {lead.phone && (
              <span className="flex items-center gap-1 text-ink-2">
                <Phone className="w-3.5 h-3.5 text-green-500" />
                {lead.phone}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-green-600 hover:text-green-700 inline-flex items-center gap-0.5 text-[10px] font-bold bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded"
                    title="Abrir no WhatsApp"
                  >
                    WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </span>
            )}

            {lead.email && (
              <span className="flex items-center gap-1 text-ink-2">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <a href={`mailto:${lead.email}`} className="hover:underline">
                  {lead.email}
                </a>
              </span>
            )}

            {lead.dateCreate && (
              <span className="flex items-center gap-1 text-ink-2 ml-auto">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(lead.dateCreate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ação Individual de 1 Clique */}
      {!lead.alreadyImported && (
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

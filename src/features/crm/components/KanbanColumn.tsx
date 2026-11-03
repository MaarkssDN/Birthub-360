import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import React from 'react';
import { LEAD_STATUS_EMOJI as STATUS_EMOJI } from '../../../lib/enumMap.js';
import type { Lead, LeadStatus } from '../../../types/index.js';
import { KanbanCard } from './KanbanCard.js';

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  onCardEnrich?: (leadId: string) => Promise<void>;
  onConvert?: (leadId: string) => Promise<void>;
  selectedLeadIds?: Set<string>;
  onToggleSelect?: (leadId: string) => void;
  selectionMode?: boolean;
  ownerNameById?: Record<string, string>;
}

export const KanbanColumn = React.memo(function KanbanColumn({
  status,
  leads,
  onCardClick,
  onCardEnrich,
  onConvert,
  selectedLeadIds,
  onToggleSelect,
  selectionMode,
  ownerNameById,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  const totalForecast = leads.reduce((acc, lead) => {
    const val = typeof lead.amount === 'number' ? lead.amount : 0;
    const prob = typeof lead.probability === 'number' ? lead.probability : 0;
    const probMultiplier = prob > 1 ? prob / 100 : prob;
    return acc + val * probMultiplier;
  }, 0);

  const scoredLeads = leads.filter((l) => typeof l.score === 'number' && l.score > 0);
  const avgScore =
    scoredLeads.length > 0
      ? Math.round(scoredLeads.reduce((acc, l) => acc + (l.score || 0), 0) / scoredLeads.length)
      : 0;

  const stagnantCount = leads.filter((l) => {
    const lastDate = l.lastInteraction || l.updatedAt || l.createdAt;
    if (!lastDate) return false;
    const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    return days > 7;
  }).length;

  return (
    <div
      ref={setNodeRef}
      className={`relative flex max-h-full min-w-[320px] max-w-[320px] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border motion-safe:transition-colors motion-safe:duration-200 ${
        isOver
          ? 'border-[#00D4FF] bg-[#00D4FF]/5 dark:bg-[#00D4FF]/10 ring-2 ring-[#00D4FF]/25'
          : 'border-[#E2E8F0] dark:border-white/10 bg-[#F4F6F9]/80 dark:bg-[#0D0F14]'
      }`}
    >
      {/* Sticky Sculpted Column Header */}
      <div className="sticky top-0 z-10 flex flex-col gap-1.5 border-b border-line/60 bg-white/95 dark:bg-[#14161C]/95 backdrop-blur-xl px-4 pb-3.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-2 text-xs font-extrabold tracking-wide text-[#1E4E75] dark:text-[#90D2FF] uppercase font-display">
            <span className="shrink-0 text-sm" aria-hidden="true">
              {STATUS_EMOJI[status] || '📌'}
            </span>
            <span className="line-clamp-2 leading-tight">{status}</span>
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {stagnantCount > 0 && (
              <span
                title={`${stagnantCount} lead(s) estagnado(s) há mais de 7 dias nesta etapa`}
                className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-700 dark:text-rose-400"
              >
                {stagnantCount}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-bold tabular-nums text-ink px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 border border-line/50">
              {leads.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_6px_#00D4FF]" />
              )}
              {leads.length}
            </span>
          </div>
        </div>

        {/* Telemetria da Coluna: Forecast e Score Médio */}
        <div className="text-xs font-semibold tabular-nums text-ink-2 flex items-center justify-between pt-0.5">
          {totalForecast > 0 ? (
            <span className="text-[#059669] dark:text-[#34D399] font-mono">
              Forecast:{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totalForecast)}
            </span>
          ) : (
            <span className="text-ink-3 text-[11px]">Sem valor ponderado</span>
          )}
          {avgScore > 0 && (
            <span className="text-[11px] font-mono text-ink-2">
              ICP Médio: <b className="text-[#00D4FF] font-bold">{avgScore}</b>
            </span>
          )}
        </div>
      </div>

      {/* Cards List / Scroll Area */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 scrollbar-thin">
        <SortableContext items={leads.map((lead) => lead.id)} strategy={rectSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onClick={onCardClick}
              onEnrich={onCardEnrich}
              onConvert={onConvert}
              isSelected={selectedLeadIds?.has(lead.id)}
              onToggleSelect={onToggleSelect}
              selectionMode={selectionMode}
              ownerNameById={ownerNameById}
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="grid h-32 place-items-center rounded-[1.25rem] border border-dashed border-line/70 p-4 text-center text-xs text-ink-3">
            Nenhum negócio nesta etapa
          </div>
        )}
      </div>
    </div>
  );
});

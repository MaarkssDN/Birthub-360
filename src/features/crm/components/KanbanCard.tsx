import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRightCircle,
  Building2,
  Calendar,
  CheckSquare,
  Loader2,
  Sparkles,
  Square,
  User,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { TechToolLogo } from '../../../components/ui/TechToolLogo.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import type { Lead } from '../../../types/index.js';

const SCORE_BADGE_CLASS: Record<string, string> = {
  Quente:
    'border-[#D4F434]/50 bg-[#D4F434]/15 text-[#415900] dark:text-[#D4F434] shadow-[0_0_8px_rgba(212,244,52,0.2)]',
  Morno:
    'border-[#F59E0B]/50 bg-[#F59E0B]/15 text-[#B45309] dark:text-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.2)]',
  Frio: 'border-line bg-surface-2 text-ink-2',
};
const DEFAULT_SCORE_BADGE_CLASS = SCORE_BADGE_CLASS.Morno;

function getStagnationBadge(days: number) {
  if (days <= 2) {
    return {
      label: `${days === 0 ? 'Hoje' : `${days}d`} sem parada`,
      className:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold',
      dot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    };
  }
  if (days <= 7) {
    return {
      label: `${days}d parado`,
      className:
        'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold',
      dot: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    };
  }
  return {
    label: `${days}d estagnado`,
    className: 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-400 font-bold',
    dot: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]',
  };
}

interface KanbanCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onEnrich?: (leadId: string) => Promise<void>;
  onConvert?: (leadId: string) => Promise<void>;
  isSelected?: boolean;
  onToggleSelect?: (leadId: string) => void;
  selectionMode?: boolean;
  ownerNameById?: Record<string, string>;
}

export const KanbanCard = React.memo(function KanbanCard({
  lead,
  onClick,
  onEnrich,
  onConvert,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
  ownerNameById,
}: KanbanCardProps) {
  const [enriching, setEnriching] = useState(false);
  const [converting, setConverting] = useState(false);
  const techRowRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const companyTech = lead.company?.technologies || [];
  const companyName = lead.company?.tradeName || lead.company?.legalName || '';
  const hasCompanyName = companyName.length > 0;

  const lastActivityDate = lead.lastInteraction || lead.updatedAt || lead.createdAt;
  const daysStale = lastActivityDate
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const stagnation = getStagnationBadge(daysStale);

  const isBitrixSynced = Boolean(lead.bitrixLeadId || lead.bitrixDealId);

  useEffect(() => {
    const buttons = techRowRef.current?.querySelectorAll('button');
    buttons?.forEach((btn: HTMLButtonElement) => {
      btn.tabIndex = -1;
    });
  }, []);

  const handleEnrich = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onEnrich || enriching) return;
    SoundFX.play('click');
    setEnriching(true);
    try {
      await onEnrich(lead.id);
      SoundFX.play('success');
    } finally {
      setEnriching(false);
    }
  };

  const handleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onConvert || converting) return;
    SoundFX.play('click');
    setConverting(true);
    try {
      await onConvert(lead.id);
      SoundFX.play('success');
    } finally {
      setConverting(false);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    SoundFX.play('click');
    onToggleSelect?.(lead.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-[1.25rem] border bg-white dark:bg-[#14161C] shadow-[0_4px_16px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_-4px_rgba(0,212,255,0.14)] motion-safe:transition-all motion-safe:duration-200 ${
        isSelected
          ? 'border-[#00D4FF] bg-[color:color-mix(in_srgb,var(--brand)_8%,var(--surface))] ring-2 ring-[#00D4FF]/30'
          : 'border-line/80 hover:border-[#00D4FF]/50'
      } ${isDragging ? 'z-50 shadow-card' : ''}`}
    >
      {(selectionMode || isSelected) && (
        <button
          type="button"
          onClick={handleCheckboxClick}
          aria-label={isSelected ? `Desmarcar ${companyName}` : `Selecionar ${companyName}`}
          className="absolute top-3 left-3 z-20 grid h-7 w-7 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-brand fill-brand/20" />
          ) : (
            <Square className="w-4 h-4 text-ink-3" />
          )}
        </button>
      )}

      {/* biome-ignore lint/a11y/useSemanticElements: elemento é alvo de useDraggable (dnd-kit) */}
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if (e.key === 'Enter') {
            SoundFX.play('click');
            onClick(lead);
          }
        }}
        onMouseEnter={() => {
          SoundFX.play('hover');
        }}
        onClick={() => {
          SoundFX.play('click');
          onClick(lead);
        }}
        className={`p-4 pb-0 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg ${
          selectionMode || isSelected ? 'pl-9' : ''
        }`}
      >
        {/* Cabeçalho do Card: Empresa, Temperatura e Score */}
        <div className="flex justify-between items-start gap-2 mb-2">
          {hasCompanyName ? (
            <h4
              title={companyName}
              className="line-clamp-2 text-sm font-extrabold leading-snug tracking-tight text-[#0F2942] dark:text-[#E2F1FF] group-hover:text-[#00D4FF] dark:group-hover:text-[#00D4FF] transition-colors"
            >
              {companyName}
            </h4>
          ) : (
            <h4 className="text-sm font-semibold text-ink-2">
              Sem empresa{' '}
              <span className="text-xs font-normal opacity-70">· dados incompletos</span>
            </h4>
          )}
          {lead.score !== undefined && lead.score !== null ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${
                lead.score >= 70
                  ? SCORE_BADGE_CLASS.Quente
                  : lead.score >= 40
                    ? SCORE_BADGE_CLASS.Morno
                    : SCORE_BADGE_CLASS.Frio
              }`}
            >
              {lead.score}
            </span>
          ) : lead.temperature ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                SCORE_BADGE_CLASS[lead.temperature] ?? DEFAULT_SCORE_BADGE_CLASS
              }`}
            >
              {lead.temperature}
            </span>
          ) : null}
        </div>

        {/* Badges Informativas */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span
            title={`Última atividade: ${new Date(lastActivityDate || '').toLocaleDateString('pt-BR')}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] ${stagnation.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${stagnation.dot}`} />
            {stagnation.label}
          </span>

          {lead.forecastProbabilityAi != null && (
            <span
              title="Probabilidade ajustada pelo Copiloto IA"
              className="inline-flex items-center gap-1 rounded-full border border-[#8B7DFF]/30 bg-[#8B7DFF]/10 px-2 py-0.5 text-[10.5px] font-bold text-[#8B7DFF]"
            >
              <Sparkles className="w-2.5 h-2.5" />
              {lead.forecastProbabilityAi}% IA
            </span>
          )}

          {isBitrixSynced && (
            <span
              title={`Sincronizado no Bitrix24 (ID #${lead.bitrixLeadId || lead.bitrixDealId})`}
              className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10.5px] font-bold text-sky-700 dark:text-sky-400"
            >
              Bitrix #{lead.bitrixLeadId || lead.bitrixDealId}
            </span>
          )}

          {Boolean(lead.customFields?.voiceQualified) && (
            <span className="inline-flex items-center rounded-full border border-[#FF2D9B]/30 bg-[#FF2D9B]/10 px-2 py-0.5 text-[10.5px] font-bold text-[#FF2D9B]">
              Voz Qualificada
            </span>
          )}

          {lead.company?.enrichmentStatus === 'Enriquecendo' ? (
            <span
              title="Enriquecimento automático em andamento..."
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-800 dark:text-amber-300"
            >
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Enriquecendo
            </span>
          ) : lead.company?.enrichmentStatus === 'Enriquecido' ? (
            <span
              title={`Empresa enriquecida via ${lead.company.enrichmentSource || 'Receita Federal'}`}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-800 dark:text-emerald-400"
            >
              <Sparkles className="h-2.5 w-2.5 text-emerald-500" strokeWidth={1.5} />
              {lead.company.enrichmentSource?.includes('Apollo') ? 'Apollo' : 'Enriquecido'}
            </span>
          ) : lead.company?.enrichmentStatus === 'Falhou' ? (
            <span
              title="Última tentativa de enriquecimento falhou"
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10.5px] font-medium text-rose-700 dark:text-rose-400"
            >
              Falha Enriq.
            </span>
          ) : null}
        </div>

        {/* Valor da Oportunidade / Deal Amount */}
        {typeof lead.amount === 'number' && lead.amount > 0 && (
          <div className="flex items-center justify-between mb-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-line/50">
            <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(lead.amount)}
            </span>
            {typeof lead.probability === 'number' && (
              <span className="text-[11px] font-mono font-bold text-[#00D4FF]">
                {lead.probability}% win
              </span>
            )}
          </div>
        )}

        {/* Dados de Contato e Segmento */}
        <div className="space-y-1.5 mt-2 text-xs">
          {lead.contact && (
            <div className="flex items-center gap-1.5 text-[#305070] dark:text-[#90B0D0] font-medium">
              <User className="w-3.5 h-3.5 text-[#00D4FF]/70" />
              <span className="truncate">{lead.contact.name}</span>
            </div>
          )}
          {lead.company?.segment && (
            <div className="flex items-center gap-1.5 text-ink-2">
              <Building2 className="w-3.5 h-3.5 text-ink-3" />
              <span className="truncate">{lead.company.segment}</span>
            </div>
          )}

          {companyTech.length > 0 && (
            <>
              <div ref={techRowRef} aria-hidden="true" className="flex flex-wrap gap-1 pt-1">
                {companyTech.slice(0, 3).map((tech: string, i: number) => (
                  <TechToolLogo key={i} techName={tech} size="sm" />
                ))}
              </div>
              <span className="sr-only">
                Tecnologias detectadas: {companyTech.slice(0, 3).join(', ')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Rodapé do Card com Ações Rápidas */}
      <div className="flex items-center justify-between mx-4 mb-3.5 mt-3 pt-2.5 border-t border-line/60">
        <div className="flex items-center gap-1.5 text-[10.5px] text-ink-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-ink-3" />
          {new Date(lead.updatedAt || lead.createdAt || '').toLocaleDateString('pt-BR')}
          {lead.owner && (
            <span className="truncate">· {ownerNameById?.[lead.owner] ?? lead.owner}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onConvert && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              title="Converter em oportunidade"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#00D4FF] to-[#0284c7] hover:opacity-95 disabled:opacity-50 transition-all shadow-xs"
            >
              {converting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowRightCircle className="w-3 h-3" />
              )}
              {converting ? 'Convertendo...' : 'Converter'}
            </button>
          )}
          {onEnrich && lead.companyId && (
            <button
              type="button"
              onClick={handleEnrich}
              disabled={enriching || lead.company?.enrichmentStatus === 'Enriquecendo'}
              title={
                lead.company?.enrichmentStatus === 'Enriquecendo'
                  ? 'Enriquecimento automático em andamento...'
                  : 'Reenriquecer dados cadastrais e firmográficos'
              }
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-2 hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink disabled:opacity-50 transition-all border border-line/50"
            >
              {enriching || lead.company?.enrichmentStatus === 'Enriquecendo' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-[#FF2D9B]" />
              )}
              {enriching || lead.company?.enrichmentStatus === 'Enriquecendo'
                ? '...'
                : 'Enriquecer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

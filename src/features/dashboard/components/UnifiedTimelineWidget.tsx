import type React from 'react';
import { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  PhoneCall,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import {
  type UnifiedTimelineEntityType,
  type UnifiedTimelineEvent,
  type UnifiedTimelineOutcome,
  type UnifiedTimelineQuery,
  useUnifiedTimeline,
} from '../../../hooks/useDatabase.js';
import { fadeIn, staggerContainer, staggerItem } from '../../../lib/motion.js';

const PERIOD_LABELS: Record<NonNullable<UnifiedTimelineQuery['period']>, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
  all: 'Todos',
};

const ENTITY_TYPE_CONFIG: Record<
  UnifiedTimelineEntityType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  lead: {
    label: 'Lead',
    icon: UserPlus,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  deal: {
    label: 'Negociação',
    icon: DollarSign,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  call: {
    label: 'Chamada',
    icon: PhoneCall,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  email: {
    label: 'E-mail',
    icon: Mail,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-600/10 border-emerald-600/20',
  },
  automation: {
    label: 'Automação',
    icon: Zap,
    color: 'text-cyan-500 dark:text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
};

const OUTCOME_CONFIG: Record<
  UnifiedTimelineOutcome,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
> = {
  success: {
    label: 'Concluído',
    icon: CheckCircle2,
    color: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20',
  },
  pending: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-amber-800 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20',
  },
  failed: {
    label: 'Falha / Cancelado',
    icon: AlertCircle,
    color: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/20',
  },
};

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHours < 24) return `Há ${diffHours} h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function UnifiedTimelineWidget() {
  const [period, setPeriod] = useState<UnifiedTimelineQuery['period']>('30d');
  const [entityType, setEntityType] = useState<UnifiedTimelineQuery['entityType']>('all');
  const [outcome, setOutcome] = useState<UnifiedTimelineQuery['outcome']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputId = useId();

  const query = useMemo<UnifiedTimelineQuery>(
    () => ({
      period,
      entityType,
      outcome,
      search: searchTerm.trim() || undefined,
      limit: 100,
    }),
    [period, entityType, outcome, searchTerm],
  );

  const { events, loading, error, refetch } = useUnifiedTimeline(query);

  const handleExportCsv = () => {
    if (!events.length) return;
    const header = [
      'Data e Hora',
      'Tipo',
      'Título',
      'Descrição',
      'Responsável',
      'Alvo/Contato',
      'Resultado',
    ].join(';');

    const escapeCell = (val?: string) => {
      if (!val) return '""';
      const clean = val.replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${clean}"`;
    };

    const rows = events.map((e) => {
      const formattedDate = new Date(e.timestamp).toLocaleString('pt-BR');
      const outcomeLabel = OUTCOME_CONFIG[e.outcome]?.label ?? e.outcome;
      const typeLabel = ENTITY_TYPE_CONFIG[e.entityType]?.label ?? e.entityType;
      return [
        escapeCell(formattedDate),
        escapeCell(typeLabel),
        escapeCell(e.title),
        escapeCell(e.description),
        escapeCell(e.actor),
        escapeCell(e.targetName),
        escapeCell(outcomeLabel),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `timeline-auditoria-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintAudit = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setPeriod('30d');
    setEntityType('all');
    setOutcome('all');
    setSearchTerm('');
  };

  return (
    <Card className="p-6 space-y-6 relative border-line bg-surface/90 backdrop-blur-md shadow-sm">
      {/* ── HEADER & AUDIT ACTIONS ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand/10 text-brand border border-brand/20">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink tracking-tight font-display">
                  Timeline Unificada Cross-Entity
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand/10 text-brand border border-brand/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Auditoria 360°
                </span>
              </div>
              <p className="text-xs text-ink-2 font-interface">
                Rastreamento cronológico ponta a ponta de leads, negociações, chamadas, WhatsApp e
                automações.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || events.length === 0}
            className="gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
            title="Exportar dados para planilha Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Excel / CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintAudit}
            disabled={loading || events.length === 0}
            className="gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
            title="Imprimir relatório de auditoria / Salvar como PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>Auditoria PDF</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 rounded-xl text-ink-2 hover:text-ink cursor-pointer"
            title="Atualizar timeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── CONTEXTUAL FILTERS TOOLBAR ─────────────────────────────────────── */}
      <div className="space-y-3 p-3.5 rounded-2xl bg-surface-2/60 border border-line">
        {/* Row 1: Search & Period */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">
              Buscar na timeline
            </label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por contato, empresa, responsável ou evento..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-2 focus:outline-hidden focus:ring-1 focus:ring-brand font-interface transition-all"
            />
          </div>

          <div className="flex items-center gap-1 self-start md:self-auto p-1 rounded-xl bg-surface border border-line">
            <span className="text-[11px] font-semibold text-ink-2 px-2 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand" />
              Período:
            </span>
            {(['today', '7d', '30d', 'all'] as const).map((p) => {
              const isSelected = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand text-white font-bold shadow-xs'
                      : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Entity Types & Outcomes */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-2 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-brand" />
              Tipo:
            </span>
            <button
              type="button"
              onClick={() => setEntityType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entityType === 'all'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'bg-surface text-ink-2 hover:text-ink border border-line'
              }`}
            >
              Todos
            </button>
            {(Object.keys(ENTITY_TYPE_CONFIG) as UnifiedTimelineEntityType[]).map((typeKey) => {
              const cfg = ENTITY_TYPE_CONFIG[typeKey];
              const Icon = cfg.icon;
              const isSelected = entityType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setEntityType(typeKey)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand text-white font-bold shadow-xs'
                      : 'bg-surface text-ink-2 hover:text-ink border border-line'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-2 mr-1">Resultado:</span>
            <button
              type="button"
              onClick={() => setOutcome('all')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                outcome === 'all'
                  ? 'bg-ink text-surface'
                  : 'bg-surface text-ink-2 hover:text-ink border border-line'
              }`}
            >
              Todos
            </button>
            {(Object.keys(OUTCOME_CONFIG) as UnifiedTimelineOutcome[]).map((outKey) => {
              const cfg = OUTCOME_CONFIG[outKey];
              const isSelected = outcome === outKey;
              return (
                <button
                  key={outKey}
                  type="button"
                  onClick={() => setOutcome(outKey)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? cfg.badge + ' font-extrabold ring-1 ring-brand'
                      : 'bg-surface text-ink-2 border-line hover:text-ink'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TIMELINE EVENTS STREAM ─────────────────────────────────────────── */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl bg-surface/50 border border-line"
              >
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="py-12 px-4 text-center rounded-2xl bg-surface-2/40 border border-line space-y-3">
            <div className="inline-flex p-3 rounded-full bg-brand/10 text-brand">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">Nenhum evento localizado</h4>
              <p className="text-xs text-ink-2 max-w-sm mx-auto">
                Não foram encontrados registros para os filtros selecionados. Tente ajustar o
                período ou o tipo de atividade.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
            <motion.div
              variants={staggerContainer(0.04, 0)}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {events.map((event) => {
                const typeCfg = ENTITY_TYPE_CONFIG[event.entityType] ?? ENTITY_TYPE_CONFIG.lead;
                const outCfg = OUTCOME_CONFIG[event.outcome] ?? OUTCOME_CONFIG.pending;
                const Icon = typeCfg.icon;
                const OutcomeIcon = outCfg.icon;

                return (
                  <motion.div
                    key={event.id}
                    variants={staggerItem}
                    className="relative group rounded-2xl border border-line bg-surface p-4 hover:border-brand/40 hover:shadow-xs transition-all"
                  >
                    {/* Node marker pin on timeline track */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center shadow-xs ${typeCfg.bg} ${typeCfg.color}`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeCfg.bg} ${typeCfg.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {typeCfg.label}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${outCfg.badge}`}
                          >
                            <OutcomeIcon className="w-2.5 h-2.5" />
                            {outCfg.label}
                          </span>

                          <span className="text-[11px] font-semibold text-ink-2 font-mono">
                            {formatRelativeTime(event.timestamp)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-ink group-hover:text-brand transition-colors">
                          {event.title}
                        </h4>

                        {event.description && (
                          <p className="text-xs text-ink-2 font-interface leading-relaxed">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-ink-2 font-interface">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <User className="w-3 h-3 text-brand" />
                            {event.actor}
                          </span>

                          {event.targetName && (
                            <span className="inline-flex items-center gap-1 font-semibold text-ink">
                              <Building2 className="w-3 h-3 text-ink-2" />
                              {event.targetName}
                            </span>
                          )}

                          <span className="text-[10px] text-ink-2/80 font-mono">
                            {new Date(event.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>

      {/* ── PRINT-ONLY AUDIT STYLES ────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root, #root * {
            visibility: visible;
          }
          header, nav, aside, button, input {
            display: none !important;
          }
        }
      `}</style>
    </Card>
  );
}

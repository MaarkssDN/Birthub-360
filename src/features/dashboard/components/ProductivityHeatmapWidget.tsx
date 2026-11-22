import { useState } from 'react';
import {
  Calendar,
  Clock,
  Flame,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  RotateCw,
  Sparkles,
  Trophy,
  Users,
  Video,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import {
  useProductivityHeatmap,
  type ProductivityHeatmapSlot,
} from '../../../hooks/useDatabase.js';

const DAYS_OF_WEEK = [
  { day: 0, label: 'Dom', full: 'Domingo' },
  { day: 1, label: 'Seg', full: 'Segunda-feira' },
  { day: 2, label: 'Ter', full: 'Terça-feira' },
  { day: 3, label: 'Qua', full: 'Quarta-feira' },
  { day: 4, label: 'Qui', full: 'Quinta-feira' },
  { day: 5, label: 'Sex', full: 'Sexta-feira' },
  { day: 6, label: 'Sáb', full: 'Sábado' },
];

const BUSINESS_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);

type HeatmapMetric = 'all' | 'calls' | 'meetings' | 'messages' | 'conversions';

export function ProductivityHeatmapWidget() {
  const [metric, setMetric] = useState<HeatmapMetric>('all');
  const [showFull24h, setShowFull24h] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ProductivityHeatmapSlot | null>(null);
  const { data: slots, loading, error, refetch } = useProductivityHeatmap(30);

  const hoursToDisplay = showFull24h ? ALL_HOURS : BUSINESS_HOURS;

  if (loading && !slots) {
    return (
      <Card variant="panel" padding="default" className="shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <Skeleton className="h-6 w-52 rounded-lg bg-surface-subtle" />
          <Skeleton className="h-8 w-40 rounded-lg bg-surface-subtle" />
        </div>
        <Skeleton className="h-64 rounded-xl bg-surface-subtle w-full" />
      </Card>
    );
  }

  if (error && !slots) {
    return (
      <Card
        variant="panel"
        padding="default"
        className="shadow-card border-rose-500/20 bg-rose-500/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            Falha ao carregar mapa de calor de produtividade
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </Card>
    );
  }

  const slotMap = new Map<string, ProductivityHeatmapSlot>();
  for (const s of slots ?? []) {
    slotMap.set(`${s.dayOfWeek}-${s.hour}`, s);
  }

  const getMetricValue = (slot: ProductivityHeatmapSlot | undefined, m: HeatmapMetric): number => {
    if (!slot) return 0;
    switch (m) {
      case 'calls':
        return slot.calls;
      case 'meetings':
        return slot.meetings;
      case 'messages':
        return slot.messages;
      case 'conversions':
        return slot.conversions;
      default:
        return slot.totalActivities;
    }
  };

  let maxVal = 1;
  let bestSlot: ProductivityHeatmapSlot | null = null;
  let bestVal = 0;

  for (const s of slots ?? []) {
    const val = getMetricValue(s, metric);
    if (val > maxVal) maxVal = val;
    if (val > bestVal) {
      bestVal = val;
      bestSlot = s;
    }
  }

  const getColorClasses = (count: number) => {
    if (count === 0) {
      return 'bg-surface-2 text-ink-3/40 border border-line/30';
    }
    const ratio = count / maxVal;
    if (metric === 'conversions') {
      if (ratio > 0.6) return 'bg-emerald-500 text-white font-bold shadow-sm';
      if (ratio > 0.3) return 'bg-emerald-500/60 text-white font-semibold';
      return 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
    }
    if (metric === 'meetings') {
      if (ratio > 0.6) return 'bg-iris text-white font-bold shadow-sm';
      if (ratio > 0.3) return 'bg-iris/70 text-white font-semibold';
      return 'bg-iris/25 text-iris border border-iris/30';
    }
    if (metric === 'messages') {
      if (ratio > 0.6) return 'bg-cyan-500 text-white font-bold shadow-sm';
      if (ratio > 0.3) return 'bg-cyan-500/60 text-white font-semibold';
      return 'bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30';
    }
    // 'all' ou 'calls' -> Brand
    if (ratio > 0.6) return 'bg-brand text-white font-bold shadow-sm';
    if (ratio > 0.3) return 'bg-brand/70 text-[#121316] font-semibold';
    return 'bg-brand/20 text-emerald-800 dark:text-brand border border-brand/30';
  };

  const bestDayLabel = bestSlot
    ? DAYS_OF_WEEK.find((d) => d.day === bestSlot?.dayOfWeek)?.full
    : '';

  return (
    <Card variant="panel" padding="default" className="shadow-card space-y-5">
      {/* ── HEADER COM FILTROS DE CAMADA ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand" />
              Heatmap de Produtividade & Conversão por Horário
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand uppercase">
              Últimos 30 dias
            </span>
          </div>
          <p className="text-xs text-ink-2 font-interface mt-1">
            Mapeamento da cadência operacional da equipe para identificar janelas de ouro e picos de
            conversão.
          </p>
        </div>

        {/* Botões de Filtro */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-2 border border-line text-xs">
          <button
            type="button"
            onClick={() => setMetric('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              metric === 'all' ? 'bg-brand text-white shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setMetric('calls')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              metric === 'calls' ? 'bg-brand text-white shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <PhoneCall className="w-3 h-3" />
            <span>Ligações</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('meetings')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              metric === 'meetings' ? 'bg-iris text-white shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Reuniões</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('messages')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              metric === 'messages'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Mensagens</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('conversions')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              metric === 'conversions'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>Ganhos</span>
          </button>
        </div>
      </div>

      {/* ── INSIGHT DA JANELA DE OURO ──────────────────────────────────────── */}
      {bestSlot && bestVal > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand animate-pulse" />
            <span className="font-semibold text-ink">
              Janela de Ouro:{' '}
              <strong className="text-brand">
                {bestDayLabel} das {String(bestSlot.hour).padStart(2, '0')}:00 às{' '}
                {String(bestSlot.hour + 1).padStart(2, '0')}:00
              </strong>
            </span>
            <span className="text-ink-2">
              ({bestVal} {metric === 'conversions' ? 'fechamentos' : 'interações'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFull24h(!showFull24h)}
              className="text-[11px] font-semibold text-ink-2 hover:text-ink underline cursor-pointer"
            >
              {showFull24h ? 'Ver horário comercial (08h-20h)' : 'Ver 24 horas completas'}
            </button>
          </div>
        </div>
      )}

      {/* ── MATRIZ SEMANAL (7 DIAS X HORÁRIOS) ──────────────────────────────── */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px] space-y-1.5">
          {/* Header com Horários */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-ink-2 pb-1">
            <div className="w-10 text-right pr-2 shrink-0 font-sans font-bold text-ink-3">Dia</div>
            {hoursToDisplay.map((h) => (
              <div key={h} className="flex-1 text-center font-bold">
                {String(h).padStart(2, '0')}h
              </div>
            ))}
          </div>

          {/* Linhas dos Dias */}
          {DAYS_OF_WEEK.map((d) => (
            <div key={d.day} className="flex items-center gap-1">
              <div className="w-10 text-right pr-2 text-xs font-bold text-ink-2 shrink-0 font-interface">
                {d.label}
              </div>
              {hoursToDisplay.map((h) => {
                const slot = slotMap.get(`${d.day}-${h}`);
                const count = getMetricValue(slot, metric);
                const isSelected = activeSlot?.dayOfWeek === d.day && activeSlot?.hour === h;

                return (
                  <button
                    key={h}
                    type="button"
                    onMouseEnter={() => slot && setActiveSlot(slot)}
                    onFocus={() => slot && setActiveSlot(slot)}
                    className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer font-mono ${getColorClasses(
                      count,
                    )} ${isSelected ? 'ring-2 ring-brand scale-105 z-10' : ''}`}
                    title={`${d.full} às ${String(h).padStart(2, '0')}:00 — ${count} ${
                      metric === 'conversions' ? 'vendas ganhas' : 'atividades'
                    }`}
                  >
                    {count > 0 ? count : '·'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── TOOLTIP / RESUMO DO SLOT ATIVO ─────────────────────────────────── */}
      {activeSlot && (
        <div className="p-3.5 rounded-xl border border-line bg-surface flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10 text-brand">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-ink font-display">
                {DAYS_OF_WEEK.find((d) => d.day === activeSlot.dayOfWeek)?.full} às{' '}
                {String(activeSlot.hour).padStart(2, '0')}:00 -{' '}
                {String(activeSlot.hour + 1).padStart(2, '0')}:00
              </p>
              <p className="text-ink-2 font-interface">
                Total de {activeSlot.totalActivities} atividades registradas no intervalo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="px-2.5 py-1 rounded-md bg-surface-2 border border-line flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-brand" /> {activeSlot.calls} ligações
            </span>
            <span className="px-2.5 py-1 rounded-md bg-surface-2 border border-line flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-iris" /> {activeSlot.meetings} reuniões
            </span>
            <span className="px-2.5 py-1 rounded-md bg-surface-2 border border-line flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-500" /> {activeSlot.messages} msgs
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-500" /> {activeSlot.conversions} ganhos
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

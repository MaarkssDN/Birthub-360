import { motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Radio,
  RotateCw,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { useRealtimeCockpit } from '../../../hooks/useDatabase.js';

export function RealtimeCockpitWidget() {
  const { data, loading, error, isLiveConnected, refetch } = useRealtimeCockpit();

  if (loading && !data) {
    return (
      <Card variant="panel" padding="default" className="shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <Skeleton className="h-6 w-48 rounded-lg bg-surface-subtle" />
          <Skeleton className="h-5 w-24 rounded-full bg-surface-subtle" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-xl bg-surface-subtle" />
          <Skeleton className="h-20 rounded-xl bg-surface-subtle" />
          <Skeleton className="h-20 rounded-xl bg-surface-subtle" />
          <Skeleton className="h-20 rounded-xl bg-surface-subtle" />
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card
        variant="panel"
        padding="default"
        className="shadow-card border-rose-500/20 bg-rose-500/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Falha ao sincronizar cockpit em tempo real
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
            title="Tentar novamente"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </Card>
    );
  }

  const leadsToday = data?.leadsToday ?? 0;
  const dealsWonToday = data?.dealsWonToday ?? 0;
  const wonRevenueToday = data?.wonRevenueToday ?? 0;
  const activitiesToday = data?.activitiesToday ?? 0;
  const conversionRateToday = data?.conversionRateToday ?? 0;
  const anomaly = data?.anomaly;

  return (
    <Card variant="panel" padding="default" className="shadow-card space-y-5">
      {/* ── HEADER COM STATUS LIVE ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand/10 text-brand">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink font-display">
                Cockpit Executivo em Tempo Real
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  isLiveConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                  }`}
                />
                {isLiveConnected ? 'SSE Live' : 'Polling Ativo'}
              </span>
            </div>
            <p className="text-xs text-ink-2 font-interface">
              Métricas consolidadas de hoje com atualização contínua e sentinela de anomalias.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="self-start sm:self-center p-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-2 hover:text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Atualizar agora"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* ── ALERTA INTELIGENTE DE ANOMALIA (QUANDO DETECTADO) ──────────────── */}
      {anomaly?.detected && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            anomaly.severity === 'critical'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          }`}
          data-testid="anomaly-alert-card"
        >
          <div className="p-2 rounded-lg bg-white/40 dark:bg-black/20 shrink-0">
            {anomaly.severity === 'critical' ? (
              <AlertOctagon className="w-5 h-5 text-rose-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wider uppercase">
                {anomaly.title} ({anomaly.deviationPct}% de desvio)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/50 dark:bg-black/30">
                {anomaly.severity === 'critical' ? 'Risco Crítico' : 'Atenção Operacional'}
              </span>
            </div>
            <p className="text-xs leading-relaxed font-interface">{anomaly.message}</p>
          </div>
        </motion.div>
      )}

      {/* ── CONTADORES HOJE ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Leads Hoje */}
        <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-2 mb-2 font-interface">
            <span className="flex items-center gap-1.5 font-semibold">
              <Users className="w-3.5 h-3.5 text-brand" /> Leads Hoje
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand/10 text-brand">
              Hoje
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-ink">{leadsToday}</p>
          <span className="text-[11px] text-ink-3 mt-1 font-interface">Entradas qualificadas</span>
        </div>

        {/* Vendas Fechadas Hoje */}
        <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-2 mb-2 font-interface">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fechamentos
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {conversionRateToday.toFixed(0)}% taxa
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-ink">{dealsWonToday}</p>
          <span className="text-[11px] text-ink-3 mt-1 font-interface">Negócios ganhos hoje</span>
        </div>

        {/* Receita Faturada Hoje */}
        <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-2 mb-2 font-interface">
            <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Receita Ganha
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              BRL
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-ink">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(wonRevenueToday)}
          </p>
          <span className="text-[11px] text-ink-3 mt-1 font-interface">Faturamento confirmado</span>
        </div>

        {/* Atividades Executadas Hoje */}
        <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-2 mb-2 font-interface">
            <span className="flex items-center gap-1.5 font-semibold text-iris">
              <Activity className="w-3.5 h-3.5 text-iris" /> Atividades
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-iris/10 text-iris">
              Cadência
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-ink">{activitiesToday}</p>
          <span className="text-[11px] text-ink-3 mt-1 font-interface">Interações comerciais</span>
        </div>
      </div>
    </Card>
  );
}

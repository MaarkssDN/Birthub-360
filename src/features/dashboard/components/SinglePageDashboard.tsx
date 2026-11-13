import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Compass,
  DollarSign,
  Flame,
  Layers,
  PhoneCall,
  Radar,
  RotateCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommercialJourneyStream } from '../../../components/CommercialJourneyStream.js';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { GamificationWidget } from '../../../components/ui/GamificationWidget.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { useAuth } from '../../../contexts/AuthContext.js';
import { useBitrixIntegration } from '../../../hooks/useBitrixIntegration.js';
import { useAnalyticsDashboard } from '../../../hooks/useDatabase.js';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus.js';
import {
  metricReveal,
  metricsContainer,
  staggerContainer,
  staggerItem,
} from '../../../lib/motion.js';
import { gamificationApi } from '../../gamification/api/gamification.api.js';
import type { SellerScore } from '../../gamification/domain/Gamification.js';
import {
  type DashboardRole,
  type KpiId,
  useDashboardLayout,
  type WidgetId,
} from '../hooks/useDashboardLayout.js';
import { DashboardBuilderModal } from './DashboardBuilderModal.js';
import { ProductivityHeatmapWidget } from './ProductivityHeatmapWidget.js';
import { RealtimeCockpitWidget } from './RealtimeCockpitWidget.js';
import { UnifiedTimelineWidget } from './UnifiedTimelineWidget.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function SinglePageDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: stats, loading, error, refetch } = useAnalyticsDashboard(6);
  const isOnline = useOnlineStatus();
  const { bitrixConnections } = useBitrixIntegration();
  const hasBitrixActive = bitrixConnections.length > 0;

  const {
    role,
    setRole,
    activeWidgets,
    visibleKpis,
    isCustomized,
    isBuilderOpen,
    setIsBuilderOpen,
    saveLayout,
    resetToRoleTemplate,
  } = useDashboardLayout();

  const overview = stats?.overview;
  const pipelineValue = overview?.pipelineValue ?? 0;
  const totalLeads = overview?.totalLeads ?? 0;

  // Perfil gamificado real — sem fallback fabricado a partir de KPIs de pipeline.
  const [sellerScore, setSellerScore] = useState<SellerScore | null>(null);
  const [gamificationLoaded, setGamificationLoaded] = useState(false);
  const sellerName = currentUser?.name?.trim() || undefined;
  useEffect(() => {
    let mounted = true;
    gamificationApi
      .getSellerProfile(sellerName)
      .then((profile) => {
        if (mounted) setSellerScore(profile);
      })
      .finally(() => {
        if (mounted) setGamificationLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [sellerName]);
  const winRate =
    overview?.conversionRate != null ? Number(overview.conversionRate).toFixed(1) : '0.0';
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || 'Gestor';
  const pendingActivities = overview?.pendingActivities ?? 0;
  const closedThisMonth = overview?.closedThisMonth ?? 0;
  const totalCompanies = overview?.totalCompanies ?? 0;
  const wonRevenueThisMonth = overview?.wonRevenueThisMonth ?? 0;

  const funnel = stats?.funnel ?? [];
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);
  const byTemp = stats?.byTemperature ?? [];

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto bg-bg p-6 lg:p-8">
        <Card
          variant="panel"
          padding="lg"
          className="max-w-[48rem] mx-auto mt-12 text-center shadow-card space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 font-display">
            Falha ao carregar indicadores comerciais
          </h2>
          <p className="text-sm text-ink-2 max-w-md mx-auto">
            {error || 'Não foi possível sincronizar as métricas de pipeline com o servidor.'}
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="default"
              onClick={() => refetch()}
              className="gap-2 text-white font-semibold shadow-sm"
            >
              <RotateCw className="w-4 h-4 text-white" />
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-bg p-6 lg:p-8">
        <div className="max-w-[96rem] mx-auto space-y-6 animate-pulse">
          <Skeleton className="h-6 w-36 rounded-full bg-surface-subtle" />
          <Skeleton className="h-10 w-80 rounded-xl bg-surface-subtle" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl bg-surface-subtle" />
            <Skeleton className="h-28 rounded-xl bg-surface-subtle" />
            <Skeleton className="h-28 rounded-xl bg-surface-subtle" />
            <Skeleton className="h-28 rounded-xl bg-surface-subtle" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 rounded-xl bg-surface-subtle lg:col-span-2" />
            <Skeleton className="h-72 rounded-xl bg-surface-subtle" />
          </div>
        </div>
      </div>
    );
  }

  // ── RENDERIZADOR DINÂMICO DE CARDS DE KPI ───────────────────────────────
  const renderKpiCard = (kpiId: KpiId) => {
    switch (kpiId) {
      case 'pipelineValue':
        return (
          <motion.div
            key="pipelineValue"
            variants={metricReveal}
            data-accent="gold"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <Target className="w-4 h-4 text-[var(--card-accent)]" /> Volume em Pipeline
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Ativo
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {pipelineValue > 0
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(pipelineValue)
                : 'R$ 0'}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>{totalLeads} oportunidades ativas</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/crm')}
              >
                Ver kanban &rarr;
              </button>
            </div>
          </motion.div>
        );

      case 'winRate':
        return (
          <motion.div
            key="winRate"
            variants={metricReveal}
            data-accent="success"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <TrendingUp className="w-4 h-4 text-[var(--card-accent)]" /> Taxa de Conversão
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Win Rate
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {winRate}%
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>{closedThisMonth} fechados no período</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/analytics')}
              >
                Métricas &rarr;
              </button>
            </div>
          </motion.div>
        );

      case 'pendingActivities':
        return (
          <motion.div
            key="pendingActivities"
            variants={metricReveal}
            data-accent="iris"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <Activity className="w-4 h-4 text-[var(--card-accent)]" /> Atividades Pendentes
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Prioridade
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {pendingActivities}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>Ações na cadência</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/calendar')}
              >
                Agenda &rarr;
              </button>
            </div>
          </motion.div>
        );

      case 'totalCompanies':
        return (
          <motion.div
            key="totalCompanies"
            variants={metricReveal}
            data-accent="cyan"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <Users className="w-4 h-4 text-[var(--card-accent)]" /> Contas e Empresas
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Ecossistema
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {totalCompanies}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>Organizações no radar</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/companies')}
              >
                Ver empresas &rarr;
              </button>
            </div>
          </motion.div>
        );

      case 'closedThisMonth':
        return (
          <motion.div
            key="closedThisMonth"
            variants={metricReveal}
            data-accent="success"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <CheckCircle2 className="w-4 h-4 text-[var(--card-accent)]" /> Ganhos no Mês
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Fechados
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {closedThisMonth}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>Negócios concluídos</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/crm')}
              >
                Ver ganhos &rarr;
              </button>
            </div>
          </motion.div>
        );

      case 'leadsToday':
        return (
          <motion.div
            key="leadsToday"
            variants={metricReveal}
            data-accent="cyan"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <Zap className="w-4 h-4 text-[var(--card-accent)]" /> Leads em Prospecção
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Em Cadência
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {totalLeads}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>Leads sob tratamento</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/prospect')}
              >
                Prospecção &rarr;
              </button>
            </div>
          </motion.div>
        );

      case 'wonRevenueMonth':
        return (
          <motion.div
            key="wonRevenueMonth"
            variants={metricReveal}
            data-accent="gold"
            className="bh-platform-card group relative p-5 transition-colors overflow-hidden motion-gpu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bh-label text-sm font-bold uppercase tracking-wider text-[var(--card-accent)] flex items-center gap-2 font-interface">
                <DollarSign className="w-4 h-4 text-[var(--card-accent)]" /> Receita Ganha no Mês
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[color-mix(in_srgb,var(--card-accent)_80%,black)] dark:text-[color-mix(in_srgb,var(--card-accent)_80%,white)]">
                Faturamento
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink font-mono tracking-tight tabular-nums numeric-tabular-cell">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(wonRevenueThisMonth)}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/40 text-xs text-ink-2">
              <span>Faturado no ciclo</span>
              <button
                type="button"
                className="text-[var(--card-accent)] font-semibold cursor-pointer hover:underline"
                onClick={() => navigate('/app/analytics')}
              >
                Relatório &rarr;
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ── RENDERIZADOR DINÂMICO DE BLOCOS / WIDGETS ───────────────────────────
  const renderWidget = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'realtimeCockpit':
        return <RealtimeCockpitWidget key="realtimeCockpit" />;

      case 'productivityHeatmap':
        return <ProductivityHeatmapWidget key="productivityHeatmap" />;

      case 'commercialJourney':
        return <CommercialJourneyStream key="commercialJourney" />;

      case 'unifiedTimeline':
        return <UnifiedTimelineWidget key="unifiedTimeline" />;

      case 'pipelineFunnel':
        return (
          <div key="pipelineFunnel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PIPELINE FUNNEL (2 COLUMNS) */}
            <Card variant="panel" padding="default" className="lg:col-span-2 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <h2 className="text-base font-bold text-ink flex items-center gap-2 font-display">
                    <BarChart3 className="w-4 h-4 text-brand" />
                    Jornada & Conversão do Funil
                  </h2>
                  <p className="text-xs text-ink-2 font-interface mt-0.5">
                    Distribuição de oportunidades através das fases de qualificação e fechamento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/app/analytics')}
                  className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Relatório completo &rarr;
                </button>
              </div>

              {funnel.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-surface-2 mx-auto flex items-center justify-center text-ink-2">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-ink">
                    Nenhum dado de funil registrado
                  </h4>
                  <p className="text-xs text-ink-2 max-w-sm mx-auto">
                    Inicie o fluxo cadastrando ou importando novos leads através do módulo de
                    prospecção.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => navigate('/app/prospect')}
                      className="gap-1.5 text-xs font-bold shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Prospectar Novos Leads
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {funnel.map((stage) => {
                    const percentage = Math.round((stage.count / maxFunnelCount) * 100);
                    return (
                      <div key={stage.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{stage.label}</span>
                            {stage.conversionFromPrevious !== null && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 font-mono">
                                {stage.conversionFromPrevious}% conv.
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {stage.amount && stage.amount > 0 ? (
                              <span className="font-mono text-ink-2 text-[11px]">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                  maximumFractionDigits: 0,
                                }).format(stage.amount)}
                              </span>
                            ) : null}
                            <span className="font-bold text-ink min-w-8 text-right font-mono">
                              {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden flex">
                          <motion.div
                            className="h-full bg-gradient-to-r from-brand/80 to-brand rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(percentage, 4)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* TEMPERATURE & OPERATIONAL PULSE (1 COLUMN) */}
            <Card
              variant="panel"
              padding="default"
              className="shadow-card space-y-5 flex flex-col justify-between"
            >
              <div>
                <div className="border-b border-line pb-4">
                  <h2 className="text-base font-bold text-ink flex items-center gap-2 font-display">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Temperatura dos Leads
                  </h2>
                  <p className="text-xs text-ink-2 font-interface mt-0.5">
                    Engajamento da base por prioridade de contato.
                  </p>
                </div>

                <div className="py-4 space-y-3">
                  {byTemp.length === 0 ? (
                    <div className="text-center py-8 text-xs text-ink-2">
                      Sem distribuição de temperatura no momento.
                    </div>
                  ) : (
                    byTemp.map((t) => {
                      const isHot = t.label.toLowerCase().includes('quente');
                      const isWarm = t.label.toLowerCase().includes('morno');
                      const colorBadge = isHot
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        : isWarm
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                      return (
                        <div
                          key={t.label}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-line/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${colorBadge}`}
                            >
                              {t.label}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-ink font-mono">{t.count}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick System Indicators */}
              <div className="pt-4 border-t border-line/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Status dos Conectores
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/app/integrations')}
                    className="text-[10px] font-semibold text-brand hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    Gerenciar &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      isOnline
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isOnline ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="text-ink font-medium">
                      {isOnline ? 'Rede Conectada' : 'Modo Offline'}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasBitrixActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-2'
                    }`}
                  >
                    {hasBitrixActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-line flex items-center justify-center text-[8px]">
                        •
                      </span>
                    )}
                    <span className="text-ink font-medium">
                      {hasBitrixActive ? 'Bitrix24 Ativo' : 'Bitrix24 Pendente'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'quickActions':
        return (
          <div key="quickActions">
            <div className="mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink font-interface flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand" />
                Cockpits Operacionais & Ações Diretas
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Prospecção */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/app/prospect')}
                data-accent="cyan"
                className="bh-platform-card group p-5 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[var(--card-accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="bh-label font-bold text-base text-[var(--card-accent)] transition-colors font-display">
                    Prospecção ICP & Mercado
                  </h3>
                  <p className="text-sm text-ink-2 leading-relaxed font-interface">
                    Varredura de decisores corporativos, enriquecimento de dados e qualificação B2B.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-xs font-semibold text-[var(--card-accent)]">
                  <span>Acessar busca</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* Tile 2: CRM 360 */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/app/crm')}
                data-accent="gold"
                className="bh-platform-card group p-5 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[var(--card-accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="bh-label font-bold text-base text-[var(--card-accent)] transition-colors font-display">
                    Gestão Comercial 360°
                  </h3>
                  <p className="text-sm text-ink-2 leading-relaxed font-interface">
                    Kanban ágil de oportunidades, controle de propostas e avanço de estágios de
                    negociação.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-xs font-semibold text-[var(--card-accent)]">
                  <span>Abrir pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* Tile 3: Cadência */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/app/cadence')}
                data-accent="iris"
                className="bh-platform-card group p-5 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[var(--card-accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <h3 className="bh-label font-bold text-base text-[var(--card-accent)] transition-colors font-display">
                    Cadência & Multicanal
                  </h3>
                  <p className="text-sm text-ink-2 leading-relaxed font-interface">
                    Regras automatizadas de follow-up, disparos via WhatsApp, e-mail e ligações
                    inteligentes.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-xs font-semibold text-[var(--card-accent)]">
                  <span>Ver réguas</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* Tile 4: Copiloto IA */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/app/intelligence')}
                data-accent="iris"
                className="bh-platform-card group p-5 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--card-accent)_10%,transparent)] text-[var(--card-accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="bh-label font-bold text-base text-[var(--card-accent)] transition-colors font-display">
                    Inteligência & Copiloto IA
                  </h3>
                  <p className="text-sm text-ink-2 leading-relaxed font-interface">
                    Diagnósticos preditivos de fechamento, análise de objeções e relatórios
                    executivos.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-xs font-semibold text-[var(--card-accent)]">
                  <span>Iniciar Copiloto</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'aiOrchestrator':
        return (
          <Card
            key="aiOrchestrator"
            variant="panel"
            padding="default"
            className="shadow-card space-y-4"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-iris/10 text-iris rounded-lg">
                  <BrainCircuit className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink font-display">
                    Motor de Inteligência Autônoma
                  </h3>
                  <p className="text-xs text-ink-2 font-interface">
                    Monitorando oportunidades e pontos de inflexão.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-iris/10 text-iris uppercase">
                Active Pulse
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-line/40 text-xs">
                <span className="mt-0.5 text-iris font-bold uppercase tracking-wider text-[10px] w-16 shrink-0">
                  Pipeline
                </span>
                <span className="text-ink leading-relaxed">
                  {totalLeads > 0
                    ? `Análise contínua ativa sobre as ${totalLeads} oportunidades registradas no ecossistema.`
                    : 'Aguardando novas oportunidades para calibração de score e priorização preditiva.'}
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-line/40 text-xs">
                <span className="mt-0.5 text-brand font-bold uppercase tracking-wider text-[10px] w-16 shrink-0">
                  Ação
                </span>
                <span className="text-ink leading-relaxed">
                  {pendingActivities > 0
                    ? `Existem ${pendingActivities} tarefas ou atividades aguardando interação no cockpit.`
                    : 'Nenhuma pendência crítica imediata. Pipeline operando em alta velocidade.'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/app/intelligence')}
                className="inline-flex items-center gap-2 text-xs font-bold text-iris hover:text-ink transition-colors cursor-pointer group font-interface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <span>Acessar Central de Inteligência</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </Card>
        );

      case 'gamification':
        return (
          <Card
            key="gamification"
            variant="panel"
            padding="default"
            className="shadow-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-brand/10 text-brand rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink font-display">
                    Performance da Equipe Comercial
                  </h3>
                  <p className="text-xs text-ink-2 font-interface">
                    Nível de engajamento operacional e consistência.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand/10 text-brand uppercase">
                Gamification
              </span>
            </div>

            {!gamificationLoaded ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : sellerScore ? (
              <GamificationWidget
                initialXp={sellerScore.totalPoints}
                level={sellerScore.level}
                streakDays={sellerScore.streakDays}
                sellerScore={sellerScore}
                show3DCore={false}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-line p-6 text-center">
                <p className="text-sm font-semibold text-ink">
                  Perfil de gamificação indisponível
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  Nenhum perfil de vendedor foi encontrado para a sua conta. Os pontos e níveis
                  aparecem aqui quando o perfil de gamificação existir.
                </p>
              </div>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-bg text-ink relative">
      <div className="w-full max-w-[98rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ── COMMAND CENTER HEADER ────────────────────────────────────────── */}
        <motion.header
          className="relative rounded-2xl border border-line bg-surface/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 shadow-sm"
          variants={staggerContainer(0.08, 0)}
          initial="hidden"
          animate="show"
        >
          <motion.div className="space-y-2" variants={staggerItem}>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                <Radar className="w-3.5 h-3.5 animate-spin-slow" />
                Command Center 360°
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                SISTEMA OPERACIONAL
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
              {greeting()}, {firstName}.
            </h1>
            <p className="text-sm text-ink-2 max-w-2xl font-interface">
              Visão consolidada de inteligência comercial, prospecção e pipeline em tempo real.
            </p>
          </motion.div>

          <motion.div className="flex flex-wrap items-center gap-3" variants={staggerItem}>
            <Button
              type="button"
              variant="vancouver"
              onClick={() => navigate('/app/prospect')}
              className="gap-2 rounded-full"
            >
              <Search className="w-4 h-4 text-[#00D4FF]" />
              <span>Buscar Mercado</span>
            </Button>

            <Button
              type="button"
              variant="brand"
              onClick={() => navigate('/app/crm')}
              className="gap-2 rounded-full"
            >
              <Activity className="w-4 h-4" />
              <span>Abrir Cockpit CRM 360°</span>
            </Button>
          </motion.div>
        </motion.header>

        {/* ── ROLE SELECTOR & DASHBOARD BUILDER CONTROLS ───────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface/70 border border-line backdrop-blur-md shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-2 pl-2 font-interface flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand" />
              Perfil Operacional:
            </span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-line">
              {(['SDR', 'CLOSER', 'GESTOR'] as DashboardRole[]).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-ink-2 hover:text-ink hover:bg-surface'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {isCustomized && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand/10 text-brand border border-brand/20">
                <Sparkles className="w-2.5 h-2.5" />
                Customizado
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsBuilderOpen(true)}
            className="text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
            <span>Personalizar Dashboard</span>
          </Button>
        </div>

        {/* ── KPI EXECUTIVE CARDS (DINÂMICOS POR CARGO) ───────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={metricsContainer}
          initial="hidden"
          animate="show"
        >
          {visibleKpis.map((kpiId) => renderKpiCard(kpiId))}
        </motion.div>

        {/* ── BLOCOS / WIDGETS ATIVOS E ORDENADOS PELO BUILDER ─────────────── */}
        <div className="space-y-8">{activeWidgets.map((widgetId) => renderWidget(widgetId))}</div>
      </div>

      {/* ── MODAL DO DASHBOARD BUILDER ────────────────────────────────────── */}
      <DashboardBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        currentRole={role}
        onSelectRole={setRole}
        activeWidgets={activeWidgets}
        visibleKpis={visibleKpis}
        isCustomized={isCustomized}
        onSave={(w, k) => saveLayout(w, k)}
        onReset={resetToRoleTemplate}
      />
    </div>
  );
}

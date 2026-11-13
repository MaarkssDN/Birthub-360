import {
  Activity,
  Code,
  Database,
  FileText,
  Play,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../../../lib/logger.js';
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Spinner,
  ToastContainer,
  Tooltip,
  useToast,
} from '../../components/design-system/index.js';
import {
  type AgentRecord,
  type CallLogEntry,
  calculateChecklistProgress,
  deriveOverviewMetrics,
  type FetchStatus,
  formatMs,
  formatTokens,
  formatUsd,
  type MetricEntry,
  type ReadyChecks,
} from './overviewMetrics.js';
import {
  AgentsCard,
  CallsLogCard,
  OnboardingPanel,
  PendingAlertsCard,
  PlatformStatusCard,
} from './overviewSections.js';
import { RealStatCard } from './overviewWidgets.js';

interface FetchSlice<T> {
  status: FetchStatus;
  data: T;
}

export default function RebuiltExecutiveOverview() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  // Onboarding Checklist — real, persisted server-side (GET/POST /api/onboarding). Kept `null`
  // until the first fetch resolves so we never render the server's default checklist as if it
  // had already been confirmed loaded (avoids a flash of "done" state before real data arrives).
  const [checklist, setChecklist] = useState<Record<string, boolean> | null>(null);
  const [checklistError, setChecklistError] = useState(false);

  const [callsState, setCallsState] = useState<FetchSlice<CallLogEntry[]>>({
    status: 'loading',
    data: [],
  });
  const [agentsState, setAgentsState] = useState<FetchSlice<AgentRecord[]>>({
    status: 'loading',
    data: [],
  });
  const [readyState, setReadyState] = useState<{
    status: FetchStatus;
    checks: ReadyChecks | null;
  }>({
    status: 'loading',
    checks: null,
  });
  // Real, tenant-scoped rows from GET /api/metrics — a single fetch, filtered client-side into the
  // SLA samples (platform_ready_check) and the AI cost/tokens/latency cards below. See
  // .agents/handoffs/onda-4/10-para-02-sla-telemetria-overview.md and
  // .agents/handoffs/onda-4/04-para-02-telemetria-custo-ia-disponivel.md. Never a fabricated value.
  const [metricsState, setMetricsState] = useState<FetchSlice<MetricEntry[]>>({
    status: 'loading',
    data: [],
  });

  const fetchCalls = useCallback(async (signal?: AbortSignal) => {
    setCallsState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/call-logs', { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCallsState({ status: 'ready', data: Array.isArray(data.callLogs) ? data.callLogs : [] });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      logger.error('Error loading call logs', { err });
      setCallsState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  const fetchAgents = useCallback(async (signal?: AbortSignal) => {
    setAgentsState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/agents', { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgentsState({ status: 'ready', data: Array.isArray(data.agents) ? data.agents : [] });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      logger.error('Error loading agents', { err });
      setAgentsState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  const fetchReady = useCallback(async (signal?: AbortSignal) => {
    setReadyState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/ready', { signal });
      const data = await res.json();
      setReadyState({ status: 'ready', checks: data.checks ?? null });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      logger.error('Error loading platform readiness', { err });
      setReadyState({ status: 'error', checks: null });
    }
  }, []);

  // GET /api/metrics is tenant-scoped (requireTenant) and mixes several event names (ai_call_*,
  // platform_ready_check, …) — fetched once here and filtered client-side per card below.
  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    setMetricsState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/metrics', { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const allMetrics: MetricEntry[] = Array.isArray(data.metrics) ? data.metrics : [];
      setMetricsState({ status: 'ready', data: allMetrics });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      logger.error('Error loading metrics', { err });
      setMetricsState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    // Abort on unmount: prevents setState-after-unmount and cancels in-flight requests when the
    // operator navigates away mid-load (long sessions, slow networks).
    const controller = new AbortController();
    const { signal } = controller;

    const fetchChecklist = async () => {
      try {
        const res = await fetch('/api/onboarding', { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setChecklist(data.checklist ?? {});
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        logger.error('Error loading onboarding checklist from database', { err });
        setChecklistError(true);
        setChecklist({});
      }
    };

    // All five fetches handle their own errors internally (try/catch → status 'error'); they are
    // fire-and-forget on mount, so mark them explicitly ignored — an unhandled rejection here
    // would be a real bug (SonarQube typescript:S9383).
    void fetchChecklist();
    void fetchCalls(signal);
    void fetchAgents(signal);
    void fetchReady(signal);
    void fetchMetrics(signal);

    return () => controller.abort();
  }, [fetchCalls, fetchAgents, fetchReady, fetchMetrics]);

  const updateChecklist = async (key: string, value: boolean) => {
    if (!checklist) return;
    const updated = { ...checklist, [key]: value };
    setChecklist(updated);
    showToast(
      `Checklist atualizado! Progresso atualizado para ${Math.round(calculateChecklistProgress(updated))}%`,
      'info',
    );

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updated }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      logger.error('Error saving onboarding checklist to database', { err });
      showToast('Não foi possível salvar o checklist no servidor. Tente novamente.', 'error');
    }
  };

  // Active onboarding tab/wizard step
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardCollapsed, setWizardCollapsed] = useState(false);

  // Modals for Quick Actions
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'kpis' | 'audit' | 'analytics'>('kpis');

  // Quick action executor
  const handleExecuteQuickAction = (type: string) => {
    setActiveActionModal(null);

    if (type === 'agent') {
      showToast('Abrindo formulário de criação de agente...', 'info');
      navigate('/dashboard/agents/new');
    } else if (type === 'telephony') {
      navigate('/dashboard/telephony');
    } else if (type === 'test') {
      navigate('/dashboard/playground');
    } else if (type === 'knowledge') {
      navigate('/dashboard/knowledge');
    }
  };

  // ---- Real, derived metrics (no fabricated numbers) — pure helpers in overviewMetrics.ts ----
  const derived = deriveOverviewMetrics(callsState.data, agentsState.data, metricsState.data);
  const {
    totalAgents,
    agentsWithPhone,
    totalCalls,
    callsToday,
    completedCalls,
    completionRate,
    avgDuration,
    parsedDurationCount,
    slaUptimePercent,
    slaCaption,
    aiTotalCost,
    aiTotalTokens,
    aiAvgLatency,
    aiCallCount,
  } = derived;

  const today = new Date();

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {today.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-sans tracking-tight mt-1">
            Birth Hub 360 Executive
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl">
            Plataforma omnicanal de IA de voz para prospecção e atendimento.
          </p>
        </div>

        {/* PLATFORM READINESS — real data from GET /api/ready (database + redis), not a
            decorative "everything is green" claim. */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
          <div className="text-left mr-2 lg:border-r border-slate-200 dark:border-slate-700 pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Status da Plataforma</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
              {today.toLocaleTimeString('pt-BR')} (UTC-3)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            {readyState.status === 'loading' && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Spinner size="sm" /> Verificando...
              </span>
            )}
            {readyState.status === 'error' && (
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Indisponível
              </span>
            )}
            {readyState.status === 'ready' && (
              <>
                <Tooltip text="Conexão com o banco de dados (PostgreSQL)">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Database className="h-3 w-3" />
                    <span
                      className={`h-2 w-2 rounded-full ${readyState.checks?.database === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    Banco de Dados
                  </span>
                </Tooltip>
                <Tooltip text="Fila/cache Redis (sessões, idempotência)">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Server className="h-3 w-3" />
                    <span
                      className={`h-2 w-2 rounded-full ${readyState.checks?.redis === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    Redis
                  </span>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => setActiveActionModal('agent')}
        >
          <div className="p-2 bg-brand/10 text-brand rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Criar Agente</h4>
            <p className="text-xs text-slate-500">Configurar novo agente</p>
          </div>
        </Card>
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => navigate('/dashboard/analytics')}
        >
          <div className="p-2 bg-indigo-50 dark:bg-iris/30 text-iris dark:text-iris rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Ver Análises</h4>
            <p className="text-xs text-slate-500">Métricas recentes</p>
          </div>
        </Card>
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => navigate('/dashboard/playground')}
        >
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Play className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Acessar Playground</h4>
            <p className="text-xs text-slate-500">Testar chamadas</p>
          </div>
        </Card>
        <Card
          className="p-4 hover:border-brand cursor-pointer transition-colors flex items-center gap-3"
          onClick={() => navigate('/dashboard/knowledge')}
        >
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nova Base</h4>
            <p className="text-xs text-slate-500">Importar conhecimento</p>
          </div>
        </Card>
      </div>

      {/* COMPACT ONBOARDING WIZARD & CHECKLIST */}
      <OnboardingPanel
        checklist={checklist}
        checklistError={checklistError}
        wizardStep={wizardStep}
        onWizardStep={setWizardStep}
        wizardCollapsed={wizardCollapsed}
        onCollapse={() => setWizardCollapsed(true)}
        progress={calculateChecklistProgress(checklist)}
        onUpdateChecklist={updateChecklist}
      />

      {/* DASHBOARD TAB SELECTOR */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('kpis')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'kpis'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Visão Geral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Relatório de UX Audit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Analytics de Produto
        </button>
      </div>

      {/* TAB 1: EXECUTIVE METRICS & WIDGETS */}
      {activeTab === 'kpis' && (
        <div className="space-y-8 animate-fade-in">
          {/* REAL, COUNTABLE KPIS — derived from GET /api/agents and GET /api/call-logs.
              Disponibilidade (SLA) is real too (GET /api/metrics, platform_ready_check — Agente 10,
              see handoff onda-4/10-para-02-sla-telemetria-overview.md): a periodic sample, not a
              continuous measurement, documented as such via its tooltip/caption below.
              AI cost/tokens/latency now real too (GET /api/metrics, ai_call_* — Agente 04, see
              handoff onda-4/04-para-02-telemetria-custo-ia-disponivel.md), rendered further below.
              CSAT still has no real data source (product decision pending) — kept as an explicit
              empty card, never a fabricated number. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <RealStatCard
              title="Agentes Cadastrados"
              status={agentsState.status}
              value={String(totalAgents)}
              caption={`${agentsWithPhone} com telefonia conectada`}
              tooltip="Total de agentes de voz cadastrados nesta organização"
              onClick={() => navigate('/dashboard/agents')}
            />
            <RealStatCard
              title="Chamadas Registradas"
              status={callsState.status}
              value={String(totalCalls)}
              caption={totalCalls >= 100 ? 'Últimas 100 registradas' : 'Total no histórico'}
              tooltip="Total de chamadas registradas para esta organização"
            />
            <RealStatCard
              title="Chamadas Hoje"
              status={callsState.status}
              value={String(callsToday)}
              caption={today.toLocaleDateString('pt-BR')}
              tooltip="Chamadas registradas com timestamp de hoje"
            />
            <RealStatCard
              title="Duração Média"
              status={callsState.status}
              value={avgDuration ?? '—'}
              caption={
                avgDuration
                  ? `${parsedDurationCount} chamadas com duração válida`
                  : 'Sem dados suficientes'
              }
              tooltip="Média calculada a partir das durações registradas"
            />
            <RealStatCard
              title="Taxa de Conclusão"
              status={callsState.status}
              value={completionRate !== null ? `${completionRate.toFixed(0)}%` : '—'}
              caption={
                completionRate !== null
                  ? `${completedCalls} de ${totalCalls} concluídas`
                  : 'Sem chamadas registradas'
              }
              tooltip="Percentual de chamadas com status Concluído"
            />
            <RealStatCard
              title="Disponibilidade (SLA)"
              status={metricsState.status}
              value={slaUptimePercent !== null ? `${slaUptimePercent.toFixed(2)}%` : '—'}
              caption={slaCaption}
              tooltip="Uptime aproximado da plataforma (Postgres + Redis), calculado a partir de checagens reais amostradas a cada 5 minutos — não é uma medição contínua: uma indisponibilidade mais curta que o intervalo entre amostras pode não aparecer aqui."
            />
          </div>

          {/* Telemetria de IA (custo, tokens, latência) — real, agregada de GET /api/metrics
              (eventos ai_call_cost_usd / ai_call_tokens / ai_call_latency_ms, gravados por
              lib/voice-runtime/providers/LLMGateway.ts a cada chamada que efetivamente atingiu um
              provedor real). Ver .agents/handoffs/onda-4/04-para-02-telemetria-custo-ia-disponivel.md.
              CSAT e SLA de disponibilidade continuam com estado vazio/honesto — SLA já tem card
              próprio acima; CSAT não tem fonte de dado real definida ainda (decisão de produto
              pendente, fora do escopo desta onda). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RealStatCard
              title="Custo de IA (total)"
              status={metricsState.status}
              value={aiTotalCost !== null ? formatUsd(aiTotalCost) : '—'}
              caption={
                aiCallCount > 0
                  ? `${aiCallCount} chamada${aiCallCount === 1 ? '' : 's'} de IA registrada${aiCallCount === 1 ? '' : 's'}`
                  : 'Ainda sem chamadas de IA para esta organização'
              }
              tooltip="Soma do custo estimado (USD) de todas as chamadas de IA que atingiram um provedor com sucesso, reportado pelo LLM Gateway."
            />
            <RealStatCard
              title="Tokens consumidos"
              status={metricsState.status}
              value={aiTotalTokens !== null ? formatTokens(aiTotalTokens) : '—'}
              caption={
                aiCallCount > 0
                  ? `${aiCallCount} chamada${aiCallCount === 1 ? '' : 's'} de IA registrada${aiCallCount === 1 ? '' : 's'}`
                  : 'Ainda sem chamadas de IA para esta organização'
              }
              tooltip="Soma de tokens totais reportados pelas respostas reais dos provedores de IA (não é uma estimativa pré-chamada)."
            />
            <RealStatCard
              title="Latência média de IA"
              status={metricsState.status}
              value={aiAvgLatency !== null ? formatMs(aiAvgLatency) : '—'}
              caption={
                aiCallCount > 0
                  ? `Média de ${aiCallCount} chamada${aiCallCount === 1 ? '' : 's'}`
                  : 'Ainda sem chamadas de IA para esta organização'
              }
              tooltip="Latência média real do processamento completo de chamada de IA (do pedido até a resposta do provedor)."
            />
            <RealStatCard
              title="CSAT"
              status="ready"
              value="—"
              caption="Sem fonte de dado definida"
              tooltip="Satisfação do cliente (CSAT) ainda não tem mecanismo de coleta definido nesta plataforma (ex.: pesquisa pós-atendimento) — decisão de produto pendente. Nenhum número é exibido enquanto essa fonte não existir."
            />
          </div>

          {/* LOWER WIDGETS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              <CallsLogCard
                status={callsState.status}
                calls={callsState.data}
                onRefresh={() => fetchCalls()}
              />
              <AgentsCard
                status={agentsState.status}
                agents={agentsState.data}
                onViewAll={() => navigate('/dashboard/agents')}
                onRetry={() => fetchAgents()}
                onCreateAgent={() => navigate('/dashboard/agents/new')}
              />
            </div>

            {/* Right Column: Health & Alerts */}
            <div className="space-y-6">
              <PlatformStatusCard status={readyState.status} checks={readyState.checks} />
              <PendingAlertsCard
                agentsStatus={agentsState.status}
                agentsCount={agentsState.data.length}
                agentsWithPhone={agentsWithPhone}
                checklist={checklist}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UX AUDIT REPORT (documentation of past UX work on this page — not a live metric) */}
      {activeTab === 'audit' && (
        <Card className="p-8 space-y-8 animate-fade-in text-left">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-750 pb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-iris dark:text-iris rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                UX Audit Report — Birth Hub 360
              </h2>
              <p className="text-sm text-slate-500">
                Mapeamento da jornada do usuário e otimização de fluxos de onboarding.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Fricções & Gargalos Identificados
              </h3>
              <div className="space-y-3 font-medium text-xs leading-relaxed text-slate-650 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Cadastro & Primeiros Passos
                  </p>
                  <p className="mt-1 text-slate-500">
                    O usuário caía em uma tela vazia sem instruções de "qual ação tomar". O
                    Onboarding Wizard de 4 fases elimina essa ambiguidade.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Painel executivo com dados de exemplo
                  </p>
                  <p className="mt-1 text-slate-500">
                    A Visão Geral exibia KPIs de negócio (tokens, custo, CSAT, SLA, latência) fixos
                    no código, sem fonte de dado real — corrigido nesta revisão: só métricas reais
                    (agentes, chamadas) aparecem como número; o restante mostra estado vazio
                    explícito até existir telemetria real.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Sessão do usuário não identificada
                  </p>
                  <p className="mt-1 text-slate-500">
                    O shell (barra lateral) lia um cookie que o servidor nunca definia, mostrando
                    sempre um usuário de exemplo fixo. Corrigido: a sessão real vem de GET
                    /api/auth/me.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Soluções Aplicadas
              </h3>
              <div className="space-y-3 font-medium text-xs leading-relaxed text-slate-650 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Onboarding Direcionado
                  </p>
                  <p className="mt-1 text-slate-500">
                    Wizard reativo exibe a porcentagem real de finalização do checklist, persistida
                    no servidor.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Estados explícitos de loading/erro/vazio
                  </p>
                  <p className="mt-1 text-slate-500">
                    Toda seção com dado remoto mostra esqueleto de carregamento, mensagem de erro
                    com retry, ou estado vazio — nunca um número inventado no lugar do dado ainda
                    não carregado.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Sessão e navegação coerentes
                  </p>
                  <p className="mt-1 text-slate-500">
                    Expiração de sessão em qualquer chamada autenticada redireciona para o Login em
                    vez de deixar a tela travada com dado obsoleto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: PRODUCT ANALYTICS — honest placeholder; no funnel/usability-telemetry backend
          exists yet, so this used to show fabricated conversion percentages. */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in text-left">
          <EmptyState
            icon={<Code className="h-10 w-10" />}
            title="Analytics de produto ainda não instrumentado"
            description="Funil de ativação e telemetria de usabilidade (tempo de criação de agente, cliques por sessão, taxa de erro) dependem de um pipeline de eventos de produto que ainda não existe nesta plataforma. Quando existir, aparece aqui com dado real."
          />
        </div>
      )}

      {/* ACTIVE MODAL CONTAINER FOR QUICK ACTIONS */}
      <Modal
        isOpen={activeActionModal !== null}
        onClose={() => setActiveActionModal(null)}
        title={
          activeActionModal === 'agent'
            ? 'Criar Novo Agente de Voz'
            : activeActionModal === 'telephony'
              ? 'Vincular Número de Telefonia (SIP)'
              : activeActionModal === 'knowledge'
                ? 'Importar Base de Conhecimento'
                : 'Executar Teste de Chamada'
        }
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveActionModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => handleExecuteQuickAction(activeActionModal || '')}
            >
              Continuar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Você será redirecionado para a tela correspondente para concluir esta ação.
          </p>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

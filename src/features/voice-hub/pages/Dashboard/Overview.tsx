import { Code } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../../../lib/logger.js';
import { EmptyState, ToastContainer, useToast } from '../../components/design-system/index.js';
import { OverviewActionModal } from './overview/OverviewActionModal.js';
import { OverviewAuditTab } from './overview/OverviewAuditTab.js';
import { OverviewHeader } from './overview/OverviewHeader.js';
import { OverviewKpisTab } from './overview/OverviewKpisTab.js';
import { OverviewOnboardingWizard } from './overview/OverviewOnboardingWizard.js';
import { OverviewQuickActions } from './overview/OverviewQuickActions.js';
import { calculateOnboardingProgress } from './overview/overviewFormat.js';
import type {
  AgentsFetchState,
  CallsFetchState,
  MetricsFetchState,
  ReadyFetchState,
} from './overview/overviewTypes.js';

export default function RebuiltExecutiveOverview() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();
  const today = new Date();

  // Onboarding Checklist — real, persisted server-side (GET/POST /api/onboarding). Kept `null`
  // until the first fetch resolves so we never render the server's default checklist as if it
  // had already been confirmed loaded (avoids a flash of "done" state before real data arrives).
  const [checklist, setChecklist] = useState<Record<string, boolean> | null>(null);
  const [checklistError, setChecklistError] = useState(false);

  const [callsState, setCallsState] = useState<CallsFetchState>({
    status: 'loading',
    calls: [],
  });
  const [agentsState, setAgentsState] = useState<AgentsFetchState>({
    status: 'loading',
    agents: [],
  });
  const [readyState, setReadyState] = useState<ReadyFetchState>({
    status: 'loading',
    checks: null,
  });
  // Real, tenant-scoped rows from GET /api/metrics — a single fetch, filtered client-side into the
  // SLA samples (platform_ready_check) and the AI cost/tokens/latency cards below. See
  // .agents/handoffs/onda-4/10-para-02-sla-telemetria-overview.md and
  // .agents/handoffs/onda-4/04-para-02-telemetria-custo-ia-disponivel.md. Never a fabricated value.
  const [metricsState, setMetricsState] = useState<MetricsFetchState>({
    status: 'loading',
    metrics: [],
  });

  const fetchCalls = useCallback(async () => {
    setCallsState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/call-logs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCallsState({ status: 'ready', calls: Array.isArray(data.callLogs) ? data.callLogs : [] });
    } catch (err: any) {
      logger.error('Error loading call logs', { err });
      setCallsState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    setAgentsState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgentsState({ status: 'ready', agents: Array.isArray(data.agents) ? data.agents : [] });
    } catch (err: any) {
      logger.error('Error loading agents', { err });
      setAgentsState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  const fetchReady = useCallback(async () => {
    setReadyState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/ready');
      const data = await res.json();
      setReadyState({ status: 'ready', checks: data.checks ?? null });
    } catch (err: any) {
      logger.error('Error loading platform readiness', { err });
      setReadyState({ status: 'error', checks: null });
    }
  }, []);

  // GET /api/metrics is tenant-scoped (requireTenant) and mixes several event names (ai_call_*,
  // platform_ready_check, …) — fetched once here and filtered client-side per card below.
  const fetchMetrics = useCallback(async () => {
    setMetricsState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const allMetrics = Array.isArray(data.metrics) ? data.metrics : [];
      setMetricsState({ status: 'ready', metrics: allMetrics });
    } catch (err: any) {
      logger.error('Error loading metrics', { err });
      setMetricsState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const res = await fetch('/api/onboarding');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setChecklist(data.checklist ?? {});
      } catch (err: any) {
        logger.error('Error loading onboarding checklist from database', { err });
        setChecklistError(true);
        setChecklist({});
      }
    };

    fetchChecklist();
    fetchCalls();
    fetchAgents();
    fetchReady();
    fetchMetrics();
  }, [fetchCalls, fetchAgents, fetchReady, fetchMetrics]);

  const updateChecklist = async (key: string, value: boolean) => {
    if (!checklist) return;
    const updated = { ...checklist, [key]: value };
    setChecklist(updated);
    showToast(
      `Checklist atualizado! Progresso atualizado para ${Math.round(calculateOnboardingProgress(updated))}%`,
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

  return (
    <div className="space-y-8 animate-slide-up text-left">
      <OverviewHeader readyState={readyState} today={today} />

      <OverviewQuickActions onActionModal={setActiveActionModal} />

      <OverviewOnboardingWizard
        checklist={checklist}
        checklistError={checklistError}
        wizardStep={wizardStep}
        onWizardStep={setWizardStep}
        wizardCollapsed={wizardCollapsed}
        onCollapse={() => setWizardCollapsed(true)}
        updateChecklist={updateChecklist}
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

      {activeTab === 'kpis' && (
        <OverviewKpisTab
          callsState={callsState}
          agentsState={agentsState}
          readyState={readyState}
          metricsState={metricsState}
          checklist={checklist}
          onRefreshCalls={fetchCalls}
          onRefreshAgents={fetchAgents}
        />
      )}

      {activeTab === 'audit' && <OverviewAuditTab />}

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

      <OverviewActionModal
        activeActionModal={activeActionModal}
        onClose={() => setActiveActionModal(null)}
        onConfirm={handleExecuteQuickAction}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}

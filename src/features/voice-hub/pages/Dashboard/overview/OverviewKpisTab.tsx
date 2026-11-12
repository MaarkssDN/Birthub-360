import {
  Activity,
  AlertTriangle,
  Database,
  Phone,
  RefreshCw,
  Server,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
} from '../../../components/design-system/index.js';
import { PendingAlert, RealStatCard } from './OverviewWidgets.js';
import {
  AI_COST_METRIC,
  AI_LATENCY_METRIC,
  AI_TOKENS_METRIC,
  describeSlaFailure,
  formatMs,
  formatSecondsAsDuration,
  formatTokens,
  formatUsd,
  parseDurationToSeconds,
  SLA_READY_CHECK_METRIC,
  SLA_WINDOW_MS,
} from './overviewFormat.js';
import type {
  AgentsFetchState,
  CallsFetchState,
  MetricsFetchState,
  ReadyFetchState,
} from './overviewTypes.js';

interface OverviewKpisTabProps {
  callsState: CallsFetchState;
  agentsState: AgentsFetchState;
  readyState: ReadyFetchState;
  metricsState: MetricsFetchState;
  checklist: Record<string, boolean> | null;
  onRefreshCalls: () => void;
  onRefreshAgents: () => void;
}

export function OverviewKpisTab({
  callsState,
  agentsState,
  readyState,
  metricsState,
  checklist,
  onRefreshCalls,
  onRefreshAgents,
}: OverviewKpisTabProps) {
  const navigate = useNavigate();
  // ---- Real, derived metrics (no fabricated numbers) ----
  const totalAgents = agentsState.agents.length;
  const agentsWithPhone = agentsState.agents.filter((a) => !!a.phoneNumber).length;

  const totalCalls = callsState.calls.length;
  const today = new Date();
  const callsToday = callsState.calls.filter((c) => {
    if (!c.timestamp) return false;
    const d = new Date(c.timestamp);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  const completedCalls = callsState.calls.filter((c) => c.status === 'Concluído').length;
  const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : null;

  const parsedDurations = callsState.calls
    .map((c) => parseDurationToSeconds(c.duration))
    .filter((v): v is number => v !== null);
  const avgDuration =
    parsedDurations.length > 0
      ? formatSecondsAsDuration(parsedDurations.reduce((a, b) => a + b, 0) / parsedDurations.length)
      : null;

  // SLA (disponibilidade) — real uptime approximation from platform_ready_check samples in the
  // last 24h, never a fabricated percentage. Empty (not zero) until the scheduler has produced at
  // least one sample for this tenant — see .agents/handoffs/onda-4/10-para-02-sla-telemetria-overview.md.
  const slaSamples = metricsState.metrics
    .filter((m) => m.name === SLA_READY_CHECK_METRIC)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const slaWindowSamples = slaSamples.filter(
    (m) => Date.now() - new Date(m.timestamp).getTime() <= SLA_WINDOW_MS,
  );
  const slaUptimePercent =
    slaWindowSamples.length > 0
      ? (slaWindowSamples.filter((m) => m.value === 1).length / slaWindowSamples.length) * 100
      : null;
  const slaLastFailure = describeSlaFailure(slaSamples[0]);
  const slaCaption =
    slaUptimePercent !== null
      ? `${slaWindowSamples.length} amostra${slaWindowSamples.length === 1 ? '' : 's'} (24h) · a cada 5 min${slaLastFailure ? ` · última falha: ${slaLastFailure}` : ''}`
      : 'Ainda sem amostras suficientes';

  // Telemetria de IA (custo, tokens, latência) — real, tenant-wide, gravada por
  // lib/voice-runtime/providers/LLMGateway.ts a cada chamada que efetivamente atingiu um provedor.
  // Ver .agents/handoffs/onda-4/04-para-02-telemetria-custo-ia-disponivel.md. Nunca fabricado: sem
  // nenhuma linha ainda, os cards mostram "—" com uma legenda honesta de "ainda sem chamadas" (o
  // pipeline existe, só não houve chamada de IA neste tenant ainda).
  const aiCostSamples = metricsState.metrics.filter((m) => m.name === AI_COST_METRIC);
  const aiTokensSamples = metricsState.metrics.filter((m) => m.name === AI_TOKENS_METRIC);
  const aiLatencySamples = metricsState.metrics.filter((m) => m.name === AI_LATENCY_METRIC);

  const aiTotalCost =
    aiCostSamples.length > 0 ? aiCostSamples.reduce((sum, m) => sum + m.value, 0) : null;
  const aiTotalTokens =
    aiTokensSamples.length > 0 ? aiTokensSamples.reduce((sum, m) => sum + m.value, 0) : null;
  const aiAvgLatency =
    aiLatencySamples.length > 0
      ? aiLatencySamples.reduce((sum, m) => sum + m.value, 0) / aiLatencySamples.length
      : null;
  // Total de chamadas de IA reportadas = nº de amostras de latência (uma por chamada bem-sucedida
  // a um provedor real — ver contrato do handoff do Agente 04).
  const aiCallCount = aiLatencySamples.length;

  return (
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
              ? `${parsedDurations.length} chamadas com duração válida`
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
          {/* CHAMADAS RECENTES (BANCO DE DADOS) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Registro de Chamadas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                  Últimas interações de voz registradas no banco de dados.
                </p>
              </div>
              <button
                type="button"
                onClick={onRefreshCalls}
                className="p-1 px-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 dark:hover:bg-slate-800 dark:border-slate-700"
              >
                <RefreshCw className="h-3 w-3" /> Atualizar
              </button>
            </div>
            {callsState.status === 'loading' && (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
            {callsState.status === 'error' && (
              <EmptyState
                icon={<AlertTriangle className="h-8 w-8" />}
                title="Não foi possível carregar as chamadas"
                description="Verifique sua conexão e tente novamente."
                action={
                  <Button size="sm" variant="outline" onClick={onRefreshCalls}>
                    Tentar novamente
                  </Button>
                }
              />
            )}
            {callsState.status === 'ready' && callsState.calls.length === 0 && (
              <EmptyState
                icon={<Phone className="h-8 w-8" />}
                title="Nenhuma chamada registrada ainda"
                description="Assim que uma chamada real acontecer, ela aparece aqui."
              />
            )}
            {callsState.status === 'ready' && callsState.calls.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-650 dark:text-slate-450">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2">ID</th>
                      <th className="py-2">Contato</th>
                      <th className="py-2">Duração</th>
                      <th className="py-2">Agente</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Quando</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {callsState.calls.slice(0, 5).map((call) => (
                      <tr key={call.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">#{call.id}</td>
                        <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {call.contactName}
                        </td>
                        <td className="py-2.5 font-mono">{call.duration}</td>
                        <td className="py-2.5">{call.agent}</td>
                        <td className="py-2.5">
                          <Badge variant={call.status === 'Concluído' ? 'success' : 'danger'}>
                            {call.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-[10px]">
                          {call.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* AGENTES */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Seus Agentes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                  Agentes de voz cadastrados nesta organização.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/agents')}
                className="p-1 px-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700"
              >
                Ver todos
              </button>
            </div>
            {agentsState.status === 'loading' && (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
            {agentsState.status === 'error' && (
              <EmptyState
                icon={<AlertTriangle className="h-8 w-8" />}
                title="Não foi possível carregar os agentes"
                description="Verifique sua conexão e tente novamente."
                action={
                  <Button size="sm" variant="outline" onClick={onRefreshAgents}>
                    Tentar novamente
                  </Button>
                }
              />
            )}
            {agentsState.status === 'ready' && agentsState.agents.length === 0 && (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Nenhum agente criado ainda"
                description="Crie seu primeiro agente de voz para começar a qualificar leads."
                action={
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate('/dashboard/agents/new')}
                  >
                    Criar Agente
                  </Button>
                }
              />
            )}
            {agentsState.status === 'ready' && agentsState.agents.length > 0 && (
              <div className="space-y-2">
                {agentsState.agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand/10 text-brand rounded-lg">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{agent.model}</p>
                      </div>
                    </div>
                    <Badge variant={agent.phoneNumber ? 'success' : 'secondary'}>
                      {agent.phoneNumber ? 'Telefonia conectada' : 'Sem telefonia'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Health & Alerts */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Activity className="h-5 w-5 text-brand" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Status da Plataforma</h4>
            </div>
            {readyState.status === 'loading' && <Skeleton className="h-20 w-full" />}
            {readyState.status !== 'loading' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Banco de Dados
                    </p>
                  </div>
                  <Badge variant={readyState.checks?.database === 'ok' ? 'success' : 'danger'}>
                    {readyState.checks?.database === 'ok' ? 'Operacional' : 'Indisponível'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Redis</p>
                  </div>
                  <Badge variant={readyState.checks?.redis === 'ok' ? 'success' : 'danger'}>
                    {readyState.checks?.redis === 'ok' ? 'Operacional' : 'Indisponível'}
                  </Badge>
                </div>
              </div>
            )}
          </Card>

          {/* ALERTA E PENDÊNCIAS — computed from real data, not hardcoded copy. */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Alertas & Pendências</h4>
            </div>
            <div className="space-y-3">
              {agentsState.status === 'ready' && agentsState.agents.length === 0 && (
                <PendingAlert
                  title="Nenhum agente criado"
                  description="Crie seu primeiro agente de voz para começar a atender leads."
                  actionLabel="Criar agente"
                  onAction={() => navigate('/dashboard/agents/new')}
                />
              )}
              {agentsState.status === 'ready' &&
                agentsState.agents.length > 0 &&
                agentsWithPhone === 0 && (
                  <PendingAlert
                    title="Nenhum número de telefonia conectado"
                    description="Conecte um número de voz SIP para receber ligações reais de leads."
                    actionLabel="Vincular"
                    onAction={() => navigate('/dashboard/telephony')}
                  />
                )}
              {checklist && !checklist.knowledgeAdded && (
                <PendingAlert
                  title="Base de conhecimento vazia"
                  description="Adicione documentos de referência para melhorar a qualificação de leads."
                  actionLabel="Adicionar"
                  onAction={() => navigate('/dashboard/knowledge')}
                  tone="amber"
                />
              )}
              {agentsState.status === 'ready' &&
                agentsState.agents.length > 0 &&
                agentsWithPhone > 0 &&
                checklist?.knowledgeAdded && (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Nenhuma pendência identificada.
                  </p>
                )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

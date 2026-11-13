// Section-level components extracted from Dashboard/Overview.tsx
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063). Each card/panel receives already-fetched state and
// callbacks — no fetching or metric math lives here, so Overview.tsx stays a thin composition
// shell and these blocks can be reviewed (and tested) in isolation.
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Phone,
  Sparkles,
  CheckCircle2,
  Activity,
  RefreshCw,
  Database,
  Server,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Progress,
  Skeleton,
  EmptyState,
  Alert,
} from '../../components/design-system/index.js';
import { ChecklistItem, PendingAlert } from './overviewWidgets.js';
import type { AgentRecord, CallLogEntry, FetchStatus, ReadyChecks } from './overviewMetrics.js';

// Compact onboarding wizard + permanent checklist. `checklist === null` means the server state
// has not loaded yet — the panel renders skeletons instead of flashing default "done" state.
export function OnboardingPanel({
  checklist,
  checklistError,
  wizardStep,
  onWizardStep,
  wizardCollapsed,
  onCollapse,
  progress,
  onUpdateChecklist,
}: {
  checklist: Record<string, boolean> | null;
  checklistError: boolean;
  wizardStep: number;
  onWizardStep: (step: number) => void;
  wizardCollapsed: boolean;
  onCollapse: () => void;
  progress: number;
  onUpdateChecklist: (key: string, value: boolean) => void;
}) {
  const navigate = useNavigate();

  if (checklist === null) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!wizardCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-brand-50/50 dark:bg-brand-950/20 p-6 rounded-2xl border border-brand-100 dark:border-brand-900/40"
        >
          {/* Onboarding Wizard (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Guia de Onboarding</Badge>
                <span className="text-xs text-slate-500 font-bold">
                  Inicie sua operação em minutos
                </span>
              </div>
              <button
                type="button"
                onClick={onCollapse}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
              >
                Minimizar
              </button>
            </div>

            {checklistError && (
              <Alert
                variant="warning"
                title="Não foi possível carregar seu progresso salvo"
                description="Exibindo checklist local; suas próximas alterações ainda serão salvas ao servidor."
              />
            )}

            <div className="text-left space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Bem-vindo ao Birth Voices Hub
                <Sparkles className="h-4 w-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                Siga o assistente passo a passo para configurar e testar sua atendente virtual.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-brand">Progresso do Setup</span>
                <span className="text-xs font-bold text-brand font-mono">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} />
            </div>

            {/* Wizard Steps Layout */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { step: 0, title: 'Organização', active: !!checklist.orgCreated },
                { step: 1, title: 'IA Agente', active: !!checklist.agentCreated },
                { step: 2, title: 'Telefonia', active: !!checklist.telephonyConnected },
                { step: 3, title: 'Atendimento', active: !!checklist.firstCallCompleted },
              ].map((item) => (
                <button
                  type="button"
                  key={item.step}
                  onClick={() => onWizardStep(item.step)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    wizardStep === item.step
                      ? 'bg-white dark:bg-slate-800 border-brand shadow-sm font-bold text-slate-900 dark:text-white'
                      : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-white/40'
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Etapa {item.step + 1}
                  </p>
                  <p className="text-xs truncate font-semibold">{item.title}</p>
                  <div className="flex justify-center mt-1">
                    {item.active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Step Detail Content */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-brand-100 dark:border-brand-900/30 text-left space-y-3">
              {wizardStep === 0 && (
                <>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    1. Criar e Configurar Organização
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Defina as cores corporativas, faça upload do logotipo da empresa e gerencie os
                    administradores do sistema.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/dashboard/organization')}
                    >
                      Configurar Organização
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateChecklist('orgCreated', true)}
                    >
                      Marcar como feito
                    </Button>
                  </div>
                </>
              )}
              {wizardStep === 1 && (
                <>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    2. Criar seu Primeiro Agente de Voz
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Configure os prompts comerciais, ajuste o tom de voz e defina as diretrizes de
                    qualificação de leads.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/dashboard/agents/new')}
                    >
                      Criar Agente
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateChecklist('agentCreated', true)}
                    >
                      Marcar como feito
                    </Button>
                  </div>
                </>
              )}
              {wizardStep === 2 && (
                <>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    3. Conectar Telefonia e SIP Trunk
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Conecte seu número de telefone virtual ou operadora local via protocolo SIP para
                    receber chamadas de leads.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/dashboard/telephony')}
                    >
                      Conectar Telefonia
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateChecklist('telephonyConnected', true)}
                    >
                      Marcar como feito
                    </Button>
                  </div>
                </>
              )}
              {wizardStep === 3 && (
                <>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    4. Executar Primeiro Teste Real de Chamada
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Abra o playground reativo de áudio e simule uma chamada de voz para verificar a
                    latência, o tom e as transcrições do agente.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/dashboard/playground')}
                    >
                      Abrir Playground
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateChecklist('firstCallCompleted', true)}
                    >
                      Concluir Setup!
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Smart Checklist (Right 1 col) */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-brand-100/60 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold text-xs uppercase tracking-wider mb-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-brand" />
                <span>Checklist Permanente</span>
              </div>

              <div className="space-y-2.5">
                <ChecklistItem
                  label="Organização Configurada"
                  checked={!!checklist.orgCreated}
                  onChange={() => onUpdateChecklist('orgCreated', !checklist.orgCreated)}
                  onClick={() => navigate('/dashboard/organization')}
                />
                <ChecklistItem
                  label="Primeiro Agente Criado"
                  checked={!!checklist.agentCreated}
                  onChange={() => onUpdateChecklist('agentCreated', !checklist.agentCreated)}
                  onClick={() => navigate('/dashboard/agents/new')}
                />
                <ChecklistItem
                  label="Telefonia Conectada"
                  checked={!!checklist.telephonyConnected}
                  onChange={() =>
                    onUpdateChecklist('telephonyConnected', !checklist.telephonyConnected)
                  }
                  onClick={() => navigate('/dashboard/telephony')}
                />
                <ChecklistItem
                  label="Conhecimento Enviado"
                  checked={!!checklist.knowledgeAdded}
                  onChange={() => onUpdateChecklist('knowledgeAdded', !checklist.knowledgeAdded)}
                  onClick={() => navigate('/dashboard/knowledge')}
                />
                <ChecklistItem
                  label="Primeiro Teste Efetuado"
                  checked={!!checklist.firstTest}
                  onChange={() => onUpdateChecklist('firstTest', !checklist.firstTest)}
                  onClick={() => navigate('/dashboard/playground')}
                />
                <ChecklistItem
                  label="Agente de Voz Ativo"
                  checked={!!checklist.agentPublished}
                  onChange={() => onUpdateChecklist('agentPublished', !checklist.agentPublished)}
                  onClick={() => navigate('/dashboard/agents/new')}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-left">
              <span className="text-[10px] text-slate-400 block leading-tight">
                Seu progresso é salvo automaticamente na sua conta.
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// CHAMADAS RECENTES (BANCO DE DADOS)
export function CallsLogCard({
  status,
  calls,
  onRefresh,
}: {
  status: FetchStatus;
  calls: CallLogEntry[];
  onRefresh: () => void;
}) {
  return (
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
          onClick={onRefresh}
          className="p-1 px-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 dark:hover:bg-slate-800 dark:border-slate-700"
        >
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>
      {status === 'loading' && (
        <div className="space-y-2 py-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
      {status === 'error' && (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Não foi possível carregar as chamadas"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button size="sm" variant="outline" onClick={onRefresh}>
              Tentar novamente
            </Button>
          }
        />
      )}
      {status === 'ready' && calls.length === 0 && (
        <EmptyState
          icon={<Phone className="h-8 w-8" />}
          title="Nenhuma chamada registrada ainda"
          description="Assim que uma chamada real acontecer, ela aparece aqui."
        />
      )}
      {status === 'ready' && calls.length > 0 && (
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
              {calls.slice(0, 5).map((call) => (
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
                  <td className="py-2.5 text-right text-slate-400 text-[10px]">{call.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// AGENTES
export function AgentsCard({
  status,
  agents,
  onViewAll,
  onRetry,
  onCreateAgent,
}: {
  status: FetchStatus;
  agents: AgentRecord[];
  onViewAll: () => void;
  onRetry: () => void;
  onCreateAgent: () => void;
}) {
  return (
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
          onClick={onViewAll}
          className="p-1 px-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700"
        >
          Ver todos
        </button>
      </div>
      {status === 'loading' && (
        <div className="space-y-2 py-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
      {status === 'error' && (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Não foi possível carregar os agentes"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button size="sm" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          }
        />
      )}
      {status === 'ready' && agents.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Nenhum agente criado ainda"
          description="Crie seu primeiro agente de voz para começar a qualificar leads."
          action={
            <Button size="sm" variant="primary" onClick={onCreateAgent}>
              Criar Agente
            </Button>
          }
        />
      )}
      {status === 'ready' && agents.length > 0 && (
        <div className="space-y-2">
          {agents.slice(0, 5).map((agent) => (
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
  );
}

// STATUS DA PLATAFORMA (GET /api/ready — database + redis)
export function PlatformStatusCard({
  status,
  checks,
}: {
  status: FetchStatus;
  checks: ReadyChecks | null;
}) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <Activity className="h-5 w-5 text-brand" />
        <h4 className="font-bold text-sm uppercase tracking-wider">Status da Plataforma</h4>
      </div>
      {status === 'loading' && <Skeleton className="h-20 w-full" />}
      {status !== 'loading' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Banco de Dados</p>
            </div>
            <Badge variant={checks?.database === 'ok' ? 'success' : 'danger'}>
              {checks?.database === 'ok' ? 'Operacional' : 'Indisponível'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Redis</p>
            </div>
            <Badge variant={checks?.redis === 'ok' ? 'success' : 'danger'}>
              {checks?.redis === 'ok' ? 'Operacional' : 'Indisponível'}
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
}

// ALERTA E PENDÊNCIAS — computed from real data, not hardcoded copy.
export function PendingAlertsCard({
  agentsStatus,
  agentsCount,
  agentsWithPhone,
  checklist,
}: {
  agentsStatus: FetchStatus;
  agentsCount: number;
  agentsWithPhone: number;
  checklist: Record<string, boolean> | null;
}) {
  const navigate = useNavigate();
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <ShieldAlert className="h-5 w-5" />
        <h4 className="font-bold text-sm uppercase tracking-wider">Alertas & Pendências</h4>
      </div>
      <div className="space-y-3">
        {agentsStatus === 'ready' && agentsCount === 0 && (
          <PendingAlert
            title="Nenhum agente criado"
            description="Crie seu primeiro agente de voz para começar a atender leads."
            actionLabel="Criar agente"
            onAction={() => navigate('/dashboard/agents/new')}
          />
        )}
        {agentsStatus === 'ready' && agentsCount > 0 && agentsWithPhone === 0 && (
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
        {agentsStatus === 'ready' &&
          agentsCount > 0 &&
          agentsWithPhone > 0 &&
          checklist?.knowledgeAdded && (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma pendência identificada.
            </p>
          )}
      </div>
    </Card>
  );
}

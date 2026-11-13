import {
  AlertCircle,
  Database,
  Link as LinkIcon,
  Save,
  Settings,
  Shield,
  Sliders,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card.js';
import { CommandCenterHeader } from '../../../components/ui/CommandCenterHeader.js';
import { PILLAR_NAME_TO_SLUG } from '../domain/pillarSettings.js';
import { pillarSettingsApi } from '../pillarSettings.api.js';
import { PillarToolsForms } from './PillarToolsForms.js';

interface PillarSettingsProps {
  pillarName: string;
}

export function PillarSettingsPlaceholder({ pillarName }: PillarSettingsProps) {
  const [activeTab, setActiveTab] = useState<
    'ferramentas' | 'permissoes' | 'automacoes' | 'integracoes'
  >('ferramentas');

  // Estados locais interativos para as ferramentas
  const [hubStagnationDays, setHubStagnationDays] = useState(14);
  const [hubRequireLossReason, setHubRequireLossReason] = useState(true);
  const [hubDedupCnpj, setHubDedupCnpj] = useState(true);

  const [marketMinRevenue, setMarketMinRevenue] = useState('R$ 5.000.000');
  const [marketAutoEnrich, setMarketAutoEnrich] = useState(true);
  const [marketSignalAlerts, setMarketSignalAlerts] = useState(true);

  const [salesSpeedToLead, setSalesSpeedToLead] = useState(5);
  const [salesRequireBant, setSalesRequireBant] = useState(true);
  const [salesDailyTouchesLimit, setSalesDailyTouchesLimit] = useState(40);

  const [perfBenchmarkRate, setPerfBenchmarkRate] = useState(18.5);
  const [perfRepScoreActive, setPerfRepScoreActive] = useState(true);
  const [perfAnomalyAlerts, setPerfAnomalyAlerts] = useState(true);

  const [predModelType, setPredModelType] = useState<'historico' | 'manual'>('historico');
  const [predFreezeDay, setPredFreezeDay] = useState(25);
  const [predConfidenceFactor, setPredConfidenceFactor] = useState(85);

  const [aiModel, setAiModel] = useState('Claude 3.5 Sonnet');
  const [aiTemperature, setAiTemperature] = useState(0.3);
  const [aiPiiMasking, setAiPiiMasking] = useState(true);

  const [autoBiDirectional, setAutoBiDirectional] = useState(true);
  const [autoRetryCount, setAutoRetryCount] = useState(3);
  const [autoSyncInterval, setAutoSyncInterval] = useState(5);

  const [engClickToCall, setEngClickToCall] = useState(true);
  const [engRecordCalls, setEngRecordCalls] = useState(true);
  const [engWorkingHoursOnly, setEngWorkingHoursOnly] = useState(true);

  // Onda F1: persistência real via /api/settings/pillars/:pillar (Setting por org).
  // Somente a aba "Ferramentas & Regras" tem contrato de backend — as demais abas
  // (permissoes/automacoes/integracoes) continuam placeholders visuais.
  const pillarSlug = PILLAR_NAME_TO_SLUG[pillarName] ?? null;
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const applyValues = useCallback(
    (values: Record<string, unknown>) => {
      const num = (k: string, fallback: number) =>
        typeof values[k] === 'number' ? (values[k] as number) : fallback;
      const bool = (k: string, fallback: boolean) =>
        typeof values[k] === 'boolean' ? (values[k] as boolean) : fallback;
      const str = (k: string, fallback: string) =>
        typeof values[k] === 'string' ? (values[k] as string) : fallback;

      switch (pillarName) {
        case 'Hub Comercial':
          setHubStagnationDays(num('stagnationDays', 14));
          setHubRequireLossReason(bool('requireLossReason', true));
          setHubDedupCnpj(bool('dedupCnpj', true));
          break;
        case 'Inteligência de Mercado':
          setMarketMinRevenue(str('minRevenue', 'R$ 5.000.000'));
          setMarketAutoEnrich(bool('autoEnrich', true));
          setMarketSignalAlerts(bool('signalAlerts', true));
          break;
        case 'Orquestração de Vendas':
          setSalesSpeedToLead(num('speedToLeadMin', 5));
          setSalesRequireBant(bool('requireBant', true));
          setSalesDailyTouchesLimit(num('dailyTouchesLimit', 40));
          break;
        case 'Performance Comercial':
          setPerfBenchmarkRate(num('benchmarkRate', 18.5));
          setPerfRepScoreActive(bool('repScoreActive', true));
          setPerfAnomalyAlerts(bool('anomalyAlerts', true));
          break;
        case 'Previsibilidade Comercial':
          setPredModelType(values.modelType === 'manual' ? 'manual' : 'historico');
          setPredFreezeDay(num('freezeDay', 25));
          setPredConfidenceFactor(num('confidenceFactor', 85));
          break;
        case 'Inteligência Artificial':
          setAiModel(str('model', 'Claude 3.5 Sonnet'));
          setAiTemperature(num('temperature', 0.3));
          setAiPiiMasking(bool('piiMasking', true));
          break;
        case 'Automação & Conectividade':
          setAutoBiDirectional(bool('biDirectional', true));
          setAutoSyncInterval(num('syncIntervalMin', 5));
          setAutoRetryCount(num('retryCount', 3));
          break;
        case 'Engajamento Comercial':
          setEngClickToCall(bool('clickToCall', true));
          setEngRecordCalls(bool('recordCalls', true));
          setEngWorkingHoursOnly(bool('workingHoursOnly', true));
          break;
        default:
          break;
      }
    },
    [pillarName],
  );

  const collectValues = (): Record<string, unknown> | null => {
    switch (pillarName) {
      case 'Hub Comercial':
        return {
          stagnationDays: hubStagnationDays,
          requireLossReason: hubRequireLossReason,
          dedupCnpj: hubDedupCnpj,
        };
      case 'Inteligência de Mercado':
        return {
          minRevenue: marketMinRevenue,
          autoEnrich: marketAutoEnrich,
          signalAlerts: marketSignalAlerts,
        };
      case 'Orquestração de Vendas':
        return {
          speedToLeadMin: salesSpeedToLead,
          requireBant: salesRequireBant,
          dailyTouchesLimit: salesDailyTouchesLimit,
        };
      case 'Performance Comercial':
        return {
          benchmarkRate: perfBenchmarkRate,
          repScoreActive: perfRepScoreActive,
          anomalyAlerts: perfAnomalyAlerts,
        };
      case 'Previsibilidade Comercial':
        return {
          modelType: predModelType,
          freezeDay: predFreezeDay,
          confidenceFactor: predConfidenceFactor,
        };
      case 'Inteligência Artificial':
        return {
          model: aiModel,
          temperature: aiTemperature,
          piiMasking: aiPiiMasking,
        };
      case 'Automação & Conectividade':
        return {
          biDirectional: autoBiDirectional,
          syncIntervalMin: autoSyncInterval,
          retryCount: autoRetryCount,
        };
      case 'Engajamento Comercial':
        return {
          clickToCall: engClickToCall,
          recordCalls: engRecordCalls,
          workingHoursOnly: engWorkingHoursOnly,
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!pillarSlug) {
      setLoadState('error');
      setLoadError('Pilar de configurações não reconhecido.');
      return;
    }
    let cancelled = false;
    setLoadState('loading');
    setLoadError(null);
    pillarSettingsApi
      .get(pillarSlug)
      .then((view) => {
        if (cancelled) return;
        applyValues(view.values);
        setSavedAt(view.updatedAt);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Falha ao carregar configurações.');
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [pillarSlug, applyValues]);

  const handleSave = async () => {
    if (!pillarSlug || saveState === 'saving') return;
    const values = collectValues();
    if (!values) return;
    setSaveState('saving');
    setSaveError(null);
    try {
      const view = await pillarSettingsApi.update(pillarSlug, values);
      applyValues(view.values);
      setSavedAt(view.updatedAt);
      setSaveState('saved');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar configurações.');
      setSaveState('error');
    }
  };

  const tabs = [
    { id: 'ferramentas' as const, label: 'Ferramentas & Regras', icon: Sliders },
    { id: 'permissoes' as const, label: 'Permissões & Acesso', icon: Shield },
    { id: 'automacoes' as const, label: 'Gatilhos & Automações', icon: Zap },
    { id: 'integracoes' as const, label: 'Conexões & Dados', icon: LinkIcon },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)] text-[var(--ink)]">
      <CommandCenterHeader
        title={`Configurações: ${pillarName}`}
        icon={Settings}
        actions={
          <div className="flex items-center gap-2">
            {saveState === 'saved' && (
              <span className="text-xs font-semibold text-[var(--nav-c-green)] hidden md:inline">
                Salvo
              </span>
            )}
            {saveState === 'error' && (
              <span className="text-xs font-semibold text-[var(--nav-c-red)] hidden md:inline">
                Falha ao salvar
              </span>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={
                !pillarSlug ||
                loadState !== 'ready' ||
                saveState === 'saving' ||
                activeTab !== 'ferramentas'
              }
              title={
                activeTab !== 'ferramentas'
                  ? 'Somente a aba "Ferramentas & Regras" é persistida no servidor.'
                  : loadState === 'error'
                    ? (loadError ?? 'Falha ao carregar configurações.')
                    : undefined
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {saveState === 'saving' ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 border-r border-[var(--line)] bg-[var(--surface)] p-4 flex flex-col gap-2 shrink-0">
          <div className="px-3 py-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
              Painel de Ajustes
            </span>
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--nav-c-blue)]/10 text-[var(--nav-c-blue)] font-semibold shadow-sm'
                    : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-auto p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
            <span className="text-xs font-semibold text-[var(--ink)] block mb-1">
              Status do Pilar
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  loadState === 'ready'
                    ? 'bg-[var(--nav-c-green)]'
                    : loadState === 'error'
                      ? 'bg-[var(--nav-c-red)]'
                      : 'bg-[var(--ink-3)]'
                }`}
              />
              {loadState === 'loading' && 'Carregando…'}
              {loadState === 'error' && 'Falha ao carregar'}
              {loadState === 'ready' &&
                (savedAt ? `Salvo em ${new Date(savedAt).toLocaleString('pt-BR')}` : 'Persistido')}
            </div>
          </div>
        </div>

        {/* Settings Content area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-semibold">
                  {pillarName}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'ferramentas' ? 'Persistente' : 'Pré-visualização'}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">{tabs.find((t) => t.id === activeTab)?.label}</h2>
              <p className="text-[var(--ink-2)] text-sm">
                Gerencie regras operacionais, governança e conectores exclusivos do{' '}
                <strong>{pillarName}</strong>.
              </p>
            </div>

            {loadState === 'error' && (
              <div
                role="alert"
                className="flex gap-3 p-4 rounded-xl border border-[var(--nav-c-red)]/30 bg-[var(--nav-c-red)]/5"
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5 text-[var(--nav-c-red)]"
                  aria-hidden="true"
                />
                <div className="text-sm">
                  <p className="font-semibold text-[var(--ink)]">
                    Não foi possível carregar as configurações salvas
                  </p>
                  <p className="text-xs text-[var(--ink-2)] mt-1">{loadError}</p>
                </div>
              </div>
            )}

            {saveState === 'error' && saveError && (
              <div
                role="alert"
                className="flex gap-3 p-4 rounded-xl border border-[var(--nav-c-red)]/30 bg-[var(--nav-c-red)]/5"
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5 text-[var(--nav-c-red)]"
                  aria-hidden="true"
                />
                <div className="text-sm">
                  <p className="font-semibold text-[var(--ink)]">Falha ao salvar</p>
                  <p className="text-xs text-[var(--ink-2)] mt-1">{saveError}</p>
                </div>
              </div>
            )}

            {activeTab !== 'ferramentas' ? (
              <div
                role="note"
                className="flex gap-3 p-4 rounded-xl border border-[var(--nav-c-gold)]/30 bg-[var(--nav-c-gold)]/5"
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5 text-[var(--nav-c-gold)]"
                  aria-hidden="true"
                />
                <div className="text-sm">
                  <p className="font-semibold text-[var(--ink)]">Pré-visualização — nada é salvo</p>
                  <p className="text-xs text-[var(--ink-2)] mt-1">
                    Os valores abaixo são ilustrativos e <strong>não são gravados</strong>. Somente
                    a aba &quot;Ferramentas &amp; Regras&quot; possui persistência real no servidor.
                  </p>
                </div>
              </div>
            ) : null}

            {activeTab === 'ferramentas' && (
              <div
                role="note"
                className="flex gap-3 p-4 rounded-xl border border-[var(--nav-c-blue)]/30 bg-[var(--nav-c-blue)]/5"
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5 text-[var(--nav-c-blue)]"
                  aria-hidden="true"
                />
                <div className="text-sm">
                  <p className="font-semibold text-[var(--ink)]">
                    Preferências persistidas — aplicação em integração
                  </p>
                  <p className="text-xs text-[var(--ink-2)] mt-1">
                    Os valores desta aba são <strong>salvos no servidor</strong>, mas a aplicação
                    efetiva nas rotinas dos módulos consumidores ainda está em integração. Trate-os
                    como preferências registradas, não como regras já em enforcement.
                  </p>
                </div>
              </div>
            )}

            {/* Render Tab Contents */}
            {activeTab === 'ferramentas' && (
              <PillarToolsForms
                pillarName={pillarName}
                hubStagnationDays={hubStagnationDays}
                setHubStagnationDays={setHubStagnationDays}
                hubRequireLossReason={hubRequireLossReason}
                setHubRequireLossReason={setHubRequireLossReason}
                hubDedupCnpj={hubDedupCnpj}
                setHubDedupCnpj={setHubDedupCnpj}
                marketMinRevenue={marketMinRevenue}
                setMarketMinRevenue={setMarketMinRevenue}
                marketAutoEnrich={marketAutoEnrich}
                setMarketAutoEnrich={setMarketAutoEnrich}
                marketSignalAlerts={marketSignalAlerts}
                setMarketSignalAlerts={setMarketSignalAlerts}
                salesSpeedToLead={salesSpeedToLead}
                setSalesSpeedToLead={setSalesSpeedToLead}
                salesRequireBant={salesRequireBant}
                setSalesRequireBant={setSalesRequireBant}
                salesDailyTouchesLimit={salesDailyTouchesLimit}
                setSalesDailyTouchesLimit={setSalesDailyTouchesLimit}
                perfBenchmarkRate={perfBenchmarkRate}
                setPerfBenchmarkRate={setPerfBenchmarkRate}
                perfRepScoreActive={perfRepScoreActive}
                setPerfRepScoreActive={setPerfRepScoreActive}
                perfAnomalyAlerts={perfAnomalyAlerts}
                setPerfAnomalyAlerts={setPerfAnomalyAlerts}
                predModelType={predModelType}
                setPredModelType={setPredModelType}
                predFreezeDay={predFreezeDay}
                setPredFreezeDay={setPredFreezeDay}
                predConfidenceFactor={predConfidenceFactor}
                setPredConfidenceFactor={setPredConfidenceFactor}
                aiModel={aiModel}
                setAiModel={setAiModel}
                aiTemperature={aiTemperature}
                setAiTemperature={setAiTemperature}
                aiPiiMasking={aiPiiMasking}
                setAiPiiMasking={setAiPiiMasking}
                autoBiDirectional={autoBiDirectional}
                setAutoBiDirectional={setAutoBiDirectional}
                autoSyncInterval={autoSyncInterval}
                setAutoSyncInterval={setAutoSyncInterval}
                autoRetryCount={autoRetryCount}
                setAutoRetryCount={setAutoRetryCount}
                engClickToCall={engClickToCall}
                setEngClickToCall={setEngClickToCall}
                engRecordCalls={engRecordCalls}
                setEngRecordCalls={setEngRecordCalls}
                engWorkingHoursOnly={engWorkingHoursOnly}
                setEngWorkingHoursOnly={setEngWorkingHoursOnly}
              />
            )}

            {activeTab === 'permissoes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Acesso Modular (RBAC)</CardTitle>
                  <CardDescription>
                    Nível de privilégio concedido a cada papel para visualização e edição dentro de{' '}
                    {pillarName}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 border-t border-[var(--line)] pt-6">
                  {[
                    { role: 'Admin', desc: 'Acesso total, auditoria e edição de parâmetros' },
                    {
                      role: 'Gestor Comercial',
                      desc: 'Edição de metas, distribuição e relatórios',
                    },
                    { role: 'Closer / AE', desc: 'Leitura de dados e execução de negociações' },
                    {
                      role: 'SDR / Pré-Vendas',
                      desc: 'Operação de toques e qualificação de leads',
                    },
                    {
                      role: 'Visualizador',
                      desc: 'Apenas leitura executiva sem permissão de escrita',
                    },
                  ].map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center justify-between p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--line)]"
                    >
                      <div>
                        <p className="font-semibold text-sm">{item.role}</p>
                        <p className="text-xs text-[var(--ink-3)]">{item.desc}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label
                          className="flex items-center gap-2 text-xs font-medium text-[var(--ink-3)] cursor-not-allowed"
                          title="Em breve — permissões reais são gerenciadas pelo RBAC do backend."
                        >
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            disabled
                            aria-disabled="true"
                            className="rounded border-[var(--line)] text-[var(--nav-c-blue)] focus:ring-[var(--nav-c-blue)] disabled:opacity-50"
                          />
                          Ver
                        </label>
                        <label
                          className="flex items-center gap-2 text-xs font-medium text-[var(--ink-3)] cursor-not-allowed"
                          title="Em breve — permissões reais são gerenciadas pelo RBAC do backend."
                        >
                          <input
                            type="checkbox"
                            defaultChecked={!item.role.includes('Visualizador')}
                            disabled
                            aria-disabled="true"
                            className="rounded border-[var(--line)] text-[var(--nav-c-blue)] focus:ring-[var(--nav-c-blue)] disabled:opacity-50"
                          />
                          Editar
                        </label>
                        <label
                          className="flex items-center gap-2 text-xs font-medium text-[var(--ink-3)] cursor-not-allowed"
                          title="Em breve — permissões reais são gerenciadas pelo RBAC do backend."
                        >
                          <input
                            type="checkbox"
                            defaultChecked={
                              item.role.includes('Admin') || item.role.includes('Gestor')
                            }
                            disabled
                            aria-disabled="true"
                            className="rounded border-[var(--line)] text-[var(--nav-c-blue)] focus:ring-[var(--nav-c-blue)] disabled:opacity-50"
                          />
                          Excluir
                        </label>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === 'automacoes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Gatilhos & Eventos do Pilar</CardTitle>
                  <CardDescription>
                    Ações automáticas disparadas mediante eventos que ocorrem em {pillarName}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 border-t border-[var(--line)] pt-6">
                  {[
                    {
                      name: 'Notificar gestor em desvio de SLA',
                      trigger: 'Tempo na etapa ultrapassa o limite de estagnação',
                      active: true,
                    },
                    {
                      name: 'Disparar webhook externo em ganho',
                      trigger: 'Negócio marcado como Ganho (Deal Won)',
                      active: true,
                    },
                    {
                      name: 'Sincronizar tarefas no calendário pessoal',
                      trigger: 'Nova atividade ou reunião agendada',
                      active: false,
                    },
                  ].map((auto) => (
                    <div
                      key={auto.name}
                      className="flex items-center justify-between p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--line)]"
                    >
                      <div>
                        <p className="font-semibold text-sm">{auto.name}</p>
                        <p className="text-xs text-[var(--ink-3)]">{auto.trigger}</p>
                      </div>
                      <Badge
                        variant="default"
                        className={
                          auto.active
                            ? 'bg-[var(--nav-c-green)]/10 text-[var(--nav-c-green)]'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        {auto.active ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === 'integracoes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Conexões de Dados & APIs</CardTitle>
                  <CardDescription>
                    Sistemas externos e bancos de dados vinculados diretamente a {pillarName}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 border-t border-[var(--line)] pt-6">
                  {[
                    {
                      name: 'Banco de Dados Principal (PostgreSQL / Prisma)',
                      status: 'Não monitorado aqui',
                    },
                    {
                      name: 'Fila de Mensageria (Redis / BullMQ)',
                      status: 'Não monitorado aqui',
                    },
                    {
                      name: 'Gateway de Telemetria e Logs (OpenTelemetry)',
                      status: 'Não monitorado aqui',
                    },
                  ].map((conn) => (
                    <div
                      key={conn.name}
                      className="flex items-center justify-between p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--line)]"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-[var(--ink-3)]" aria-hidden="true" />
                        <div>
                          <p className="font-semibold text-sm">{conn.name}</p>
                          <p className="text-xs text-[var(--ink-3)]">
                            Saúde e latência reais ficam no painel de observabilidade.
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {conn.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Aviso de Isolamento de Tenancy */}
            <div className="p-4 bg-[var(--nav-c-blue)]/5 border border-[var(--nav-c-blue)]/20 rounded-xl flex gap-3 mt-6">
              <Shield className="text-[var(--nav-c-blue)] shrink-0 w-5 h-5 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-[var(--nav-c-blue)]">
                  Isolamento Seguro por Organização (Multi-Tenant)
                </h4>
                <p className="text-xs text-[var(--ink-2)] mt-1">
                  Todas as regras e limites definidos nesta tela afetam unicamente a sua organização
                  e estão protegidos por Row-Level Security e criptografia em repouso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

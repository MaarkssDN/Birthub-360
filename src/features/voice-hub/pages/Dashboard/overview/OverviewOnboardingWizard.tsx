import { CheckCircle2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Progress,
  Skeleton,
} from '../../../components/design-system/index.js';
import { ChecklistItem } from './OverviewWidgets.js';
import { calculateOnboardingProgress } from './overviewFormat.js';

interface OverviewOnboardingWizardProps {
  checklist: Record<string, boolean> | null;
  checklistError: boolean;
  wizardStep: number;
  onWizardStep: (step: number) => void;
  wizardCollapsed: boolean;
  onCollapse: () => void;
  updateChecklist: (key: string, value: boolean) => void;
}

export function OverviewOnboardingWizard({
  checklist,
  checklistError,
  wizardStep,
  onWizardStep,
  wizardCollapsed,
  onCollapse,
  updateChecklist,
}: OverviewOnboardingWizardProps) {
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
                onClick={() => onCollapse()}
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
                  {Math.round(calculateOnboardingProgress(checklist))}%
                </span>
              </div>
              <Progress value={calculateOnboardingProgress(checklist)} />
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
                      onClick={() => updateChecklist('orgCreated', true)}
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
                      onClick={() => updateChecklist('agentCreated', true)}
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
                      onClick={() => updateChecklist('telephonyConnected', true)}
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
                      onClick={() => updateChecklist('firstCallCompleted', true)}
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
                  onChange={() => updateChecklist('orgCreated', !checklist.orgCreated)}
                  onClick={() => navigate('/dashboard/organization')}
                />
                <ChecklistItem
                  label="Primeiro Agente Criado"
                  checked={!!checklist.agentCreated}
                  onChange={() => updateChecklist('agentCreated', !checklist.agentCreated)}
                  onClick={() => navigate('/dashboard/agents/new')}
                />
                <ChecklistItem
                  label="Telefonia Conectada"
                  checked={!!checklist.telephonyConnected}
                  onChange={() =>
                    updateChecklist('telephonyConnected', !checklist.telephonyConnected)
                  }
                  onClick={() => navigate('/dashboard/telephony')}
                />
                <ChecklistItem
                  label="Conhecimento Enviado"
                  checked={!!checklist.knowledgeAdded}
                  onChange={() => updateChecklist('knowledgeAdded', !checklist.knowledgeAdded)}
                  onClick={() => navigate('/dashboard/knowledge')}
                />
                <ChecklistItem
                  label="Primeiro Teste Efetuado"
                  checked={!!checklist.firstTest}
                  onChange={() => updateChecklist('firstTest', !checklist.firstTest)}
                  onClick={() => navigate('/dashboard/playground')}
                />
                <ChecklistItem
                  label="Agente de Voz Ativo"
                  checked={!!checklist.agentPublished}
                  onChange={() => updateChecklist('agentPublished', !checklist.agentPublished)}
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

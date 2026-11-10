import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, RotateCcw, Send, Sparkles, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import type { SwarmEvent } from '../../features/intelligence/agents/supervisor.agent.js';
import { hasRequiredRole, MESA_TRATAMENTO_ROLES } from '../../lib/auth/authorization.js';
import { SoundFX } from '../../lib/soundEffects.js';
import { readSseStream, sseRequestInit } from '../../lib/sse.js';
import type { TabType } from '../layout/tabMeta.js';
import { isNavHiddenTab } from '../layout/tabMeta.js';
import { AiReasoningPipeline, type AiReasoningStep } from './AiReasoningPipeline.js';

interface AgentCharacter {
  id: 'orbit' | 'nexus' | 'aria' | 'vanguard' | 'oracle' | 'core' | 'spark' | 'echo' | 'sudo';
  name: string;
  role: string;
  color: string;
  headingColor: string;
  subheadingColor: string;
  contextMsg: string;
  ariaLabel: string;
}

const AGENTS_BY_PILLAR: Record<string, AgentCharacter> = {
  'PILAR 01 — HUB COMERCIAL': {
    id: 'orbit',
    name: 'Orbit',
    role: 'Guardião do CRM',
    color: 'from-amber-400 to-amber-600',
    headingColor: '#FFC107',
    subheadingColor: '#70D6FF',
    contextMsg: 'Monitorando pipeline e integridade dos negócios',
    ariaLabel: 'Orbit, agente guardião do CRM e da integridade de pipeline',
  },
  'PILAR 02 — INTELIGÊNCIA DE MERCADO': {
    id: 'nexus',
    name: 'Nexus',
    role: 'Analista de Dados',
    color: 'from-blue-400 to-blue-600',
    headingColor: '#00D4FF',
    subheadingColor: '#BAE6FD',
    contextMsg: 'Pesquisando dados de mercado, ICP e decisores',
    ariaLabel: 'Nexus, agente analista de dados e inteligência de mercado',
  },
  'PILAR 03 — ORQUESTRAÇÃO DE VENDAS': {
    id: 'aria',
    name: 'Aria',
    role: 'Maestrina de Fluxos',
    color: 'from-emerald-400 to-emerald-600',
    headingColor: '#10B981',
    subheadingColor: '#34D399',
    contextMsg: 'Otimizando cadência diária e próximas melhores ações',
    ariaLabel: 'Aria, agente maestrina de fluxos diários e cadência de vendas',
  },
  'PILAR 04 — PERFORMANCE COMERCIAL': {
    id: 'vanguard',
    name: 'Vanguard',
    role: 'Estrategista de Metas',
    color: 'from-rose-400 to-rose-600',
    headingColor: '#FF2D9B',
    subheadingColor: '#FFC107',
    contextMsg: 'Acompanhando gargalos de conversão e metas',
    ariaLabel: 'Vanguard, agente estrategista de metas e aceleração de performance',
  },
  'PILAR 05 — PREVISIBILIDADE COMERCIAL': {
    id: 'oracle',
    name: 'Oracle',
    role: 'Visionário de Forecast',
    color: 'from-purple-400 to-purple-600',
    headingColor: '#A855F7',
    subheadingColor: '#FF2D9B',
    contextMsg: 'Projetando forecast ponderado e fechamentos',
    ariaLabel: 'Oracle, agente visionário de forecast e previsibilidade comercial',
  },
  'PILAR 06 — INTELIGÊNCIA ARTIFICIAL': {
    id: 'core',
    name: 'Core',
    role: 'Mente Principal',
    color: 'from-indigo-400 to-indigo-600',
    headingColor: '#6366F1',
    subheadingColor: '#00D4FF',
    contextMsg: 'Supervisionando o enxame de agentes autônomos',
    ariaLabel: 'Core, agente mente principal e orquestrador cognitivo de IA',
  },
  'PILAR 07 — AUTOMAÇÃO & CONECTIVIDADE': {
    id: 'spark',
    name: 'Spark',
    role: 'Engenheiro de Integrações',
    color: 'from-teal-400 to-teal-600',
    headingColor: '#14B8A6',
    subheadingColor: '#D4F434',
    contextMsg: 'Monitorando conectores externos e filas',
    ariaLabel: 'Spark, agente engenheiro de conectores e integrações',
  },
  'PILAR 08 — ENGAJAMENTO COMERCIAL': {
    id: 'echo',
    name: 'Echo',
    role: 'Especialista em Voz',
    color: 'from-pink-400 to-pink-600',
    headingColor: '#FB7185',
    subheadingColor: '#00D4FF',
    contextMsg: 'Acompanhando discador, transcrições e cadências',
    ariaLabel: 'Echo, agente especialista em telefonia, voz e engajamento',
  },
  ADMINISTRAÇÃO: {
    id: 'sudo',
    name: 'Sudo',
    role: 'Controlador de Sistema',
    color: 'from-slate-400 to-slate-600',
    headingColor: '#94A3B8',
    subheadingColor: '#FFC107',
    contextMsg: 'Validando governança, alçadas e segurança',
    ariaLabel: 'Sudo, agente controlador de sistema, governança e alçadas',
  },
};

interface ModuleAgentWidgetProps {
  activeTab: TabType;
}

export function ModuleAgentWidget({ activeTab }: ModuleAgentWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<AiReasoningStep>('CONTEXT');
  const [inputText, setInputText] = useState('');
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamOutput, setStreamOutput] = useState('');
  const [streamReasoning, setStreamReasoning] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [activeSubAgent, setActiveSubAgent] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const { currentUser, isAdmin, canAccessCommercialIntelligence, canAccessCopilotoIa } = useAuth();

  const canManageOperations =
    !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);
  const canAccessMesaTratamento =
    !!currentUser && hasRequiredRole(currentUser.role, MESA_TRATAMENTO_ROLES);

  // Fecha o widget com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Cancela qualquer streaming ativo no desmonte do componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const navGroupsByJourney = [
    {
      title: 'PILAR 01 — HUB COMERCIAL',
      items: ['workspace', 'crm', 'crm360', 'propostas', 'companies', 'contacts', 'settings_hub'],
    },
    {
      title: 'PILAR 02 — INTELIGÊNCIA DE MERCADO',
      items: ['prospect', 'market-intelligence', 'settings_market'],
    },
    {
      title: 'PILAR 03 — ORQUESTRAÇÃO DE VENDAS',
      items: [
        'daily-plan',
        'activities',
        'calendar',
        'cadence',
        'roleplay',
        'qualification_matrix',
        'objections_matrix',
        'topic_training',
        'chatbook',
        'editor',
        'playbooks',
        'jornadas',
        'processos',
        'roteiros',
        'settings_sales',
      ],
    },
    {
      title: 'PILAR 04 — PERFORMANCE COMERCIAL',
      items: [
        'dashboard',
        'analytics',
        'winloss',
        'reports',
        'signals-risks',
        'gamification',
        'settings_performance',
      ],
    },
    {
      title: 'PILAR 05 — PREVISIBILIDADE COMERCIAL',
      items: ['forecast', 'pipeline_ponderado', 'metas', 'settings_predictability'],
    },
    {
      title: 'PILAR 06 — INTELIGÊNCIA ARTIFICIAL',
      items: [
        ...(canAccessCommercialIntelligence ? (['commercial_intelligence'] as TabType[]) : []),
        ...(canAccessCopilotoIa ? (['copiloto_ia'] as TabType[]) : []),
        'intelligence',
        'knowledge',
        'sdr-diagnostic',
        'settings_ai',
      ],
    },
    {
      title: 'PILAR 07 — AUTOMAÇÃO & CONECTIVIDADE',
      items: [
        ...(canManageOperations ? (['automations', 'integrations'] as TabType[]) : []),
        'bitrix',
        'settings_automation',
      ],
    },
    {
      title: 'PILAR 08 — ENGAJAMENTO COMERCIAL',
      items: [
        'voice-hub',
        'outbound',
        'dialer',
        ...(canAccessMesaTratamento ? (['mesa-tratamento'] as TabType[]) : []),
        'settings_engagement',
      ].filter((tab) => !isNavHiddenTab(tab as TabType)),
    },
    {
      title: 'ADMINISTRAÇÃO',
      items: ['notifications', 'usage', 'team', 'module-access', 'settings'].filter((item) => {
        if (item === 'notifications' || item === 'settings') return true;
        return isAdmin;
      }) as TabType[],
    },
  ];

  const navGroups = navGroupsByJourney.map((g) => ({
    ...g,
    items: (g.items as TabType[]).filter((tab) => !isNavHiddenTab(tab)),
  }));
  const activeGroup = navGroups.find((g) => (g.items as TabType[]).includes(activeTab));

  if (!activeGroup) return null;
  const agent = AGENTS_BY_PILLAR[activeGroup.title];
  if (!agent) return null;

  const handleInteract = () => {
    SoundFX.play('focus');
    if (!isExpanded) {
      setPipelineStep('CONTEXT');
      setIsExpanded(true);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    SoundFX.play('click');
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt ?? inputText).trim();
    if (!promptToSend || isStreaming) return;
    if (!customPrompt) setInputText('');
    setLastPrompt(promptToSend);
    setStreamError(null);
    setStreamOutput('');
    setStreamReasoning('');
    setActiveSubAgent(null);
    setIsStreaming(true);
    setPipelineStep('CONTEXT');
    SoundFX.play('click');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setPipelineStep('ANALYSIS');
      const response = await fetch(
        '/api/agent/swarm/stream',
        sseRequestInit(
          {
            mission: `[Contexto: ${activeGroup.title} - Agente: ${agent.name}] ${promptToSend}`,
          },
          controller.signal,
        ),
      );

      await readSseStream(response, (evt) => {
        if (!evt.data) return;
        try {
          const parsed = JSON.parse(evt.data) as SwarmEvent;
          if (parsed.type === 'routing') {
            setPipelineStep('ANALYSIS');
            if (parsed.nextAgent || parsed.agent) {
              setActiveSubAgent(parsed.nextAgent || parsed.agent);
            }
          } else if (parsed.type === 'agent_result') {
            setPipelineStep('RECOMMENDATION');
            if (parsed.content) {
              setStreamOutput((prev) => (prev ? `${prev}\n\n${parsed.content}` : parsed.content));
            }
            if (parsed.reasoning) {
              setStreamReasoning(parsed.reasoning);
            }
          } else if (parsed.type === 'final') {
            setPipelineStep('EXECUTION');
            if (parsed.content) {
              setStreamOutput((prev) => (prev ? `${prev}\n\n${parsed.content}` : parsed.content));
            }
          } else if (parsed.type === 'agent_error') {
            setStreamError(parsed.content || 'Erro no processamento da missão pelo agente.');
          }
        } catch {
          if (evt.data && evt.data !== '{}') {
            setStreamOutput((prev) => (prev ? `${prev} ${evt.data}` : evt.data));
          }
        }
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStreamError('Processamento cancelado pelo operador.');
      } else {
        setStreamError(err?.message || 'Falha na conexão com o copiloto de agentes.');
        SoundFX.play('error');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const characterState = streamError
    ? 'error'
    : isStreaming
      ? streamOutput
        ? 'speaking'
        : 'processing'
      : inputText.trim()
        ? 'listening'
        : streamOutput
          ? 'success'
          : 'idle';

  const details: Record<AiReasoningStep, string> = {
    CONTEXT: `Analisando contexto ativo em ${agent.name}...`,
    ANALYSIS:
      streamReasoning ||
      (activeSubAgent
        ? `Roteado para especialista: ${activeSubAgent.toUpperCase()}`
        : 'Processando plano pelo orquestrador LangGraph...'),
    RECOMMENDATION: 'Gerando recomendações táticas baseadas em dados...',
    APPROVAL: 'Verificando guardrails e isolamento de segurança...',
    EXECUTION: 'Resposta concluída e persistida na sessão.',
  };

  return (
    <section
      className="fixed bottom-4 left-4 z-50 flex flex-col-reverse items-start gap-4"
      aria-label={agent.ariaLabel}
    >
      {/* Botão Flutuante */}
      <motion.button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleInteract}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={isExpanded}
        aria-label={`Abrir copiloto ${agent.name}`}
        className="relative flex items-center bg-surface-elevated/95 backdrop-blur-xl border border-white/10 p-1.5 pr-4 rounded-full shadow-2xl overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />

        <div
          className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${agent.color} shadow-inner bh-character-avatar`}
          data-state={characterState}
        >
          <img
            src={`/brand/characters/${agent.id}.svg`}
            alt={agent.ariaLabel}
            className="w-7 h-7 drop-shadow-md"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/brand/characters/core.svg';
            }}
          />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-surface shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>

        <div className="ml-3 flex flex-col items-start justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[13px] font-bold leading-none"
              style={{ color: agent.headingColor }}
            >
              {agent.name}
            </span>
            <Sparkles className="w-3 h-3 text-brand opacity-80" />
          </div>

          <AnimatePresence mode="wait">
            {isHovered ? (
              <motion.div
                key="action-hint"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1 mt-0.5"
              >
                <Bot className="w-3 h-3 text-[#F8F9FF]/70" />
                <span className="text-[10px] font-semibold text-[#F8F9FF]/70 uppercase tracking-wide">
                  Copiloto IA Ativo
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="role"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-0.5"
              >
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: agent.subheadingColor }}
                >
                  {agent.role}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Painel Expandido (Card Flutuante) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#F8F9FF]/10 shadow-2xl overflow-hidden flex flex-col max-h-[580px]"
            style={{
              background: 'rgba(6,13,26,0.97)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Header do Card */}
            <div className="px-5 py-4 border-b border-[#F8F9FF]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br ${agent.color} bh-character-avatar`}
                  data-state={characterState}
                >
                  <img
                    src={`/brand/characters/${agent.id}.svg`}
                    alt={agent.ariaLabel}
                    className="w-7 h-7"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/brand/characters/core.svg';
                    }}
                  />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm flex items-center gap-1.5"
                    style={{ color: agent.headingColor }}
                  >
                    {agent.name} <Sparkles className="w-3.5 h-3.5 text-brand" />
                  </h3>
                  <p
                    className="text-[11px] font-mono mt-0.5"
                    style={{ color: agent.subheadingColor }}
                  >
                    {agent.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  SoundFX.play('click');
                  setIsExpanded(false);
                }}
                aria-label="Fechar painel do copiloto"
                className="p-1.5 rounded-md hover:bg-[#F8F9FF]/10 text-[#F8F9FF]/40 hover:text-[#F8F9FF] transition-colors focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contexto & Pipeline */}
            <div className="px-5 py-4 border-b border-[#F8F9FF]/10 overflow-y-auto">
              <p className="text-[#F8F9FF]/70 text-xs mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {agent.contextMsg}
              </p>

              <AiReasoningPipeline currentStep={pipelineStep} details={details} />

              {/* Erro */}
              {streamError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-300">Erro no processamento</p>
                      <p className="text-red-300/80 mt-0.5">{streamError}</p>
                    </div>
                  </div>
                  {lastPrompt && (
                    <button
                      type="button"
                      onClick={() => handleSend(lastPrompt)}
                      aria-label="Tentar novamente"
                      className="px-2 py-1 bg-red-900/60 hover:bg-red-800/80 text-red-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Tentar
                    </button>
                  )}
                </div>
              )}

              {/* Resposta do Agente */}
              {streamOutput && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[#F8F9FF]/90 text-xs leading-relaxed max-h-48 overflow-y-auto"
                >
                  <div className="flex items-center gap-1.5 text-brand text-[11px] font-semibold mb-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Resposta do Copiloto</span>
                  </div>
                  <div className="whitespace-pre-wrap">{streamOutput}</div>
                </div>
              )}
            </div>

            {/* Input para Pergunta */}
            <div className="p-4 bg-black/30">
              <div className="relative">
                <textarea
                  value={inputText}
                  disabled={isStreaming}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  aria-label={`Mensagem ou instrução para o copiloto ${agent.name}`}
                  placeholder={`Pergunte ao ${agent.name} sobre este módulo...`}
                  className="w-full bg-[#F8F9FF]/5 border border-[#F8F9FF]/10 rounded-xl px-4 py-3 pr-12 text-sm text-[#F8F9FF] placeholder-[#F8F9FF]/30 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 resize-none h-16 disabled:opacity-50"
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    aria-label="Cancelar comando do copiloto"
                    className="absolute right-2 bottom-2 p-2 rounded-lg bg-red-600/80 text-white font-bold hover:bg-red-600 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    aria-label="Enviar comando para o copiloto"
                    className="absolute right-2 bottom-2 p-2 rounded-lg bg-brand text-midnight font-bold hover:bg-brand-hover disabled:opacity-40 disabled:hover:bg-brand transition-colors focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

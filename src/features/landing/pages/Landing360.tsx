import { useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Headphones,
  Layers,
  LineChart,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Network,
  PhoneCall,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';

const LuxuryLandingPage = lazy(() =>
  import('../luxury/LuxuryLandingPage.js').then((m) => ({ default: m.LuxuryLandingPage })),
);

import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BirthHubLogo } from '@/components/brand/BirthHubLogo';
import { isAuthorizedLoginEmail } from '@/config/access-policy';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { trackHeroRoiSimulatorOpened } from '@/lib/analytics/conversionTelemetry';
import { authClient } from '@/lib/auth-client';
import { SoundFX } from '@/lib/soundEffects';
import { RoiSimulatorModal } from '../components/RoiSimulatorModal.js';
import { PillarDetailModal } from '../components/PillarDetailModal.js';
import './LandingAdaptive.css';
import './Landing360.css';

// 8 PILARES ADAPTATIVOS
const ADAPTIVE_PILLARS = [
  {
    num: '01',
    title: 'Hub comercial',
    desc: 'Centralize contas, pipeline e oportunidades em uma visão 360° de cada negociação.',
    bg: '/landing/assets/pillar-hub.jpg',
    colorClass: '',
    accentColor: '#00D4FF',
    tag: 'PIPELINE 360°',
    kpi: 'R$ 4.2M em pipeline',
    modalTitle: '01. Hub Comercial',
    modalDesc:
      'Centralização de contas, pipeline comercial unificado e visão 360° de cada oportunidade em negociação com rastreabilidade total.',
  },
  {
    num: '02',
    title: 'Inteligência de mercado',
    desc: 'Enriqueça dados B2B, identifique sinais de compra e qualifique decisores com precisão.',
    bg: '/landing/assets/pillar-market.jpg',
    colorClass: 'b360-c-pink',
    accentColor: '#FF2D9B',
    tag: 'ENRIQUECIMENTO B2B',
    kpi: '96% Match ICP',
    modalTitle: '02. Inteligência de Mercado',
    modalDesc:
      'Enriquecimento analítico de dados B2B, mapeamento de contas, identificação de sinais de compra e qualificação preditiva.',
  },
  {
    num: '03',
    title: 'Orquestração de vendas',
    desc: 'Coordene cadências multicanal, passagem de bastão e a próxima ação de vendas.',
    bg: '/landing/assets/pillar-orchestration.jpg',
    colorClass: 'b360-c-gold',
    accentColor: '#FFC107',
    tag: 'CADÊNCIA MULTICANAL',
    kpi: 'SLA < 15min',
    modalTitle: '03. Orquestração de Vendas',
    modalDesc:
      'Cadências coordenadas entre SDRs e Closers, regras claras de passagem de bastão e direcionamento para a próxima melhor ação.',
  },
  {
    num: '04',
    title: 'Performance comercial',
    desc: 'Acompanhe conversão, velocidade do funil, metas e produtividade da equipe.',
    bg: '/landing/assets/pillar-performance.jpg',
    colorClass: 'b360-c-iris',
    accentColor: '#8B7DFF',
    tag: 'TELEMETRIA & METAS',
    kpi: '+24.8% Conversão',
    modalTitle: '04. Performance Comercial',
    modalDesc:
      'Telemetria de conversão, velocidade de ciclo entre etapas, metas operacionais e produtividade da equipe em tempo real.',
  },
  {
    num: '05',
    title: 'Previsibilidade comercial',
    desc: 'Modele probabilidades, pipeline ponderado e cenários baseados no histórico real.',
    bg: '/landing/assets/pillar-forecast.jpg',
    colorClass: '',
    accentColor: '#00D4FF',
    tag: 'FORECAST PROBABILÍSTICO',
    kpi: '94.2% Acurácia',
    modalTitle: '05. Previsibilidade Comercial',
    modalDesc:
      'Modelagem estatística de probabilidade, análise de pipeline ponderado e projeções de receita embasadas no histórico real.',
  },
  {
    num: '06',
    title: 'Inteligência artificial',
    desc: 'Um copiloto conectado aos dados da empresa e ao contexto das negociações.',
    bg: '/landing/assets/pillar-ai.jpg',
    colorClass: 'b360-c-pink',
    accentColor: '#FF2D9B',
    tag: 'COPILOTO DE NEGOCIAÇÕES',
    kpi: 'NBA em Tempo Real',
    modalTitle: '06. Inteligência Artificial',
    modalDesc:
      'Copiloto de negociações contextualizado com dados da organização, diagnóstico de entraves e recomendações acionáveis em tempo real.',
  },
  {
    num: '07',
    title: 'Automação & conectividade',
    desc: 'Sincronize CRMs, acione gatilhos e integre ferramentas por APIs e webhooks.',
    bg: '/landing/assets/pillar-automation.jpg',
    colorClass: 'b360-c-gold',
    accentColor: '#FFC107',
    tag: 'GATEWAY MULTI-CRM',
    kpi: '12ms Latência',
    modalTitle: '07. Automação & Conectividade Multi-CRM',
    modalDesc:
      'Sincronização bidirecional em tempo real via APIs abertas e webhooks com Bitrix24, Salesforce, HubSpot e Pipedrive.',
  },
  {
    num: '08',
    title: 'Engajamento comercial',
    desc: 'Reúna telefonia, interações e histórico de contatos em uma comunicação integrada.',
    bg: '/landing/assets/pillar-hub.jpg',
    colorClass: 'b360-c-iris',
    accentColor: '#8B7DFF',
    tag: 'VOICEHUB & WHATSAPP',
    kpi: 'Sentimento 94%',
    modalTitle: '08. Engajamento Comercial',
    modalDesc:
      'Telefonia em nuvem integrada, gravação, transcrição com IA, WhatsApp API oficial e linha do tempo omnichannel unificada.',
  },
];

// ECOSSISTEMA DE INTEGRAÇÕES OFICIAIS
const ADAPTIVE_INTEGRATIONS = [
  {
    name: 'Bitrix24',
    desc: 'Sincronização bidirecional de leads, contatos, negócios e etapas de funil.',
    icon: '/landing/assets/bitrix24.svg',
    status: 'active' as const,
    statusLabel: 'Em Produção',
  },
  {
    name: 'WhatsApp Oficial API',
    desc: 'Conversas oficiais registradas na linha do tempo com opt-in auditável.',
    icon: '/landing/assets/whatsapp.svg',
    status: 'active' as const,
    statusLabel: 'Em Produção',
  },
  {
    name: 'VoiceHub Telefonia',
    desc: 'Telefonia em nuvem com discador inteligente, gravação, transcrição e análise por IA.',
    icon: '/landing/assets/voice.svg',
    status: 'active' as const,
    statusLabel: 'Em Produção',
  },
  {
    name: 'Webhooks & REST APIs',
    desc: 'Disparo e recepção de eventos customizados em tempo real com autenticação segura.',
    icon: '/landing/assets/webhooks.svg',
    status: 'active' as const,
    statusLabel: 'Em Produção',
  },
  {
    name: 'HubSpot',
    desc: 'Alinhamento contínuo entre inbound marketing e pipeline de vendas ativas.',
    icon: '/landing/assets/hubspot.svg',
    status: 'in_dev' as const,
    statusLabel: 'Em Homologação',
  },
  {
    name: 'Salesforce',
    desc: 'Mapeamento de contas estratégicas enterprise e histórico corporativo de negociações.',
    icon: '/landing/assets/salesforce.svg',
    status: 'in_dev' as const,
    statusLabel: 'Em Homologação',
  },
  {
    name: 'Pipedrive',
    desc: 'Gestão visual de etapas e atividades operacionais de prospecção e fechamento.',
    icon: '/landing/assets/pipedrive.svg',
    status: 'in_dev' as const,
    statusLabel: 'Em Homologação',
  },
  {
    name: 'Google Workspace',
    desc: 'Agendamento sincronizado no Google Agenda, e-mails corporativos e documentos.',
    icon: '/landing/assets/google.svg',
    status: 'planned' as const,
    statusLabel: 'Planejado',
  },
  {
    name: 'Microsoft 365',
    desc: 'Integração federada com Outlook, Teams e ecossistema de produtividade.',
    icon: '/landing/assets/microsoft.svg',
    status: 'planned' as const,
    statusLabel: 'Planejado',
  },
];

function renderPillarIcon(num: string) {
  switch (num) {
    case '01':
      return <Layers className="w-5 h-5 text-[#00D4FF]" />;
    case '02':
      return <Target className="w-5 h-5 text-[#FF2D9B]" />;
    case '03':
      return <Workflow className="w-5 h-5 text-[#FFC107]" />;
    case '04':
      return <TrendingUp className="w-5 h-5 text-[#8B7DFF]" />;
    case '05':
      return <LineChart className="w-5 h-5 text-[#00D4FF]" />;
    case '06':
      return <Sparkles className="w-5 h-5 text-[#FF2D9B]" />;
    case '07':
      return <Zap className="w-5 h-5 text-[#FFC107]" />;
    case '08':
      return <PhoneCall className="w-5 h-5 text-[#8B7DFF]" />;
    default:
      return <Building2 className="w-5 h-5" />;
  }
}

function renderPillarVisual(num: string) {
  switch (num) {
    case '01':
      return (
        <div className="b360-micro-kanban" aria-hidden="true">
          <div className="b360-kanban-col">
            <span className="b360-kanban-tag">Qualificação</span>
            <div className="b360-kanban-card">
              <span className="b360-deal-name">Tech Corp</span>
              <strong className="b360-deal-val text-[#00D4FF]">R$ 145k</strong>
            </div>
          </div>
          <div className="b360-kanban-col">
            <span className="b360-kanban-tag">Proposta</span>
            <div className="b360-kanban-card b360-highlight">
              <span className="b360-deal-name">Grupo Delta</span>
              <strong className="b360-deal-val text-[#FF2D9B]">R$ 280k</strong>
            </div>
          </div>
        </div>
      );
    case '02':
      return (
        <div className="b360-micro-dossier" aria-hidden="true">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-slate-400">CNPJ 42.108.902/0001-34</span>
            <span className="b360-match-badge">96% ICP</span>
          </div>
          <div className="b360-dossier-row">
            <span className="text-slate-300">Setor Saúde · 14 Decisores</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
          </div>
        </div>
      );
    case '03':
      return (
        <div className="b360-micro-cadence" aria-hidden="true">
          <div className="b360-cadence-step done">
            <span className="b360-cadence-dot" />
            <span>D1: E-mail Executivo</span>
          </div>
          <div className="b360-cadence-step active">
            <span className="b360-cadence-dot animate-ping" />
            <span>D3: WhatsApp Oficial</span>
          </div>
          <div className="b360-cadence-step pending">
            <span className="b360-cadence-dot" />
            <span>D5: Reunião Closer (SLA 15m)</span>
          </div>
        </div>
      );
    case '04':
      return (
        <div className="b360-micro-telemetry" aria-hidden="true">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-mono">Taxa de Conversão</span>
            <span className="text-xs font-bold font-mono text-[#8B7DFF]">+24.8%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-[#8B7DFF] to-[#00D4FF] rounded-full w-[74%]" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Ciclo: 18.2 dias</span>
            <span>Meta: 114%</span>
          </div>
        </div>
      );
    case '05':
      return (
        <div className="b360-micro-forecast" aria-hidden="true">
          <div className="b360-forecast-bars">
            <div className="b360-fbar-item">
              <span className="b360-fbar-lbl">Conservador</span>
              <div className="b360-fbar-fill w-[55%] bg-slate-600" />
              <strong className="b360-fbar-val">R$ 1.2M</strong>
            </div>
            <div className="b360-fbar-item">
              <span className="b360-fbar-lbl">Provável</span>
              <div className="b360-fbar-fill w-[78%] bg-[#00D4FF]" />
              <strong className="b360-fbar-val text-[#00D4FF]">R$ 1.84M</strong>
            </div>
            <div className="b360-fbar-item">
              <span className="b360-fbar-lbl">Otimista</span>
              <div className="b360-fbar-fill w-[95%] bg-[#FF2D9B]" />
              <strong className="b360-fbar-val text-[#FF2D9B]">R$ 2.40M</strong>
            </div>
          </div>
        </div>
      );
    case '06':
      return (
        <div className="b360-micro-copilot" aria-hidden="true">
          <div className="b360-copilot-pill">
            <Sparkles className="w-3 h-3 text-[#FF2D9B]" />
            <span>Objeção: "Preço acima do budget"</span>
          </div>
          <p className="b360-copilot-recommendation">
            NBA: Enviar proposta parcelada com ROI garantido em 45 dias.
          </p>
        </div>
      );
    case '07':
      return (
        <div className="b360-micro-integrations" aria-hidden="true">
          <div className="b360-integ-chip active">
            <span className="b360-integ-led green" />
            <span>Bitrix24 (12ms)</span>
          </div>
          <div className="b360-integ-chip active">
            <span className="b360-integ-led green" />
            <span>HubSpot Sync</span>
          </div>
          <div className="b360-integ-chip active">
            <span className="b360-integ-led green" />
            <span>Webhooks 0 falhas</span>
          </div>
        </div>
      );
    case '08':
      return (
        <div className="b360-micro-voice" aria-hidden="true">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3 h-3 text-[#8B7DFF]" />
              <span className="font-mono text-[10px] text-slate-300">Chamada Transcrita</span>
            </div>
            <span className="b360-sentiment-badge">94% Positivo</span>
          </div>
          <div className="b360-audio-wave">
            <span style={{ height: '40%' }} />
            <span style={{ height: '70%' }} />
            <span style={{ height: '100%' }} />
            <span style={{ height: '60%' }} />
            <span style={{ height: '90%' }} />
            <span style={{ height: '45%' }} />
            <span style={{ height: '80%' }} />
            <span style={{ height: '55%' }} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

// MÓDULOS DO COMMAND CENTER SANDBOX
const COMMAND_MODULES = [
  {
    name: 'Inteligência',
    ico: '✧',
    desc: 'Insights e decisões',
    modalDesc:
      'Copiloto de IA, Next Best Action (NBA), análise preditiva de fechamento e detecção precoce de riscos no pipeline.',
  },
  {
    name: 'CRM & BI',
    ico: '▦',
    desc: 'Pipeline e dados',
    modalDesc:
      'Visão unificada de pipeline, métricas de conversão em tempo real e relatórios executivos de win/loss.',
  },
  {
    name: 'Prospecção',
    ico: '◎',
    desc: 'Descobrir oportunidades',
    modalDesc:
      'Localização de leads corporativos, enriquecimento de CNPJs e qualificação preditiva de ICP.',
  },
  {
    name: 'Automações',
    ico: '⌘',
    desc: 'Fluxos inteligentes',
    modalDesc:
      'Workflows inteligentes para passagem de bastão, envio de propostas e cadências automatizadas de follow-up.',
  },
  {
    name: 'Gamificação',
    ico: '✦',
    desc: 'Evolução e metas',
    modalDesc:
      'Quadro de metas, desafios semanais, pontuação por atividades e rankings de produtividade de equipe.',
  },
  {
    name: 'Roleplay',
    ico: '◇',
    desc: 'Simulações de vendas',
    modalDesc:
      'Simulador de negociações com inteligência artificial para treinamento e nivelamento contínuo do time comercial.',
  },
  {
    name: 'Social Selling',
    ico: '✺',
    desc: 'Presença e conexão',
    modalDesc:
      'Geração assistida de mensagens de engajamento no LinkedIn e canais de relacionamento corporativo B2B.',
  },
  {
    name: 'VoiceHub',
    ico: '◈',
    desc: 'Conversas inteligentes',
    modalDesc:
      'Discador inteligente, gravação, transcrição e análise de sentimentos em chamadas de vendas.',
  },
];

function BH360LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="inline-block relative shrink-0">
      <BirthHubLogo
        variant="icon"
        title="Birth Hub 360º"
        className="w-full h-full"
        animated={true}
      />
    </span>
  );
}

export function Landing360({
  initialScreen = 'intro',
}: {
  initialScreen?: 'intro' | 'login';
} = {}) {
  const [activeScreen, setActiveScreen] = useState<'intro' | 'login'>(initialScreen);
  const [viewMode, setViewMode] = useState<'public' | 'command'>('public');
  const [activeModal, setActiveModal] = useState<{ title: string; desc: string } | null>(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const { currentUser, isPending: isAuthPending } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Sincronizar activeScreen com a rota ativa
  useEffect(() => {
    if (location.pathname === '/login') {
      setActiveScreen('login');
    } else if (location.pathname === '/' || location.pathname === '/welcome') {
      if (initialScreen === 'login') return;
      setActiveScreen('intro');
    }
  }, [location.pathname, initialScreen]);

  // Capturar erros passados por query string (ex: retorno de OAuth /login?error=...)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'sso_failed' || errorParam === 'oauth_failed') {
        setErrorMessage(
          'Falha na autenticação via SSO Empresarial. Tente novamente ou use E-mail Corporativo.',
        );
      } else if (errorParam === 'unauthorized') {
        setErrorMessage('Acesso não autorizado para esta organização.');
      } else {
        setErrorMessage(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams]);

  // Monitorar alteração de modo tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    SoundFX.play('confirm');
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          setErrorMessage('Seu navegador não oferece suporte para modo tela cheia.');
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      setErrorMessage('Não foi possível alternar o modo tela cheia no navegador.');
    }
  };

  const handleBackToHome = () => {
    SoundFX.play('click');
    setActiveScreen('intro');
    if (location.pathname === '/login') {
      void navigate('/', { replace: true });
    }
  };

  // Estado do botão flutuante de voltar ao topo
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Form State para autenticação
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'email' | 'sso'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.title = 'Birth Hub 360° · Revenue Command Center & Multi-CRM';
  }, []);

  // Monitorar scroll para exibição do botão Voltar ao Topo
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirecionamento se já autenticado
  useEffect(() => {
    if (currentUser) {
      navigate('/app', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoToLogin = () => {
    SoundFX.play('confirm');
    setActiveScreen('login');
    if (location.pathname !== '/login') {
      navigate('/login');
    }
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleSwitchView = (mode: 'public' | 'command') => {
    SoundFX.play('click');
    setViewMode(mode);
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleOpenModal = (title: string, desc: string, pillarNum?: string) => {
    SoundFX.play('click');
    setSelectedPillarId(pillarNum ?? null);
    setActiveModal({ title, desc });
  };

  const handleCloseModal = () => {
    SoundFX.play('click');
    setSelectedPillarId(null);
    setActiveModal(null);
  };

  const handleOpenRoiSimulator = () => {
    SoundFX.play('click');
    trackHeroRoiSimulatorOpened('A', 'landing_adaptive_hero');
    setIsSimulatorOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe seu e-mail corporativo.');
      return;
    }

    if (!isAuthorizedLoginEmail(trimmedEmail)) {
      setErrorMessage(
        'Por favor, informe um endereço de e-mail corporativo válido (ex: nome@empresa.com.br).',
      );
      return;
    }

    if (authMode !== 'forgot' && !password.trim()) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    if (authMode === 'signup' && password.trim().length < 8) {
      setErrorMessage('A senha de acesso corporativo deve conter pelo menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    SoundFX.play('confirm');

    try {
      if (authMode === 'signin') {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password: password.trim(),
          rememberMe,
          callbackURL: '/app',
        });

        if (result.error) {
          setErrorMessage(result.error.message || 'Credenciais inválidas. Tente novamente.');
          setIsSubmitting(false);
          return;
        }

        navigate('/app', { replace: true });
      } else if (authMode === 'signup') {
        const result = await authClient.signUp.email({
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || email.split('@')[0],
          callbackURL: '/app',
        });

        if (result.error) {
          setErrorMessage(
            result.error.message || 'Erro ao solicitar provisionamento. Verifique os dados.',
          );
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(
          'Solicitação de provisionamento enviada com sucesso! Verifique seu e-mail corporativo.',
        );
        setIsSubmitting(false);
      } else if (authMode === 'forgot') {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: '/reset-password',
        });

        if (result.error) {
          setErrorMessage(result.error.message || 'Não foi possível enviar o link de redefinição.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage('Link de redefinição de senha enviado para seu e-mail corporativo.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro inesperado ao processar.');
      setIsSubmitting(false);
    }
  };

  const handleSsoSubmit = async () => {
    SoundFX.play('confirm');
    setErrorMessage('');
    setSuccessMessage('');

    const targetDomain = email.trim();
    if (!targetDomain) {
      setErrorMessage(
        'Por favor, informe o domínio corporativo da sua organização (ex: empresa.com.br).',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/sso-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error || 'Provedor SSO corporativo não configurado para este domínio.',
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Conectando ao provedor empresarial ${data.providerName}...`);
      await authClient.signIn.social({
        provider: data.provider,
        callbackURL: '/app',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao contatar serviço de autenticação SSO.');
      setIsSubmitting(false);
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'email' | 'sso') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextTab = currentTab === 'email' ? 'sso' : 'email';
      setAuthMethod(nextTab);
    }
  };

  const isLuxuryMode =
    searchParams.get('mode') === 'luxury' || searchParams.get('view') === 'luxury';
  if (isLuxuryMode && activeScreen === 'intro') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-[#00D4FF] font-mono text-sm tracking-widest">
            INICIALIZANDO CENTRAL 360º...
          </div>
        }
      >
        <LuxuryLandingPage />
      </Suspense>
    );
  }

  if (isAuthPending) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors ${
          theme === 'dark' ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'
        }`}
      >
        <Loader2 className="animate-spin text-[#00D4FF] w-10 h-10" />
      </div>
    );
  }

  return (
    <main
      className={`relative w-full min-h-screen overflow-x-clip font-sans selection:bg-[#FF2D9B]/30 selection:text-[#00D4FF] landing-neon-root transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#06111e] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}
    >
      {/* ════════════════════════════════════════════════════════════════════
          TELA 1: LANDING ADAPTADA & COMMAND CENTER INTERATIVO
      ════════════════════════════════════════════════════════════════════ */}
      <div className={activeScreen === 'intro' ? 'block b360-adaptive-landing' : 'hidden'}>
        {/* Topbar Fixa */}
        <header className="b360-topbar">
          <div className="b360-shell">
            <div className="b360-toprow">
              <a href="#inicio" className="b360-brand" aria-label="Birth Hub 360">
                <BH360LogoMark size={38} />
                <span>
                  Birth Hub <strong>360°</strong>
                </span>
              </a>

              {/* Seletor de Modo: Página Pública vs Command Center */}
              <nav className="b360-mode-switch" aria-label="Alternar modo de visualização">
                <button
                  id="btn-public"
                  type="button"
                  className="b360-mode-btn"
                  aria-pressed={viewMode === 'public'}
                  onClick={() => handleSwitchView('public')}
                >
                  Página pública
                </button>
                <button
                  id="btn-command"
                  type="button"
                  className="b360-mode-btn"
                  aria-pressed={viewMode === 'command'}
                  onClick={() => handleSwitchView('command')}
                >
                  Command Center
                </button>
              </nav>

              {/* Links de navegação desktop */}
              <nav className="b360-topnav" aria-label="Navegação principal">
                <a href="#destaques">8 pilares</a>
                <a href="#ia">IA Comercial</a>
                <a href="#ecossistema">Integrações</a>
                <button
                  type="button"
                  onClick={handleOpenRoiSimulator}
                  className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-[#00D4FF] hover:text-[#FF2D9B] transition-colors"
                >
                  Simular ROI
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`p-2 rounded-full border transition-colors ${theme === 'dark' ? 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-[#00D4FF]' : 'border-slate-300/80 bg-white/90 text-slate-700 hover:text-sky-600 shadow-sm'}`}
                  aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                  title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-[#FFC107]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#0284c7] dark:text-[#00D4FF]" />
                  )}
                </button>

                <button className="b360-aurora b360-small" type="button" onClick={handleGoToLogin}>
                  <span className="b360-aurora-inner">
                    Acessar Plataforma <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* MODO 1: PÁGINA PÚBLICA */}
        {viewMode === 'public' && (
          <div className="b360-shell">
            {/* Hero Section */}
            <section className="b360-hero" id="inicio">
              <div className="b360-hero-main">
                <div>
                  <div className="b360-eyebrow">REVENUE COMMAND CENTER</div>
                  <h1>
                    Dados que conectam.
                    <br />
                    <em>Inteligência que decide.</em>
                    <br />
                    <span className="b360-gold-text">Execução que acontece.</span>
                  </h1>
                  <p>
                    Conecte CRM, dados, inteligência artificial e automação em um único centro de
                    comando para planejar, monitorar, prever e acelerar suas operações comerciais.
                  </p>
                  <div className="flex flex-wrap items-center gap-3.5">
                    <button
                      className="b360-aurora"
                      type="button"
                      onClick={() => handleSwitchView('command')}
                    >
                      <span className="b360-aurora-inner">
                        Explorar a plataforma <span aria-hidden="true">↗</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenRoiSimulator}
                      className="b360-hero-pill-btn"
                    >
                      Simular ROI Comercial
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToLogin}
                      className="b360-hero-secondary-btn"
                    >
                      Acessar Plataforma
                    </button>
                  </div>
                  <div className="b360-hero-trust">
                    <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                    <span>✦ <b>Supervisor On-line</b> · Orquestração inteligente · Experiência integrada</span>
                  </div>
                </div>

                <div className="b360-hero-console" role="region" aria-label="Visão Executiva do Command Center">
                  <div className="b360-console-topbar">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] animate-pulse" />
                      <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#00D4FF]">
                        SUPERVISOR ON-LINE · OPERAÇÃO CONECTADA
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                        RLS Multi-Tenant
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF]">
                        12ms
                      </span>
                    </div>
                  </div>

                  <div className="b360-console-kpis">
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Pipeline em Radar</span>
                      <strong className="b360-kpi-value text-[#00D4FF]">R$ 4.280.000</strong>
                      <span className="b360-kpi-trend text-emerald-400">▲ +18.4% vs mês ant.</span>
                    </div>
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Oportunidades</span>
                      <strong className="b360-kpi-value text-[#FF2D9B]">86 ativas</strong>
                      <span className="b360-kpi-trend text-slate-400">12 em fechamento</span>
                    </div>
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Acurácia Forecast</span>
                      <strong className="b360-kpi-value text-[#FFC107]">94.2%</strong>
                      <span className="b360-kpi-trend text-emerald-400">Modelo ponderado</span>
                    </div>
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Agentes Ativos</span>
                      <strong className="b360-kpi-value text-[#8B7DFF]">19 agentes</strong>
                      <span className="b360-kpi-trend text-cyan-400">Execução paralela</span>
                    </div>
                  </div>

                  <div className="b360-console-stream">
                    <div className="b360-stream-item">
                      <div className="b360-stream-badge bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                        Copiloto IA
                      </div>
                      <div className="b360-stream-content">
                        <p className="b360-stream-title">Objeção de preço contornada · Deal #1042</p>
                        <p className="b360-stream-desc">Proposta R$ 145k renegociada com ROI simulado de 3.8x. NBA aceita pelo Closer.</p>
                      </div>
                      <span className="b360-stream-time">Agora</span>
                    </div>

                    <div className="b360-stream-item">
                      <div className="b360-stream-badge bg-[#FF2D9B]/15 text-[#FF2D9B] border border-[#FF2D9B]/30">
                        Bitrix24 Sync
                      </div>
                      <div className="b360-stream-content">
                        <p className="b360-stream-title">Sincronização bidirecional de 14 oportunidades</p>
                        <p className="b360-stream-desc">Contas e histórico de mensagens unificados com persistência multi-tenant.</p>
                      </div>
                      <span className="b360-stream-time">há 2 min</span>
                    </div>

                    <div className="b360-stream-item">
                      <div className="b360-stream-badge bg-[#8B7DFF]/15 text-[#8B7DFF] border border-[#8B7DFF]/30">
                        VoiceHub
                      </div>
                      <div className="b360-stream-content">
                        <p className="b360-stream-title">Chamada com CFO da Vanguarda transcrita</p>
                        <p className="b360-stream-desc">Duração 14m 20s · Sentimento 94% Positivo · SLA de follow-up disparado.</p>
                      </div>
                      <span className="b360-stream-time">há 5 min</span>
                    </div>
                  </div>

                  <div className="b360-console-footer">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                      <span>Supervisor pronto para coordenar sua próxima missão de receita.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchView('command')}
                      className="b360-console-action-btn"
                    >
                      Ver Command Center →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 8 Pilares */}
            <section id="destaques">
              <div className="b360-sectionhead">
                <div className="b360-eyebrow">ARQUITETURA DE RECEITA</div>
                <h2>Oito pilares. Uma operação conectada.</h2>
                <p>
                  Da primeira oportunidade à decisão de receita, cada dimensão trabalha em conjunto em uma esteira integrada.
                </p>
              </div>

              <div className="b360-feature-grid">
                {ADAPTIVE_PILLARS.map((pillar) => (
                  <button
                    key={pillar.num}
                    type="button"
                    className={`b360-feature-card ${pillar.colorClass}`}
                    onClick={() => handleOpenModal(pillar.modalTitle, pillar.modalDesc, pillar.num)}
                  >
                    <div className="b360-card-header">
                      <span className="b360-pillar-badge">{pillar.num}</span>
                      <div className="b360-pillar-icon">
                        {renderPillarIcon(pillar.num)}
                      </div>
                      <span className="b360-pillar-tag">{pillar.tag}</span>
                    </div>

                    <div className="b360-card-visual">
                      {renderPillarVisual(pillar.num)}
                    </div>

                    <div className="b360-card-bottom">
                      <h3>
                        {pillar.num}. {pillar.title}
                      </h3>
                      <p>{pillar.desc}</p>
                      <div className="b360-card-action">
                        <span>Inspecionar capacidades</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Problema / Contexto */}
            <section className="b360-section" id="problema">
              <div className="b360-sectionhead">
                <div className="b360-eyebrow">ELIMINAÇÃO DE SILOS</div>
                <h2>Sua equipe precisa de contexto para avançar.</h2>
                <p>
                  Ferramentas isoladas fragmentam o histórico e escondem o que realmente trava o
                  pipeline.
                </p>
              </div>

              <div className="b360-problem-grid">
                <article className="b360-problem-card">
                  <div className="b360-problem-header">
                    <span className="b360-problem-tag">SILOS DE INFORMAÇÃO</span>
                    <span className="b360-problem-icon">❌</span>
                  </div>
                  <h3>Chega de silos operacionais</h3>
                  <div className="b360-problem-body">
                    <div className="b360-problem-row">
                      <span className="b360-label-flag red">Problema</span>
                      <p>CRM, telefonia, e-mails e WhatsApp desconectados forçam os vendedores a caçar informações e retrabalhar contatos.</p>
                    </div>
                    <div className="b360-problem-row">
                      <span className="b360-label-flag cyan">Solução Birth Hub</span>
                      <p>Linha do tempo 360° unificada onde cada negociação preserva todo o histórico de interações e passagens de bastão.</p>
                    </div>
                  </div>
                  <div className="b360-problem-kpi">
                    <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                    <span><b>Resultado:</b> -40% no tempo de preparação e zero retrabalho operacional.</span>
                  </div>
                </article>

                <article className="b360-problem-card">
                  <div className="b360-problem-header">
                    <span className="b360-problem-tag">DECISÕES TARDIAS</span>
                    <span className="b360-problem-icon">❌</span>
                  </div>
                  <h3>Decisões no tempo certo</h3>
                  <div className="b360-problem-body">
                    <div className="b360-problem-row">
                      <span className="b360-label-flag red">Problema</span>
                      <p>Planilhas estáticas e fechamentos mensais revelam estagnações quando já não há tempo hábil para recuperar a meta.</p>
                    </div>
                    <div className="b360-problem-row">
                      <span className="b360-label-flag cyan">Solução Birth Hub</span>
                      <p>Telemetria em tempo real com alertas preditivos de gargalos e desvios de velocidade de ciclo em D+0.</p>
                    </div>
                  </div>
                  <div className="b360-problem-kpi">
                    <TrendingUp className="w-4 h-4 text-[#FF2D9B]" />
                    <span><b>Resultado:</b> +28% na velocidade de avanço entre etapas do funil.</span>
                  </div>
                </article>

                <article className="b360-problem-card">
                  <div className="b360-problem-header">
                    <span className="b360-problem-tag">OPORTUNIDADES NO ESCURO</span>
                    <span className="b360-problem-icon">❌</span>
                  </div>
                  <h3>Nenhuma oportunidade no escuro</h3>
                  <div className="b360-problem-body">
                    <div className="b360-problem-row">
                      <span className="b360-label-flag red">Problema</span>
                      <p>Falta de rigor no cumprimento de SLAs faz negócios quentes esfriarem sem acompanhamento ou ação definida.</p>
                    </div>
                    <div className="b360-problem-row">
                      <span className="b360-label-flag cyan">Solução Birth Hub</span>
                      <p>Orquestração automática de follow-ups com SLA garantido e recomendação da Próxima Melhor Ação (NBA).</p>
                    </div>
                  </div>
                  <div className="b360-problem-kpi">
                    <TrendingUp className="w-4 h-4 text-[#FFC107]" />
                    <span><b>Resultado:</b> 100% das oportunidades com próximo passo monitorado.</span>
                  </div>
                </article>
              </div>
            </section>

            {/* Arquitetura da Plataforma */}
            <section className="b360-section" id="plataforma">
              <div className="b360-sectionhead">
                <div className="b360-eyebrow">SISTEMA OPERACIONAL COMERCIAL</div>
                <h2>Um centro de comando para a sua receita.</h2>
                <p>Dados, diagnóstico e execução integrados na mesma experiência.</p>
              </div>

              <div className="b360-platform-grid">
                <article className="b360-platform-card">
                  <div className="b360-platform-icon bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3>Dados e conectividade Multi-CRM</h3>
                  <p>
                    Conexões bidirecionais via APIs abertas e webhooks com Bitrix24, HubSpot, Salesforce e Pipedrive
                    mantêm os dados comerciais sincronizados em milissegundos sem duplicação.
                  </p>
                  <div className="b360-platform-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                    <span>Persistência RLS Multi-Tenant</span>
                  </div>
                </article>

                <article className="b360-platform-card">
                  <div className="b360-platform-icon bg-[#FF2D9B]/10 text-[#FF2D9B] border border-[#FF2D9B]/30">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3>Diagnóstico e inteligência</h3>
                  <p>
                    Analise a saúde das contas, identifique riscos de estagnação e receba recomendações preditivas
                    fundamentadas no histórico real de negociações para destravar o fechamento.
                  </p>
                  <div className="b360-platform-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D9B] animate-pulse" />
                    <span>Copiloto Contextual & NBA</span>
                  </div>
                </article>

                <article className="b360-platform-card">
                  <div className="b360-platform-icon bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/30">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <h3>Execução e orquestração</h3>
                  <p>
                    Coordene a rotina de SDRs, Closers e liderança com cadências multicanal, regras rígidas de SLA
                    e supervisão autônoma para garantir passagens de bastão sem fricção.
                  </p>
                  <div className="b360-platform-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFC107] animate-pulse" />
                    <span>Passagem de Bastão com SLA</span>
                  </div>
                </article>
              </div>
            </section>

            {/* Fluxo */}
            <section className="b360-section" id="fluxo">
              <div className="b360-sectionhead">
                <div className="b360-eyebrow">JORNADA COMPLETA</div>
                <h2>Da prospecção ao fechamento.</h2>
                <p>Um fluxo contínuo, com contexto preservado em cada passagem de bastão.</p>
              </div>

              <div className="b360-flow-connected">
                <div className="b360-flow-card">
                  <div className="b360-flow-num-badge">01</div>
                  <div className="b360-flow-icon">
                    <Building2 className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <h3>Entrada e captura</h3>
                  <p>Leads e contas chegam por CRMs, campanhas de marketing e prospecção ativa com enriquecimento automático.</p>
                  <div className="b360-flow-kpi">Inbound & Outbound</div>
                </div>

                <div className="b360-flow-connector" aria-hidden="true">
                  <div className="b360-flow-line" />
                  <ArrowRight className="w-4 h-4 b360-flow-arrow" />
                </div>

                <div className="b360-flow-card">
                  <div className="b360-flow-num-badge">02</div>
                  <div className="b360-flow-icon">
                    <Target className="w-5 h-5 text-[#FF2D9B]" />
                  </div>
                  <h3>Enriquecimento B2B</h3>
                  <p>Dados de empresas, decisores e CNAE apoiam a validação imediata do ICP e priorização inteligente de contas.</p>
                  <div className="b360-flow-kpi">Match ICP & QSA</div>
                </div>

                <div className="b360-flow-connector" aria-hidden="true">
                  <div className="b360-flow-line" />
                  <ArrowRight className="w-4 h-4 b360-flow-arrow" />
                </div>

                <div className="b360-flow-card">
                  <div className="b360-flow-num-badge">03</div>
                  <div className="b360-flow-icon">
                    <GitBranch className="w-5 h-5 text-[#FFC107]" />
                  </div>
                  <h3>Cadência e SLA</h3>
                  <p>Distribuição automática e contato ágil entre SDR e Closer seguindo regras operacionais rígidas de SLA.</p>
                  <div className="b360-flow-kpi">Toques Multicanal</div>
                </div>

                <div className="b360-flow-connector" aria-hidden="true">
                  <div className="b360-flow-line" />
                  <ArrowRight className="w-4 h-4 b360-flow-arrow" />
                </div>

                <div className="b360-flow-card">
                  <div className="b360-flow-num-badge">04</div>
                  <div className="b360-flow-icon">
                    <Bot className="w-5 h-5 text-[#8B7DFF]" />
                  </div>
                  <h3>Apoio com IA</h3>
                  <p>Histórico contextual, matriz de objeções e copiloto orientam as abordagens e reuniões de negociação.</p>
                  <div className="b360-flow-kpi">NBA em Tempo Real</div>
                </div>

                <div className="b360-flow-connector" aria-hidden="true">
                  <div className="b360-flow-line" />
                  <ArrowRight className="w-4 h-4 b360-flow-arrow" />
                </div>

                <div className="b360-flow-card">
                  <div className="b360-flow-num-badge">05</div>
                  <div className="b360-flow-icon">
                    <LineChart className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <h3>Fechamento e dados</h3>
                  <p>O aprendizado dos negócios ganhos e perdidos realimenta os modelos estatísticos de previsão de receita.</p>
                  <div className="b360-flow-kpi">Forecast Ponderado</div>
                </div>
              </div>
            </section>

            {/* Seção IA */}
            <section className="b360-section" id="ia">
              <div className="b360-ai-grid">
                <div>
                  <div className="b360-eyebrow">COPILOTO COMERCIAL & SUPERVISOR</div>
                  <h2 className="text-3xl font-extrabold landing-title-gradient mb-4">
                    Inteligência que compreende seu pipeline.
                  </h2>
                  <p className="text-slate-400 text-base mb-6">
                    O copiloto analisa o estágio de cada negociação, o histórico das interações e as
                    objeções recorrentes para apoiar sua equipe em tempo real com supervisão contínua.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                    <div className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-900/60 dark:bg-[#0B1A2E]/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                        <h3 className="text-sm font-bold text-[#00D4FF]">
                          Diagnóstico de entraves
                        </h3>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                        Identifique negócios estagnados no funil e receba o contexto exato do motivo de bloqueio.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-pink-500/20 bg-slate-900/60 dark:bg-[#0B1A2E]/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Target className="w-4 h-4 text-[#FF2D9B]" />
                        <h3 className="text-sm font-bold text-[#FF2D9B]">
                          Próxima melhor ação (NBA)
                        </h3>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                        Receba recomendações táticas preditivas para avançar negociações e contornar objeções.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-amber-500/20 bg-slate-900/60 dark:bg-[#0B1A2E]/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="w-4 h-4 text-[#FFC107]" />
                        <h3 className="text-sm font-bold text-[#FFC107]">
                          Contexto histórico
                        </h3>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                        Leitura instantânea de chamadas gravadas, e-mails trocados e propostas enviadas.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-indigo-500/20 bg-slate-900/60 dark:bg-[#0B1A2E]/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bot className="w-4 h-4 text-[#8B7DFF]" />
                        <h3 className="text-sm font-bold text-[#8B7DFF]">
                          Supervisor On-line
                        </h3>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                        Orquestração autônoma de missões operacionais e alocação dinâmica de agentes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="b360-copilot-card">
                  <div className="b360-copilot-top">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                      <span>COPILOTO ON-LINE</span>
                    </div>
                    <small>Simulação Contextual</small>
                  </div>
                  <div className="b360-copilot-deal-info">
                    <span className="b360-copilot-deal-tag">OPORTUNIDADE #1042</span>
                    <h3>Oportunidade pede atenção.</h3>
                    <p className="b360-copilot-deal-desc">
                      Proposta comercial no valor de <strong>R$ 145.000</strong> enviada há 4 dias sem retorno registrado após reunião técnica.
                    </p>
                  </div>
                  <div className="b360-suggestion-box">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D4FF] mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Próxima Ação Sugerida (NBA):</span>
                    </div>
                    <p>
                      Retomar contato com o CFO destacando o caso de ROI simulado (payback estimado em 45 dias) e propor reunião executiva de implantação com modelo parcelado.
                    </p>
                  </div>
                  <div className="b360-copilot-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenModal('Copiloto de IA', 'Simulação do Copiloto de IA em negociação real.')}
                      className="b360-copilot-apply-btn"
                    >
                      <span>Aplicar recomendação na oportunidade</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Ecossistema / Integrações */}
            <section className="b360-section" id="ecossistema">
              <div className="b360-sectionhead">
                <div className="b360-eyebrow">CONECTIVIDADE TOTAL</div>
                <h2>Conectado ao seu ecossistema.</h2>
                <p>
                  Uma operação aberta e compatível com as ferramentas comerciais e produtividade que sua empresa já utiliza.
                </p>
              </div>

              <div className="b360-integrations">
                {ADAPTIVE_INTEGRATIONS.map((integ) => (
                  <article key={integ.name} className="b360-integration-card">
                    <div className="b360-integration-header">
                      <div className="b360-integration-title">
                        <img src={integ.icon} alt={`${integ.name} logo`} />
                        <h3>{integ.name}</h3>
                      </div>
                      <span className={`b360-status-pill ${integ.status}`}>
                        {integ.status === 'active' && <span className="b360-status-dot green" />}
                        {integ.status === 'in_dev' && <span className="b360-status-dot amber" />}
                        {integ.status === 'planned' && <span className="b360-status-dot slate" />}
                        <span>{integ.statusLabel}</span>
                      </span>
                    </div>
                    <p>{integ.desc}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="b360-final-cta">
              <div className="b360-eyebrow">CONTROLE TOTAL DE RECEITA</div>
              <h2>Coloque sua operação comercial sob comando.</h2>
              <p>
                Explore a experiência do Birth Hub 360° e descubra como dados, equipe e execução se
                potencializam mutuamente em uma única plataforma soberana.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  className="b360-aurora"
                  type="button"
                  onClick={() => handleSwitchView('command')}
                >
                  <span className="b360-aurora-inner">
                    Acessar Command Center <span aria-hidden="true">→</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenRoiSimulator}
                  className="b360-hero-pill-btn"
                >
                  Simular ROI Comercial
                </button>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="px-6 py-3 rounded-full text-xs font-mono font-bold tracking-wider uppercase border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                >
                  Acessar Plataforma
                </button>
              </div>
            </section>
          </div>
        )}

        {/* MODO 2: COMMAND CENTER (SANDBOX INTERATIVO) */}
        {viewMode === 'command' && (
          <div className="b360-shell b360-dashboard-layout">
            {/* Sidebar */}
            <aside className="b360-side" aria-label="Módulos da Plataforma">
              <div className="b360-side-brand">
                <BH360LogoMark size={28} />
                <span className="font-bold text-white">
                  Birth Hub <strong className="text-pink-500">360°</strong>
                </span>
              </div>
              <small>PRINCIPAL</small>
              <button
                type="button"
                className="b360-active"
                onClick={() =>
                  handleOpenModal(
                    'Command Center',
                    'Centro unificado de operações de receita e monitoramento em tempo real.',
                  )
                }
              >
                <span className="b360-dot" /> Command Center
              </button>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'Inteligência Comercial',
                    'Copiloto de IA, Next Best Action (NBA), diagnóstico de gargalos e recomendações de deals.',
                  )
                }
              >
                ✧ Inteligência
              </button>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'CRM & BI 360°',
                    'Pipeline unificado, visualização de negócios por valor, previsão ponderada e telemetria.',
                  )
                }
              >
                ▦ CRM & BI
              </button>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'Prospecção B2B',
                    'Mapeamento de empresas no Brasil, descoberta de sócios e decisores, qualificação de ICP.',
                  )
                }
              >
                ◎ Prospecção
              </button>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'Automações',
                    'Gatilhos Multi-CRM, cadências automáticas de follow-up e sincronização de eventos.',
                  )
                }
              >
                ⌘ Automações
              </button>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'VoiceHub',
                    'Telefonia corporativa em nuvem, discador automático e transcrição com inteligência artificial.',
                  )
                }
              >
                ◈ VoiceHub
              </button>
              <small>CONTROLE</small>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'Governança & RLS',
                    'Isolamento multi-tenant estrito, controle de papéis (RBAC) e governança de privacidade LGPD.',
                  )
                }
              >
                ◉ Governança
              </button>
              <button
                type="button"
                onClick={() =>
                  handleOpenModal(
                    'Central de Integrações',
                    'Conectores para Bitrix24, Salesforce, HubSpot, WhatsApp Oficial e webhooks customizados.',
                  )
                }
              >
                ⥈ Integrações
              </button>
            </aside>

            {/* Conteúdo Central do Command Center */}
            <div>
              <div className="b360-dash-header">
                <div>
                  <div className="b360-eyebrow">SEU CENTRO DE OPERAÇÕES</div>
                  <h1>Command Center</h1>
                  <p>Agentes inteligentes, operações e indicadores em uma única tela.</p>
                </div>
                <button
                  className="b360-aurora b360-small"
                  type="button"
                  onClick={() =>
                    handleOpenModal(
                      'Nova Missão Comercial',
                      'Defina o objetivo operacional: prospecção ativa, auditoria de gargalos ou cadência multicanal.',
                    )
                  }
                >
                  <span className="b360-aurora-inner">+ Nova missão</span>
                </button>
              </div>

              {/* Card do Supervisor On-line */}
              <section className="b360-supervisor">
                <div className="b360-eyebrow">SUPERVISOR ON-LINE</div>
                <h2>O que vamos conquistar hoje?</h2>
                <p>
                  Descreva seu objetivo de vendas. Eu coordeno os agentes, analiso o pipeline e
                  trago as ações prioritárias.
                </p>
                <button
                  className="b360-aurora b360-small"
                  type="button"
                  onClick={() =>
                    handleOpenModal(
                      'Iniciar Missão Autônoma',
                      'O Supervisor ativará os agentes de Enriquecimento, Qualificação e Copiloto para analisar seu pipeline em tempo real.',
                    )
                  }
                >
                  <span className="b360-aurora-inner">Iniciar missão →</span>
                </button>
              </section>

              {/* Métricas Operacionais */}
              <div className="b360-metrics">
                <div className="b360-metric">
                  <small>Missões Ativas</small>
                  <strong>128</strong>
                  <span>● Operação contínua</span>
                </div>
                <div className="b360-metric">
                  <small>Agentes Acionados</small>
                  <strong>19</strong>
                  <span>● Em execução paralela</span>
                </div>
                <div className="b360-metric">
                  <small>Oportunidades em Radar</small>
                  <strong>86</strong>
                  <span>● R$ 4.2M em pipeline</span>
                </div>
              </div>

              {/* Módulos do Sistema */}
              <div
                className="b360-sectionhead"
                style={{ margin: '36px 0 20px', textAlign: 'left' }}
              >
                <div className="b360-eyebrow">EXPLORE A PLATAFORMA</div>
                <h2>Seus oito pilares operacionais</h2>
                <p style={{ margin: 0 }}>
                  Clique em qualquer módulo para inspecionar os recursos e capacidades integradas.
                </p>
              </div>

              <div className="b360-modules">
                {COMMAND_MODULES.map((mod) => (
                  <button
                    key={mod.name}
                    type="button"
                    className="b360-module"
                    onClick={() => handleOpenModal(mod.name, mod.modalDesc)}
                  >
                    <span className="b360-ico">{mod.ico}</span>
                    <b>{mod.name}</b>
                    <span>{mod.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Institucional */}
        <footer className="b360-footer">
          <div className="b360-shell">
            <div className="b360-footer-grid">
              <div className="b360-footer-col brand">
                <div className="flex items-center gap-2.5 mb-3">
                  <BH360LogoMark size={32} />
                  <span className="font-display font-extrabold text-lg text-slate-100 dark:text-white">
                    Birth Hub <strong className="text-[#FF2D9B]">360°</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-sm">
                  O sistema operacional definitivo para operações de receita enterprise unificando CRM, telemetria e inteligência artificial.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-slate-800/60 border border-slate-700/60 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                  <span>Isolamento Multi-Tenant por RLS</span>
                </div>
              </div>

              <div className="b360-footer-col">
                <h4>Plataforma</h4>
                <ul>
                  <li><button type="button" onClick={() => handleOpenModal('01. Hub Comercial', 'Pipeline 360° e contas.', '01')}>01. Pipeline & Contas</button></li>
                  <li><button type="button" onClick={() => handleOpenModal('02. Inteligência de Mercado', 'Enriquecimento B2B.', '02')}>02. Inteligência de Mercado</button></li>
                  <li><button type="button" onClick={() => handleOpenModal('03. Orquestração de Vendas', 'Cadência e SLAs.', '03')}>03. Orquestração de Vendas</button></li>
                  <li><button type="button" onClick={() => handleOpenModal('06. Inteligência Artificial', 'Copiloto de negociações.', '06')}>06. Copiloto de IA</button></li>
                </ul>
              </div>

              <div className="b360-footer-col">
                <h4>Conectividade</h4>
                <ul>
                  <li><span>Bitrix24 (API Oficial)</span></li>
                  <li><span>WhatsApp Business API</span></li>
                  <li><span>VoiceHub Telefonia em Nuvem</span></li>
                  <li><span>Webhooks & Open REST API</span></li>
                </ul>
              </div>

              <div className="b360-footer-col">
                <h4>Governança</h4>
                <ul>
                  <li>
                    <Link to="/privacy" className="hover:text-[#00D4FF] transition-colors">
                      Política de Privacidade
                    </Link>
                  </li>
                  <li><span>Direitos do Titular (LGPD Art. 18)</span></li>
                  <li><span>Sessão Segura HttpOnly</span></li>
                  <li><span>Auditoria de Logs & RBAC</span></li>
                </ul>
              </div>
            </div>

            <div className="b360-footer-bottom">
              <span>© 2026 Birth Hub 360° · Todos os direitos reservados.</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sistemas Operacionais 100%</span>
                </span>
                <span>·</span>
                <span>Versão 2.4 Enterprise</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Modal Editorial dos 8 Pilares e Módulos da Plataforma */}
        <PillarDetailModal
          isOpen={Boolean(activeModal || selectedPillarId)}
          pillarId={selectedPillarId}
          genericModal={activeModal}
          onClose={handleCloseModal}
          onProceedToLogin={handleGoToLogin}
          onOpenRoiSimulator={handleOpenRoiSimulator}
          theme={theme}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TELA 2: LOGIN — MODAL / TELA DE ACESSO CORPORATIVO (ZERO FUNDO BRANCO EM BOTÕES)
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 w-full h-full flex flex-col items-center justify-start z-50 login-antessala-backdrop ${
          theme === 'dark' ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'
        } px-5 py-6 sm:px-8 lg:px-12 overflow-y-auto transition-all duration-500 ${
          activeScreen === 'login'
            ? 'opacity-100 pointer-events-auto'
            : 'hidden opacity-0 pointer-events-none'
        }`}
      >
        {/* Topo do Modal com navegação */}
        <div className="w-full max-w-[460px] flex items-center justify-between mb-4">
          <button
            id="btn-back"
            type="button"
            onClick={handleBackToHome}
            className="text-slate-700 dark:text-slate-300 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] transition-colors flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="landing-theme-toggle-btn"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F59E0B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#00D4FF]" />
              )}
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Ativar modo tela cheia'}
              title={isFullscreen ? 'Sair da tela cheia' : 'Ativar modo tela cheia'}
              className="text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors font-mono text-xs cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800"
            >
              <span>{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Header Centralizado do Modal — Sequência Coesa */}
        <div className="flex flex-col items-center mb-4 text-center">
          <BH360LogoMark size={48} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] mt-3 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <span>Revenue Command Center · Antessala</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold landing-title-gradient tracking-tight mb-1.5 leading-tight text-center">
            <span>
              {authMode === 'signup'
                ? 'Solicitar Acesso Corporativo'
                : authMode === 'forgot'
                  ? 'Redefinir Senha'
                  : 'Acessar o Command Center'}
            </span>
          </h2>
          <p className="landing-subtitle font-sans text-xs sm:text-sm font-medium max-w-[380px] mx-auto leading-relaxed text-center">
            {authMode === 'signup'
              ? 'Preencha suas informações corporativas para provisionamento de acesso.'
              : authMode === 'forgot'
                ? 'Informe seu e-mail corporativo para receber o link de recuperação.'
                : 'Central de inteligência comercial, previsibilidade e governança integrada.'}
          </p>
        </div>

        {/* Card Central de Login — Command Deck (Zero Fundo Branco Chapado) */}
        <div className="w-full max-w-[460px] mb-8">
          <div className="card-login-command p-6 sm:p-7 relative">
            {/* Abas E-mail vs SSO */}
            {authMode === 'signin' && (
              <div
                className="grid grid-cols-2 gap-1 mb-5 p-1 bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl"
                role="tablist"
                aria-label="Método de acesso"
              >
                <button
                  id="auth-tab-email"
                  type="button"
                  role="tab"
                  aria-selected={authMethod === 'email'}
                  aria-controls="auth-panel-email"
                  tabIndex={authMethod === 'email' ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 'email')}
                  onClick={() => setAuthMethod('email')}
                  className={`py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-all ${
                    authMethod === 'email'
                      ? 'bg-[#00D4FF]/20 border border-[#00D4FF] text-[#0369a1] dark:text-[#00D4FF] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>E-mail Corporativo</span>
                </button>
                <button
                  id="auth-tab-sso"
                  type="button"
                  role="tab"
                  aria-selected={authMethod === 'sso'}
                  aria-controls="auth-panel-sso"
                  tabIndex={authMethod === 'sso' ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 'sso')}
                  onClick={() => setAuthMethod('sso')}
                  className={`py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-all ${
                    authMethod === 'sso'
                      ? 'bg-[#00D4FF]/20 border border-[#00D4FF] text-[#0369a1] dark:text-[#00D4FF] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>SSO Empresarial</span>
                </button>
              </div>
            )}

            {/* Mensagens de Feedback */}
            {errorMessage && (
              <div
                id="auth-error-message"
                role="alert"
                className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/50 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="font-medium font-sans">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div
                id="auth-status-message"
                role="status"
                className="mb-4 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="font-medium font-sans">{successMessage}</p>
              </div>
            )}

            {/* Conteúdo de SSO Empresarial ou Formulário Padrão */}
            {authMethod === 'sso' && authMode === 'signin' ? (
              <div
                id="auth-panel-sso"
                role="tabpanel"
                aria-labelledby="auth-tab-sso"
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/15 text-[#00D4FF] flex items-center justify-center mx-auto mb-2.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-sm font-bold text-[#0369a1] dark:text-[#00D4FF] mb-1">
                    Single Sign-On Corporativo
                  </h4>
                  <p className="landing-subtitle font-sans text-xs leading-relaxed mb-3">
                    Autenticação federada OpenID Connect / SAML 2.0 (Google Workspace / Microsoft
                    Entra ID) para a sua organização.
                  </p>
                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="sso-domain"
                      className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      Domínio Corporativo
                    </label>
                    <input
                      id="sso-domain"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={errorMessage ? 'auth-error-message' : undefined}
                      className="w-full h-11 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 text-sm font-sans outline-none placeholder:text-slate-400"
                      placeholder="empresa.com.br"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSsoSubmit}
                  className="btn-cta-light w-full h-12 rounded-xl font-mono text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Continuar com SSO</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Formulário Padrão */
              <form
                id="auth-panel-email"
                role={authMode === 'signin' ? 'tabpanel' : undefined}
                aria-labelledby={authMode === 'signin' ? 'auth-tab-email' : undefined}
                onSubmit={handleAuthSubmit}
                className="space-y-4"
                noValidate
              >
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-name"
                      className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      Nome Completo
                    </label>
                    <input
                      id="login-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 text-sm font-sans outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Seu nome"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-email"
                      className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      E-mail Corporativo
                    </label>
                    <span className="font-mono text-[10px] text-[#00D4FF]/80">
                      Domínio empresarial
                    </span>
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={errorMessage ? 'auth-error-message' : undefined}
                    className="w-full h-11 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 text-sm font-sans outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="nome@empresa.com.br"
                    required
                    autoComplete="email"
                  />
                </div>

                {authMode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                      >
                        Senha de Acesso
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={Boolean(errorMessage)}
                        aria-describedby={errorMessage ? 'auth-error-message' : undefined}
                        className="w-full h-11 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 text-sm font-sans outline-none transition-all pr-11 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="••••••••"
                        required
                        autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors p-1"
                        aria-label="Mostrar ou ocultar senha"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {authMode === 'signin' && (
                  <div className="flex items-center justify-between pt-1 font-sans text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-[#00D4FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Manter conectado</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="font-medium text-[#00D4FF] hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                {/* Botão de Enviar */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-cta-light w-full h-12 rounded-xl font-mono text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>
                        {authMode === 'signup'
                          ? 'Solicitar Acesso'
                          : authMode === 'forgot'
                            ? 'Enviar Link de Redefinição'
                            : 'Entrar na Plataforma'}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 text-white" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Alternância de Modo */}
            <div className="mt-4 text-center">
              {authMode === 'signin' && (
                <button
                  type="button"
                  aria-label="Criar conta"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-sans text-xs text-slate-600 dark:text-slate-300 hover:text-[#00D4FF] transition-colors cursor-pointer"
                >
                  Não possui credenciais corporativas?{' '}
                  <span className="font-bold text-[#00D4FF] hover:underline">Criar conta</span>
                </button>
              )}

              {authMode === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-sans text-xs text-slate-600 dark:text-slate-300 hover:text-[#00D4FF] transition-colors cursor-pointer"
                >
                  Já possui credenciais corporativas?{' '}
                  <span className="font-bold text-[#00D4FF] hover:underline">Fazer login</span>
                </button>
              )}

              {authMode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-sans text-xs text-slate-600 dark:text-slate-300 hover:text-[#00D4FF] transition-colors cursor-pointer"
                >
                  Voltar para{' '}
                  <span className="font-bold text-[#0369a1] dark:text-[#00D4FF] hover:underline">
                    Login Corporativo
                  </span>
                </button>
              )}
            </div>

            {/* Régua Técnica de Segurança e Conformidade (Arquitetura Real) */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#0369a1] dark:text-[#00D4FF]">
                    Multi-Tenant
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Isolamento RLS
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#0369a1] dark:text-[#00D4FF]">
                    Sessão Segura
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Cookie HttpOnly
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#92400e] dark:text-[#F59E0B]">
                    LGPD / Art. 18
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Conformidade
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#047857] dark:text-[#10B981]">
                    RBAC Estrito
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Controle de Acesso
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          BOTÃO FLUTUANTE VOLTAR AO TOPO (NEON FLOATING ACTION BUTTON)
      ════════════════════════════════════════════════════════════════════ */}
      {showScrollTop && activeScreen === 'intro' && (
        <button
          type="button"
          onClick={() => {
            SoundFX.play('click');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="btn-floating-top"
          aria-label="Voltar ao topo da página"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      {/* Modal Global do Simulador Executivo de Previsibilidade & ROI */}
      <RoiSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onProceedToLogin={handleGoToLogin}
      />
    </main>
  );
}

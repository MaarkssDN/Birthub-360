import { useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
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
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const LuxuryLandingPage = lazy(() =>
  import('../luxury/LuxuryLandingPage.js').then((m) => ({ default: m.LuxuryLandingPage })),
);

import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BirthHubLogo } from '@/components/brand/BirthHubLogo';
import { isAuthorizedLoginEmail } from '@/config/access-policy';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getFirstInvalidLeadField,
  type LeadFieldErrors,
  type LeadFormField,
  mapLeadServerFieldErrors,
  normalizeBrazilianWhatsapp,
  validateLeadForm,
} from '@/features/landing/services/leadFormValidation';
import {
  getLeadSubmitErrorMessage,
  isAbortError,
  isLeadSubmitError,
  LEAD_CONSENT_PURPOSE,
  LEAD_CONSENT_TEXT_VERSION,
  LEAD_TEAM_SIZES,
  type LeadTeamSize,
  submitLead,
} from '@/features/landing/services/submitLead';
import {
  type HeroVariant,
  trackHeroCtaPrimaryClick,
  trackHeroRoiSimulatorOpened,
  trackHeroVariantImpression,
  trackHeroVariantSwitched,
  trackLeadCaptureOpened,
  trackLeadFormSubmitted,
} from '@/lib/analytics/conversionTelemetry';
import { authClient } from '@/lib/auth-client';
import { SoundFX } from '@/lib/soundEffects';
import {
  B360AmbientFX,
  B360CountUp,
  B360DataStreamCursor,
  B360DecryptBlock,
  B360FloatingNodes,
  B360NeonButton,
  B360ScrollProgress,
  B360UnifiedPipelineFlow,
  B360Words,
  useB360CardTilt,
  useB360MagneticAttraction,
  useB360ScrollParallax,
  useB360ScrollVelocityInertia,
  useB360SectionProgress,
} from '../components/CinematicFX.js';
import { PillarDetailModal } from '../components/PillarDetailModal.js';
import { RoiSimulatorModal } from '../components/RoiSimulatorModal.js';
import './LandingAdaptive.css';
import './Landing360.css';
import './LandingCinematic.css';
import './LandingRegenerationV4.css';
import './LandingConversionV5.css';

// 11 MÓDULOS ADAPTATIVOS (8 Pilares Centrais + 3 Complementares — BENTO GRID REFINADO)
const ADAPTIVE_PILLARS = [
  {
    num: '01',
    bentoClass: 'b360-bento-p1',
    title: 'Hub comercial',
    desc: 'Centralize contas, pipeline e oportunidades em uma visão 360° de cada negociação.',
    bg: '/landing/assets/pillar-hub.jpg',
    colorClass: '',
    accentColor: '#00D4FF',
    tag: 'PIPELINE 360°',
    kpiPrefix: 'Simulação:',
    kpi: 'R$ 4,2M pipeline',
    modalTitle: '01. Hub Comercial',
    modalDesc:
      'Centralização de contas, pipeline comercial unificado e visão 360° de cada oportunidade em negociação com rastreabilidade total.',
  },
  {
    num: '02',
    bentoClass: 'b360-bento-p2',
    title: 'Inteligência de mercado',
    desc: 'Enriqueça dados B2B, identifique sinais de compra e qualifique decisores com precisão.',
    bg: '/landing/assets/pillar-market.jpg',
    colorClass: 'b360-c-pink',
    accentColor: '#FF2D9B',
    tag: 'ENRIQUECIMENTO B2B',
    kpiPrefix: 'Simulação:',
    kpi: '96% Match ICP',
    modalTitle: '02. Inteligência de Mercado',
    modalDesc:
      'Enriquecimento analítico de dados B2B, mapeamento de contas, identificação de sinais de compra e qualificação preditiva.',
  },
  {
    num: '03',
    bentoClass: 'b360-bento-p3',
    title: 'Orquestração de vendas',
    desc: 'Coordene cadências multicanal, passagem de bastão e a próxima ação de vendas.',
    bg: '/landing/assets/pillar-orchestration.jpg',
    colorClass: 'b360-c-gold',
    accentColor: '#FFC107',
    tag: 'CADÊNCIA MULTICANAL',
    kpiPrefix: 'Alvo SLA:',
    kpi: '< 15 min',
    modalTitle: '03. Orquestração de Vendas',
    modalDesc:
      'Cadências coordenadas entre SDRs e Closers, regras claras de passagem de bastão e direcionamento para a próxima melhor ação.',
  },
  {
    num: '04',
    bentoClass: 'b360-bento-p4',
    title: 'Performance comercial',
    desc: 'Acompanhe conversão, velocidade do funil, metas e produtividade da equipe.',
    bg: '/landing/assets/pillar-performance.jpg',
    colorClass: 'b360-c-iris',
    accentColor: '#8B7DFF',
    tag: 'TELEMETRIA & METAS',
    kpiPrefix: 'Simulação:',
    kpi: '+24,8% conversão',
    modalTitle: '04. Performance Comercial',
    modalDesc:
      'Telemetria de conversão, velocidade de ciclo entre etapas, metas operacionais e produtividade da equipe em tempo real.',
  },
  {
    num: '05',
    bentoClass: 'b360-bento-p5',
    title: 'Previsibilidade comercial',
    desc: 'Modele probabilidades, pipeline ponderado e cenários baseados no histórico real.',
    bg: '/landing/assets/pillar-forecast.jpg',
    colorClass: '',
    accentColor: '#00D4FF',
    tag: 'FORECAST PROBABILÍSTICO',
    kpiPrefix: 'Simulação:',
    kpi: '94,2% acurácia',
    modalTitle: '05. Previsibilidade Comercial',
    modalDesc:
      'Modelagem estatística de probabilidade, análise de pipeline ponderado e projeções de receita embasadas no histórico real.',
  },
  {
    num: '06',
    bentoClass: 'b360-bento-p6',
    title: 'Inteligência artificial',
    desc: 'Um enxame de 20+ agentes especializados e um copiloto conectado aos dados da empresa.',
    bg: '/landing/assets/pillar-ai.jpg',
    colorClass: 'b360-c-pink',
    accentColor: '#FF2D9B',
    tag: 'COPILOTO DE NEGOCIAÇÕES',
    kpiPrefix: 'Modo:',
    kpi: 'NBA em tempo real',
    modalTitle: '06. Inteligência Artificial',
    modalDesc:
      'Copiloto de negociações contextualizado com dados da organização, diagnóstico de entraves e recomendações acionáveis em tempo real.',
  },
  {
    num: '07',
    bentoClass: 'b360-bento-p7',
    title: 'Automação & conectividade',
    desc: 'Motor de regras, scanners inteligentes e uma malha de 9 conectores — incluindo Bitrix24.',
    bg: '/landing/assets/pillar-automation.jpg',
    colorClass: 'b360-c-gold',
    accentColor: '#FFC107',
    tag: 'MOTOR DE REGRAS & 9 CONECTORES',
    kpiPrefix: 'Simulação:',
    kpi: '~12 ms sync',
    modalTitle: '07. Automação & Conectividade Multi-CRM',
    modalDesc:
      'Sincronização bidirecional em tempo real via APIs abertas e webhooks com Bitrix24, Salesforce, HubSpot e Pipedrive.',
  },
  {
    num: '08',
    bentoClass: 'b360-bento-p8',
    title: 'Engajamento comercial',
    desc: 'Reúna telefonia, interações e histórico de contatos em uma comunicação integrada.',
    bg: '/landing/assets/pillar-engagement.jpg',
    colorClass: 'b360-c-iris',
    accentColor: '#8B7DFF',
    tag: 'VOICEHUB & WHATSAPP',
    kpiPrefix: 'Simulação:',
    kpi: '94% sentimento',
    modalTitle: '08. Engajamento Comercial',
    modalDesc:
      'Voice Hub com studio visual e supervisão ao vivo, cold call governado, WhatsApp via Chatwoot, mesa de tratamento e app Android dedicado.',
  },
  {
    num: '09',
    bentoClass: 'b360-bento-p9',
    title: 'Admin & operations',
    desc: 'Fundação operacional: settings globais, equipe e papéis, acesso por módulo e feature flags.',
    bg: '/landing/assets/pillar-admin.jpg',
    colorClass: '',
    accentColor: '#00D4FF',
    tag: 'GOVERNANÇA DA PLATAFORMA',
    kpiPrefix: 'Escopo:',
    kpi: 'Por organização',
    modalTitle: '09. Admin & Operations',
    modalDesc:
      'Camada de administração da plataforma: configurações globais, gestão de equipe e papéis, controle de acesso a módulos, feature flags e telemetria de consumo.',
  },
  {
    num: '10',
    bentoClass: 'b360-bento-p10',
    title: 'Mobile & field sales',
    desc: 'Vendas em campo com gravação de reuniões, sincronização offline e IA edge no app Android.',
    bg: '/landing/assets/pillar-mobile.jpg',
    colorClass: 'b360-c-pink',
    accentColor: '#FF2D9B',
    tag: 'FORÇA DE CAMPO',
    kpiPrefix: 'Modo:',
    kpi: 'Offline-first',
    modalTitle: '10. Mobile & Field Sales',
    modalDesc:
      'FieldMeetingRecorder para registrar reuniões externas, sincronização offline, gravação de áudio e IA edge — o vendedor trabalha fora do escritório com a mesma plataforma via app Android (Capacitor).',
  },
  {
    num: '11',
    bentoClass: 'b360-bento-p11',
    title: 'Social selling',
    desc: 'Abordagens personalizadas por canal com copywriting assistido por IA e persistência de interações.',
    bg: '/landing/assets/pillar-social.jpg',
    colorClass: 'b360-c-gold',
    accentColor: '#FFC107',
    tag: 'VENDA SOCIAL',
    kpiPrefix: 'Canais:',
    kpi: 'LinkedIn · WhatsApp',
    modalTitle: '11. Social Selling',
    modalDesc:
      'Geração de abordagens personalizadas, copywriting assistido por IA, abordagem estruturada por canal e persistência de interações — módulo concedido por organização.',
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
    case '09':
      return <Settings className="w-5 h-5 text-[#00D4FF]" />;
    case '10':
      return <Smartphone className="w-5 h-5 text-[#FF2D9B]" />;
    case '11':
      return <Share2 className="w-5 h-5 text-[#FFC107]" />;
    default:
      return <Building2 className="w-5 h-5" />;
  }
}

function renderPillarVisual(num: string) {
  switch (num) {
    case '01':
      return (
        <div className="b360-p-float b360-pf1" aria-hidden="true">
          <b>Pipeline unificado · exemplo</b>
          <div className="b360-pf-row">
            <span>
              Qualificação<em>R$ 145k</em>
            </span>
            <span>
              Proposta<em>R$ 280k</em>
            </span>
          </div>
        </div>
      );
    case '04':
      return (
        <div className="b360-p-float b360-pf4" aria-hidden="true">
          <b>Taxa de conversão · simulação</b>
          <div className="b360-pf-bar">
            <i />
          </div>
          <div className="b360-pf-meta">
            <span>Ciclo 18,2 dias</span>
            <strong>+24,8%</strong>
          </div>
        </div>
      );
    case '06':
      return (
        <div className="b360-p-float b360-pf6" aria-hidden="true">
          <b>NBA · simulação contextual</b>
          <span>Enviar proposta parcelada com ROI estimado em 45 dias.</span>
        </div>
      );
    case '08':
      return (
        <div className="b360-p-float b360-pf8" aria-hidden="true">
          <b>Chamada transcrita · exemplo</b>
          <div className="b360-pf-meta">
            <span>Sentimento simulado</span>
            <strong>94% positivo</strong>
          </div>
          <div className="b360-pf-wave">
            <i style={{ '--h': '8px' } as React.CSSProperties} />
            <i style={{ '--h': '16px' } as React.CSSProperties} />
            <i style={{ '--h': '24px' } as React.CSSProperties} />
            <i style={{ '--h': '12px' } as React.CSSProperties} />
            <i style={{ '--h': '20px' } as React.CSSProperties} />
            <i style={{ '--h': '26px' } as React.CSSProperties} />
            <i style={{ '--h': '14px' } as React.CSSProperties} />
            <i style={{ '--h': '22px' } as React.CSSProperties} />
            <i style={{ '--h': '10px' } as React.CSSProperties} />
            <i style={{ '--h': '18px' } as React.CSSProperties} />
            <i style={{ '--h': '24px' } as React.CSSProperties} />
            <i style={{ '--h': '12px' } as React.CSSProperties} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

// MÓDULOS DO COMMAND CENTER SANDBOX (11 MÓDULOS OFICIAIS DA PLATAFORMA)
const COMMAND_MODULES = [
  {
    name: 'Hub Comercial',
    ico: '▦',
    desc: 'Pipeline e contas 360°',
    modalDesc:
      'Núcleo operacional: pipeline kanban, gestão de negócios, propostas e cadastro unificado de contas e decisores — a base de dados sobre a qual todos os outros módulos operam.',
  },
  {
    name: 'Inteligência de Mercado',
    ico: '◎',
    desc: 'Prospecção multi-fonte',
    modalDesc:
      'Motor de prospecção multi-fonte: consulta CNPJ, Apollo, Hunter, Google Places, LinkedIn e mais; enriquece contas com dados societários e monta um dossiê 360° antes da abordagem.',
  },
  {
    name: 'Orquestração de Vendas',
    ico: '⌘',
    desc: 'Cadências, execução & roleplay',
    modalDesc:
      'Motor próprio de cadências com opt-out e rate limit, plano diário priorizado, mesa de tratamento e ferramental de execução — playbooks, roteiros, matrizes, roleplay e academy.',
  },
  {
    name: 'Performance Comercial',
    ico: '✦',
    desc: 'Analytics & gamificação',
    modalDesc:
      'Analytics com coortes, win/loss estruturado, gamificação com coaching e ~18 tipos de relatórios executivos — de gargalo de funil a benchmark de vendedores.',
  },
  {
    name: 'Previsibilidade Comercial',
    ico: '◔',
    desc: 'Forecast preditivo',
    modalDesc:
      'Forecast com calibração contínua contra o realizado, pipeline ponderado, health score, detecção de risco por deal e simulador de cenários de contratação.',
  },
  {
    name: 'Inteligência Artificial',
    ico: '✧',
    desc: 'Enxame de agentes',
    modalDesc:
      'Enxame de 20+ agentes especializados (BDR, Closer, SDR, Forecast, Pricing, Contract, Churn, Guardian do Bitrix), copiloto contextual com voz, RAG corporativo e aprovação humana para ações de alto impacto.',
  },
  {
    name: 'Automação & Conectividade',
    ico: '⇄',
    desc: 'Regras & 9 conectores',
    modalDesc:
      'Motor de regras com dry-run, versionamento e idempotência; scanners de leads frios e deals estagnados; smart lead router; e malha de 9 conectores — incluindo o extrator completo do Bitrix24.',
  },
  {
    name: 'Engajamento Comercial',
    ico: '◈',
    desc: 'Voz, WhatsApp & agenda',
    modalDesc:
      'Voice Hub com studio visual e supervisão ao vivo, cold call governado por política e scoring, WhatsApp via Chatwoot, mesa de tratamento e página pública de agendamento — com app Android dedicado.',
  },
  {
    name: 'Admin & Operations',
    ico: '⚙',
    desc: 'Fundação da plataforma',
    modalDesc:
      'Camada de administração: settings globais, gestão de equipe e papéis, controle de acesso a módulos, feature flags, catálogo por organização, relatórios de bug, consumo de IA e notificações.',
  },
  {
    name: 'Mobile & Field Sales',
    ico: '▣',
    desc: 'Vendas em campo',
    modalDesc:
      'FieldMeetingRecorder para reuniões externas, sincronização offline, gravação de áudio e IA edge — o app Android via Capacitor mantém o vendedor produtivo fora do escritório.',
  },
  {
    name: 'Social Selling',
    ico: '✺',
    desc: 'Venda via redes sociais',
    modalDesc:
      'Abordagens personalizadas por canal, copywriting assistido por IA, abordagem estruturada e persistência de interações — concedido por módulo à organização.',
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

  // --- CRO & TESTES A/B (Variante A: Aceleração de Pipeline / Variante B: Multiplicação de Receita) ---
  const [abVariant, setAbVariant] = useState<HeroVariant>(() => {
    if (typeof window === 'undefined') return 'A';
    try {
      const qv = searchParams.get('variant')?.toUpperCase();
      if (qv === 'B' || qv === 'C') return qv as HeroVariant;
      if (qv === 'A') return 'A';
      const saved = sessionStorage.getItem('bh_landing_variant');
      if (saved === 'A' || saved === 'B' || saved === 'C') return saved as HeroVariant;
    } catch {}
    return 'A';
  });

  useEffect(() => {
    trackHeroVariantImpression(abVariant);
    try {
      sessionStorage.setItem('bh_landing_variant', abVariant);
    } catch {}
  }, [abVariant]);

  const handleSwitchAbVariant = (newVariant: HeroVariant) => {
    SoundFX.play('click');
    trackHeroVariantSwitched(abVariant, newVariant);
    setAbVariant(newVariant);
    try {
      sessionStorage.setItem('bh_landing_variant', newVariant);
    } catch {}
  };

  // --- FORMULÁRIO OBJETIVO DE CAPTURA DE LEAD ---
  const [leadForm, setLeadForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    equipe: '6 a 15' as LeadTeamSize,
    consent: false,
    website: '',
  });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadFieldErrors, setLeadFieldErrors] = useState<LeadFieldErrors>({});
  const [leadSubmitError, setLeadSubmitError] = useState<string | null>(null);
  const leadNomeRef = useRef<HTMLInputElement>(null);
  const leadEmailRef = useRef<HTMLInputElement>(null);
  const leadWhatsappRef = useRef<HTMLInputElement>(null);
  const leadConsentRef = useRef<HTMLInputElement>(null);
  const leadEquipeGroupRef = useRef<HTMLDivElement>(null);
  const leadEquipeFocusRafRef = useRef<number | null>(null);
  const leadAbortRef = useRef<AbortController | null>(null);

  const leadFieldRefs: Partial<Record<LeadFormField, React.RefObject<HTMLInputElement | null>>> = {
    nome: leadNomeRef,
    email: leadEmailRef,
    whatsapp: leadWhatsappRef,
    consent: leadConsentRef,
  };

  const cancelEquipeFocusRaf = () => {
    if (leadEquipeFocusRafRef.current != null) {
      cancelAnimationFrame(leadEquipeFocusRafRef.current);
      leadEquipeFocusRafRef.current = null;
    }
  };

  const focusLeadField = (field: LeadFormField) => {
    cancelEquipeFocusRaf();
    if (field === 'equipe') {
      const selectedIndex = LEAD_TEAM_SIZES.indexOf(leadForm.equipe);
      const selected =
        (selectedIndex >= 0
          ? document.getElementById(`lead-equipe-option-${selectedIndex}`)
          : null) ??
        leadEquipeGroupRef.current?.querySelector<HTMLElement>(
          '[role="radio"][aria-checked="true"]',
        );
      (selected ?? leadEquipeGroupRef.current)?.focus();
      return;
    }
    leadFieldRefs[field]?.current?.focus();
  };

  useEffect(() => {
    return () => {
      cancelEquipeFocusRaf();
      leadAbortRef.current?.abort();
    };
  }, []);

  const handleEquipeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    current: LeadTeamSize,
  ) => {
    const currentIndex = LEAD_TEAM_SIZES.indexOf(current);
    const lastIndex = LEAD_TEAM_SIZES.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    } else {
      return;
    }

    event.preventDefault();
    const next = LEAD_TEAM_SIZES[nextIndex];
    setLeadForm({ ...leadForm, equipe: next });
    cancelEquipeFocusRaf();
    leadEquipeFocusRafRef.current = requestAnimationFrame(() => {
      leadEquipeFocusRafRef.current = null;
      document.getElementById(`lead-equipe-option-${nextIndex}`)?.focus();
    });
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadLoading) return;

    const fieldErrors = validateLeadForm(leadForm);
    setLeadFieldErrors(fieldErrors);
    setLeadSubmitError(null);

    const firstInvalid = getFirstInvalidLeadField(fieldErrors);
    if (firstInvalid) {
      focusLeadField(firstInvalid);
      return;
    }

    setLeadLoading(true);
    SoundFX.play('click');

    leadAbortRef.current?.abort();
    const controller = new AbortController();
    leadAbortRef.current = controller;

    try {
      const whatsapp = normalizeBrazilianWhatsapp(leadForm.whatsapp);
      await submitLead(
        {
          nome: leadForm.nome.trim(),
          email: leadForm.email.trim(),
          ...(whatsapp ? { whatsapp } : {}),
          equipe: leadForm.equipe,
          consent: true,
          consentTextVersion: LEAD_CONSENT_TEXT_VERSION,
          purpose: LEAD_CONSENT_PURPOSE,
          website: leadForm.website,
        },
        { signal: controller.signal },
      );
      setLeadSubmitted(true);
      trackLeadFormSubmitted(abVariant, {
        teamSize: leadForm.equipe,
        source: 'landing_form_objective',
      });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      if (isLeadSubmitError(error) && error.fields) {
        const mapped = mapLeadServerFieldErrors(error.fields);
        setLeadFieldErrors(mapped.fieldErrors);
        setLeadSubmitError(mapped.formMessage ?? getLeadSubmitErrorMessage(error));
        const firstInvalid = getFirstInvalidLeadField(mapped.fieldErrors);
        if (firstInvalid) {
          focusLeadField(firstInvalid);
        }
      } else {
        setLeadSubmitError(getLeadSubmitErrorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLeadLoading(false);
      }
    }
  };
  const firstInvalidLeadField = getFirstInvalidLeadField(leadFieldErrors);
  const reduceMotion = useReducedMotion();
  useB360CardTilt([viewMode, activeScreen]);
  useB360ScrollParallax();
  useB360ScrollVelocityInertia(
    '.b360-hero-console, .b360-fanned-card, .b360-feature-card, .b360-problem-card, .b360-platform-card, .b360-flow-card, .b360-integration-card',
  );
  useB360MagneticAttraction(
    '.b360-integration-card, .b360-status-pill, .b360-neon-halo-btn, .b360-aurora',
    0.32,
    220,
  );
  const { isIntersecting: isProblemIntersecting } = useB360SectionProgress('problema');

  // Sincronizar o tema dinâmico no elemento raiz para que o toggle de modo claro/escuro funcione perfeitamente
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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

  // Scroll reveals cinematográficos — IntersectionObserver adiciona .b360-reveal-in
  // conforme as seções entram na viewport (movimento só existe sob
  // prefers-reduced-motion: no-preference, definido no CSS).
  useEffect(() => {
    if (activeScreen !== 'intro' || !('IntersectionObserver' in window)) return;
    const root = document.querySelector('.b360-adaptive-landing');
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>(
      '.b360-section, .b360-problem-card, .b360-platform-card, .b360-flow-card, .b360-ai-grid > div, .b360-integration-card, .b360-feature-card, .b360-module, .b360-final-cta',
    );
    if (targets.length === 0) return;

    targets.forEach((el) => {
      el.classList.add('b360-reveal');
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('b360-reveal-in');
            entry.target.classList.remove('b360-reveal');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    // Fallback para saltos de scroll (scrollTo/end, âncoras, find-in-page):
    // elementos que ficam acima da viewport sem nunca intersectar ficariam
    // ocultos para sempre — um listener passivo os revela ao passar.
    const revealPassed = () => {
      for (const el of targets) {
        if (!el.classList.contains('b360-reveal-in') && el.getBoundingClientRect().bottom < 0) {
          el.classList.add('b360-reveal-in');
          io.unobserve(el);
        }
      }
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        revealPassed();
      });
    };
    revealPassed();
    window.addEventListener('scroll', onScroll, { passive: true });

    targets.forEach((el) => {
      io.observe(el);
    });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activeScreen, viewMode]);

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

  // Limpeza de estado de modais e simuladores em mudanças de rota
  useEffect(() => {
    setSelectedPillarId(null);
    setActiveModal(null);
    setIsSimulatorOpen(false);
  }, [location.pathname]);

  const handleGoToLogin = () => {
    SoundFX.play('confirm');
    setSelectedPillarId(null);
    setActiveModal(null);
    setIsSimulatorOpen(false);
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
    trackHeroRoiSimulatorOpened(abVariant, 'landing_adaptive_hero');
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
      {activeScreen === 'intro' && (
        <>
          <B360ScrollProgress />
          <B360DataStreamCursor />
        </>
      )}
      {/* ════════════════════════════════════════════════════════════════════
          TELA 1: LANDING ADAPTADA & COMMAND CENTER INTERATIVO
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`b360-adaptive-landing ${theme === 'dark' ? 'dark' : 'light'} ${activeScreen === 'intro' ? 'block' : 'hidden'}`}
        data-theme={theme}
      >
        {/* Camada ambiente cinematográfica — orbes de cor + anel de órbita cônico 360° */}
        <div className="b360-ambient" aria-hidden="true">
          <div className="b360-orb b360-orb-a" />
          <div className="b360-orb b360-orb-b" />
          <div className="b360-orb b360-orb-c" />
          <div className="b360-orbit-ring" />
        </div>

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
                <a href="#destaques">11 módulos</a>
                <a href="#ia">IA Comercial</a>
                <a href="#provas-sociais">Casos & Métricas</a>
                <a href="#demonstracao">Agendar Demo</a>
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
              <B360AmbientFX variant="hero" />

              {/* Banner de Urgência Ética e Transparente */}
              <div
                className="b360-urgency-banner"
                role="status"
                aria-label="Aviso de disponibilidade de implantação assistida"
              >
                <div className="b360-urgency-content">
                  <span className="b360-urgency-badge">🔥 Vagas Limitadas</span>
                  <span>
                    <b>Ciclo de Implantação Assistida:</b> Apenas 4 vagas para onboarding com
                    Arquiteto de Vendas nesta semana.
                  </span>
                </div>
                <a href="#demonstracao" className="b360-urgency-btn">
                  Garantir vaga com setup gratuito →
                </a>
              </div>

              <div className="b360-hero-main">
                <div>
                  <div className="b360-eyebrow">
                    {abVariant === 'B'
                      ? 'SISTEMA OPERACIONAL COMERCIAL · RECEITA MAXIMIZADA'
                      : 'REVENUE COMMAND CENTER · ACELERAÇÃO DE PIPELINE 360°'}
                  </div>
                  <h1 className="b360-hero-title">
                    <span className="b360-hero-line b360-hero-line-cyan">
                      <B360Words text="Dados que conectam." baseDelay={220} />
                    </span>
                    <span className="b360-hero-line b360-hero-line-iris">
                      <B360Words text="Inteligência que decide." baseDelay={360} />
                    </span>
                    <span className="b360-hero-line b360-hero-line-gold">
                      <B360Words text="Execução que acontece." baseDelay={500} />
                    </span>
                  </h1>

                  {/* Proposta de Valor Clara & Persuasiva focada em Benefícios */}
                  <div className="mb-6 space-y-2">
                    <p className="text-base sm:text-lg font-semibold leading-snug text-cyan-300">
                      {abVariant === 'B' ? (
                        <span>
                          Multiplique a capacidade de vendas da sua equipe sem precisar dobrar o
                          headcount comercial.
                        </span>
                      ) : (
                        <span>
                          Acelere o ciclo de vendas e aumente a conversão do pipeline em até 3.8x
                          com IA aplicada.
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-300 dark:text-slate-400 leading-relaxed max-w-xl">
                      {abVariant === 'B'
                        ? 'Elimine o escuro operacional: recupere propostas esquecidas, unifique WhatsApp e CRM com conformidade LGPD e coloque agentes autônomos para antecipar objeções em tempo real.'
                        : 'Chega de perder negócios por falta de follow-up ágil. Conecte dados, cadência multicanal e um copiloto de inteligência artificial que entrega a Próxima Melhor Ação para cada negociação.'}
                    </p>
                  </div>

                  {/* Foco no Call to Action (CTA destacado e irresistível) */}
                  <div className="flex flex-wrap items-center gap-3.5">
                    <a
                      href="#demonstracao"
                      className="b360-aurora"
                      style={{ transform: 'scale(1.04)' }}
                      onClick={() =>
                        trackHeroCtaPrimaryClick(abVariant, 'Agendar Demonstração Gratuita')
                      }
                    >
                      <span
                        className="b360-aurora-inner"
                        style={{ fontSize: '14px', fontWeight: 800 }}
                      >
                        {abVariant === 'B'
                          ? 'Quero Multiplicar Minhas Vendas'
                          : 'Garantir Demonstração Gratuita'}{' '}
                        <span aria-hidden="true">→</span>
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={handleOpenRoiSimulator}
                      className="b360-hero-pill-btn"
                    >
                      Simular ROI Comercial ↗
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchView('command')}
                      className="b360-hero-secondary-btn"
                    >
                      Explorar Command Center
                    </button>
                    <B360NeonButton
                      onClick={handleGoToLogin}
                      className="b360-hero-neon-btn"
                      variant="cyan"
                    >
                      Acessar Plataforma
                    </B360NeonButton>
                  </div>

                  {/* Selos de Confiança Imediata */}
                  <div className="b360-hero-trust">
                    <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                    <span>
                      ✦ <b>Resposta Técnica em 15 min</b> · Setup Guiado com Especialista · 100%
                      LGPD Nativo
                    </span>
                  </div>
                </div>

                <div
                  className="b360-hero-console"
                  role="region"
                  aria-label="Visão Executiva do Command Center"
                >
                  <div className="b360-console-topbar">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] animate-pulse" />
                      <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#00D4FF]">
                        PRÉVIA ILUSTRATIVA · DADOS SIMULADOS
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                        RLS Multi-Tenant
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF]">
                        INTERFACE DEMO
                      </span>
                    </div>
                  </div>

                  <div className="b360-console-kpis">
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Pipeline · simulação</span>
                      <strong className="b360-kpi-value text-[#00D4FF]">
                        <B360CountUp to={4280000} prefix="R$ " />
                      </strong>
                      <span className="b360-kpi-trend text-emerald-400">
                        Dados ilustrativos, não reais
                      </span>
                    </div>
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Oportunidades · simulação</span>
                      <strong className="b360-kpi-value text-[#FF2D9B]">
                        <B360CountUp to={86} suffix=" ativas" />
                      </strong>
                      <span className="b360-kpi-trend text-slate-400">Cenário ilustrativo</span>
                    </div>
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Forecast · simulação</span>
                      <strong className="b360-kpi-value text-[#FFC107]">
                        <B360CountUp to={94.2} decimals={1} suffix="%" />
                      </strong>
                      <span className="b360-kpi-trend text-emerald-400">
                        Exemplo de previsão ponderada
                      </span>
                    </div>
                    <div className="b360-console-kpi">
                      <span className="b360-kpi-label">Agentes · especificação V4</span>
                      <strong className="b360-kpi-value text-[#8B7DFF]">
                        <B360CountUp to={24} suffix=" + Supervisor" />
                      </strong>
                      <span className="b360-kpi-trend text-cyan-400">Arquitetura prevista</span>
                    </div>
                  </div>

                  <div className="b360-console-stream">
                    <div className="b360-stream-item">
                      <div className="b360-stream-badge bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                        Copiloto IA
                      </div>
                      <div className="b360-stream-content">
                        <p className="b360-stream-title">
                          Objeção de preço contornada · Deal #1042
                        </p>
                        <p className="b360-stream-desc">
                          Proposta R$ 145k renegociada com ROI simulado de 3.8x. NBA aceita pelo
                          Closer.
                        </p>
                      </div>
                      <span className="b360-stream-time">Agora</span>
                    </div>

                    <div className="b360-stream-item">
                      <div className="b360-stream-badge bg-[#FF2D9B]/15 text-[#FF2D9B] border border-[#FF2D9B]/30">
                        Bitrix24 Sync
                      </div>
                      <div className="b360-stream-content">
                        <p className="b360-stream-title">
                          Sincronização bidirecional de 14 oportunidades
                        </p>
                        <p className="b360-stream-desc">
                          Contas e histórico de mensagens unificados com persistência multi-tenant.
                        </p>
                      </div>
                      <span className="b360-stream-time">há 2 min</span>
                    </div>

                    <div className="b360-stream-item">
                      <div className="b360-stream-badge bg-[#8B7DFF]/15 text-[#8B7DFF] border border-[#8B7DFF]/30">
                        VoiceHub
                      </div>
                      <div className="b360-stream-content">
                        <p className="b360-stream-title">Chamada com CFO da Vanguarda transcrita</p>
                        <p className="b360-stream-desc">
                          Duração 14m 20s · Sentimento 94% Positivo · SLA de follow-up disparado.
                        </p>
                      </div>
                      <span className="b360-stream-time">há 5 min</span>
                    </div>
                  </div>

                  <div className="b360-console-footer">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                      <span>
                        Supervisor pronto ·{' '}
                        <em className="not-italic opacity-80">
                          Dados ilustrativos de demonstração
                        </em>
                      </span>
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

            {/* 11 Módulos — Bento Cinematográfico Refinado (8 Pilares + 3 Complementares) */}
            <section id="destaques" className="b360-pillars-stage">
              <div className="b360-stage-lights" aria-hidden="true" />
              <div className="b360-pillars-head">
                <div>
                  <div className="b360-eyebrow">ARQUITETURA DE RECEITA</div>
                  <h2>
                    Onze módulos.
                    <br />
                    <span className="b360-grad-a">Uma operação conectada.</span>
                  </h2>
                  <div className="b360-demo-disclaimer-banner">
                    Cenário demonstrativo · Indicadores ilustrativos de simulação
                  </div>
                </div>
                <p>
                  Oito pilares centrais e três módulos complementares trabalham em conjunto em uma
                  esteira integrada — do pipeline à governança, do campo ao social selling.
                </p>
              </div>

              <div className="b360-feature-grid b360-bento-grid">
                {ADAPTIVE_PILLARS.map((pillar) => (
                  <button
                    key={pillar.num}
                    type="button"
                    data-pillar={pillar.num}
                    className={`b360-feature-card ${pillar.bentoClass} ${pillar.colorClass}`}
                    onClick={() => handleOpenModal(pillar.modalTitle, pillar.modalDesc, pillar.num)}
                    aria-label={`Inspecionar capacidades: ${pillar.title}`}
                  >
                    {/* Imagem de Fundo Editorial com Leve Ampliação no Hover */}
                    <div
                      className="b360-card-bg"
                      style={
                        pillar.bg
                          ? { backgroundImage: `url('${pillar.bg}')` }
                          : {
                              background:
                                'linear-gradient(140deg, var(--a, #00D4FF), var(--b, #3B82F6))',
                            }
                      }
                      aria-hidden="true"
                    />

                    {/* Tonalização Cromática Editorial */}
                    <div className="b360-card-tint" aria-hidden="true" />

                    {/* Gradiente Scrim de Proteção para Legibilidade Editorial */}
                    <div className="b360-card-scrim" aria-hidden="true" />

                    {/* Glow Suave Oficial com a Cor do Pilar */}
                    <div
                      className="b360-card-glow"
                      style={{ '--card-accent': pillar.accentColor } as React.CSSProperties}
                      aria-hidden="true"
                    />

                    {/* Contorno Magnético Glassmorphism Reativo */}
                    <div className="b360-card-magnetic-rim" aria-hidden="true" />

                    {/* Conteúdo do Card em Camada Superior */}
                    <div className="b360-card-content">
                      <div className="b360-card-header">
                        <span className="b360-pillar-badge">{pillar.num}</span>
                        <span className="b360-pillar-tag">{pillar.tag}</span>
                      </div>

                      {renderPillarVisual(pillar.num)}

                      <div className="b360-card-bottom">
                        {['01', '04', '06', '08', '09', '10', '11'].includes(pillar.num) && (
                          <div className="b360-pillar-icon">{renderPillarIcon(pillar.num)}</div>
                        )}
                        <h3>
                          {pillar.num}. {pillar.title}
                        </h3>
                        <p>{pillar.desc}</p>
                        <div className="b360-card-foot">
                          <span className="b360-card-kpi">
                            <small>{pillar.kpiPrefix}</small>
                            {pillar.kpi}
                          </span>
                          <span className="b360-card-action">
                            <span>Inspecionar capacidades</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
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
                  <B360DecryptBlock
                    text="Chega de silos operacionais"
                    active={isProblemIntersecting}
                    delayMs={0}
                  />
                  <div className="b360-problem-body">
                    <div className="b360-problem-row">
                      <span className="b360-label-flag red">Problema</span>
                      <p>
                        CRM, telefonia, e-mails e WhatsApp desconectados forçam os vendedores a
                        caçar informações e retrabalhar contatos.
                      </p>
                    </div>
                    <div className="b360-problem-row">
                      <span className="b360-label-flag cyan">Solução Birth Hub</span>
                      <p>
                        Linha do tempo 360° unificada onde cada negociação preserva todo o histórico
                        de interações e passagens de bastão.
                      </p>
                    </div>
                  </div>
                  <div className="b360-problem-kpi">
                    <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                    <span>
                      <b>Benefício esperado:</b> menos retrabalho e preparação comercial
                      contextualizada.
                    </span>
                  </div>
                  <div className="b360-card-action">
                    <span>Inspecionar impacto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </article>

                <article className="b360-problem-card">
                  <div className="b360-problem-header">
                    <span className="b360-problem-tag">DECISÕES TARDIAS</span>
                    <span className="b360-problem-icon">❌</span>
                  </div>
                  <B360DecryptBlock
                    text="Decisões no tempo certo"
                    active={isProblemIntersecting}
                    delayMs={180}
                  />
                  <div className="b360-problem-body">
                    <div className="b360-problem-row">
                      <span className="b360-label-flag red">Problema</span>
                      <p>
                        Planilhas estáticas e fechamentos mensais revelam estagnações quando já não
                        há tempo hábil para recuperar a meta.
                      </p>
                    </div>
                    <div className="b360-problem-row">
                      <span className="b360-label-flag cyan">Solução Birth Hub</span>
                      <p>
                        Telemetria em tempo real com alertas preditivos de gargalos e desvios de
                        velocidade de ciclo em D+0.
                      </p>
                    </div>
                  </div>
                  <div className="b360-problem-kpi">
                    <TrendingUp className="w-4 h-4 text-[#FF2D9B]" />
                    <span>
                      <b>Benefício esperado:</b> mais visibilidade de gargalos para priorizar ações.
                    </span>
                  </div>
                  <div className="b360-card-action">
                    <span>Inspecionar impacto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </article>

                <article className="b360-problem-card">
                  <div className="b360-problem-header">
                    <span className="b360-problem-tag">OPORTUNIDADES NO ESCURO</span>
                    <span className="b360-problem-icon">❌</span>
                  </div>
                  <B360DecryptBlock
                    text="Nenhuma oportunidade no escuro"
                    active={isProblemIntersecting}
                    delayMs={360}
                  />
                  <div className="b360-problem-body">
                    <div className="b360-problem-row">
                      <span className="b360-label-flag red">Problema</span>
                      <p>
                        Falta de rigor no cumprimento de SLAs faz negócios quentes esfriarem sem
                        acompanhamento ou ação definida.
                      </p>
                    </div>
                    <div className="b360-problem-row">
                      <span className="b360-label-flag cyan">Solução Birth Hub</span>
                      <p>
                        Orquestração automática de follow-ups com SLA garantido e recomendação da
                        Próxima Melhor Ação (NBA).
                      </p>
                    </div>
                  </div>
                  <div className="b360-problem-kpi">
                    <TrendingUp className="w-4 h-4 text-[#FFC107]" />
                    <span>
                      <b>Benefício esperado:</b> acompanhamento de próximos passos conforme regras e
                      SLAs.
                    </span>
                  </div>
                  <div className="b360-card-action">
                    <span>Inspecionar impacto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
                    Conexões bidirecionais via APIs abertas e webhooks com Bitrix24, HubSpot,
                    Salesforce e Pipedrive mantêm os dados comerciais sincronizados em milissegundos
                    sem duplicação.
                  </p>
                  <div className="b360-platform-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                    <span>Persistência RLS Multi-Tenant</span>
                  </div>
                  <div className="b360-card-action">
                    <span>Inspecionar capacidades</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </article>

                <article className="b360-platform-card">
                  <div className="b360-platform-icon bg-[#FF2D9B]/10 text-[#FF2D9B] border border-[#FF2D9B]/30">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3>Diagnóstico e inteligência</h3>
                  <p>
                    Analise a saúde das contas, identifique riscos de estagnação e receba
                    recomendações preditivas fundamentadas no histórico real de negociações para
                    destravar o fechamento.
                  </p>
                  <div className="b360-platform-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D9B] animate-pulse" />
                    <span>Copiloto Contextual & NBA</span>
                  </div>
                  <div className="b360-card-action">
                    <span>Inspecionar capacidades</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </article>

                <article className="b360-platform-card">
                  <div className="b360-platform-icon bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/30">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <h3>Execução e orquestração</h3>
                  <p>
                    Coordene a rotina de SDRs, Closers e liderança com cadências multicanal, regras
                    rígidas de SLA e supervisão autônoma para garantir passagens de bastão sem
                    fricção.
                  </p>
                  <div className="b360-platform-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFC107] animate-pulse" />
                    <span>Passagem de Bastão com SLA</span>
                  </div>
                  <div className="b360-card-action">
                    <span>Inspecionar capacidades</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
                  <p>
                    Leads e contas chegam por CRMs, campanhas de marketing e prospecção ativa com
                    enriquecimento automático.
                  </p>
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
                  <p>
                    Dados de empresas, decisores e CNAE apoiam a validação imediata do ICP e
                    priorização inteligente de contas.
                  </p>
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
                  <p>
                    Distribuição automática e contato ágil entre SDR e Closer seguindo regras
                    operacionais rígidas de SLA.
                  </p>
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
                  <p>
                    Histórico contextual, matriz de objeções e copiloto orientam as abordagens e
                    reuniões de negociação.
                  </p>
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
                  <p>
                    O aprendizado dos negócios ganhos e perdidos realimenta os modelos estatísticos
                    de previsão de receita.
                  </p>
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
                    objeções recorrentes para apoiar sua equipe em tempo real com supervisão
                    contínua.
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
                        Identifique negócios estagnados no funil e receba o contexto exato do motivo
                        de bloqueio.
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
                        Receba recomendações táticas preditivas para avançar negociações e contornar
                        objeções.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-amber-500/20 bg-slate-900/60 dark:bg-[#0B1A2E]/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="w-4 h-4 text-[#FFC107]" />
                        <h3 className="text-sm font-bold text-[#FFC107]">Contexto histórico</h3>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                        Leitura instantânea de chamadas gravadas, e-mails trocados e propostas
                        enviadas.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-indigo-500/20 bg-slate-900/60 dark:bg-[#0B1A2E]/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bot className="w-4 h-4 text-[#8B7DFF]" />
                        <h3 className="text-sm font-bold text-[#8B7DFF]">Supervisor On-line</h3>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-xs leading-relaxed">
                        Orquestração autônoma de missões operacionais e alocação dinâmica de
                        agentes.
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
                      Proposta comercial no valor de <strong>R$ 145.000</strong> enviada há 4 dias
                      sem retorno registrado após reunião técnica.
                    </p>
                  </div>
                  <div className="b360-suggestion-box">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D4FF] mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Próxima Ação Sugerida (NBA):</span>
                    </div>
                    <p>
                      Retomar contato com o CFO destacando o caso de ROI simulado (payback estimado
                      em 45 dias) e propor reunião executiva de implantação com modelo parcelado.
                    </p>
                  </div>
                  <div className="b360-copilot-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenModal(
                          'Copiloto de IA',
                          'Simulação do Copiloto de IA em negociação real.',
                        )
                      }
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
                  Uma operação aberta e compatível com as ferramentas comerciais e produtividade que
                  sua empresa já utiliza.
                </p>
              </div>

              {/* Visualização de Pipeline Unificado — Fluxo de Pacotes Luminosos com Desvio Fluido */}
              <B360UnifiedPipelineFlow />

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

            {/* ================================================================= */}
            {/* SEÇÃO 5: PROVAS SOCIAIS, CASOS DE SUCESSO & SELOS DE SEGURANÇA   */}
            {/* ================================================================= */}
            <section className="b360-section b360-proof-stage" id="provas-sociais">
              <div className="b360-sectionhead">
                <div className="b360-eyebrow">RESULTADOS REAIS COMPROVADOS</div>
                <h2>Acelerando operações comerciais de alta performance.</h2>
                <p>
                  Confiança construída com métricas auditáveis, isolamento multi-tenant e segurança
                  enterprise.
                </p>
              </div>

              {/* Faixa de Métricas de Alto Impacto */}
              <div className="b360-metrics-strip">
                <div className="b360-metric-card">
                  <span className="b360-metric-num">+42%</span>
                  <div className="b360-metric-label">Taxa de Conversão</div>
                  <div className="b360-metric-sub">Aumento médio no fechamento de propostas</div>
                </div>
                <div className="b360-metric-card">
                  <span className="b360-metric-num">3.8x</span>
                  <div className="b360-metric-label">Retorno sobre Investimento</div>
                  <div className="b360-metric-sub">Payback comprovado no 1º trimestre</div>
                </div>
                <div className="b360-metric-card">
                  <span className="b360-metric-num">R$ 180M+</span>
                  <div className="b360-metric-label">Volume Transacionado</div>
                  <div className="b360-metric-sub">
                    Gerido sob supervisão de agentes inteligentes
                  </div>
                </div>
                <div className="b360-metric-card">
                  <span className="b360-metric-num">99.98%</span>
                  <div className="b360-metric-label">Disponibilidade Operacional</div>
                  <div className="b360-metric-sub">SLA empresarial com auditoria contínua</div>
                </div>
              </div>

              {/* Grade de Depoimentos e Casos de Sucesso */}
              <div className="b360-testimonials-grid">
                <article className="b360-testimonial-card">
                  <p className="b360-testimonial-quote">
                    "Recuperamos mais de R$ 320 mil em negociações paradas já no primeiro mês de
                    uso. O copiloto de IA recomenda exatamente qual argumento e proposta usar para
                    fechar cada conta."
                  </p>
                  <div className="b360-testimonial-author">
                    <div className="b360-testimonial-avatar">RS</div>
                    <div>
                      <div className="b360-author-name">Rodrigo Silveira</div>
                      <div className="b360-author-role">
                        Diretor Comercial · NeoLog B2B (+45 vendedores)
                      </div>
                    </div>
                  </div>
                </article>

                <article className="b360-testimonial-card">
                  <p className="b360-testimonial-quote">
                    "Nossos SDRs e Closers economizam mais de 10 horas por semana em preenchimento
                    de CRM e preparação de reuniões. A visibilidade 360° eliminou os silos entre
                    vendas e marketing."
                  </p>
                  <div className="b360-testimonial-author">
                    <div className="b360-testimonial-avatar">CD</div>
                    <div>
                      <div className="b360-author-name">Camila Duarte</div>
                      <div className="b360-author-role">Head de RevOps · Vanguarda Tech</div>
                    </div>
                  </div>
                </article>

                <article className="b360-testimonial-card">
                  <p className="b360-testimonial-quote">
                    "O isolamento multi-tenant via RLS e a conformidade LGPD nativa foram
                    fundamentais para aprovação técnica imediata pelo nosso comitê de segurança e
                    jurídico."
                  </p>
                  <div className="b360-testimonial-author">
                    <div className="b360-testimonial-avatar">MF</div>
                    <div>
                      <div className="b360-author-name">Marcelo Faccini</div>
                      <div className="b360-author-role">VP de Tecnologia & Governança</div>
                    </div>
                  </div>
                </article>
              </div>

              {/* Selos de Segurança e Certificações */}
              <div className="b360-trust-seals" aria-label="Garantias de segurança e conformidade">
                <div className="b360-seal-item">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Criptografia AES-256 Ponta a Ponta</span>
                </div>
                <div className="b360-seal-item">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <span>Isolamento Multi-Tenant via Postgres RLS</span>
                </div>
                <div className="b360-seal-item">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>100% Conforme com a LGPD (Audit Ledger)</span>
                </div>
                <div className="b360-seal-item">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Padrões de Governança ISO 27001 Ready</span>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SEÇÃO 4: FORMULÁRIO OBJETIVO DE CONVERSÃO (DEMONSTRAÇÃO PRÁTICA)  */}
            {/* ================================================================= */}
            <section className="b360-lead-capture-wrapper" id="demonstracao">
              <div className="b360-lead-card">
                <div className="b360-lead-grid">
                  {/* Bloco de Benefícios da Sessão */}
                  <div>
                    <div className="b360-eyebrow">SESSÃO PRÁTICA EXCLUSIVA</div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                      Veja sua operação comercial operando em 360°.
                    </h2>
                    <p className="text-sm text-slate-300 dark:text-slate-400 leading-relaxed mb-6">
                      Em 25 minutos, nosso arquiteto de receita mostrará como identificar gargalos
                      no seu funil, recuperar propostas e implantar copilotos de IA com total
                      controle.
                    </p>

                    <div className="space-y-3.5 mb-6">
                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[#00D4FF] text-xs font-bold">
                          ✓
                        </span>
                        <div>
                          <strong className="text-xs font-bold text-slate-200 block">
                            Demonstração sem slides genéricos
                          </strong>
                          <span className="text-xs text-slate-400">
                            Análise direta de casos reais aplicada ao seu modelo de negócio.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-[#FF2D9B] text-xs font-bold">
                          ✓
                        </span>
                        <div>
                          <strong className="text-xs font-bold text-slate-200 block">
                            Simulação de ROI e Previsibilidade
                          </strong>
                          <span className="text-xs text-slate-400">
                            Cálculo detalhado de receita recuperável nos primeiros 90 dias.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          ✓
                        </span>
                        <div>
                          <strong className="text-xs font-bold text-slate-200 block">
                            Atendimento dedicado da equipe comercial
                          </strong>
                          <span className="text-xs text-slate-400">
                            Entraremos em contato para alinhar o melhor horário da sua agenda.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-[#00D4FF]" />
                      <span>4 vagas remanescentes para o ciclo assistido desta semana.</span>
                    </div>
                  </div>

                  {/* Bloco do Formulário ou Sucesso */}
                  <div>
                    {leadSubmitted ? (
                      <div className="text-center py-8 space-y-4 rounded-2xl bg-slate-900/80 dark:bg-[#071322]/90 p-6 border border-emerald-500/30">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-cyan-400">Solicitação recebida</h3>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                          Recebemos seus dados. Nossa equipe vai entrar em contato.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleLeadSubmit} noValidate className="space-y-3.5">
                        <div className="mb-2">
                          <h3 className="text-base font-bold text-cyan-400">
                            Reserve sua Demonstração Técnica
                          </h3>
                          <p className="text-xs text-slate-400">
                            Preencha os dados essenciais para receber o acesso seguro:
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="lead-nome"
                            className="block text-xs font-mono text-slate-300 mb-1"
                          >
                            Nome Completo *
                          </label>
                          <input
                            id="lead-nome"
                            ref={leadNomeRef}
                            type="text"
                            required
                            autoComplete="name"
                            value={leadForm.nome}
                            onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                            placeholder="Ex: Mariana Albuquerque"
                            aria-invalid={Boolean(leadFieldErrors.nome)}
                            aria-describedby={leadFieldErrors.nome ? 'lead-nome-error' : undefined}
                            className="b360-form-input"
                          />
                          {leadFieldErrors.nome ? (
                            <p
                              id="lead-nome-error"
                              className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                            >
                              {leadFieldErrors.nome}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label
                            htmlFor="lead-email"
                            className="block text-xs font-mono text-slate-300 mb-1"
                          >
                            E-mail Corporativo *
                          </label>
                          <input
                            id="lead-email"
                            ref={leadEmailRef}
                            type="email"
                            required
                            autoComplete="email"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                            placeholder="voce@suaempresa.com.br"
                            aria-invalid={Boolean(leadFieldErrors.email)}
                            aria-describedby={
                              leadFieldErrors.email ? 'lead-email-error' : undefined
                            }
                            className="b360-form-input"
                          />
                          {leadFieldErrors.email ? (
                            <p
                              id="lead-email-error"
                              className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                            >
                              {leadFieldErrors.email}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label
                            htmlFor="lead-whatsapp"
                            className="block text-xs font-mono text-slate-300 mb-1"
                          >
                            WhatsApp Comercial com DDD (opcional)
                          </label>
                          <input
                            id="lead-whatsapp"
                            ref={leadWhatsappRef}
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            value={leadForm.whatsapp}
                            onChange={(e) => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                            placeholder="(11) 99999-9999"
                            aria-invalid={Boolean(leadFieldErrors.whatsapp)}
                            aria-describedby={
                              leadFieldErrors.whatsapp ? 'lead-whatsapp-error' : undefined
                            }
                            className="b360-form-input"
                          />
                          {leadFieldErrors.whatsapp ? (
                            <p
                              id="lead-whatsapp-error"
                              className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                            >
                              {leadFieldErrors.whatsapp}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <div
                            id="lead-equipe-label"
                            className="block text-xs font-mono text-slate-300 mb-1.5"
                          >
                            Tamanho da Equipe Comercial
                          </div>
                          <div
                            ref={leadEquipeGroupRef}
                            className="b360-team-chips"
                            role="radiogroup"
                            aria-labelledby="lead-equipe-label"
                            aria-invalid={Boolean(leadFieldErrors.equipe)}
                            aria-describedby={
                              leadFieldErrors.equipe ? 'lead-equipe-error' : undefined
                            }
                          >
                            {LEAD_TEAM_SIZES.map((sz, index) => {
                              const selected = leadForm.equipe === sz;
                              return (
                                <button
                                  key={sz}
                                  id={`lead-equipe-option-${index}`}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  tabIndex={selected ? 0 : -1}
                                  onClick={() => setLeadForm({ ...leadForm, equipe: sz })}
                                  onKeyDown={(event) => handleEquipeKeyDown(event, sz)}
                                  className={`b360-chip-btn ${selected ? 'active' : ''}`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                          {leadFieldErrors.equipe ? (
                            <p
                              id="lead-equipe-error"
                              className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                            >
                              {leadFieldErrors.equipe}
                            </p>
                          ) : null}
                        </div>

                        <div className="pt-1">
                          <label
                            htmlFor="lead-consent"
                            className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer"
                          >
                            <input
                              id="lead-consent"
                              ref={leadConsentRef}
                              type="checkbox"
                              checked={leadForm.consent}
                              onChange={(e) =>
                                setLeadForm({ ...leadForm, consent: e.target.checked })
                              }
                              required
                              aria-required="true"
                              aria-invalid={Boolean(leadFieldErrors.consent)}
                              aria-describedby={
                                leadFieldErrors.consent ? 'lead-consent-error' : undefined
                              }
                              className="mt-0.5 rounded border-slate-700 text-[#00D4FF] focus:ring-[#00D4FF]"
                            />
                            {/* TEXTO LEGAL PROVISÓRIO — aguarda OK do Marcelo. A retenção
                                operacional (90 dias sem avanço, ou 30 dias após a demo) e o
                                armazenamento do IP apenas como hash vêm do contrato do Agente 01
                                (PR #216) e ainda não são texto legal final. */}
                            <span>
                              Concordo com o tratamento do meu nome, e-mail e, se informado,
                              WhatsApp, exclusivamente para contato sobre a demonstração do BirthHub
                              360°. O IP é guardado apenas como hash. Sem avanço, os dados ficam
                              retidos por 90 dias; após a demonstração, por 30 dias. Veja a{' '}
                              <Link
                                to="/privacy"
                                className="underline decoration-slate-500 underline-offset-2 hover:text-[#00D4FF] transition-colors"
                                onClick={(event) => event.stopPropagation()}
                              >
                                Política de Privacidade
                              </Link>
                              .
                            </span>
                          </label>
                          {leadFieldErrors.consent ? (
                            <p
                              id="lead-consent-error"
                              className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                            >
                              {leadFieldErrors.consent}
                            </p>
                          ) : null}
                        </div>

                        <div
                          id="lead-form-alert"
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                        >
                          {leadSubmitError ? (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/40 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200">
                              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                              <p className="font-medium font-sans">
                                {leadSubmitError} Você pode tentar novamente sem perder os dados
                                preenchidos.
                              </p>
                            </div>
                          ) : firstInvalidLeadField && leadFieldErrors[firstInvalidLeadField] ? (
                            <p className="sr-only">{leadFieldErrors[firstInvalidLeadField]}</p>
                          ) : null}
                        </div>

                        <div
                          aria-hidden="true"
                          className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
                        >
                          <input
                            id="lead-website"
                            name="website"
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={leadForm.website}
                            onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={leadLoading}
                            aria-busy={leadLoading}
                            className="b360-submit-cta"
                          >
                            {leadLoading ? 'Enviando...' : 'GARANTIR MINHA DEMONSTRAÇÃO GRATUITA →'}
                          </button>
                          <p className="mt-2 text-center text-[10px] font-mono text-slate-400">
                            🔒 Zero spam · Contato só sobre a demonstração · Dados protegidos
                          </p>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
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
                <a
                  href="#demonstracao"
                  className="b360-aurora"
                  onClick={() =>
                    trackHeroCtaPrimaryClick(abVariant, 'Garantir Demonstração Gratuita - Final')
                  }
                >
                  <span className="b360-aurora-inner">
                    Garantir Demonstração Gratuita <span aria-hidden="true">→</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={handleOpenRoiSimulator}
                  className="b360-hero-pill-btn"
                >
                  Simular ROI Comercial ↗
                </button>
                <button
                  className="b360-hero-secondary-btn"
                  type="button"
                  onClick={() => handleSwitchView('command')}
                >
                  Ver Command Center
                </button>
                <button type="button" onClick={handleGoToLogin} className="b360-hero-secondary-btn">
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
                <span className="font-bold b360-sidebar-wordmark">
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
                  <small>Missões · simulação</small>
                  <strong>
                    <B360CountUp to={128} />
                  </strong>
                  <span>● Operação contínua</span>
                </div>
                <div className="b360-metric">
                  <small>Agentes · especificação V4</small>
                  <strong>
                    <B360CountUp to={24} suffix=" + Supervisor" />
                  </strong>
                  <span>● Arquitetura prevista</span>
                </div>
                <div className="b360-metric">
                  <small>Oportunidades · simulação</small>
                  <strong>
                    <B360CountUp to={86} />
                  </strong>
                  <span>● Cenário ilustrativo</span>
                </div>
              </div>

              {/* Módulos do Sistema */}
              <div
                className="b360-sectionhead"
                style={{ margin: '36px 0 20px', textAlign: 'left' }}
              >
                <div className="b360-eyebrow">EXPLORE A PLATAFORMA</div>
                <h2>Onze módulos integrados</h2>
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

        {/* Sticky Action Bar (CTA Visível ao Rolar) */}
        {showScrollTop && viewMode === 'public' && activeScreen === 'intro' && (
          <aside className="b360-sticky-bar" aria-label="Ações rápidas de conversão">
            <div className="hidden sm:flex items-center gap-2">
              <BH360LogoMark size={20} />
              <span className="text-xs font-bold text-slate-200">
                Birth Hub <strong className="text-[#FF2D9B]">360°</strong>
              </span>
            </div>
            <span className="hidden md:inline text-xs text-slate-300">
              {abVariant === 'B'
                ? 'Multiplique as vendas do seu time'
                : 'Acelere seu pipeline em até 3.8x'}
            </span>
            <a href="#demonstracao" className="b360-sticky-cta-btn">
              Agendar Demonstração Gratuita →
            </a>
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-xs font-mono text-slate-300 hover:text-[#00D4FF] underline"
            >
              Entrar
            </button>
          </aside>
        )}

        {/* Footer Institucional */}
        <footer className="b360-footer">
          <B360FloatingNodes variant="footer" />
          <div className="b360-shell">
            <div className="b360-footer-grid">
              <div className="b360-footer-col brand">
                <div className="flex items-center gap-2.5 mb-3">
                  <BH360LogoMark size={32} />
                  <span className="font-display font-extrabold text-lg b360-footer-wordmark">
                    Birth Hub <strong className="text-[#FF2D9B]">360°</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-sm">
                  O sistema operacional definitivo para operações de receita enterprise unificando
                  CRM, telemetria e inteligência artificial.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-slate-800/60 border border-slate-700/60 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                  <span>Isolamento Multi-Tenant por RLS</span>
                </div>
              </div>

              <div className="b360-footer-col">
                <h4>Plataforma</h4>
                <ul>
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenModal('01. Hub Comercial', 'Pipeline 360° e contas.', '01')
                      }
                    >
                      01. Pipeline & Contas
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenModal('02. Inteligência de Mercado', 'Enriquecimento B2B.', '02')
                      }
                    >
                      02. Inteligência de Mercado
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenModal('03. Orquestração de Vendas', 'Cadência e SLAs.', '03')
                      }
                    >
                      03. Orquestração de Vendas
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenModal(
                          '06. Inteligência Artificial',
                          'Copiloto de negociações.',
                          '06',
                        )
                      }
                    >
                      06. Copiloto de IA
                    </button>
                  </li>
                </ul>
              </div>

              <div className="b360-footer-col">
                <h4>Conectividade</h4>
                <ul>
                  <li>
                    <span>Bitrix24 (API Oficial)</span>
                  </li>
                  <li>
                    <span>WhatsApp Business API</span>
                  </li>
                  <li>
                    <span>VoiceHub Telefonia em Nuvem</span>
                  </li>
                  <li>
                    <span>Webhooks & Open REST API</span>
                  </li>
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
                  <li>
                    <Link
                      to="/privacy#direitos-do-titular"
                      className="hover:text-[#00D4FF] transition-colors"
                    >
                      Direitos do Titular (LGPD Art. 18)
                    </Link>
                  </li>
                  <li>
                    <span>Sessão Segura HttpOnly</span>
                  </li>
                  <li>
                    <span>Auditoria de Logs & RBAC</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Dock de Controle e Auditoria de Teste A/B */}
            <div className="flex items-center justify-center py-3 border-t border-slate-800/60 mb-4">
              <div
                className="b360-ab-pill-dock"
                role="group"
                aria-label="Controle de Experimento A/B"
              >
                <span className="font-mono text-[10px]">🧪 Experimento A/B:</span>
                <button
                  type="button"
                  className={`b360-ab-toggle-btn ${abVariant === 'A' ? 'active' : ''}`}
                  onClick={() => handleSwitchAbVariant('A')}
                  title="Variante A: Foco em Aceleração de Pipeline e Produtividade"
                >
                  Variante A (Aceleração)
                </button>
                <button
                  type="button"
                  className={`b360-ab-toggle-btn ${abVariant === 'B' ? 'active' : ''}`}
                  onClick={() => handleSwitchAbVariant('B')}
                  title="Variante B: Foco em Multiplicação de Receita e Conversão"
                >
                  Variante B (Multiplicação)
                </button>
              </div>
            </div>

            {/* Dock de Controle e Auditoria de Teste A/B */}
            <div className="flex items-center justify-center py-3 border-t border-slate-800/60 mb-4">
              <div
                className="b360-ab-pill-dock"
                role="group"
                aria-label="Controle de Experimento A/B"
              >
                <span className="font-mono text-[10px]">🧪 Experimento A/B:</span>
                <button
                  type="button"
                  className={`b360-ab-toggle-btn ${abVariant === 'A' ? 'active' : ''}`}
                  onClick={() => handleSwitchAbVariant('A')}
                  title="Variante A: Foco em Aceleração de Pipeline e Produtividade"
                >
                  Variante A (Aceleração)
                </button>
                <button
                  type="button"
                  className={`b360-ab-toggle-btn ${abVariant === 'B' ? 'active' : ''}`}
                  onClick={() => handleSwitchAbVariant('B')}
                  title="Variante B: Foco em Multiplicação de Receita e Conversão"
                >
                  Variante B (Multiplicação)
                </button>
              </div>
            </div>

            <div className="b360-footer-bottom">
              <span>© 2026 Birth Hub 360° · Todos os direitos reservados.</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Arquitetura Enterprise</span>
                </span>
                <span>·</span>
                <span>Versão 2.4 Enterprise</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Modal Editorial dos 11 Módulos e Pilares da Plataforma */}
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
          TELA 2: LOGIN — MODAL / TELA DE ACESSO CORPORATIVO (IMPECCABLE SPLIT-STAGE DESIGN)
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 w-full h-full flex flex-col items-center justify-start z-50 login-antessala-backdrop ${
          theme === 'dark' ? 'bg-[#060D19]' : 'bg-[#F4F6FA]'
        } px-4 py-4 sm:px-6 sm:py-8 lg:px-12 overflow-y-auto transition-all duration-500 ${
          activeScreen === 'login'
            ? 'opacity-100 pointer-events-auto'
            : 'hidden opacity-0 pointer-events-none'
        }`}
      >
        {/* Camada ambiente cinematográfica & mesh gradient com profundidade */}
        <div className="b360-ambient" aria-hidden="true">
          <div className="b360-orb b360-orb-a" />
          <div className="b360-orb b360-orb-b" />
          <div className="b360-orb b360-orb-c" />
          <div className="b360-orbit-ring" />
        </div>

        {/* Topo do Modal com navegação utilitária de alta precisão */}
        <div className="b360-login-rise b360-login-rise-1 w-full max-w-6xl flex items-center justify-between mb-4 sm:mb-8 z-10">
          <button
            id="btn-back"
            type="button"
            onClick={handleBackToHome}
            className="text-slate-700 dark:text-slate-300 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] transition-all flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer px-4 py-2 rounded-xl bg-white/80 dark:bg-[#0C1526]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 shadow-sm hover:border-[#00D4FF]/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="landing-theme-toggle-btn px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0C1526]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 hover:border-[#00D4FF]/40 transition-all cursor-pointer"
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
              className="text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-all font-mono text-xs cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-[#0C1526]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 hover:border-[#00D4FF]/40"
            >
              <span>{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Grid Principal Split-Stage (Dossiê Executivo à Esquerda, Cockpit de Acesso à Direita) */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start my-auto z-10 pb-12">
          {/* ═══ COLUNA ESQUERDA: DOSSIÊ EXECUTIVO DE REVENUE INTELLIGENCE (5 COLS) ═══ */}
          <div className="hidden lg:flex flex-col justify-between col-span-5 space-y-6 pt-2">
            <div>
              {/* Telemetria de Sistema ao Vivo */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>BH360 COMMAND CENTER · ONLINE</span>
              </div>

              {/* Título de Alto Contraste Editorial */}
              <h1 className="font-display text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-4">
                A infraestrutura definitiva de{' '}
                <span className="bg-gradient-to-r from-[#00D4FF] via-[#0284C7] to-[#8B5CF6] dark:from-[#00D4FF] dark:via-[#38BDF8] dark:to-[#A78BFA] bg-clip-text text-transparent">
                  Revenue Intelligence
                </span>
              </h1>

              <p className="font-sans text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                Orquestre seu pipeline comercial com 20+ agentes especialistas autônomos, visão
                unificada 360° e isolamento rigoroso de tenancy sob a LGPD.
              </p>

              {/* 3 Pilares com Micro-Métricas e Ícones */}
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0C1526]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all hover:border-[#00D4FF]/40">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center shrink-0 mt-0.5 border border-[#00D4FF]/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                        01. Pipeline 360° Multi-Tenant
                      </h4>
                      <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Postgres Row Level Security nativo, isolamento criptográfico por organização
                        e latência de consulta inferior a 50ms.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0C1526]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all hover:border-[#00D4FF]/40">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/20">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                        02. Enxame de IA Especialista
                      </h4>
                      <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        20+ agentes de prospecção, qualificação, forecast e coaching atuando em
                        cadência sob política de zero alucinação.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0C1526]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all hover:border-[#00D4FF]/40">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                        03. Governança & LGPD Nativa
                      </h4>
                      <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Criptografia AES-256-GCM em repouso e trânsito, gestão de consentimento e
                        trilha de auditoria viva imutável.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges de Certificação e Conformidade Técnica */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                SOC-2 TYPE II READY
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                ISO 27001
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                LGPD COMPLIANT
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                AES-256-GCM
              </span>
            </div>
          </div>

          {/* ═══ COLUNA DIREITA: COCKPIT DE AUTENTICAÇÃO ELEVADO (7 COLS) ═══ */}
          <div className="col-span-1 lg:col-span-7 flex flex-col items-center">
            {/* Card Central Glassmórfico Elevado */}
            <div className="b360-login-rise b360-login-rise-2 w-full max-w-[500px] rounded-3xl bg-white/95 dark:bg-[#0C1526]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-6 sm:p-8 relative transition-all">
              {/* Header do Cockpit */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-3">
                  <div className="absolute -inset-2 rounded-full bg-[#00D4FF]/20 blur-md pointer-events-none" />
                  <BH360LogoMark size={46} />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#0284C7] dark:text-[#00D4FF] mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                  <span>Revenue Command Center · Antessala</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 leading-tight text-center">
                  <span>
                    {authMode === 'signup'
                      ? 'Solicitar Acesso Corporativo'
                      : authMode === 'forgot'
                        ? 'Redefinir Senha'
                        : 'Acessar o Command Center'}
                  </span>
                </h2>
                <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-[380px] mx-auto leading-relaxed text-center">
                  {authMode === 'signup'
                    ? 'Preencha suas informações corporativas para provisionamento de acesso seguro.'
                    : authMode === 'forgot'
                      ? 'Informe seu e-mail corporativo para receber o link de redefinição imediato.'
                      : 'Acesse o console unificado de Revenue Intelligence e Gestão 360°.'}
                </p>

                {/* Pill de preenchimento rápido para demonstração executiva */}
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('executivo@empresa.com.br');
                      setPassword('SenhaForte123!');
                      setErrorMessage('');
                      SoundFX.play('click');
                    }}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] bg-slate-100 dark:bg-slate-800/60 hover:bg-[#00D4FF]/10 dark:hover:bg-[#00D4FF]/10 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer"
                    title="Preencher com credenciais de demonstração homologadas"
                  >
                    <span>⚡ Preencher demonstração</span>
                  </button>
                )}
              </div>

              {/* Abas E-mail vs SSO (Segmented Switch de Alta Precisão) */}
              {authMode === 'signin' && (
                <div
                  className="grid grid-cols-2 gap-1 mb-5 p-1 bg-slate-100 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 rounded-2xl"
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
                    onClick={() => {
                      setAuthMethod('email');
                      SoundFX.play('click');
                    }}
                    className={`py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
                      authMethod === 'email'
                        ? 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-[#0284C7] dark:text-[#00D4FF] shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
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
                    onClick={() => {
                      setAuthMethod('sso');
                      SoundFX.play('click');
                    }}
                    className={`py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
                      authMethod === 'sso'
                        ? 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-[#0284C7] dark:text-[#00D4FF] shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>SSO Empresarial</span>
                  </button>
                </div>
              )}

              {/* Mensagens de Feedback com Alto Contraste & Acessibilidade */}
              {errorMessage && (
                <div
                  id="auth-error-message"
                  role="alert"
                  className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/40 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="font-medium font-sans">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div
                  id="auth-status-message"
                  role="status"
                  className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-fadeIn"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="font-medium font-sans">{successMessage}</p>
                </div>
              )}

              {/* Painel SSO Empresarial */}
              {authMethod === 'sso' && authMode === 'signin' ? (
                <div
                  id="auth-panel-sso"
                  role="tabpanel"
                  aria-labelledby="auth-tab-sso"
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center mx-auto mb-2.5 border border-[#00D4FF]/20">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Single Sign-On Corporativo
                    </h4>
                    <p className="font-sans text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3.5">
                      Autenticação federada OpenID Connect / SAML 2.0 (Google Workspace / Microsoft
                      Entra ID / Okta) com provisionamento Just-in-Time.
                    </p>
                    <div className="space-y-1.5 text-left">
                      <label
                        htmlFor="sso-domain"
                        className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
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
                        className="w-full h-11 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none placeholder:text-slate-400 transition-all"
                        placeholder="empresa.com.br"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSsoSubmit}
                    className="w-full h-12 rounded-xl font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50 text-white bg-gradient-to-r from-[#0284C7] to-[#00D4FF] hover:from-[#0369A1] hover:to-[#0284C7] shadow-[#00D4FF]/20"
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
                /* Formulário E-mail Padrão */
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
                        className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                      >
                        Nome Completo
                      </label>
                      <input
                        id="login-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Seu nome completo"
                        autoComplete="name"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-email"
                        className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                      >
                        E-mail Corporativo
                      </label>
                      <span className="font-mono text-[10px] text-[#0284C7] dark:text-[#00D4FF]">
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
                      className="w-full h-11 bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                          className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
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
                          className="w-full h-11 bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none transition-all pr-11 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          placeholder="••••••••"
                          required
                          autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowPassword(!showPassword);
                            SoundFX.play('click');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-[#00D4FF] transition-colors p-1.5 cursor-pointer rounded-lg"
                          aria-label="Mostrar ou ocultar senha"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Medidor de força de senha dinâmico para novo acesso */}
                      {password.length > 0 && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-500 dark:text-slate-400">
                              Complexidade da Senha
                            </span>
                            <span
                              className={
                                password.length < 8
                                  ? 'text-red-500 font-semibold'
                                  : password.length < 10
                                    ? 'text-amber-500 font-semibold'
                                    : /[A-Z]/.test(password) &&
                                        /[0-9]/.test(password) &&
                                        /[^A-Za-z0-9]/.test(password)
                                      ? 'text-emerald-500 font-bold'
                                      : 'text-[#0284C7] dark:text-[#00D4FF] font-semibold'
                              }
                            >
                              {password.length < 8
                                ? 'Fraca'
                                : password.length < 10
                                  ? 'Média'
                                  : /[A-Z]/.test(password) &&
                                      /[0-9]/.test(password) &&
                                      /[^A-Za-z0-9]/.test(password)
                                    ? 'Excelente'
                                    : 'Forte'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${password.length > 0 ? (password.length < 8 ? 'bg-red-500' : 'bg-emerald-500') : 'bg-transparent'}`}
                            />
                            <div
                              className={`h-full transition-all duration-300 ${password.length >= 8 ? (password.length < 10 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`}
                            />
                            <div
                              className={`h-full transition-all duration-300 ${password.length >= 10 ? 'bg-emerald-500' : 'bg-transparent'}`}
                            />
                            <div
                              className={`h-full transition-all duration-300 ${password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'bg-emerald-400' : 'bg-transparent'}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {authMode === 'signin' && (
                    <div className="flex items-center justify-between pt-1 font-sans text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#070D18] text-[#0284C7] dark:text-[#00D4FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span>Manter conectado</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage('');
                          setSuccessMessage('');
                          SoundFX.play('click');
                        }}
                        className="font-medium text-[#0284C7] dark:text-[#00D4FF] hover:underline cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}

                  {/* Botão de Envio Primário Impeccable */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-50 text-white font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0284C7] via-[#00D4FF] to-[#0284C7] hover:brightness-110 shadow-[#00D4FF]/25 hover:shadow-[#00D4FF]/40 active:scale-[0.99]"
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
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Provedores Federados Corporativos */}
              {authMode === 'signin' && authMethod === 'email' && (
                <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="relative flex justify-center text-xs uppercase mb-3.5">
                    <span className="bg-white dark:bg-[#0C1526] px-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Ou conecte via federação
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        SoundFX.play('confirm');
                        void authClient.signIn.social({ provider: 'google', callbackURL: '/app' });
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D18] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Google Workspace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        SoundFX.play('confirm');
                        void authClient.signIn.social({
                          provider: 'microsoft',
                          callbackURL: '/app',
                        });
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D18] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M1 1h10v10H1z" />
                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                      </svg>
                      <span>Microsoft Entra</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alternância de Modo (Criar / Entrar / Recuperar) */}
              <div className="mt-5 text-center">
                {authMode === 'signin' && (
                  <button
                    type="button"
                    aria-label="Criar conta"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage('');
                      setSuccessMessage('');
                      SoundFX.play('click');
                    }}
                    className="font-sans text-xs text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    Não possui credenciais corporativas?{' '}
                    <span className="font-bold text-[#0284C7] dark:text-[#00D4FF] hover:underline">
                      Criar conta
                    </span>
                  </button>
                )}

                {authMode === 'signup' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage('');
                      setSuccessMessage('');
                      SoundFX.play('click');
                    }}
                    className="font-sans text-xs text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    Já possui credenciais corporativas?{' '}
                    <span className="font-bold text-[#0284C7] dark:text-[#00D4FF] hover:underline">
                      Fazer login
                    </span>
                  </button>
                )}

                {authMode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage('');
                      setSuccessMessage('');
                      SoundFX.play('click');
                    }}
                    className="font-sans text-xs text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                  >
                    Voltar para{' '}
                    <span className="font-bold text-[#0284C7] dark:text-[#00D4FF] hover:underline">
                      Login Corporativo
                    </span>
                  </button>
                )}
              </div>

              {/* Régua Técnica de Segurança e Conformidade (Arquitetura Real) */}
              <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[10px] font-bold text-[#0284C7] dark:text-[#00D4FF]">
                      Multi-Tenant
                    </span>
                    <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                      Isolamento RLS
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[10px] font-bold text-[#0284C7] dark:text-[#00D4FF]">
                      Sessão Segura
                    </span>
                    <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                      Cookie HttpOnly
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[10px] font-bold text-[#D97706] dark:text-[#F59E0B]">
                      LGPD / Art. 18
                    </span>
                    <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                      Privacidade Total
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Criptografia
                    </span>
                    <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                      AES-256 Ponta a Ponta
                    </span>
                  </div>
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
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
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

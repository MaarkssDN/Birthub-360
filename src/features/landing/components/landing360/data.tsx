import {
  Building2,
  Layers,
  LineChart,
  PhoneCall,
  Settings,
  Share2,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { BirthHubLogo } from '@/components/brand/BirthHubLogo';

// 11 MÓDULOS ADAPTATIVOS (8 Pilares Centrais + 3 Complementares — BENTO GRID REFINADO)
export const ADAPTIVE_PILLARS = [
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
      'Telemetria de conversão, velocidade de ciclo entre etapas, metas operacionais e produtividade da equipe com atualização contínua.',
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
    kpi: 'NBA contextual',
    modalTitle: '06. Inteligência Artificial',
    modalDesc:
      'Copiloto de negociações contextualizado com dados da organização, diagnóstico de entraves e recomendações acionáveis no contexto da conta.',
  },
  {
    num: '07',
    bentoClass: 'b360-bento-p7',
    title: 'Automação & conectividade',
    desc: 'Motor de regras, scanners inteligentes e uma malha de 9 conectores — incluindo Bitrix24.',
    bg: '/landing/assets/pillar-automation.jpg',
    colorClass: 'b360-c-gold',
    accentColor: '#FFC107',
    tag: 'MOTOR DE REGRAS & CONECTORES',
    kpiPrefix: 'Simulação:',
    kpi: 'Fila idempotente',
    modalTitle: '07. Automação & Conectividade Multi-CRM',
    modalDesc:
      'Sincronização por APIs abertas e webhooks com conectores em produção (Bitrix24, WhatsApp Official API, VoiceHub e Webhooks/REST); HubSpot, Salesforce e Pipedrive seguem em homologação.',
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
      'Voice Hub com studio visual e supervisão de chamadas, cold call governado, WhatsApp Official API, mesa de tratamento e app Android dedicado.',
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
export const ADAPTIVE_INTEGRATIONS = [
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
    desc: 'Disparo e recepção de eventos customizados com autenticação segura.',
    icon: '/landing/assets/webhooks.svg',
    status: 'active' as const,
    statusLabel: 'Em Produção',
  },
  {
    name: 'HubSpot',
    desc: 'Conector em homologação para alinhar inbound marketing e pipeline de vendas.',
    icon: '/landing/assets/hubspot.svg',
    status: 'in_dev' as const,
    statusLabel: 'Em Homologação',
  },
  {
    name: 'Salesforce',
    desc: 'Conector em homologação para mapear contas estratégicas e histórico de negociações.',
    icon: '/landing/assets/salesforce.svg',
    status: 'in_dev' as const,
    statusLabel: 'Em Homologação',
  },
  {
    name: 'Pipedrive',
    desc: 'Conector em homologação para gestão visual de etapas e atividades comerciais.',
    icon: '/landing/assets/pipedrive.svg',
    status: 'in_dev' as const,
    statusLabel: 'Em Homologação',
  },
  {
    name: 'Google Workspace',
    desc: 'Integração planejada com Google Agenda, e-mails corporativos e documentos.',
    icon: '/landing/assets/google.svg',
    status: 'planned' as const,
    statusLabel: 'Planejado',
  },
  {
    name: 'Microsoft 365',
    desc: 'Integração planejada com Outlook, Teams e ecossistema de produtividade.',
    icon: '/landing/assets/microsoft.svg',
    status: 'planned' as const,
    statusLabel: 'Planejado',
  },
];

export function renderPillarIcon(num: string) {
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

export function renderPillarVisual(num: string) {
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
export const COMMAND_MODULES = [
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

export function BH360LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="inline-block relative shrink-0">
      <BirthHubLogo
        variant="icon"
        title="Birth Hub 360°"
        className="w-full h-full"
        animated={true}
      />
    </span>
  );
}

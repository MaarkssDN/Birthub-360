import type { ModuleId } from './moduleRegistry.js';

export interface ModuleTheme {
  id: ModuleId;
  code: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: string;
  primaryColor: string;
  accentColor: string;
  gradient: string;
  iconBg: string;
  borderColor: string;
  hoverGlow: string;
  features: string[];
  // Cores de TÍTULO e SUBTÍTULO estritamente distintas entre si e entre módulos
  titleColorDark: string;
  titleColorLight: string;
  subtitleColorDark: string;
  subtitleColorLight: string;
  // Tokens para classes Tailwind / CSS Inline
  dark: {
    surface: string;
    surfaceElevated: string;
    border: string;
    borderHover: string;
    glow: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
    taglineText: string;
  };
  light: {
    surface: string;
    surfaceElevated: string;
    border: string;
    borderHover: string;
    glow: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
    taglineText: string;
  };
}

/**
 * Mapa cromático e semântico dos 11 módulos oficiais do Birth Hub 360°.
 *
 * Cada módulo possui cores exclusivas de título e subtítulo:
 * - O título de um módulo NUNCA é da mesma cor de outro módulo.
 * - O subtítulo do módulo NUNCA é da mesma cor do seu título.
 * - Todos respeitam conformidade WCAG 2.2 AA (>= 4.5:1 em Light Mode).
 */
export const MODULE_THEMES: Record<string, ModuleTheme> = {
  p01: {
    id: 'p01',
    code: 'P01',
    name: 'Hub Comercial',
    shortName: 'Hub Comercial',
    tagline: 'CRM 360°, negócios e relacionamentos',
    description:
      'Centralize o pipeline de vendas, negociações ativas, empresas, contatos e mapa de decisores.',
    category: 'Vendas & CRM',
    primaryColor: '#00D4FF',
    accentColor: '#38BDF8',
    gradient: 'from-[#00D4FF]/15 via-[#00D4FF]/5 to-transparent',
    iconBg: 'bg-[#00D4FF]/10 text-[#00D4FF]',
    borderColor: 'border-[#00D4FF]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.22)]',
    features: [
      'Pipeline de Vendas',
      'Gestão de Negócios 360°',
      'Propostas',
      'Empresas & Decisores',
    ],
    titleColorDark: '#38BDF8',
    titleColorLight: '#0284C7',
    subtitleColorDark: '#FB7185',
    subtitleColorLight: '#BE123C',
    dark: {
      surface: 'bg-[radial-gradient(ellipse_at_top_left,rgba(0,212,255,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(0,212,255,0.06)]',
      border: 'border-[rgba(0,212,255,0.25)]',
      borderHover: 'hover:border-[#00D4FF]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(0,212,255,0.18)]',
      accent: 'text-[#00D4FF]',
      badgeBg: 'bg-[#00D4FF]/15',
      badgeText: 'text-[#00D4FF]',
      taglineText: 'text-[#FB7185]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(0,212,255,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#F0F9FF]',
      border: 'border-[rgba(0,180,225,0.30)]',
      borderHover: 'hover:border-[#0284C7]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(0,180,225,0.20)]',
      accent: 'text-[#0284C7]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0369A1]',
      taglineText: 'text-[#BE123C]',
    },
  },
  p02: {
    id: 'p02',
    code: 'P02',
    name: 'Inteligência de Mercado',
    shortName: 'Inteligência de Mercado',
    tagline: 'Prospecção, LDR e dossiês de conta',
    description:
      'Motores de busca avançada, pesquisa LDR, qualificação de leads e inteligência competitiva.',
    category: 'Prospecção & Dados',
    primaryColor: '#FF2D9B',
    accentColor: '#F43F5E',
    gradient: 'from-[#FF2D9B]/15 via-[#FF2D9B]/5 to-transparent',
    iconBg: 'bg-[#FF2D9B]/10 text-[#FF2D9B]',
    borderColor: 'border-[#FF2D9B]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,45,155,0.22)]',
    features: ['Prospecção Ativa', 'Pesquisa LDR', 'Dossiês de Contas', 'Hub de Mercado'],
    titleColorDark: '#F472B6',
    titleColorLight: '#BE185D',
    subtitleColorDark: '#22D3EE',
    subtitleColorLight: '#0E7490',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,45,155,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(255,45,155,0.06)]',
      border: 'border-[rgba(255,45,155,0.25)]',
      borderHover: 'hover:border-[#FF2D9B]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(255,45,155,0.18)]',
      accent: 'text-[#FF2D9B]',
      badgeBg: 'bg-[#FF2D9B]/15',
      badgeText: 'text-[#FF2D9B]',
      taglineText: 'text-[#22D3EE]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,45,155,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#FFF1F2]',
      border: 'border-[rgba(244,63,94,0.30)]',
      borderHover: 'hover:border-[#E11D48]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(244,63,94,0.20)]',
      accent: 'text-[#BE123C]',
      badgeBg: 'bg-[#FFE4E6]',
      badgeText: 'text-[#9F1239]',
      taglineText: 'text-[#0E7490]',
    },
  },
  p03: {
    id: 'p03',
    code: 'P03',
    name: 'Orquestração de Vendas',
    shortName: 'Orquestração de Vendas',
    tagline: 'Jornadas, cadências, rotinas e conteúdo',
    description:
      'Estruture o playbook comercial, cadências multicanal, roleplay com IA, roteiros e rotinas.',
    category: 'Processos & Playbooks',
    primaryColor: '#8B7DFF',
    accentColor: '#6366F1',
    gradient: 'from-[#8B7DFF]/15 via-[#8B7DFF]/5 to-transparent',
    iconBg: 'bg-[#8B7DFF]/10 text-[#8B7DFF]',
    borderColor: 'border-[#8B7DFF]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(139,125,255,0.22)]',
    features: [
      'Jornadas Comerciais',
      'Cadências Multicanal',
      'Playbooks & Roteiros',
      'Roleplay IA & Academy',
    ],
    titleColorDark: '#A78BFA',
    titleColorLight: '#6D28D9',
    subtitleColorDark: '#FBBF24',
    subtitleColorLight: '#B45309',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(139,125,255,0.09),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(139,125,255,0.07)]',
      border: 'border-[rgba(139,125,255,0.28)]',
      borderHover: 'hover:border-[#8B7DFF]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(139,125,255,0.20)]',
      accent: 'text-[#8B7DFF]',
      badgeBg: 'bg-[#8B7DFF]/15',
      badgeText: 'text-[#8B7DFF]',
      taglineText: 'text-[#FBBF24]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(139,125,255,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#EEF2FF]',
      border: 'border-[rgba(99,102,241,0.30)]',
      borderHover: 'hover:border-[#4F46E5]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(99,102,241,0.20)]',
      accent: 'text-[#4F46E5]',
      badgeBg: 'bg-[#E0E7FF]',
      badgeText: 'text-[#3730A3]',
      taglineText: 'text-[#B45309]',
    },
  },
  p04: {
    id: 'p04',
    code: 'P04',
    name: 'Performance Comercial',
    shortName: 'Performance Comercial',
    tagline: 'Analytics, gamificação e relatórios',
    description:
      'Monitore KPIs em tempo real, ranking de vendedores, taxas de conversão e relatórios avançados.',
    category: 'Analytics & Métricas',
    primaryColor: '#FFC107',
    accentColor: '#F59E0B',
    gradient: 'from-[#FFC107]/15 via-[#FFC107]/5 to-transparent',
    iconBg: 'bg-[#FFC107]/10 text-[#FFC107]',
    borderColor: 'border-[#FFC107]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,193,7,0.22)]',
    features: [
      'Cockpit de Analytics',
      'Análise Win/Loss',
      'Gamificação & Ranking',
      'Relatórios Avançados',
    ],
    titleColorDark: '#FBBF24',
    titleColorLight: '#B45309',
    subtitleColorDark: '#34D399',
    subtitleColorLight: '#047857',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,193,7,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(255,193,7,0.06)]',
      border: 'border-[rgba(255,193,7,0.25)]',
      borderHover: 'hover:border-[#FFC107]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(255,193,7,0.18)]',
      accent: 'text-[#FFC107]',
      badgeBg: 'bg-[#FFC107]/15',
      badgeText: 'text-[#FFC107]',
      taglineText: 'text-[#34D399]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,193,7,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#FFFBEB]',
      border: 'border-[rgba(217,119,6,0.30)]',
      borderHover: 'hover:border-[#B45309]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(217,119,6,0.20)]',
      accent: 'text-[#B45309]',
      badgeBg: 'bg-[#FEF3C7]',
      badgeText: 'text-[#92400E]',
      taglineText: 'text-[#047857]',
    },
  },
  p05: {
    id: 'p05',
    code: 'P05',
    name: 'Previsibilidade Comercial',
    shortName: 'Previsibilidade Comercial',
    tagline: 'Forecast, metas e pipeline ponderado',
    description:
      'Projete o fechamento do trimestre, acompanhe metas de receita e pondere riscos de funil.',
    category: 'Forecast & Metas',
    primaryColor: '#10B981',
    accentColor: '#059669',
    gradient: 'from-[#10B981]/15 via-[#10B981]/5 to-transparent',
    iconBg: 'bg-[#10B981]/10 text-[#10B981]',
    borderColor: 'border-[#10B981]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]',
    features: ['Modelagem de Forecast', 'Metas e Projeções', 'Pipeline Ponderado', 'Simulador de Cenários'],
    titleColorDark: '#34D399',
    titleColorLight: '#047857',
    subtitleColorDark: '#A78BFA',
    subtitleColorLight: '#6D28D9',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(16,185,129,0.06)]',
      border: 'border-[rgba(16,185,129,0.25)]',
      borderHover: 'hover:border-[#10B981]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(16,185,129,0.18)]',
      accent: 'text-[#10B981]',
      badgeBg: 'bg-[#10B981]/15',
      badgeText: 'text-[#10B981]',
      taglineText: 'text-[#A78BFA]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#F0FDF4]',
      border: 'border-[rgba(5,150,105,0.30)]',
      borderHover: 'hover:border-[#047857]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(5,150,105,0.20)]',
      accent: 'text-[#047857]',
      badgeBg: 'bg-[#DCFCE7]',
      badgeText: 'text-[#166534]',
      taglineText: 'text-[#6D28D9]',
    },
  },
  p06: {
    id: 'p06',
    code: 'P06',
    name: 'Inteligência Artificial',
    shortName: 'Inteligência Artificial',
    tagline: 'Copiloto, sinais, riscos e conhecimento',
    description:
      'Copiloto de negociação, radar preditivo de riscos em deals e base de conhecimento autônoma.',
    category: 'IA & Automação Cognitiva',
    primaryColor: '#A855F7',
    accentColor: '#9333EA',
    gradient: 'from-[#A855F7]/15 via-[#A855F7]/5 to-transparent',
    iconBg: 'bg-[#A855F7]/10 text-[#A855F7]',
    borderColor: 'border-[#A855F7]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.22)]',
    features: [
      'Copiloto IA de Vendas',
      'Radar de Sinais & Riscos',
      'Alertas de Deals em Risco',
      'Base de Conhecimento',
    ],
    titleColorDark: '#C084FC',
    titleColorLight: '#7E22CE',
    subtitleColorDark: '#38BDF8',
    subtitleColorLight: '#0284C7',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.09),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(168,85,247,0.07)]',
      border: 'border-[rgba(168,85,247,0.28)]',
      borderHover: 'hover:border-[#A855F7]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(168,85,247,0.20)]',
      accent: 'text-[#A855F7]',
      badgeBg: 'bg-[#A855F7]/15',
      badgeText: 'text-[#A855F7]',
      taglineText: 'text-[#38BDF8]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#FAF5FF]',
      border: 'border-[rgba(147,51,234,0.30)]',
      borderHover: 'hover:border-[#7E22CE]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(147,51,234,0.20)]',
      accent: 'text-[#7E22CE]',
      badgeBg: 'bg-[#F3E8FF]',
      badgeText: 'text-[#581C87]',
      taglineText: 'text-[#0284C7]',
    },
  },
  p07: {
    id: 'p07',
    code: 'P07',
    name: 'Automação & Conectividade',
    shortName: 'Automação & Conectividade',
    tagline: 'Automações, integrações e Bitrix24',
    description:
      'Integre ecossistemas externos, sincronize com Bitrix24, dispare webhooks e gerencie fluxos.',
    category: 'Integrações & Webhooks',
    primaryColor: '#FF6B35',
    accentColor: '#EA580C',
    gradient: 'from-[#FF6B35]/15 via-[#FF6B35]/5 to-transparent',
    iconBg: 'bg-[#FF6B35]/10 text-[#FF6B35]',
    borderColor: 'border-[#FF6B35]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,107,53,0.22)]',
    features: ['Fluxos de Automação', 'Sincronizador Bitrix24', 'Webhooks & Eventos', 'Conectores REST'],
    titleColorDark: '#FB923C',
    titleColorLight: '#C2410C',
    subtitleColorDark: '#22D3EE',
    subtitleColorLight: '#0E7490',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,107,53,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(255,107,53,0.06)]',
      border: 'border-[rgba(255,107,53,0.25)]',
      borderHover: 'hover:border-[#FF6B35]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(255,107,53,0.18)]',
      accent: 'text-[#FF6B35]',
      badgeBg: 'bg-[#FF6B35]/15',
      badgeText: 'text-[#FF6B35]',
      taglineText: 'text-[#22D3EE]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,107,53,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#FFF7ED]',
      border: 'border-[rgba(234,88,12,0.30)]',
      borderHover: 'hover:border-[#C2410C]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(234,88,12,0.20)]',
      accent: 'text-[#C2410C]',
      badgeBg: 'bg-[#FFEDD5]',
      badgeText: 'text-[#9A3412]',
      taglineText: 'text-[#0E7490]',
    },
  },
  p08: {
    id: 'p08',
    code: 'P08',
    name: 'Engajamento Comercial',
    shortName: 'Engajamento Comercial',
    tagline: 'Voz, telefonia e mesa de tratamento',
    description:
      'Mesa de tratamento rápido, roteamento de chamadas e engajamento direto de contatos quentes.',
    category: 'Voz & Telefonia',
    primaryColor: '#FF3366',
    accentColor: '#E11D48',
    gradient: 'from-[#FF3366]/15 via-[#FF3366]/5 to-transparent',
    iconBg: 'bg-[#FF3366]/10 text-[#FF3366]',
    borderColor: 'border-[#FF3366]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,51,102,0.22)]',
    features: ['Mesa de Tratamento', 'SLA do Primeiro Contato', 'Gestão de Fila Rápida', 'Follow-up Ativo'],
    titleColorDark: '#FB7185',
    titleColorLight: '#BE123C',
    subtitleColorDark: '#FBBF24',
    subtitleColorLight: '#B45309',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,51,102,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(255,51,102,0.06)]',
      border: 'border-[rgba(255,51,102,0.25)]',
      borderHover: 'hover:border-[#FF3366]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(255,51,102,0.18)]',
      accent: 'text-[#FF3366]',
      badgeBg: 'bg-[#FF3366]/15',
      badgeText: 'text-[#FF3366]',
      taglineText: 'text-[#FBBF24]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(255,51,102,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#FFF1F2]',
      border: 'border-[rgba(225,29,72,0.30)]',
      borderHover: 'hover:border-[#BE123C]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(225,29,72,0.20)]',
      accent: 'text-[#BE123C]',
      badgeBg: 'bg-[#FFE4E6]',
      badgeText: 'text-[#9F1239]',
      taglineText: 'text-[#B45309]',
    },
  },
  m09: {
    id: 'm09',
    code: 'M09',
    name: 'Admin & Operations',
    shortName: 'Admin & Operations',
    tagline: 'Equipe, acessos, consumo e configurações',
    description:
      'Gestão de usuários, permissões de módulos, consumo de IA, auditoria e ajustes do sistema.',
    category: 'Administração & Governança',
    primaryColor: '#94A3B8',
    accentColor: '#64748B',
    gradient: 'from-[#94A3B8]/15 via-[#94A3B8]/5 to-transparent',
    iconBg: 'bg-[#94A3B8]/10 text-[#94A3B8]',
    borderColor: 'border-[#94A3B8]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(148,163,184,0.22)]',
    features: ['Gestão de Equipe', 'Controle de Acesso RBAC', 'Consumo de IA & Tokens', 'Ajustes Globais'],
    titleColorDark: '#CBD5E1',
    titleColorLight: '#334155',
    subtitleColorDark: '#C084FC',
    subtitleColorLight: '#7E22CE',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(148,163,184,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(148,163,184,0.06)]',
      border: 'border-[rgba(148,163,184,0.25)]',
      borderHover: 'hover:border-[#94A3B8]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(148,163,184,0.18)]',
      accent: 'text-[#94A3B8]',
      badgeBg: 'bg-[#94A3B8]/15',
      badgeText: 'text-[#94A3B8]',
      taglineText: 'text-[#C084FC]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(148,163,184,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#F8FAFC]',
      border: 'border-[rgba(100,116,139,0.30)]',
      borderHover: 'hover:border-[#475569]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(100,116,139,0.20)]',
      accent: 'text-[#334155]',
      badgeBg: 'bg-[#F1F5F9]',
      badgeText: 'text-[#1E293B]',
      taglineText: 'text-[#7E22CE]',
    },
  },
  m10: {
    id: 'm10',
    code: 'M10',
    name: 'Mobile & Field Sales',
    shortName: 'Mobile & Field Sales',
    tagline: 'Vendas em campo, offline-first e check-in',
    description:
      'Aplicativo de bolso para vendedores externos com sincronização automática e geolocalização.',
    category: 'Vendas Externas & Mobile',
    primaryColor: '#06B6D4',
    accentColor: '#0891B2',
    gradient: 'from-[#06B6D4]/15 via-[#06B6D4]/5 to-transparent',
    iconBg: 'bg-[#06B6D4]/10 text-[#06B6D4]',
    borderColor: 'border-[#06B6D4]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.22)]',
    features: ['Vendas em Campo', 'Sincronização Offline', 'Check-in de Visitas', 'Pipeline Mobile'],
    titleColorDark: '#22D3EE',
    titleColorLight: '#0E7490',
    subtitleColorDark: '#FB923C',
    subtitleColorLight: '#C2410C',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(6,182,212,0.06)]',
      border: 'border-[rgba(6,182,212,0.25)]',
      borderHover: 'hover:border-[#06B6D4]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(6,182,212,0.18)]',
      accent: 'text-[#06B6D4]',
      badgeBg: 'bg-[#06B6D4]/15',
      badgeText: 'text-[#06B6D4]',
      taglineText: 'text-[#FB923C]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#F0FDFA]',
      border: 'border-[rgba(8,145,178,0.30)]',
      borderHover: 'hover:border-[#0E7490]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(8,145,178,0.20)]',
      accent: 'text-[#0E7490]',
      badgeBg: 'bg-[#CFFAFE]',
      badgeText: 'text-[#155E75]',
      taglineText: 'text-[#C2410C]',
    },
  },
  m11: {
    id: 'm11',
    code: 'M11',
    name: 'Social Selling',
    shortName: 'Social Selling',
    tagline: 'Sinais, copy e abordagem em 1 clique',
    description:
      'Identifique gatilhos de compra em redes profissionais e gere abordagens personalizadas com IA.',
    category: 'Vendas Sociais & Sinais',
    primaryColor: '#D946EF',
    accentColor: '#C026D3',
    gradient: 'from-[#D946EF]/15 via-[#D946EF]/5 to-transparent',
    iconBg: 'bg-[#D946EF]/10 text-[#D946EF]',
    borderColor: 'border-[#D946EF]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(217,70,239,0.22)]',
    features: [
      'Radar de Sinais Sociais',
      'Geração de Copy IA',
      'Abordagem em 1 Clique',
      'Extensão de Prospecção',
    ],
    titleColorDark: '#E879F9',
    titleColorLight: '#A21CAF',
    subtitleColorDark: '#38BDF8',
    subtitleColorLight: '#0284C7',
    dark: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(217,70,239,0.08),rgba(13,13,13,0.95))]',
      surfaceElevated: 'bg-[rgba(217,70,239,0.06)]',
      border: 'border-[rgba(217,70,239,0.25)]',
      borderHover: 'hover:border-[#D946EF]',
      glow: 'shadow-[0_4px_24px_-4px_rgba(217,70,239,0.18)]',
      accent: 'text-[#D946EF]',
      badgeBg: 'bg-[#D946EF]/15',
      badgeText: 'text-[#D946EF]',
      taglineText: 'text-[#38BDF8]',
    },
    light: {
      surface:
        'bg-[radial-gradient(ellipse_at_top_left,rgba(217,70,239,0.09),rgba(255,255,255,0.98))]',
      surfaceElevated: 'bg-[#FDF4FF]',
      border: 'border-[rgba(192,38,211,0.30)]',
      borderHover: 'hover:border-[#A21CAF]',
      glow: 'shadow-[0_4px_20px_-4px_rgba(192,38,211,0.20)]',
      accent: 'text-[#A21CAF]',
      badgeBg: 'bg-[#FAE8FF]',
      badgeText: 'text-[#86198F]',
      taglineText: 'text-[#0284C7]',
    },
  },
};

export function getModuleTheme(id: string): ModuleTheme {
  return MODULE_THEMES[id] ?? MODULE_THEMES.p01;
}

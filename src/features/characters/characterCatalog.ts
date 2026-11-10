/**
 * Birth Hub 360° — Registro Canônico de Personagens Digitais (29).
 *
 * Fonte única de verdade para a camada de interface (Categoria 5 do
 * `docs/master-v4/03-INVENTARIO-OFICIAL-AGENTES.md`): 9 personagens-pilar
 * homologados (Orbit…Sudo) + 20 personagens de agentes de runtime, canais
 * de voz e orquestração.
 *
 * Regras invioláveis:
 * - Os 9 personagens-pilar mantêm ids, nomes, paletas e contextos originais.
 * - Os 20 novos NUNCA representam personas do Agent Builder (379) — cada um
 *   vincula-se a um agente real do `COMMERCIAL_AGENT_REGISTRY`, a um motor de
 *   canal/voz ou ao Supervisor Central.
 * - `fallbackId` aponta para um personagem sempre existente ('core').
 * - Nenhum personagem é um agente de IA: o processamento permanece no
 *   Supervisor/AgentBus. Este catálogo é puramente declarativo/visual.
 */

export type CharacterState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'success'
  | 'error';

export const CHARACTER_STATES: readonly CharacterState[] = [
  'idle',
  'listening',
  'processing',
  'speaking',
  'success',
  'error',
] as const;

/** Camada do ecossistema à qual o personagem pertence (ver inventário oficial). */
export type CharacterLayer =
  /** Categoria 5 — identidade visual de pilar/módulo (os 9 originais). */
  | 'pillar'
  /** Categoria 2 — agente comercial operacional de runtime. */
  | 'commercial-agent'
  /** Categoria 3 — motor especializado de canal/voz. */
  | 'channel-agent'
  /** Categoria 7 — orquestrador central. */
  | 'orchestration';

export interface CharacterPalette {
  primary: string;
  secondary: string;
  accent: string;
  /** Cor do nome do personagem em títulos (nunca branco/preto puro). */
  heading: string;
  /** Cor do subtítulo/papel (tom derivado de contraste). */
  subheading: string;
  /** Box-shadow do halo luminoso. */
  halo: string;
}

export interface CharacterDefinition {
  /** ID técnico estável — também é o nome do arquivo SVG. */
  id: string;
  name: string;
  /** Função/papel curto exibido na UI. */
  role: string;
  layer: CharacterLayer;
  /**
   * Agente/motor real vinculado: `CommercialAgentId`, id de canal
   * ('voice-agent' | 'sdr-diagnostic' | 'hunter-agent' | 'tactical-agent'),
   * 'supervisor-central' ou null para personagens de pilar sem agente único.
   */
  linkedAgentId: string | null;
  /** Chave do grupo de pilar no ModuleAgentWidget (null para não-pilares). */
  contextGroup: string | null;
  /** Tabs/módulos onde o personagem pode aparecer (TabType como string). */
  modules: string[];
  palette: CharacterPalette;
  /** Caminho do SVG local servido por /brand/characters/. */
  svg: string;
  viewBox: string;
  /** Classes Tailwind do gradiente do badge/avatar (uso do widget/galeria). */
  badgeGradient: string;
  headingColor: string;
  subheadingColor: string;
  /** Mensagem de contexto exibida no widget expandido (pilares). */
  contextMsg: string | null;
  /** Nome acessível completo (aria-label). */
  ariaLabel: string;
  /** Descrição de acessibilidade estendida (role/funcionalidade). */
  accessibleDescription: string;
  /** Arquétipo geométrico do SVG. */
  archetype: string;
  /** Assinatura de movimento que diferencia o personagem no estado idle. */
  animationSignature: string;
  /** Estados operacionais suportados (todos suportam os 6 oficiais). */
  states: CharacterState[];
  /** Personagem de fallback seguro quando o SVG falha. */
  fallbackId: 'core';
  /** Comando de invocação por voz (padrão "Ei <Nome>"). */
  command: string;
}

const ALL_STATES = [...CHARACTER_STATES];

/* ------------------------------------------------------------------ *
 *  Camada 5 — Personagens-Pilar (9 originais, preservados integralmente)
 * ------------------------------------------------------------------ */

const PILLAR_01_TABS = [
  'workspace',
  'crm',
  'crm360',
  'propostas',
  'companies',
  'contacts',
  'settings_hub',
];
const PILLAR_02_TABS = ['prospect', 'market-intelligence', 'settings_market'];
const PILLAR_03_TABS = [
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
];
const PILLAR_04_TABS = [
  'dashboard',
  'analytics',
  'winloss',
  'reports',
  'signals-risks',
  'gamification',
  'settings_performance',
];
const PILLAR_05_TABS = ['forecast', 'pipeline_ponderado', 'metas', 'settings_predictability'];
const PILLAR_06_TABS = [
  'commercial_intelligence',
  'copiloto_ia',
  'intelligence',
  'knowledge',
  'sdr-diagnostic',
  'settings_ai',
];
const PILLAR_07_TABS = ['automations', 'integrations', 'bitrix', 'settings_automation'];
const PILLAR_08_TABS = [
  'voice-hub',
  'outbound',
  'dialer',
  'mesa-tratamento',
  'settings_engagement',
];
const ADMIN_TABS = ['notifications', 'usage', 'team', 'module-access', 'settings'];

/* ------------------------------------------------------------------ *
 *  Catálogo completo — 29 personagens
 * ------------------------------------------------------------------ */

export const CHARACTER_CATALOG: CharacterDefinition[] = [
  /* ===================== CAMADA 5 — PILARES (9) ===================== */
  {
    id: 'orbit',
    name: 'Orbit',
    role: 'Guardião do CRM',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 01 — HUB COMERCIAL',
    modules: PILLAR_01_TABS,
    palette: {
      primary: '#FFC107',
      secondary: '#00D4FF',
      accent: '#FF2D9B',
      heading: '#FFC107',
      subheading: '#70D6FF',
      halo: '0 0 32px rgba(255, 193, 7, 0.35)',
    },
    svg: '/brand/characters/orbit.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-amber-400 to-amber-600',
    headingColor: '#FFC107',
    subheadingColor: '#70D6FF',
    contextMsg: 'Monitorando pipeline e integridade dos negócios',
    ariaLabel: 'Orbit, agente guardião do CRM e da integridade de pipeline',
    accessibleDescription:
      'Guardião do Hub Comercial: vigia a integridade do pipeline de negócios e das empresas.',
    archetype: 'Non-Human Gravitational Gyroscope',
    animationSignature: 'orbita lenta de anéis com satélites de dados',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Orbit',
  },
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Analista de Dados',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 02 — INTELIGÊNCIA DE MERCADO',
    modules: PILLAR_02_TABS,
    palette: {
      primary: '#00D4FF',
      secondary: '#38BDF8',
      accent: '#FFC107',
      heading: '#00D4FF',
      subheading: '#BAE6FD',
      halo: '0 0 32px rgba(0, 212, 255, 0.40)',
    },
    svg: '/brand/characters/nexus.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-blue-400 to-blue-600',
    headingColor: '#00D4FF',
    subheadingColor: '#BAE6FD',
    contextMsg: 'Pesquisando dados de mercado, ICP e decisores',
    ariaLabel: 'Nexus, agente analista de dados e inteligência de mercado',
    accessibleDescription:
      'Analista de Inteligência de Mercado: pesquisa dados, ICP e decisores para prospecção.',
    archetype: 'Non-Human Faceted Quantum Prism',
    animationSignature: 'refração prismática dos vértices hexagonais',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Nexus',
  },
  {
    id: 'aria',
    name: 'Aria',
    role: 'Maestrina de Fluxos',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 03 — ORQUESTRAÇÃO DE VENDAS',
    modules: PILLAR_03_TABS,
    palette: {
      primary: '#10B981',
      secondary: '#00D4FF',
      accent: '#34D399',
      heading: '#10B981',
      subheading: '#34D399',
      halo: '0 0 32px rgba(16, 185, 129, 0.38)',
    },
    svg: '/brand/characters/aria.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-emerald-400 to-emerald-600',
    headingColor: '#10B981',
    subheadingColor: '#34D399',
    contextMsg: 'Otimizando cadência diária e próximas melhores ações',
    ariaLabel: 'Aria, agente maestrina de fluxos diários e cadência de vendas',
    accessibleDescription:
      'Maestrina de Orquestração de Vendas: coordena cadências diárias e melhores próximas ações.',
    archetype: 'Non-Human Harmonic Mobius Ribbon',
    animationSignature: 'ondulação harmônica das fitas de fluxo',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Aria',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    role: 'Estrategista de Metas',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 04 — PERFORMANCE COMERCIAL',
    modules: PILLAR_04_TABS,
    palette: {
      primary: '#FF2D9B',
      secondary: '#FFC107',
      accent: '#00D4FF',
      heading: '#FF2D9B',
      subheading: '#FFC107',
      halo: '0 0 32px rgba(255, 45, 155, 0.40)',
    },
    svg: '/brand/characters/vanguard.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-rose-400 to-rose-600',
    headingColor: '#FF2D9B',
    subheadingColor: '#FFC107',
    contextMsg: 'Acompanhando gargalos de conversão e metas',
    ariaLabel: 'Vanguard, agente estrategista de metas e aceleração de performance',
    accessibleDescription:
      'Estrategista de Performance Comercial: acompanha gargalos de conversão e metas.',
    archetype: 'Non-Human Ascending Spearhead & Shield',
    animationSignature: 'propulsão ascendente com ignição do núcleo',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Vanguard',
  },
  {
    id: 'oracle',
    name: 'Oracle',
    role: 'Visionário de Forecast',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 05 — PREVISIBILIDADE COMERCIAL',
    modules: PILLAR_05_TABS,
    palette: {
      primary: '#A855F7',
      secondary: '#FF2D9B',
      accent: '#00D4FF',
      heading: '#A855F7',
      subheading: '#FF2D9B',
      halo: '0 0 32px rgba(168, 85, 247, 0.40)',
    },
    svg: '/brand/characters/oracle.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-purple-400 to-purple-600',
    headingColor: '#A855F7',
    subheadingColor: '#FF2D9B',
    contextMsg: 'Projetando forecast ponderado e fechamentos',
    ariaLabel: 'Oracle, agente visionário de forecast e previsibilidade comercial',
    accessibleDescription:
      'Visionário de Previsibilidade Comercial: projeta forecast ponderado e fechamentos.',
    archetype: 'Non-Human Astrolabe Ocular Lens',
    animationSignature: 'rotação lenta dos círculos temporais concêntricos',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Oracle',
  },
  {
    id: 'core',
    name: 'Core',
    role: 'Mente Principal',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 06 — INTELIGÊNCIA ARTIFICIAL',
    modules: PILLAR_06_TABS,
    palette: {
      primary: '#6366F1',
      secondary: '#00D4FF',
      accent: '#FF2D9B',
      heading: '#6366F1',
      subheading: '#00D4FF',
      halo: '0 0 34px rgba(99, 102, 241, 0.45)',
    },
    svg: '/brand/characters/core.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-indigo-400 to-indigo-600',
    headingColor: '#6366F1',
    subheadingColor: '#00D4FF',
    contextMsg: 'Supervisionando o enxame de agentes autônomos',
    ariaLabel: 'Core, agente mente principal e orquestrador cognitivo de IA',
    accessibleDescription:
      'Mente Principal de IA: supervisiona o enxame de agentes autônomos e o conhecimento.',
    archetype: 'Non-Human Synaptic Hypersphere',
    animationSignature: 'respiração neural com feixes sinápticos',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Core',
  },
  {
    id: 'spark',
    name: 'Spark',
    role: 'Engenheiro de Integrações',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 07 — AUTOMAÇÃO & CONECTIVIDADE',
    modules: PILLAR_07_TABS,
    palette: {
      primary: '#14B8A6',
      secondary: '#D4F434',
      accent: '#00F2FE',
      heading: '#14B8A6',
      subheading: '#D4F434',
      halo: '0 0 32px rgba(20, 184, 166, 0.40)',
    },
    svg: '/brand/characters/spark.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-teal-400 to-teal-600',
    headingColor: '#14B8A6',
    subheadingColor: '#D4F434',
    contextMsg: 'Monitorando conectores externos e filas',
    ariaLabel: 'Spark, agente engenheiro de conectores e integrações',
    accessibleDescription:
      'Engenheiro de Automação e Conectividade: monitora conectores externos, filas e webhooks.',
    archetype: 'Non-Human 4-Point Electric Starlight',
    animationSignature: 'centelhamento elétrico de 4 pontas',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Spark',
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Especialista em Voz',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'PILAR 08 — ENGAJAMENTO COMERCIAL',
    modules: PILLAR_08_TABS,
    palette: {
      primary: '#FB7185',
      secondary: '#00D4FF',
      accent: '#FF2D9B',
      heading: '#FB7185',
      subheading: '#00D4FF',
      halo: '0 0 32px rgba(251, 113, 133, 0.40)',
    },
    svg: '/brand/characters/echo.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-pink-400 to-pink-600',
    headingColor: '#FB7185',
    subheadingColor: '#00D4FF',
    contextMsg: 'Acompanhando discador, transcrições e cadências',
    ariaLabel: 'Echo, agente especialista em telefonia, voz e engajamento',
    accessibleDescription:
      'Especialista em Engajamento Comercial: acompanha discador, transcrições e cadências de voz.',
    archetype: 'Non-Human Acoustic Resonator Capsule',
    animationSignature: 'ressonância esférica com ondas sonoras concêntricas',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Echo',
  },
  {
    id: 'sudo',
    name: 'Sudo',
    role: 'Controlador de Sistema',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: 'ADMINISTRAÇÃO',
    modules: ADMIN_TABS,
    palette: {
      primary: '#94A3B8',
      secondary: '#00D4FF',
      accent: '#FFC107',
      heading: '#94A3B8',
      subheading: '#FFC107',
      halo: '0 0 32px rgba(0, 212, 255, 0.35)',
    },
    svg: '/brand/characters/sudo.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-slate-400 to-slate-600',
    headingColor: '#94A3B8',
    subheadingColor: '#FFC107',
    contextMsg: 'Validando governança, alçadas e segurança',
    ariaLabel: 'Sudo, agente controlador de sistema, governança e alçadas',
    accessibleDescription:
      'Controlador de Administração: valida governança, alçadas, RBAC e segurança do sistema.',
    archetype: 'Non-Human Isometric Cryptographic Monolith',
    animationSignature: 'pulso criptográfico do monólito isométrico',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Sudo',
  },

  /* ============ CAMADA 2 — AGENTES COMERCIAIS DE RUNTIME (15) ============ */
  {
    id: 'axiom',
    name: 'Axiom',
    role: 'Guardião de Dados LDR',
    layer: 'commercial-agent',
    linkedAgentId: 'ldr-intelligence',
    contextGroup: null,
    modules: ['market-intelligence', 'prospect', 'companies', 'contacts'],
    palette: {
      primary: '#38BDF8',
      secondary: '#FFC107',
      accent: '#22C55E',
      heading: '#7DD3FC',
      subheading: '#BAE6FD',
      halo: '0 0 32px rgba(56, 189, 248, 0.38)',
    },
    svg: '/brand/characters/axiom.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-sky-400 to-sky-600',
    headingColor: '#7DD3FC',
    subheadingColor: '#BAE6FD',
    contextMsg: 'Verificando integridade e completude dos dados de conta',
    ariaLabel: 'Axiom, agente LDR de inteligência e higienização de dados de leads',
    accessibleDescription:
      'LDR — Inteligência de Leads: contextualiza e prioriza contas, higienizando dados antes da abordagem.',
    archetype: 'Non-Human Data Integrity Cell',
    animationSignature: 'verificação sequencial dos nós da grade de dados',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Axiom',
  },
  {
    id: 'beacon',
    name: 'Beacon',
    role: 'Prospector Outbound',
    layer: 'commercial-agent',
    linkedAgentId: 'bdr-outbound',
    contextGroup: null,
    modules: ['prospect', 'roteiros', 'playbooks', 'cadence'],
    palette: {
      primary: '#FBBF24',
      secondary: '#FF2D9B',
      accent: '#00D4FF',
      heading: '#FDE68A',
      subheading: '#FBBF24',
      halo: '0 0 32px rgba(251, 191, 36, 0.38)',
    },
    svg: '/brand/characters/beacon.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-amber-300 to-amber-500',
    headingColor: '#FDE68A',
    subheadingColor: '#FBBF24',
    contextMsg: 'Emitindo sinais de prospecção e abordagens personalizadas',
    ariaLabel: 'Beacon, agente BDR de outbound e prospecção personalizada',
    accessibleDescription:
      'BDR — Outbound: redige abordagens hiper-personalizadas para prospecção ativa.',
    archetype: 'Non-Human Signal Beacon Tower',
    animationSignature: 'emissão pulsante de arcos de transmissão',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Beacon',
  },
  {
    id: 'meridian',
    name: 'Meridian',
    role: 'Qualificador SDR',
    layer: 'commercial-agent',
    linkedAgentId: 'sdr-qualification',
    contextGroup: null,
    modules: ['sdr-diagnostic', 'qualification_matrix', 'daily-plan', 'cadence'],
    palette: {
      primary: '#34D399',
      secondary: '#8B7DFF',
      accent: '#00D4FF',
      heading: '#6EE7B7',
      subheading: '#A7F3D0',
      halo: '0 0 32px rgba(52, 211, 153, 0.38)',
    },
    svg: '/brand/characters/meridian.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-emerald-300 to-emerald-500',
    headingColor: '#6EE7B7',
    subheadingColor: '#A7F3D0',
    contextMsg: 'Calibrando qualificação BANT e triagem de cadências',
    ariaLabel: 'Meridian, agente SDR de qualificação BANT e triagem',
    accessibleDescription:
      'SDR — Qualificação: conduz qualificação BANT e triagem de cadências de entrada.',
    archetype: 'Non-Human Qualification Compass',
    animationSignature: 'oscilação da agulha de decisão sobre o meridiano',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Meridian',
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'Closer Copilot',
    layer: 'commercial-agent',
    linkedAgentId: 'closer-sales',
    contextGroup: null,
    modules: ['roleplay', 'propostas', 'crm360', 'objections_matrix'],
    palette: {
      primary: '#FB923C',
      secondary: '#FFC107',
      accent: '#FF2D9B',
      heading: '#FDBA74',
      subheading: '#FED7AA',
      halo: '0 0 32px rgba(251, 146, 60, 0.40)',
    },
    svg: '/brand/characters/forge.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-orange-400 to-rose-500',
    headingColor: '#FDBA74',
    subheadingColor: '#FED7AA',
    contextMsg: 'Forjando fechamento: objeções, propostas e táticas de reunião',
    ariaLabel: 'Forge, agente closer copilot de fechamento e objeções',
    accessibleDescription:
      'Closer Copilot: apoia reuniões, objeções e propostas — sugere, nunca fecha o deal.',
    archetype: 'Non-Human Closing Forge',
    animationSignature: 'chama interna pulsante com faíscas de impacto',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Forge',
  },
  {
    id: 'relay',
    name: 'Relay',
    role: 'Coordenador de Vendas',
    layer: 'commercial-agent',
    linkedAgentId: 'coordinator-commercial',
    contextGroup: null,
    modules: ['daily-plan', 'activities', 'calendar', 'mesa-tratamento'],
    palette: {
      primary: '#2DD4BF',
      secondary: '#00D4FF',
      accent: '#FFC107',
      heading: '#5EEAD4',
      subheading: '#99F6E4',
      halo: '0 0 32px rgba(45, 212, 191, 0.38)',
    },
    svg: '/brand/characters/relay.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-teal-300 to-cyan-500',
    headingColor: '#5EEAD4',
    subheadingColor: '#99F6E4',
    contextMsg: 'Distribuindo carga de trabalho e balanceando SLAs',
    ariaLabel: 'Relay, agente coordenador comercial de roteamento e SLAs',
    accessibleDescription:
      'Coordenador Comercial: balanceia carga de trabalho e SLAs de atendimento.',
    archetype: 'Non-Human Workload Router Node',
    animationSignature: 'pulso sequencial nas três rotas de distribuição',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Relay',
  },
  {
    id: 'helm',
    name: 'Helm',
    role: 'Gerente Comercial IA',
    layer: 'commercial-agent',
    linkedAgentId: 'manager-commercial',
    contextGroup: null,
    modules: ['dashboard', 'analytics', 'reports', 'team'],
    palette: {
      primary: '#A78BFA',
      secondary: '#FFC107',
      accent: '#00D4FF',
      heading: '#C4B5FD',
      subheading: '#DDD6FE',
      halo: '0 0 32px rgba(167, 139, 250, 0.38)',
    },
    svg: '/brand/characters/helm.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-violet-400 to-indigo-600',
    headingColor: '#C4B5FD',
    subheadingColor: '#DDD6FE',
    contextMsg: 'Pilotando performance da equipe e alçadas de desconto',
    ariaLabel: 'Helm, agente gerente comercial de performance e alçadas',
    accessibleDescription:
      'Gerente Comercial IA: avalia performance da equipe e calcula alçadas — exige confirmação humana.',
    archetype: 'Non-Human Command Helm Wheel',
    animationSignature: 'rotação lenta dos raios do leme com pulsos nos comandos',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Helm',
  },
  {
    id: 'apex',
    name: 'Apex',
    role: 'Diretor Executivo IA',
    layer: 'commercial-agent',
    linkedAgentId: 'executive-director',
    contextGroup: null,
    modules: ['dashboard', 'forecast', 'metas', 'reports'],
    palette: {
      primary: '#FACC15',
      secondary: '#8B7DFF',
      accent: '#FF2D9B',
      heading: '#FDE68A',
      subheading: '#FEF3C7',
      halo: '0 0 32px rgba(250, 204, 21, 0.38)',
    },
    svg: '/brand/characters/apex.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-yellow-300 to-amber-500',
    headingColor: '#FDE68A',
    subheadingColor: '#FEF3C7',
    contextMsg: 'Visão macro de metas e alçadas máximas de exceção',
    ariaLabel: 'Apex, agente diretor executivo de visão macro e alçadas',
    accessibleDescription:
      'Diretor Executivo IA: visão macro de metas e alçadas máximas — exige confirmação do Admin.',
    archetype: 'Non-Human Executive Summit',
    animationSignature: 'brilho da estrela de topo sobre os cumes de alçada',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Apex',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    role: 'Auditor de Faturamento',
    layer: 'commercial-agent',
    linkedAgentId: 'billing-revenue',
    contextGroup: null,
    modules: ['reports', 'usage', 'settings_hub'],
    palette: {
      primary: '#22C55E',
      secondary: '#FFC107',
      accent: '#00D4FF',
      heading: '#86EFAC',
      subheading: '#BBF7D0',
      halo: '0 0 32px rgba(34, 197, 94, 0.38)',
    },
    svg: '/brand/characters/ledger.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-green-400 to-emerald-600',
    headingColor: '#86EFAC',
    subheadingColor: '#BBF7D0',
    contextMsg: 'Auditando contratos, cobrança e faturamento recorrente',
    ariaLabel: 'Ledger, agente auditor de faturamento e contratos',
    accessibleDescription:
      'Auditor de Faturamento: audita contratos e cobrança — bloqueio compulsório em alterações.',
    archetype: 'Non-Human Ledger Tome',
    animationSignature: 'lançamento sequencial de colunas de auditoria',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Ledger',
  },
  {
    id: 'anchor',
    name: 'Anchor',
    role: 'Guardião de Retenção',
    layer: 'commercial-agent',
    linkedAgentId: 'churn-retention',
    contextGroup: null,
    modules: ['analytics', 'companies', 'contacts', 'reports'],
    palette: {
      primary: '#60A5FA',
      secondary: '#FF2D9B',
      accent: '#8B7DFF',
      heading: '#93C5FD',
      subheading: '#BFDBFE',
      halo: '0 0 32px rgba(96, 165, 250, 0.38)',
    },
    svg: '/brand/characters/anchor.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-blue-400 to-indigo-500',
    headingColor: '#93C5FD',
    subheadingColor: '#BFDBFE',
    contextMsg: 'Ancorando clientes: telemetria de churn e planos de resgate',
    ariaLabel: 'Anchor, agente guardião de retenção e prevenção de churn',
    accessibleDescription:
      'Guardião de Retenção: monitora telemetria de churn e dispara planos de resgate.',
    archetype: 'Non-Human Retention Anchor',
    animationSignature: 'estabilização do anel com vibração amortecida das patas',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Anchor',
  },
  {
    id: 'seal',
    name: 'Seal',
    role: 'Guardião Contratual',
    layer: 'commercial-agent',
    linkedAgentId: 'contract-signature',
    contextGroup: null,
    modules: ['propostas', 'reports', 'settings_hub'],
    palette: {
      primary: '#F472B6',
      secondary: '#FFC107',
      accent: '#8B7DFF',
      heading: '#F9A8D4',
      subheading: '#FBCFE8',
      halo: '0 0 32px rgba(244, 114, 182, 0.38)',
    },
    svg: '/brand/characters/seal.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-pink-400 to-fuchsia-600',
    headingColor: '#F9A8D4',
    subheadingColor: '#FBCFE8',
    contextMsg: 'Selando formalização e assinatura digital de contratos',
    ariaLabel: 'Seal, agente guardião contratual de assinatura digital',
    accessibleDescription:
      'Guardião Contratual: conduz formalização e assinatura — bloqueio para envio de contratos.',
    archetype: 'Non-Human Digital Wax Seal',
    animationSignature: 'compressão do selo de cera com carimbo central',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Seal',
  },
  {
    id: 'cipher',
    name: 'Cipher',
    role: 'Guardião Bitrix24',
    layer: 'commercial-agent',
    linkedAgentId: 'bitrix-guardian',
    contextGroup: null,
    modules: ['bitrix', 'integrations', 'automations'],
    palette: {
      primary: '#6EE7B7',
      secondary: '#38BDF8',
      accent: '#FFC107',
      heading: '#A7F3D0',
      subheading: '#99F6E4',
      halo: '0 0 32px rgba(110, 231, 183, 0.36)',
    },
    svg: '/brand/characters/cipher.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-emerald-300 to-sky-500',
    headingColor: '#A7F3D0',
    subheadingColor: '#99F6E4',
    contextMsg: 'Protegendo a integridade da sincronização Bitrix24',
    ariaLabel: 'Cipher, agente guardião de integração e sincronização Bitrix24',
    accessibleDescription:
      'Guardião Bitrix24: monitora anomalias e integridade de sincronização — autônomo em mapeamentos.',
    archetype: 'Non-Human Interlocked Sync Rings',
    animationSignature: 'engrenamento contra-rotativo dos anéis hexagonais',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Cipher',
  },
  {
    id: 'harbinger',
    name: 'Harbinger',
    role: 'Oráculo de Receita',
    layer: 'commercial-agent',
    linkedAgentId: 'revenue-intelligence',
    contextGroup: null,
    modules: ['forecast', 'pipeline_ponderado', 'commercial_intelligence', 'analytics'],
    palette: {
      primary: '#C084FC',
      secondary: '#00D4FF',
      accent: '#FF2D9B',
      heading: '#D8B4FE',
      subheading: '#E9D5FF',
      halo: '0 0 32px rgba(192, 132, 252, 0.38)',
    },
    svg: '/brand/characters/harbinger.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-purple-300 to-fuchsia-500',
    headingColor: '#D8B4FE',
    subheadingColor: '#E9D5FF',
    contextMsg: 'Modelando previsão ponderada e inteligência de receita',
    ariaLabel: 'Harbinger, agente oráculo de receita e forecast preditivo',
    accessibleDescription:
      'Oráculo de Receita: modelagem preditiva e projeção de forecast — autônomo para ratings.',
    archetype: 'Non-Human Faceted Prediction Crystal',
    animationSignature: 'trajetória ascendente da seta de tendência no cristal',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Harbinger',
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Detetive de Conta',
    layer: 'commercial-agent',
    linkedAgentId: 'account-detective',
    contextGroup: null,
    modules: ['market-intelligence', 'crm360', 'companies', 'contacts'],
    palette: {
      primary: '#4ADE80',
      secondary: '#00D4FF',
      accent: '#FFC107',
      heading: '#86EFAC',
      subheading: '#BBF7D0',
      halo: '0 0 32px rgba(74, 222, 128, 0.36)',
    },
    svg: '/brand/characters/scout.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-green-300 to-teal-500',
    headingColor: '#86EFAC',
    subheadingColor: '#BBF7D0',
    contextMsg: 'Investigando contas: dossiê pré-reunião em 10 seções',
    ariaLabel: 'Scout, agente detetive de conta e dossiê pré-reunião',
    accessibleDescription:
      'Detetive de Conta: investigação pré-reunião e dossiê em 10 seções — autônomo para pesquisa.',
    archetype: 'Non-Human Investigation Lens',
    animationSignature: 'varredura da lupa sobre o mapa de evidências',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Scout',
  },
  {
    id: 'pledge',
    name: 'Pledge',
    role: 'Guardião de Promessas',
    layer: 'commercial-agent',
    linkedAgentId: 'promise-guardian',
    contextGroup: null,
    modules: ['activities', 'mesa-tratamento', 'voice-hub', 'calendar'],
    palette: {
      primary: '#F9A8D4',
      secondary: '#8B7DFF',
      accent: '#FFC107',
      heading: '#FBCFE8',
      subheading: '#FCE7F3',
      halo: '0 0 32px rgba(249, 168, 212, 0.36)',
    },
    svg: '/brand/characters/pledge.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-pink-300 to-violet-500',
    headingColor: '#FBCFE8',
    subheadingColor: '#FCE7F3',
    contextMsg: 'Vigiando promessas verbais e tarefas derivadas de áudio',
    ariaLabel: 'Pledge, agente guardião de promessas comerciais',
    accessibleDescription:
      'Guardião de Promessas: detecta promessas verbais em áudios e cria rascunhos de tarefas.',
    archetype: 'Non-Human Commitment Knot',
    animationSignature: 'aperto do nó central com selagem dos extremos',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Pledge',
  },
  {
    id: 'tribunal',
    name: 'Tribunal',
    role: 'Advogado do Diabo',
    layer: 'commercial-agent',
    linkedAgentId: 'devils-advocate',
    contextGroup: null,
    modules: ['crm', 'crm360', 'winloss', 'analytics'],
    palette: {
      primary: '#64748B',
      secondary: '#EF4444',
      accent: '#FFC107',
      heading: '#CBD5E1',
      subheading: '#E2E8F0',
      halo: '0 0 32px rgba(100, 116, 139, 0.40)',
    },
    svg: '/brand/characters/tribunal.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-slate-500 to-slate-700',
    headingColor: '#CBD5E1',
    subheadingColor: '#E2E8F0',
    contextMsg: 'Auditando criticamente probabilidade de negócios estagnados',
    ariaLabel: 'Tribunal, agente advogado do diabo de auditoria de negócios',
    accessibleDescription:
      'Advogado do Diabo: auditoria crítica de probabilidade — autônomo para rebaixar rating.',
    archetype: 'Non-Human Audit Scales',
    animationSignature: 'balanço ponderado dos pratos de contraprova',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Tribunal',
  },

  /* ============ CAMADA 3 — CANAIS E VOZ (4) ========================= */
  {
    id: 'vox',
    name: 'Vox',
    role: 'Discador Autônomo',
    layer: 'channel-agent',
    linkedAgentId: 'voice-agent',
    contextGroup: null,
    modules: ['voice-hub', 'dialer', 'outbound', 'mesa-tratamento'],
    palette: {
      primary: '#F0ABFC',
      secondary: '#00D4FF',
      accent: '#FF2D9B',
      heading: '#F5D0FE',
      subheading: '#FAE8FF',
      halo: '0 0 32px rgba(240, 171, 252, 0.38)',
    },
    svg: '/brand/characters/vox.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-fuchsia-300 to-purple-500',
    headingColor: '#F5D0FE',
    subheadingColor: '#FAE8FF',
    contextMsg: 'Discando chamadas autônomas com detecção de secretária',
    ariaLabel: 'Vox, agente de voz e discador autônomo',
    accessibleDescription:
      'Voice Agent: discador autônomo, detecção de secretária eletrônica (AMD) e saudação governada.',
    archetype: 'Non-Human Directional Voice Emitter',
    animationSignature: 'emissão direcional de arcos sonoros',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Vox',
  },
  {
    id: 'scope',
    name: 'Scope',
    role: 'Diagnóstico de Leads',
    layer: 'channel-agent',
    linkedAgentId: 'sdr-diagnostic',
    contextGroup: null,
    modules: ['sdr-diagnostic', 'intelligence', 'knowledge'],
    palette: {
      primary: '#A3E635',
      secondary: '#8B7DFF',
      accent: '#00D4FF',
      heading: '#BEF264',
      subheading: '#ECFCCB',
      halo: '0 0 32px rgba(163, 230, 53, 0.36)',
    },
    svg: '/brand/characters/scope.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-lime-300 to-violet-500',
    headingColor: '#BEF264',
    subheadingColor: '#ECFCCB',
    contextMsg: 'Diagnosticando maturidade de leads inbound',
    ariaLabel: 'Scope, agente de diagnóstico de maturidade de leads',
    accessibleDescription:
      'SDR Diagnostic: diagnóstico de maturidade de leads inbound.',
    archetype: 'Non-Human Diagnostic Reticle',
    animationSignature: 'pulso vital varrendo o retículo de diagnóstico',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Scope',
  },
  {
    id: 'tracker',
    name: 'Tracker',
    role: 'Scanner de Mercado',
    layer: 'channel-agent',
    linkedAgentId: 'hunter-agent',
    contextGroup: null,
    modules: ['prospect', 'market-intelligence', 'signals-risks'],
    palette: {
      primary: '#F87171',
      secondary: '#FFC107',
      accent: '#00D4FF',
      heading: '#FCA5A5',
      subheading: '#FECACA',
      halo: '0 0 32px rgba(248, 113, 113, 0.36)',
    },
    svg: '/brand/characters/tracker.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-red-400 to-amber-500',
    headingColor: '#FCA5A5',
    subheadingColor: '#FECACA',
    contextMsg: 'Varrendo o mercado em busca de novas contas',
    ariaLabel: 'Tracker, agente hunter de novas contas no mercado',
    accessibleDescription:
      'Hunter Agent: scanners automáticos de novas contas no mercado.',
    archetype: 'Non-Human Market Sweep Radar',
    animationSignature: 'varredura angular do feixe de radar',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Tracker',
  },
  {
    id: 'tempo',
    name: 'Tempo',
    role: 'Assistente Tático',
    layer: 'channel-agent',
    linkedAgentId: 'tactical-agent',
    contextGroup: null,
    modules: ['chatbook', 'copiloto_ia', 'intelligence'],
    palette: {
      primary: '#67E8F9',
      secondary: '#FF2D9B',
      accent: '#FFC107',
      heading: '#A5F3FC',
      subheading: '#CFFAFE',
      halo: '0 0 32px rgba(103, 232, 249, 0.36)',
    },
    svg: '/brand/characters/tempo.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-cyan-300 to-pink-500',
    headingColor: '#A5F3FC',
    subheadingColor: '#CFFAFE',
    contextMsg: 'Respondendo com agilidade tática em chat',
    ariaLabel: 'Tempo, agente tático de respostas rápidas em chat',
    accessibleDescription:
      'Tactical Agent: assistente de respostas rápidas em chat.',
    archetype: 'Non-Human Tactical Chat Bolt',
    animationSignature: 'descarga do relâmpago com pontos de digitação',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Tempo',
  },

  /* ============ CAMADA 7 — ORQUESTRAÇÃO (1) ======================== */
  {
    id: 'aegis',
    name: 'Aegis',
    role: 'Supervisor Central',
    layer: 'orchestration',
    linkedAgentId: 'supervisor-central',
    contextGroup: null,
    modules: ['intelligence', 'copiloto_ia', 'knowledge'],
    palette: {
      primary: '#8B7DFF',
      secondary: '#FFC107',
      accent: '#00D4FF',
      heading: '#C4B5FD',
      subheading: '#DDD6FE',
      halo: '0 0 36px rgba(139, 125, 255, 0.42)',
    },
    svg: '/brand/characters/aegis.svg',
    viewBox: '0 0 128 128',
    badgeGradient: 'from-violet-400 to-indigo-600',
    headingColor: '#C4B5FD',
    subheadingColor: '#DDD6FE',
    contextMsg: 'Orquestrando o enxame: delegação, memória e guardrails',
    ariaLabel: 'Aegis, supervisor central e orquestrador do enxame de agentes',
    accessibleDescription:
      'Supervisor Central: orquestra o enxame de agentes, memória compartilhada, filas e guardrails de risco.',
    archetype: 'Non-Human Orchestration Shield',
    animationSignature: 'rotação do anel orbital com íris central de comando',
    states: ALL_STATES,
    fallbackId: 'core',
    command: 'Ei Aegis',
  },
];

/* ------------------------------------------------------------------ *
 *  Índices e helpers declarativos
 * ------------------------------------------------------------------ */

const BY_ID = new Map(CHARACTER_CATALOG.map((c) => [c.id, c]));
const BY_CONTEXT_GROUP = new Map(
  CHARACTER_CATALOG.filter((c) => c.contextGroup).map((c) => [c.contextGroup as string, c]),
);

export function getCharacter(id: string): CharacterDefinition | undefined {
  return BY_ID.get(id);
}

const CORE_FALLBACK = CHARACTER_CATALOG.find((c) => c.id === 'core') as CharacterDefinition;

export function getCharacterOrFallback(id: string): CharacterDefinition {
  return BY_ID.get(id) ?? CORE_FALLBACK;
}

/** Personagem-pilar associado a um grupo de navegação do ModuleAgentWidget. */
export function getPillarCharacter(contextGroup: string): CharacterDefinition | undefined {
  return BY_CONTEXT_GROUP.get(contextGroup);
}

export function getCharactersByLayer(layer: CharacterLayer): CharacterDefinition[] {
  return CHARACTER_CATALOG.filter((c) => c.layer === layer);
}

/** Personagens vinculados a um agente/motor real (camadas 2, 3 e 7). */
export function getCharactersByAgent(linkedAgentId: string): CharacterDefinition[] {
  return CHARACTER_CATALOG.filter((c) => c.linkedAgentId === linkedAgentId);
}

/** Caminho do SVG com fallback para 'core' quando o id é desconhecido. */
export function characterSvgSrc(id: string): string {
  return getCharacterOrFallback(id).svg;
}

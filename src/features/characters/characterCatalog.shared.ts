/**
 * Birth Hub 360° — Tipos, estados e constantes de abas do registro canônico
 * de personagens (extraído de characterCatalog.ts para respeitar o limite de
 * hotspot de 1.000 linhas). Não contém dados de personagens.
 */

export type CharacterState = 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error';

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

export const ALL_STATES = [...CHARACTER_STATES];

/* ------------------------------------------------------------------ *
 *  Camada 5 — Personagens-Pilar (9 originais, preservados integralmente)
 * ------------------------------------------------------------------ */

export const PILLAR_01_TABS = [
  'workspace',
  'crm',
  'crm360',
  'propostas',
  'companies',
  'contacts',
  'settings_hub',
];
export const PILLAR_02_TABS = ['prospect', 'market-intelligence', 'settings_market'];
export const PILLAR_03_TABS = [
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
export const PILLAR_04_TABS = [
  'dashboard',
  'analytics',
  'winloss',
  'reports',
  'signals-risks',
  'gamification',
  'settings_performance',
];
export const PILLAR_05_TABS = ['forecast', 'pipeline_ponderado', 'metas', 'settings_predictability'];
export const PILLAR_06_TABS = [
  'commercial_intelligence',
  'copiloto_ia',
  'intelligence',
  'knowledge',
  'sdr-diagnostic',
  'settings_ai',
];
export const PILLAR_07_TABS = ['automations', 'integrations', 'bitrix', 'settings_automation'];
export const PILLAR_08_TABS = [
  'voice-hub',
  'outbound',
  'dialer',
  'mesa-tratamento',
  'settings_engagement',
];
export const ADMIN_TABS = ['notifications', 'usage', 'team', 'module-access', 'settings'];
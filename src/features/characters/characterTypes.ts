/**
 * Birth Hub 360° — Tipos e estados do Registro Canônico de Personagens Digitais.
 *
 * Extraído de `characterCatalog.ts` para modularização (gate check:hotspots).
 * Este módulo é puramente declarativo: tipos, união de estados e a lista oficial.
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

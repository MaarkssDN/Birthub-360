import type { TabType } from './tabMeta.js';
import type { ModuleId } from './moduleRegistry.js';

export interface NavItemTheme {
  emoji: string;
  color: string;
  lightColor: string;
  darkColor: string;
  label?: string;
}

/** Emojis oficiais para cada um dos 11 módulos + Hub Central */
export const MODULE_EMOJIS: Record<string, string> = {
  hub: '🏛️',
  p01: '💼',
  p02: '🔍',
  p03: '🎯',
  p04: '📊',
  p05: '🔮',
  p06: '🤖',
  p07: '⚡',
  p08: '📞',
  m09: '🛡️',
  m10: '📱',
  m11: '🚀',
};

export function getModuleEmoji(moduleId: string): string {
  return MODULE_EMOJIS[moduleId] ?? '✨';
}

/**
 * Paleta canônica com contraste WCAG 2.2 AA (>= 4.5:1 em light mode)
 * e brilho neon editorial em dark mode.
 */
const PALETTES = {
  cyan: {
    color: '#00D4FF',
    lightColor: '#0284C7', // sky-600 / sky-700
    darkColor: '#38BDF8',
  },
  pink: {
    color: '#FF2D9B',
    lightColor: '#BE185D', // pink-700
    darkColor: '#F472B6',
  },
  gold: {
    color: '#FFC107',
    lightColor: '#B45309', // amber-700
    darkColor: '#FBBF24',
  },
  iris: {
    color: '#8B7DFF',
    lightColor: '#6D28D9', // violet-700
    darkColor: '#A78BFA',
  },
  emerald: {
    color: '#10B981',
    lightColor: '#047857', // emerald-700
    darkColor: '#34D399',
  },
  orange: {
    color: '#FF6B35',
    lightColor: '#C2410C', // orange-700
    darkColor: '#FB923C',
  },
  crimson: {
    color: '#FF3366',
    lightColor: '#BE123C', // rose-700
    darkColor: '#FB7185',
  },
  teal: {
    color: '#06B6D4',
    lightColor: '#0E7490', // teal-700
    darkColor: '#22D3EE',
  },
  purple: {
    color: '#A855F7',
    lightColor: '#7E22CE', // purple-700
    darkColor: '#C084FC',
  },
  fuchsia: {
    color: '#D946EF',
    lightColor: '#A21CAF', // fuchsia-700
    darkColor: '#E879F9',
  },
  slate: {
    color: '#94A3B8',
    lightColor: '#475569', // slate-600
    darkColor: '#CBD5E1',
  },
} as const;

/**
 * Registro de metadados cromáticos e emojis específicos para cada sub-destino
 * da Sidebar em todos os módulos. Chaves combinam tab, path e query.
 */
const ITEM_THEMES: Record<string, NavItemTheme> = {
  // === HUB CENTRAL ===
  'dashboard:home': {
    emoji: '🌐',
    ...PALETTES.cyan,
  },
  'dashboard:dashboard': {
    emoji: '🚀',
    ...PALETTES.gold,
  },
  workspace: {
    emoji: '👤',
    ...PALETTES.iris,
  },
  'daily-plan': {
    emoji: '📅',
    ...PALETTES.emerald,
  },
  notifications: {
    emoji: '🔔',
    ...PALETTES.pink,
  },

  // === P01 — HUB COMERCIAL ===
  crm: {
    emoji: '📊',
    ...PALETTES.cyan,
  },
  crm360: {
    emoji: '💼',
    ...PALETTES.iris,
  },
  propostas: {
    emoji: '📝',
    ...PALETTES.gold,
  },
  companies: {
    emoji: '🏢',
    ...PALETTES.emerald,
  },
  contacts: {
    emoji: '👥',
    ...PALETTES.teal,
  },
  'contacts?view=decisores': {
    emoji: '🎯',
    ...PALETTES.pink,
  },

  // === P02 — INTELIGÊNCIA DE MERCADO ===
  prospect: {
    emoji: '🔭',
    ...PALETTES.pink,
  },
  'prospect:prospect/inteligente': {
    emoji: '⚡',
    ...PALETTES.cyan,
  },
  'market-intelligence': {
    emoji: '🔍',
    ...PALETTES.iris,
  },
  'market-intelligence:market-intelligence/hub': {
    emoji: '💡',
    ...PALETTES.gold,
  },

  // === P03 — ORQUESTRAÇÃO DE VENDAS ===
  jornadas: {
    emoji: '🗺️',
    ...PALETTES.iris,
  },
  playbooks: {
    emoji: '📖',
    ...PALETTES.cyan,
  },
  processos: {
    emoji: '⚙️',
    ...PALETTES.teal,
  },
  roteiros: {
    emoji: '📜',
    ...PALETTES.gold,
  },
  cadence: {
    emoji: '🔁',
    ...PALETTES.emerald,
  },
  activities: {
    emoji: '📋',
    ...PALETTES.orange,
  },
  calendar: {
    emoji: '🗓️',
    ...PALETTES.cyan,
  },
  roleplay: {
    emoji: '🎭',
    ...PALETTES.crimson,
  },
  qualification_matrix: {
    emoji: '⚖️',
    ...PALETTES.purple,
  },
  objections_matrix: {
    emoji: '🛡️',
    ...PALETTES.pink,
  },
  topic_training: {
    emoji: '🎓',
    ...PALETTES.gold,
  },
  chatbook: {
    emoji: '💬',
    ...PALETTES.teal,
  },
  editor: {
    emoji: '✍️',
    ...PALETTES.slate,
  },

  // === P04 — PERFORMANCE COMERCIAL ===
  analytics: {
    emoji: '📈',
    ...PALETTES.gold,
  },
  winloss: {
    emoji: '🏆',
    ...PALETTES.crimson,
  },
  reports: {
    emoji: '📑',
    ...PALETTES.iris,
  },
  gamification: {
    emoji: '🥇',
    ...PALETTES.emerald,
  },

  // === P05 — PREVISIBILIDADE COMERCIAL ===
  forecast: {
    emoji: '🔮',
    ...PALETTES.emerald,
  },
  metas: {
    emoji: '🎯',
    ...PALETTES.cyan,
  },
  pipeline_ponderado: {
    emoji: '⚖️',
    ...PALETTES.iris,
  },

  // === P06 — INTELIGÊNCIA ARTIFICIAL ===
  intelligence: {
    emoji: '🧠',
    ...PALETTES.purple,
  },
  copiloto_ia: {
    emoji: '🤖',
    ...PALETTES.cyan,
  },
  commercial_intelligence: {
    emoji: '💡',
    ...PALETTES.gold,
  },
  'signals-risks': {
    emoji: '🚨',
    ...PALETTES.pink,
  },
  'signals-risks:signals-risks/radar': {
    emoji: '📡',
    ...PALETTES.teal,
  },
  'signals-risks:signals-risks/deal-risks': {
    emoji: '⚠️',
    ...PALETTES.orange,
  },
  knowledge: {
    emoji: '📚',
    ...PALETTES.emerald,
  },
  'sdr-diagnostic': {
    emoji: '🩺',
    ...PALETTES.cyan,
  },

  // === P07 — AUTOMAÇÃO & CONECTIVIDADE ===
  automations: {
    emoji: '⚡',
    ...PALETTES.orange,
  },
  integrations: {
    emoji: '🔌',
    ...PALETTES.cyan,
  },
  bitrix: {
    emoji: '📘',
    ...PALETTES.teal,
  },

  // === P08 — ENGAJAMENTO COMERCIAL ===
  'mesa-tratamento': {
    emoji: '📞',
    ...PALETTES.crimson,
  },

  // === M09 — ADMIN & OPERATIONS ===
  team: {
    emoji: '👥',
    ...PALETTES.cyan,
  },
  'module-access': {
    emoji: '🔐',
    ...PALETTES.emerald,
  },
  usage: {
    emoji: '💳',
    ...PALETTES.iris,
  },
  settings: {
    emoji: '🛠️',
    ...PALETTES.slate,
  },
};

/** Paleta de fallback dinâmica baseada em rota/tab */
const FALLBACK_PALETTES = [
  PALETTES.cyan,
  PALETTES.pink,
  PALETTES.gold,
  PALETTES.iris,
  PALETTES.emerald,
  PALETTES.orange,
  PALETTES.crimson,
  PALETTES.teal,
  PALETTES.purple,
  PALETTES.fuchsia,
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Retorna o tema com emoji, cor base, cor clara e cor escura para qualquer item da sidebar.
 */
export function getNavItemTheme(params: {
  tab: TabType;
  path?: string;
  query?: string;
  label?: string;
}): NavItemTheme {
  const { tab, path, query, label } = params;

  // 1. Tenta chave mais específica: tab?query
  if (query) {
    const keyWithQuery = `${tab}?${query}`;
    if (ITEM_THEMES[keyWithQuery]) return ITEM_THEMES[keyWithQuery];
  }

  // 2. Tenta tab:path
  if (path) {
    const keyWithPath = `${tab}:${path}`;
    if (ITEM_THEMES[keyWithPath]) return ITEM_THEMES[keyWithPath];
  }

  // 3. Tenta tab pura
  if (ITEM_THEMES[tab]) return ITEM_THEMES[tab];

  // 4. Fallback harmonioso e determinístico para itens dinâmicos ou não mapeados
  const hashKey = `${tab}-${path ?? ''}-${label ?? ''}`;
  const idx = hashString(hashKey) % FALLBACK_PALETTES.length;
  const fallback = FALLBACK_PALETTES[idx];

  return {
    emoji: '✦',
    ...fallback,
  };
}

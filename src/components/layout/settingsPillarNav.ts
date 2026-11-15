import type { TabType } from './tabMeta.js';

/**
 * Navegação das rotas `/app/settings/pillars/<slug>` (MEL-30/MEL-31, Onda 4).
 *
 * As 8 telas `settings_*` por pilar foram consolidadas no PillarSettingsHub
 * (`src/features/settings/components/PillarSettingsHub.tsx`), mas a derivação
 * de `activeTab` em MainLayout usava `pathname.split('/')[2]` — para
 * `/app/settings/pillars/hub` isso devolvia `'settings'`, fazendo Topbar,
 * Breadcrumbs, Sidebar e ModuleAgentWidget tratarem a página como "Ajustes
 * Globais" (achado A1 da revisão independente do Agente 24).
 *
 * Este módulo é o ponto único de verdade do shell para resolver
 * pathname → TabType/label desses slugs. Os slugs são DUPLICADOS de
 * `src/features/settings/domain/pillarSettings.ts` de propósito: a camada de
 * layout (`src/components/layout`) não pode depender de `src/features/*`
 * (direção de dependência — features consomem layout, não o inverso). Se os
 * slugs mudarem lá, este arquivo precisa acompanhar (há teste cobrindo os 8).
 */

export const SETTINGS_PILLAR_SLUGS = [
  'hub',
  'market',
  'sales',
  'performance',
  'predictability',
  'ai',
  'automation',
  'engagement',
] as const;

export type SettingsPillarSlug = (typeof SETTINGS_PILLAR_SLUGS)[number];

/** TabType canônico de cada pilar — `settings_<slug>` (já existem em TAB_META). */
export const SETTINGS_PILLAR_TAB: Record<SettingsPillarSlug, TabType> = {
  hub: 'settings_hub',
  market: 'settings_market',
  sales: 'settings_sales',
  performance: 'settings_performance',
  predictability: 'settings_predictability',
  ai: 'settings_ai',
  automation: 'settings_automation',
  engagement: 'settings_engagement',
};

/** Nome de exibição do pilar (espelha PILLAR_SLUG_TO_NAME do domínio de settings). */
export const SETTINGS_PILLAR_LABEL: Record<SettingsPillarSlug, string> = {
  hub: 'Hub Comercial',
  market: 'Inteligência de Mercado',
  sales: 'Orquestração de Vendas',
  performance: 'Performance Comercial',
  predictability: 'Previsibilidade Comercial',
  ai: 'Inteligência Artificial',
  automation: 'Automação & Conectividade',
  engagement: 'Engajamento Comercial',
};

export function isSettingsPillarSlug(value: string | undefined): value is SettingsPillarSlug {
  return value !== undefined && (SETTINGS_PILLAR_SLUGS as readonly string[]).includes(value);
}

/**
 * Resolve o slug do pilar a partir do segmento da rota. Slug ausente ou
 * inválido cai em `'hub'` — mesmo destino do `<Navigate>` do PillarSettingsHub
 * (deep-link nunca quebra; o shell já reflete o pilar para onde a rota vai).
 */
export function resolveSettingsPillarSlug(segment: string | undefined): SettingsPillarSlug {
  return isSettingsPillarSlug(segment) ? segment : 'hub';
}

/**
 * Deriva o `activeTab` do pathname, replicando o comportamento anterior
 * (`pathname.split('/')[2]`) para todas as rotas EXCETO
 * `/app/settings/pillars[/<slug>]`, que resolve para `settings_<slug>`.
 */
export function deriveActiveTabFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Formas cobertas: /app/settings/pillars, /app/settings/pillars/<slug>
  // (o índice `/app/settings/pillars` redireciona para /hub no AppLayout).
  if (segments[0] === 'app' && segments[1] === 'settings' && segments[2] === 'pillars') {
    return SETTINGS_PILLAR_TAB[resolveSettingsPillarSlug(segments[3])];
  }
  return segments[1] || 'dashboard';
}

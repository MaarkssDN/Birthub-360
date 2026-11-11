import { LayoutDashboard, Share2, Smartphone, ShieldCheck, type LucideIcon } from 'lucide-react';
import { createElement, type ComponentType, type SVGProps } from 'react';
import {
  AIIcon,
  AutomationIcon,
  EngagementIcon,
  ForecastIcon,
  HubIcon,
  IntelligenceIcon,
  OrchestrationIcon,
  PerformanceIcon,
} from '../brand/PillarIcons.js';
import type { NavAccent, TabType } from './tabMeta.js';

/**
 * Registro canônico dos 11 módulos oficiais do Birthub 360° — taxonomia do
 * BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4: 8 Pilares (P01–P08) + 3 Módulos
 * complementares (M09–M11). O "Hub" é o centro neural da plataforma (Command
 * Center + Meu Espaço), não um dos 11 módulos — vive fora da numeração oficial.
 *
 * Cada módulo é um workspace independente: a Sidebar global virou um rail de
 * módulos + painel contextual (`Sidebar.tsx`), e os destinos internos de cada
 * módulo são `items` aqui — nunca estado local sem rota (toda tela continua
 * deep-linkável em /app/*).
 */

export type ModuleId =
  | 'hub'
  | 'p01'
  | 'p02'
  | 'p03'
  | 'p04'
  | 'p05'
  | 'p06'
  | 'p07'
  | 'p08'
  | 'm09'
  | 'm10'
  | 'm11';

export type ModuleIcon = ComponentType<
  SVGProps<SVGSVGElement> & { isActive?: boolean; className?: string }
>;

/**
 * Adapta ícones lucide ao contrato `ModuleIcon` (que aceita `isActive` para os
 * PillarIcons animados) sem vazar a prop para o DOM — lucide faz spread de
 * props no <svg> e `isActive` geraria warning de atributo desconhecido.
 */
function asModuleIcon(Icon: LucideIcon): ModuleIcon {
  const Wrapped = ({
    isActive: _isActive,
    className,
    ...rest
  }: SVGProps<SVGSVGElement> & { isActive?: boolean }) =>
    createElement(Icon, { className, ...rest });
  Wrapped.displayName = `ModuleIcon(${Icon.displayName ?? 'lucide'})`;
  return Wrapped;
}

export interface ModuleNavItem {
  /** TabType dono do destino — resolve meta (label/ícone) e activeTab da rota. */
  tab: TabType;
  /** Rótulo exibido; default = TAB_META[tab].label. */
  label?: string;
  /** Sub-rota real sob /app (ex.: `market-intelligence/hub`). Sem path → `/app/<tab>`. */
  path?: string;
  /** Query string anexada à rota (ex.: `view=decisores`). */
  query?: string;
  /** Agrupa itens sob um subtítulo dentro do painel do módulo. */
  section?: string;
  /** Gate de visibilidade equivalente ao da antiga sidebarSections. */
  requires?: 'copilotoIa' | 'commercialIntelligence' | 'operations' | 'admin';
}

export interface ProductModule {
  id: ModuleId;
  /** Código oficial do Documento Mestre (P01–P08, M09–M11); Hub não tem código. */
  code: string;
  label: string;
  tagline: string;
  icon: ModuleIcon;
  accent: NavAccent;
  /** Rota de entrada do módulo. `null` = módulo sem workspace web (M10 mobile). */
  home: string | null;
  /** Destino fora de /app (M11 Social Selling é rota top-level com RequireModuleAccess). */
  external?: boolean;
  /** 'mobile' = módulo existe apenas no app Capacitor; rail informa, não navega. */
  availability?: 'web' | 'mobile';
  items: ModuleNavItem[];
  /** TabTypes que ativam o módulo mesmo sem item de nav correspondente (ex.: settings_*). */
  extraTabs?: TabType[];
  /** Prefixos de rota extras que pertencem ao módulo (rotas sem TabType). */
  extraPaths?: string[];
}

export interface ModuleNavPermissions {
  canAccessCommercialIntelligence?: boolean;
  canAccessCopilotoIa?: boolean;
  canManageOperations?: boolean;
  isAdmin?: boolean;
}

const item = (
  tab: TabType,
  label?: string,
  extra?: Partial<ModuleNavItem>,
): ModuleNavItem => ({ tab, label, ...extra });

export const HUB_MODULE: ProductModule = {
  id: 'hub',
  code: 'HUB',
  label: 'Hub Central',
  tagline: 'Command Center e Meu Espaço',
  icon: asModuleIcon(LayoutDashboard),
  accent: 'gold',
  home: '/app',
  items: [
    item('dashboard', 'Visão Geral'),
    item('workspace', 'Meu Espaço'),
    item('daily-plan', 'Plano Diário'),
    item('notifications', 'Notificações'),
  ],
};

export const PRODUCT_MODULES: ProductModule[] = [
  {
    id: 'p01',
    code: 'P01',
    label: 'Hub Comercial',
    tagline: 'CRM 360°, negócios e relacionamentos',
    icon: HubIcon,
    accent: 'blue',
    home: '/app/crm',
    extraTabs: ['settings_hub'],
    items: [
      item('crm', 'Pipeline'),
      item('crm360', 'Gestão de Negócios'),
      item('propostas', 'Propostas'),
      { tab: 'companies', label: 'Empresas', section: 'Relacionamento' },
      item('contacts', 'Contatos & Decisores'),
      { tab: 'contacts', label: 'Mapeamento de Decisores', path: 'contacts', query: 'view=decisores' },
    ],
  },
  {
    id: 'p02',
    code: 'P02',
    label: 'Inteligência de Mercado',
    tagline: 'Prospecção, LDR e dossiês de conta',
    icon: IntelligenceIcon,
    accent: 'teal',
    home: '/app/prospect',
    extraTabs: ['settings_market'],
    items: [
      item('prospect', 'Prospecção'),
      { tab: 'prospect', label: 'Prospecção Inteligente', path: 'prospect/inteligente' },
      { tab: 'market-intelligence', label: 'Pesquisa LDR' },
      {
        tab: 'market-intelligence',
        label: 'Hub de Inteligência',
        path: 'market-intelligence/hub',
      },
    ],
  },
  {
    id: 'p03',
    code: 'P03',
    label: 'Orquestração de Vendas',
    tagline: 'Jornadas, cadências, rotinas e conteúdo',
    icon: OrchestrationIcon,
    accent: 'violet',
    home: '/app/jornadas',
    extraTabs: ['settings_sales'],
    items: [
      { tab: 'jornadas', label: 'Jornadas Comerciais', section: 'Orquestração' },
      item('playbooks', 'Playbooks Comerciais'),
      item('processos', 'Processos de Vendas'),
      { tab: 'roteiros', label: 'Roteiros de Abordagem' },
      { tab: 'cadence', label: 'Cadências' },
      {
        tab: 'activities',
        label: 'Tarefas & Atividades',
        section: 'Rotina Comercial',
      },
      item('calendar', 'Calendário'),
      {
        tab: 'roleplay',
        label: 'Roleplay IA',
        section: 'Treinamento',
      },
      item('qualification_matrix', 'Matriz de Qualificação'),
      item('objections_matrix', 'Matriz de Objeções'),
      item('topic_training', 'Academy'),
      {
        tab: 'chatbook',
        label: 'Chatbook',
        section: 'Conteúdo & Ajuda',
      },
      item('editor', 'Editor de Documentos'),
    ],
  },
  {
    id: 'p04',
    code: 'P04',
    label: 'Performance Comercial',
    tagline: 'Analytics, gamificação e relatórios',
    icon: PerformanceIcon,
    accent: 'gold',
    home: '/app/analytics',
    extraTabs: ['settings_performance'],
    extraPaths: ['war-room'],
    items: [
      item('analytics', 'Analytics'),
      item('winloss', 'Win/Loss'),
      item('reports', 'Relatórios Avançados'),
      item('gamification', 'Gamificação & Ranking'),
    ],
  },
  {
    id: 'p05',
    code: 'P05',
    label: 'Previsibilidade Comercial',
    tagline: 'Forecast, metas e pipeline ponderado',
    icon: ForecastIcon,
    accent: 'gold',
    home: '/app/forecast',
    extraTabs: ['settings_predictability'],
    items: [
      item('forecast', 'Forecast'),
      item('metas', 'Metas e Projeções'),
      item('pipeline_ponderado', 'Pipeline Ponderado'),
    ],
  },
  {
    id: 'p06',
    code: 'P06',
    label: 'Inteligência Artificial',
    tagline: 'Copiloto, sinais, riscos e conhecimento',
    icon: AIIcon,
    accent: 'iris',
    home: '/app/intelligence',
    extraTabs: ['settings_ai'],
    extraPaths: ['pending-actions', 'intelligence/elite-agent', 'intelligence/pending-actions'],
    items: [
      item('intelligence', 'Hub de IA'),
      {
        tab: 'copiloto_ia',
        label: 'Copiloto IA',
        requires: 'copilotoIa',
      },
      {
        tab: 'commercial_intelligence',
        label: 'Inteligência de Vendas',
        requires: 'commercialIntelligence',
      },
      { tab: 'signals-risks', label: 'Sinais & Riscos', section: 'Risco & Sinais' },
      {
        tab: 'signals-risks',
        label: 'Radar de Sinais',
        path: 'signals-risks/radar',
      },
      {
        tab: 'signals-risks',
        label: 'Riscos de Deals',
        path: 'signals-risks/deal-risks',
      },
      { tab: 'knowledge', label: 'Base de Conhecimento' },
      { tab: 'sdr-diagnostic', label: 'Diagnóstico SDR' },
    ],
  },
  {
    id: 'p07',
    code: 'P07',
    label: 'Automação & Conectividade',
    tagline: 'Automações, integrações e Bitrix24',
    icon: AutomationIcon,
    accent: 'blue',
    home: '/app/integrations',
    extraTabs: ['settings_automation'],
    items: [
      {
        tab: 'automations',
        label: 'Automações',
        requires: 'operations',
      },
      {
        tab: 'integrations',
        label: 'Integrações',
        requires: 'operations',
      },
      { tab: 'bitrix', label: 'Guia Prático Bitrix24' },
    ],
  },
  {
    id: 'p08',
    code: 'P08',
    label: 'Engajamento Comercial',
    tagline: 'Voz, telefonia e mesa de tratamento',
    icon: EngagementIcon,
    accent: 'red',
    home: '/app/mesa-tratamento',
    extraTabs: ['settings_engagement'],
    // Deep-links legados de voz/telefonia (voice-hub, outbound, dialer) seguem
    // resolvendo para o P08 mesmo estando fora da navegação (NAV_HIDDEN_TABS).
    extraPaths: ['voice-hub', 'outbound', 'dialer'],
    items: [
      // voice-hub/outbound/dialer seguem em NAV_HIDDEN_TABS (503 MODULE_NOT_READY
      // intencional — handoff 17→12). Mesa de Tratamento é o único destino web
      // liberado do pilar até o Agente 12 reabrir o gate.
      { tab: 'mesa-tratamento', label: 'Mesa de Tratamento' },
    ],
  },
  {
    id: 'm09',
    code: 'M09',
    label: 'Admin & Operations',
    tagline: 'Equipe, acessos, consumo e configurações',
    icon: asModuleIcon(ShieldCheck),
    accent: 'slate',
    home: '/app/settings',
    extraPaths: ['failover', 'resilience', 'characters'],
    items: [
      { tab: 'team', label: 'Equipe', requires: 'admin' },
      { tab: 'module-access', label: 'Acesso a Módulos', requires: 'admin' },
      { tab: 'usage', label: 'Consumo de IA', requires: 'admin' },
      item('settings', 'Ajustes Globais'),
    ],
  },
  {
    id: 'm10',
    code: 'M10',
    label: 'Mobile & Field Sales',
    tagline: 'Vendas em campo, offline-first e check-in',
    icon: asModuleIcon(Smartphone),
    accent: 'teal',
    home: null,
    availability: 'mobile',
    items: [],
  },
  {
    id: 'm11',
    code: 'M11',
    label: 'Social Selling',
    tagline: 'Sinais, copy e abordagem em 1 clique',
    icon: asModuleIcon(Share2),
    accent: 'red',
    home: '/social-selling',
    external: true,
    items: [],
  },
];

export const ALL_MODULES: ProductModule[] = [HUB_MODULE, ...PRODUCT_MODULES];

function itemVisible(itemDef: ModuleNavItem, permissions: ModuleNavPermissions): boolean {
  switch (itemDef.requires) {
    case 'copilotoIa':
      return !!permissions.canAccessCopilotoIa;
    case 'commercialIntelligence':
      return !!permissions.canAccessCommercialIntelligence;
    case 'operations':
      return !!permissions.canManageOperations;
    case 'admin':
      return !!permissions.isAdmin;
    default:
      return true;
  }
}

export function getVisibleModuleItems(
  module: ProductModule,
  permissions: ModuleNavPermissions,
): ModuleNavItem[] {
  return module.items.filter((i) => itemVisible(i, permissions));
}

/** Módulos do rail na ordem oficial (Hub fora — o logo já é o acesso ao Hub). */
export function getRailModules(permissions: ModuleNavPermissions): ProductModule[] {
  return PRODUCT_MODULES.filter((m) => {
    if (m.id === 'm10') return true; // sempre visível: informa que é o app mobile
    if (m.external) return true; // M11: a rota top-level aplica RequireModuleAccess
    return getVisibleModuleItems(m, permissions).length > 0 || m.home !== null;
  });
}

export function navTarget(itemDef: ModuleNavItem): string {
  const base = itemDef.path ?? itemDef.tab;
  return `/app/${base}${itemDef.query ? `?${itemDef.query}` : ''}`;
}

function pathPrefixes(module: ProductModule): string[] {
  const prefixes = module.items.map((i) => i.path ?? i.tab);
  if (module.home) prefixes.push(module.home.replace(/^\/app\/?/, ''));
  if (module.extraPaths) prefixes.push(...module.extraPaths);
  return prefixes.filter(Boolean);
}

function matchesPrefix(appPath: string, prefix: string): boolean {
  return appPath === prefix || appPath.startsWith(`${prefix}/`);
}

/**
 * Resolve o módulo dono da rota atual. Prioridade: prefixo mais longo entre os
 * itens/rotas do módulo; fallback por TabType do primeiro segmento; fallback Hub.
 */
export function getActiveModuleId(pathname: string): ModuleId {
  const appPath = pathname.replace(/^\/app\/?/, '').replace(/\/+$/, '');
  if (!appPath || appPath === 'dashboard') return 'hub';

  let best: { id: ModuleId; length: number } | null = null;
  for (const module of ALL_MODULES) {
    for (const prefix of pathPrefixes(module)) {
      if (matchesPrefix(appPath, prefix) && (!best || prefix.length > best.length)) {
        best = { id: module.id, length: prefix.length };
      }
    }
  }
  if (best) return best.id;

  const firstSegment = appPath.split('/')[0];
  const tab = firstSegment as TabType;
  for (const module of ALL_MODULES) {
    const tabs = new Set<TabType>([
      ...module.items.map((i) => i.tab),
      ...(module.extraTabs ?? []),
    ]);
    if (tabs.has(tab)) return module.id;
  }
  return 'hub';
}

export function getModuleById(id: ModuleId): ProductModule {
  return ALL_MODULES.find((m) => m.id === id) ?? HUB_MODULE;
}

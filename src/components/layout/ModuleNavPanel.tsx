import type { CSSProperties, MouseEvent } from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { hasRequiredRole } from '../../lib/auth/authorization.js';
import { BirthHubLogo } from '../brand/BirthHubLogo.js';
import { useSidebarState } from './hooks/useSidebarState.js';
import {
  getActiveModuleId,
  getModuleById,
  getVisibleModuleItems,
  type ModuleNavItem,
  type ModuleNavPermissions,
  PRODUCT_MODULES,
  type ProductModule,
} from './moduleRegistry.js';
import { getModuleTheme } from './moduleThemes.js';
import { getNavItemTheme, getModuleEmoji } from './navItemThemes.js';
import type { NavLaunch } from './NavLaunchTransition.js';
import { NavLaunchTransition } from './NavLaunchTransition.js';
import { TAB_META, type TabType } from './tabMeta.js';

interface ModuleNavPanelProps {
  activeTab: TabType;
  /** Drawer mobile: lista módulos + itens do módulo ativo em largura total. */
  mobile?: boolean;
  onCloseMobile?: () => void;
  onNavigate?: () => void;
}

const EASE =
  'motion-safe:transition-all motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]';
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
const ITEM = `sidebar-nav-card group relative flex w-full items-center gap-3 rounded-[18px] border px-3 text-[15px] tracking-[-0.012em] select-none cursor-pointer ${EASE} ${FOCUS_RING}`;
const ICON_WELL =
  'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[14px] motion-safe:transition-all motion-safe:duration-[220ms]';

function currentAppPath(pathname: string): string {
  return pathname.replace(/^\/app\/?/, '').replace(/\/+$/, '');
}

function matchesPath(appPath: string, prefix: string): boolean {
  return appPath === prefix || appPath.startsWith(`${prefix}/`);
}

function isItemActive(
  itemDef: ModuleNavItem,
  siblings: ModuleNavItem[],
  appPath: string,
  search: string,
): boolean {
  const prefix = itemDef.path ?? itemDef.tab;
  if (!matchesPath(appPath, prefix)) return false;
  // Um irmão com prefixo MAIS LONGO que também casa a URL desativa os itens
  // genéricos — ex.: em /app/market-intelligence/hub só "Hub de Inteligência"
  // fica ativo, não "Pesquisa LDR" (prefixo 'market-intelligence' também casa).
  const hasMoreSpecificSibling = siblings.some((o) => {
    if (o === itemDef) return false;
    const otherPrefix = o.path ?? o.tab;
    return (
      otherPrefix !== prefix &&
      otherPrefix.length > prefix.length &&
      matchesPath(appPath, otherPrefix)
    );
  });
  if (hasMoreSpecificSibling) return false;
  if (itemDef.query) return search.includes(itemDef.query);
  // Item "base" (sem query) não fica ativo quando um irmão com query casa a URL
  // atual — ex.: /app/contacts?view=decisores acende só "Mapeamento de Decisores".
  return !siblings.some(
    (o) =>
      o !== itemDef &&
      o.tab === itemDef.tab &&
      (o.path ?? o.tab) === prefix &&
      !!o.query &&
      search.includes(o.query),
  );
}

function useModulePermissions(): ModuleNavPermissions {
  const { currentUser, isAdmin, canAccessCommercialIntelligence, canAccessCopilotoIa } = useAuth();
  const canManageOperations =
    !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);
  return useMemo(
    () => ({
      canAccessCommercialIntelligence,
      canAccessCopilotoIa,
      canManageOperations,
      isAdmin,
    }),
    [canAccessCommercialIntelligence, canAccessCopilotoIa, canManageOperations, isAdmin],
  );
}

/**
 * Painel contextual do módulo ativo — com curvatura orgânica moderna (squircle),
 * paleta singular por card e título, emojis distintivos e animações táteis.
 */
export function ModuleNavPanel({
  activeTab,
  mobile = false,
  onCloseMobile,
  onNavigate,
}: ModuleNavPanelProps) {
  const { pathname, search } = useLocation();
  const appPath = currentAppPath(pathname);
  const moduleId = getActiveModuleId(pathname);
  const module = getModuleById(moduleId);
  const moduleTheme = getModuleTheme(module.id);
  const moduleEmoji = getModuleEmoji(module.id);
  const permissions = useModulePermissions();
  const { launch, openTab, finishLaunch, selectTab } = useSidebarState({
    activeTab,
    onCloseMobile,
  });

  const visibleItems = useMemo(
    () => getVisibleModuleItems(module, permissions),
    [module, permissions],
  );

  // Agrupa itens por `section` preservando a ordem de declaração.
  const sections = useMemo(() => {
    const map = new Map<string, ModuleNavItem[]>();
    for (const i of visibleItems) {
      const key = i.section ?? '';
      const list = map.get(key) ?? [];
      list.push(i);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [visibleItems]);

  const handleItemClick = (itemDef: ModuleNavItem, event: MouseEvent<HTMLButtonElement>) => {
    onNavigate?.();
    selectTab(
      itemDef.tab,
      event,
      itemDef.path ? `${itemDef.path}${itemDef.query ? `?${itemDef.query}` : ''}` : undefined,
    );
  };

  const handleModuleLaunch = (target: ProductModule) => {
    onNavigate?.();
    if (!target.home) return;
    if (target.external) {
      window.location.assign(target.home);
      return;
    }
    openTab(target.items[0]?.tab ?? 'dashboard', target.home.replace(/^\/app\/?/, ''));
  };

  const isHub = module.id === 'hub';
  // No Hub o lançador lista os módulos; no mobile ele aparece em TODO módulo —
  // sem ele, o drawer não teria como trocar de módulo fora do Hub Central.
  const showModuleLauncher = isHub || mobile;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-surface/95 dark:bg-bg/95 backdrop-blur-xl">
      {launch && <NavLaunchFallback launch={launch} onFinish={finishLaunch} />}

      {/* Cabeçalho do módulo */}
      <header className="flex shrink-0 items-center gap-3 border-b border-line/70 px-4 py-3.5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] border transition-transform duration-200 hover:scale-105"
          style={{
            borderColor: `color-mix(in srgb, ${moduleTheme.primaryColor} 45%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${moduleTheme.primaryColor} 14%, transparent)`,
            color: moduleTheme.primaryColor,
            boxShadow: `0 0 14px color-mix(in srgb, ${moduleTheme.primaryColor} 20%, transparent)`,
          }}
        >
          <module.icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className="truncate font-display text-[16px] font-bold leading-tight tracking-[-0.02em] flex items-center gap-1.5"
            style={{
              color: isHub ? '#FFC107' : moduleTheme.primaryColor,
            }}
          >
            <span aria-hidden="true" className="select-none text-[17px]">{moduleEmoji}</span>
            <span className="truncate">{module.label}</span>
          </h2>
          <p className="truncate text-[12px] text-ink-2 mt-0.5">{module.tagline}</p>
        </div>
      </header>

      {/* Itens do módulo */}
      <nav
        aria-label={`Navegação — ${module.label}`}
        className="bh-sidebar-nav flex-1 space-y-4 overflow-y-auto px-3 py-3.5"
      >
        {/* Botão de retorno rápido ao Hub Central quando dentro de um módulo */}
        {!isHub && (
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              openTab('dashboard', 'home');
            }}
            className="group mb-2 flex w-full items-center gap-2.5 rounded-[16px] border border-amber-500/30 bg-amber-500/8 px-3.5 py-2.5 text-[14px] font-semibold text-amber-600 dark:text-amber-400 transition-all duration-200 hover:border-amber-500/60 hover:bg-amber-500/16 hover:shadow-[0_0_16px_rgba(255,193,7,0.20)] hover:-translate-x-0.5 cursor-pointer"
            title="Voltar ao Portal dos 11 Módulos"
          >
            <span
              className="text-[15px] font-bold transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            >
              ←
            </span>
            <span className="flex-1 text-left font-display">Hub Central</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10.5px] font-bold tracking-wider text-amber-700 dark:text-amber-300">
              🏛️ 11 Módulos
            </span>
          </button>
        )}

        {sections.map(([section, items]) => (
          <div key={section || 'default'} className="space-y-1.5">
            {section && (
              <p className="px-1.5 pb-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink-2/90 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand/60" />
                <span>{section}</span>
              </p>
            )}
            {items.map((itemDef, idx) => {
              const meta = TAB_META[itemDef.tab] ?? TAB_META.dashboard;
              const Icon = meta.icon;
              const active = isItemActive(itemDef, visibleItems, appPath, search);
              const key = `${itemDef.tab}-${itemDef.path ?? ''}-${itemDef.query ?? ''}-${idx}`;
              const itemTheme = getNavItemTheme({
                tab: itemDef.tab,
                path: itemDef.path,
                query: itemDef.query,
                label: itemDef.label ?? meta.label,
              });
              const rawLabel = itemDef.label ?? meta.label;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => handleItemClick(itemDef, e)}
                  aria-label={rawLabel}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`module-nav-${module.id}-${itemDef.tab}${itemDef.path ? `-${itemDef.path.replace(/\//g, '-')}` : ''}`}
                  className={`${ITEM} ${mobile ? 'h-[50px]' : 'h-[46px]'} ${
                    active ? 'font-bold shadow-sm' : 'font-semibold'
                  }`}
                  style={
                    {
                      '--title-light': itemTheme.lightColor,
                      '--title-dark': itemTheme.darkColor,
                      backgroundColor: active
                        ? `color-mix(in srgb, ${itemTheme.color} 14%, transparent)`
                        : `color-mix(in srgb, ${itemTheme.color} 4%, transparent)`,
                      borderColor: active
                        ? itemTheme.color
                        : `color-mix(in srgb, ${itemTheme.color} 24%, transparent)`,
                      boxShadow: active
                        ? `0 4px 18px -2px color-mix(in srgb, ${itemTheme.color} 25%, transparent)`
                        : undefined,
                    } as CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = itemTheme.color;
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${itemTheme.color} 10%, transparent)`;
                      e.currentTarget.style.boxShadow = `0 4px 16px -2px color-mix(in srgb, ${itemTheme.color} 20%, transparent)`;
                      e.currentTarget.style.transform = 'translateX(3px) translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = `color-mix(in srgb, ${itemTheme.color} 24%, transparent)`;
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${itemTheme.color} 4%, transparent)`;
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = '';
                    }
                  }}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[7px] bottom-[7px] w-[3.5px] rounded-r-full"
                      style={{
                        backgroundColor: itemTheme.color,
                        boxShadow: `0 0 10px ${itemTheme.color}`,
                      }}
                    />
                  )}
                  <span
                    className={`${ICON_WELL} border`}
                    style={{
                      color: itemTheme.color,
                      backgroundColor: `color-mix(in srgb, ${itemTheme.color} 14%, transparent)`,
                      borderColor: `color-mix(in srgb, ${itemTheme.color} 30%, transparent)`,
                    }}
                  >
                    <Icon size={17} strokeWidth={active ? 2.25 : 1.85} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-sans text-[15px] flex items-center">
                    <span
                      aria-hidden="true"
                      className="mr-2 text-[16px] inline-block shrink-0 transition-transform duration-200 group-hover:scale-125 select-none"
                    >
                      {itemTheme.emoji}
                    </span>
                    <span
                      className="truncate text-[var(--title-light)] dark:text-[var(--title-dark)]"
                      style={{
                        textShadow: active
                          ? `0 0 12px color-mix(in srgb, ${itemTheme.color} 30%, transparent)`
                          : undefined,
                      }}
                    >
                      {rawLabel}
                    </span>
                  </span>
                  <span
                    className="h-2 w-2 rounded-full shrink-0 mr-0.5 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: itemTheme.color,
                      boxShadow: active ? `0 0 8px ${itemTheme.color}` : 'none',
                      opacity: active ? 1 : 0.45,
                    }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        ))}

        {showModuleLauncher && (
          <div className="space-y-1.5 pt-2">
            <p className="px-1.5 pb-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink-2/90 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-gold" />
              <span>Módulos do Sistema</span>
            </p>
            {PRODUCT_MODULES.map((m) => {
              const Icon = m.icon;
              const mobileOnly = m.availability === 'mobile';
              const theme = getModuleTheme(m.id);
              const emoji = getModuleEmoji(m.id);
              const isCurrentModule = m.id === moduleId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModuleLaunch(m)}
                  disabled={mobileOnly}
                  aria-disabled={mobileOnly || undefined}
                  aria-label={m.label}
                  aria-current={isCurrentModule ? 'page' : undefined}
                  title={
                    mobileOnly
                      ? `${emoji} ${m.label} — disponível no aplicativo mobile`
                      : `${emoji} ${m.label}`
                  }
                  data-testid={`module-launch-${m.id}`}
                  className={`${ITEM} ${mobile ? 'h-[50px]' : 'h-[48px]'} transition-all duration-200 ${
                    mobileOnly ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${isCurrentModule ? 'font-bold text-ink shadow-sm' : 'font-semibold'}`}
                  style={
                    {
                      '--mod-light': theme.light.accent,
                      '--mod-dark': theme.dark.accent,
                      backgroundColor: isCurrentModule
                        ? `color-mix(in srgb, ${theme.primaryColor} 14%, transparent)`
                        : `color-mix(in srgb, ${theme.primaryColor} 4%, transparent)`,
                      borderColor: isCurrentModule
                        ? theme.primaryColor
                        : `color-mix(in srgb, ${theme.primaryColor} 24%, transparent)`,
                      boxShadow: isCurrentModule
                        ? `0 0 16px color-mix(in srgb, ${theme.primaryColor} 25%, transparent)`
                        : undefined,
                    } as CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (!mobileOnly && !isCurrentModule) {
                      e.currentTarget.style.borderColor = theme.primaryColor;
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${theme.primaryColor} 10%, transparent)`;
                      e.currentTarget.style.boxShadow = `0 0 16px color-mix(in srgb, ${theme.primaryColor} 24%, transparent)`;
                      e.currentTarget.style.transform = 'translateX(3px) translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!mobileOnly && !isCurrentModule) {
                      e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primaryColor} 24%, transparent)`;
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${theme.primaryColor} 4%, transparent)`;
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = '';
                    }
                  }}
                >
                  {isCurrentModule && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[6px] bottom-[6px] w-[3.5px] rounded-r-full"
                      style={{
                        backgroundColor: theme.primaryColor,
                        boxShadow: `0 0 10px ${theme.primaryColor}`,
                      }}
                    />
                  )}
                  <span
                    className={`${ICON_WELL} border`}
                    style={{
                      color: theme.primaryColor,
                      backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 14%, transparent)`,
                      borderColor: `color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-sans text-[15px] flex items-center">
                    <span
                      aria-hidden="true"
                      className="mr-2 text-[16px] inline-block shrink-0 transition-transform duration-200 group-hover:scale-125 select-none"
                    >
                      {emoji}
                    </span>
                    <span
                      className="truncate text-[var(--mod-light)] dark:text-[var(--mod-dark)]"
                      style={{
                        textShadow: isCurrentModule
                          ? `0 0 12px color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`
                          : undefined,
                      }}
                    >
                      {m.label}
                    </span>
                  </span>
                  <span
                    className="h-2 w-2 rounded-full shrink-0 mr-0.5 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: theme.primaryColor,
                      boxShadow: `0 0 6px ${theme.primaryColor}`,
                    }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        )}

        {visibleItems.length === 0 && !isHub && (
          <p className="px-2 py-6 text-center text-xs text-ink-2">
            Este módulo não possui destinos web adicionais.
          </p>
        )}
      </nav>

      {/* Rodapé mobile */}
      {mobile && (
        <div className="shrink-0 border-t border-line/70 p-3">
          <div className="flex items-center gap-2 text-[11px] text-ink-2">
            <BirthHubLogo variant="mark" animated={false} className="h-4 w-4" />
            <span className="font-semibold">Birth Hub 360° — Revenue OS</span>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLaunchFallback({ launch, onFinish }: { launch: NavLaunch; onFinish: () => void }) {
  return <NavLaunchTransition launch={launch} onFinish={onFinish} />;
}

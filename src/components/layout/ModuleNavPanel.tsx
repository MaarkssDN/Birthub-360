import type { MouseEvent } from 'react';
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
const ITEM = `sidebar-nav-card group relative flex w-full items-center gap-3 rounded-[14px] border border-transparent px-3 text-[13.5px] tracking-[-0.012em] ${EASE} ${FOCUS_RING}`;
const ICON_WELL =
  'grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] motion-safe:transition-all motion-safe:duration-[220ms]';

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
 * Painel contextual do módulo ativo — substitui a listagem plana de ~30 itens.
 * Mostra somente os destinos do módulo dono da rota atual (ou do Hub), mais o
 * lançador dos 11 módulos quando o usuário está no Hub Central.
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
    <div className="flex h-full min-h-0 w-full flex-col bg-surface/95 dark:bg-bg/95">
      {launch && <NavLaunchFallback launch={launch} onFinish={finishLaunch} />}

      {/* Cabeçalho do módulo */}
      <header className="flex shrink-0 items-center gap-3 border-b border-line/70 px-4 py-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-line/80 bg-surface-2">
          <module.icon className="h-[18px] w-[18px] text-ink" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-[14px] font-bold leading-tight tracking-[-0.02em] text-ink">
            {module.label}
          </h2>
          <p className="truncate text-[10.5px] text-ink-2">{module.tagline}</p>
        </div>
      </header>

      {/* Itens do módulo */}
      <nav
        aria-label={`Navegação — ${module.label}`}
        className="bh-sidebar-nav flex-1 space-y-4 overflow-y-auto px-3 py-4"
      >
        {sections.map(([section, items]) => (
          <div key={section || 'default'} className="space-y-1">
            {section && (
              <p className="px-1 pb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-2/80">
                {section}
              </p>
            )}
            {items.map((itemDef, idx) => {
              const meta = TAB_META[itemDef.tab] ?? TAB_META.dashboard;
              const Icon = meta.icon;
              const active = isItemActive(itemDef, visibleItems, appPath, search);
              const key = `${itemDef.tab}-${itemDef.path ?? ''}-${itemDef.query ?? ''}-${idx}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => handleItemClick(itemDef, e)}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`module-nav-${module.id}-${itemDef.tab}${itemDef.path ? `-${itemDef.path.replace(/\//g, '-')}` : ''}`}
                  className={`${ITEM} ${
                    active
                      ? 'sidebar-card-active-cyan text-ink'
                      : 'sidebar-card-idle text-ink-2 hover:text-ink'
                  } ${mobile ? 'h-11' : 'h-[42px]'}`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-full bg-brand shadow-[0_0_10px_var(--color-brand)]"
                    />
                  )}
                  <span
                    className={`${ICON_WELL} ${
                      active
                        ? 'bg-brand/15 text-sky-700 dark:text-brand border border-brand/40'
                        : 'bg-surface-2 text-ink-2 border border-transparent group-hover:bg-surface group-hover:text-ink'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2 : 1.75} />
                  </span>
                  <span
                    className={`truncate font-sans ${
                      active ? 'font-semibold text-ink' : 'font-medium'
                    }`}
                  >
                    {itemDef.label ?? meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        {showModuleLauncher && (
          <div className="space-y-1">
            <p className="px-1 pb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-2/80">
              Módulos
            </p>
            {PRODUCT_MODULES.map((m) => {
              const Icon = m.icon;
              const mobileOnly = m.availability === 'mobile';
              const theme = getModuleTheme(m.id);
              const isCurrentModule = m.id === moduleId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModuleLaunch(m)}
                  disabled={mobileOnly}
                  aria-disabled={mobileOnly || undefined}
                  aria-current={isCurrentModule ? 'page' : undefined}
                  title={mobileOnly ? `${m.label} — disponível no aplicativo mobile` : m.label}
                  data-testid={`module-launch-${m.id}`}
                  className={`${ITEM} h-[44px] transition-all duration-200 ${
                    mobileOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${isCurrentModule ? 'font-semibold text-ink shadow-sm' : 'text-ink-2 hover:text-ink'}`}
                  style={{
                    backgroundColor: isCurrentModule
                      ? `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`
                      : `color-mix(in srgb, ${theme.primaryColor} 4%, transparent)`,
                    borderColor: isCurrentModule
                      ? theme.primaryColor
                      : `color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`,
                    boxShadow: isCurrentModule
                      ? `0 0 14px color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!mobileOnly && !isCurrentModule) {
                      e.currentTarget.style.borderColor = theme.primaryColor;
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${theme.primaryColor} 10%, transparent)`;
                      e.currentTarget.style.boxShadow = `0 0 16px color-mix(in srgb, ${theme.primaryColor} 24%, transparent)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!mobileOnly && !isCurrentModule) {
                      e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`;
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${theme.primaryColor} 4%, transparent)`;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {isCurrentModule && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full"
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
                      backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 15%, transparent)`,
                      borderColor: `color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-sans">
                    {m.label}
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
          <div className="flex items-center gap-2 text-[10px] text-ink-2">
            <BirthHubLogo variant="mark" animated={false} className="h-4 w-4" />
            <span>Birth Hub 360° — Revenue OS</span>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLaunchFallback({ launch, onFinish }: { launch: NavLaunch; onFinish: () => void }) {
  return <NavLaunchTransition launch={launch} onFinish={onFinish} />;
}

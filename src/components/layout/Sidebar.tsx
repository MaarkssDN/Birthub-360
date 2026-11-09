import { ChevronDown, ChevronLeft, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { hasRequiredRole } from '../../lib/auth/authorization.js';
import { BirthHubLogo } from '../brand/BirthHubLogo.js';
import { useSidebarState } from './hooks/useSidebarState.js';
import { NavLaunchTransition } from './NavLaunchTransition.js';
import { getSidebarNavSections, type NavSubItem } from './sidebarSections.js';
import type { TabType } from './tabMeta.js';
import './Sidebar.css';

/**
 * IMPECCABLE SIDEBAR — Birth Hub 360°
 *
 * Redesign completo seguindo princípios de craft award-winning:
 * - Superfícies esculpidas com profundidade real e micro-chanfro especular
 * - Itens em formato pill com icon wells de alta precisão
 * - Indicadores semânticos com glow elétrico (Cyan, Gold, Iris, Pink)
 * - Transições fluidas com cubic-bezier(0.22, 1, 0.36, 1)
 * - Contraste WCAG 2.2 AA inegociável em Light/Dark mode
 * - Estados claros: idle, hover, active, focus, disabled
 * - Suporte completo a reduced-motion
 */

interface SidebarProps {
  activeTab: TabType;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type AccentColor = 'cyan' | 'pink' | 'gold' | 'iris';

function getGroupAccent(groupId: string, sectionTitle: string): AccentColor {
  if (/copilot|intelligence|automations|cadence/.test(groupId)) return 'iris';
  if (/signals-risks|gamification|contacts|decisores/.test(groupId)) return 'pink';
  if (/revenue|performance|metas|forecast|activities/.test(groupId)) return 'gold';
  if (/prospect|market-intelligence|companies|integrations|dashboard|workspace/.test(groupId))
    return 'cyan';

  if (sectionTitle === 'RECEITA' || sectionTitle === 'PERFORMANCE') return 'gold';
  if (sectionTitle === 'INTELLIGENCE' || sectionTitle === 'INTELIGÊNCIA') return 'iris';
  if (sectionTitle === 'RELATIONSHIPS' || sectionTitle === 'RELACIONAMENTO') return 'pink';
  return 'cyan';
}

function getSectionBadgeStyle(title: string): {
  border: string;
  bg: string;
  text: string;
  dot: string;
} {
  switch (title) {
    case 'COMMAND CENTER':
    case 'CENTRAL DE COMANDO':
    case 'EXECUTION':
    case 'EXECUÇÃO':
      return {
        border: 'border-[#00D4FF]/35',
        bg: 'bg-[#00D4FF]/10',
        text: 'text-[#0284c7] dark:text-[#00D4FF]',
        dot: 'bg-[#00D4FF]',
      };
    case 'RECEITA':
    case 'PERFORMANCE':
      return {
        border: 'border-[#F59E0B]/35',
        bg: 'bg-[#F59E0B]/10',
        text: 'text-[#b45309] dark:text-[#F59E0B]',
        dot: 'bg-[#F59E0B]',
      };
    case 'INTELLIGENCE':
    case 'INTELIGÊNCIA':
      return {
        border: 'border-[#8B7DFF]/35',
        bg: 'bg-[#8B7DFF]/10',
        text: 'text-[#6d28d9] dark:text-[#8B7DFF]',
        dot: 'bg-[#8B7DFF]',
      };
    case 'RELATIONSHIPS':
    case 'RELACIONAMENTO':
      return {
        border: 'border-[#FF2D9B]/35',
        bg: 'bg-[#FF2D9B]/10',
        text: 'text-[#be185d] dark:text-[#FF2D9B]',
        dot: 'bg-[#FF2D9B]',
      };
    default:
      return {
        border: 'border-line',
        bg: 'bg-surface-2',
        text: 'text-ink-2',
        dot: 'bg-ink-2',
      };
  }
}

function getActiveIconWellStyle(accent: AccentColor): string {
  switch (accent) {
    case 'cyan':
      return 'bg-[#00D4FF]/15 text-[#0284c7] dark:text-[#00D4FF] border border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.3)]';
    case 'pink':
      return 'bg-[#FF2D9B]/15 text-[#be185d] dark:text-[#FF2D9B] border border-[#FF2D9B]/50 shadow-[0_0_12px_rgba(255,45,155,0.3)]';
    case 'gold':
      return 'bg-[#F59E0B]/15 text-[#b45309] dark:text-[#F59E0B] border border-[#F59E0B]/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
    case 'iris':
      return 'bg-[#8B7DFF]/15 text-[#6d28d9] dark:text-[#8B7DFF] border border-[#8B7DFF]/50 shadow-[0_0_12px_rgba(139,125,255,0.3)]';
  }
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

// Premium easing curve inline nas classes Tailwind
const EASE =
  'motion-safe:transition-all motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]';

// Container do item com hover elevado
const ITEM = `sidebar-nav-card group relative flex w-full items-center gap-3 text-[13.5px] tracking-[-0.012em] rounded-[14px] border border-transparent ${EASE} ${FOCUS_RING}`;

// Icon well com profundidade e brilho
const ICON_WELL =
  'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] motion-safe:transition-all motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]';

const ICON_WELL_QUIET =
  'bg-surface-2 text-ink-2 border border-transparent group-hover:bg-surface group-hover:border-line group-hover:text-ink group-hover:shadow-sm';

// Botão de controle ghost
const GHOST_CONTROL = `grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-transparent text-ink-2 hover:bg-surface-2 hover:border-line hover:text-ink ${EASE} ${FOCUS_RING}`;

/** Caminho atual relativo a /app (ex.: `market-intelligence/hub`). */
function currentAppPath(pathname: string): string {
  return pathname.replace(/^\/app\/?/, '').replace(/\/+$/, '');
}

function matchesPath(appPath: string, path: string): boolean {
  return appPath === path || appPath.startsWith(`${path}/`);
}

/**
 * Sub-item com `path` só ativa na própria sub-rota; sub-item sem `path` ativa pela aba, exceto
 * quando a URL atual pertence a um irmão com `path` (ex.: LDR não acende em `/hub`).
 */
function isSubItemActive(
  sub: NavSubItem,
  siblings: NavSubItem[],
  activeTab: TabType,
  appPath: string,
): boolean {
  if (sub.path) return matchesPath(appPath, sub.path);
  if (sub.tab !== activeTab) return false;
  return !siblings.some((s) => s.path && matchesPath(appPath, s.path));
}

export function Sidebar({
  activeTab,
  mobileOpen = false,
  onCloseMobile,
  collapsed: externalCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const {
    isCollapsed: rawCollapsed,
    toggleCollapse,
    hoveredGroupId,
    setHoveredGroupId,
    expandedGroups,
    toggleGroupExpand,
    launch,
    openTab,
    finishLaunch,
    selectTab,
  } = useSidebarState({
    activeTab,
    onCloseMobile,
    collapsed: externalCollapsed,
    onToggleCollapse,
  });
  const isCollapsed = mobileOpen ? false : rawCollapsed;
  const [popoverTop, setPopoverTop] = useState<number | null>(null);

  const { pathname } = useLocation();
  const appPath = currentAppPath(pathname);

  const { currentUser, isAdmin, canAccessCommercialIntelligence, canAccessCopilotoIa } = useAuth();

  const canManageOperations =
    !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);

  const navSections = useMemo(
    () =>
      getSidebarNavSections({
        canAccessCommercialIntelligence,
        canAccessCopilotoIa,
        canManageOperations,
        isAdmin,
      }),
    [canAccessCommercialIntelligence, canAccessCopilotoIa, canManageOperations, isAdmin],
  );

  return (
    <>
      {launch && <NavLaunchTransition launch={launch} onFinish={finishLaunch} />}

      <aside
        className={`bh-sidebar relative z-30 flex h-full flex-col bg-surface/98 dark:bg-[#111214]/98 backdrop-blur-xl font-sans text-ink select-none ${
          mobileOpen
            ? 'bh-sidebar--mobile bh-sidebar--mobile-open w-[288px]'
            : `hidden border-r border-line/80 lg:flex motion-safe:transition-[width] motion-safe:duration-[280ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isCollapsed ? 'bh-sidebar--collapsed w-[72px]' : 'w-[272px]'
              }`
        }`}
        aria-label="Navegação Principal"
      >
        {/* Brand Header — Impeccable */}
        <header
          className={`bh-sidebar-header flex shrink-0 items-center ${
            isCollapsed ? 'h-[68px] justify-center px-2' : 'h-[68px] justify-between gap-3 px-4'
          }`}
        >
          <button
            type="button"
            onClick={() => openTab('dashboard')}
            className={`bh-sidebar-logo-wrapper flex min-w-0 items-center gap-3 text-left rounded-2xl p-1 ${EASE} ${FOCUS_RING} hover:opacity-95`}
            title="Birth Hub 360° — Ir para Visão Geral"
            aria-label="Birth Hub 360° — Ir para Visão Geral"
          >
            <span className="bh-sidebar-logo grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-surface-2 border border-line/80 shadow-sm motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:rotate-[-2deg]">
              <BirthHubLogo
                variant="mark"
                animated={false}
                className="h-6 w-6 drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]"
              />
            </span>
            {!isCollapsed && (
              <div className="bh-sidebar-wordmark min-w-0 motion-safe:transition-opacity motion-safe:duration-200">
                <div className="bh-sidebar-wordmark-title truncate font-display text-[15px] font-bold leading-tight tracking-[-0.02em] text-ink">
                  Birth Hub{' '}
                  <span className="text-brand dark:text-[#00D4FF] dark:drop-shadow-[0_0_8px_rgba(0,212,255,0.45)]">
                    360°
                  </span>
                </div>
                <div className="bh-sidebar-wordmark-sub mt-0.5 flex items-center gap-1.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-ink-2">
                  <span
                    className="h-[5px] w-[5px] rounded-full bg-[#D4F434] shadow-[0_0_8px_#D4F434] motion-safe:animate-pulse"
                    aria-hidden="true"
                  />
                  <span>Revenue OS</span>
                </div>
              </div>
            )}
          </button>

          {mobileOpen ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className={`bh-sidebar-mobile-close lg:hidden ${GHOST_CONTROL}`}
              title="Fechar navegação"
              aria-label="Fechar navegação"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          ) : (
            !isCollapsed && (
              <button
                type="button"
                onClick={toggleCollapse}
                className={`bh-sidebar-collapse-btn hidden lg:grid ${GHOST_CONTROL}`}
                title="Recolher menu lateral"
                aria-label="Recolher menu lateral"
              >
                <ChevronLeft
                  size={14}
                  strokeWidth={1.75}
                  className="motion-safe:transition-transform motion-safe:duration-250"
                />
              </button>
            )
          )}
        </header>

        {isCollapsed && !mobileOpen && (
          <div className="flex shrink-0 justify-center pb-2">
            <button
              type="button"
              onClick={toggleCollapse}
              className={`bh-sidebar-collapse-btn ${GHOST_CONTROL}`}
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
            >
              <ChevronLeft
                size={14}
                strokeWidth={1.75}
                className="rotate-180 motion-safe:transition-transform motion-safe:duration-250"
              />
            </button>
          </div>
        )}

        <div
          aria-hidden="true"
          className={`h-px shrink-0 bg-gradient-to-r from-transparent via-line/60 to-transparent ${isCollapsed ? 'mx-3' : 'mx-4'}`}
        />

        {/* Scrollable Nav Items — Impeccable */}
        <nav
          className={`bh-sidebar-nav sidebar-scroll-container flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-line hover:scrollbar-thumb-line-strong ${
            isCollapsed ? 'space-y-4 px-2' : 'space-y-5 px-3'
          }`}
        >
          {navSections.map((section) => {
            const sectionBadge = getSectionBadgeStyle(section.title);
            return (
              <div key={section.title} className="bh-sidebar-section space-y-2">
                {!isCollapsed ? (
                  <div className="bh-sidebar-section-header flex items-center gap-2 px-1 pt-2 pb-1 sticky top-0 bg-surface/95 dark:bg-[#111214]/95 backdrop-blur-sm z-[1]">
                    <span
                      className={`bh-sidebar-section-badge inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] border ${sectionBadge.bg} ${sectionBadge.border} ${sectionBadge.text}`}
                    >
                      <span
                        className={`bh-sidebar-section-badge-dot h-[5px] w-[5px] rounded-full ${sectionBadge.dot} shadow-[0_0_6px_currentColor]`}
                        aria-hidden="true"
                      />
                      {section.title}
                    </span>
                    <div
                      className="flex-1 h-px bg-gradient-to-r from-line/50 to-transparent"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div
                    className="mx-auto my-2 h-px w-6 rounded-full bg-line/60"
                    aria-hidden="true"
                  />
                )}

                {section.groups.map((group) => {
                  const Icon = group.icon;
                  const subItems = group.subItems ?? [];
                  const hasSubItems = subItems.length > 0;
                  const isGroupExpanded = !!expandedGroups[group.id];
                  const anySubActive = subItems.some((sub) =>
                    isSubItemActive(sub, subItems, activeTab, appPath),
                  );
                  const isPrimaryActive = group.primaryTab === activeTab;
                  const isActive = isPrimaryActive || anySubActive;
                  const accent = getGroupAccent(group.id, section.title);

                  const cardStyleClass = isActive
                    ? `sidebar-card-active-${accent}`
                    : 'sidebar-card-idle';

                  return (
                    <section
                      key={group.id}
                      aria-label={group.label}
                      className="bh-sidebar-group relative"
                      onMouseEnter={(e) => {
                        if (isCollapsed) {
                          setHoveredGroupId(group.id);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoverTop(rect.top);
                        }
                      }}
                      onMouseLeave={() => {
                        if (isCollapsed) {
                          setHoveredGroupId(null);
                          setPopoverTop(null);
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          if (hasSubItems && !isCollapsed) {
                            toggleGroupExpand(group.id, e);
                          }
                          if (group.primaryTab) {
                            selectTab(group.primaryTab, e);
                          }
                        }}
                        className={`bh-sidebar-item ${ITEM} ${
                          isCollapsed
                            ? 'h-[42px] justify-center px-0 rounded-[14px]'
                            : 'h-[44px] justify-between pr-3 pl-[10px]'
                        } ${cardStyleClass}`}
                        aria-label={group.ariaLabel || group.label}
                        aria-current={isActive && !hasSubItems ? 'page' : undefined}
                        aria-expanded={hasSubItems && !isCollapsed ? isGroupExpanded : undefined}
                        title={isCollapsed ? group.label : undefined}
                        data-testid={`sidebar-nav-${group.id}`}
                        data-tooltip={isCollapsed ? group.label : undefined}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className={`absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-r-full motion-safe:transition-all motion-safe:duration-300 ${
                              accent === 'cyan'
                                ? 'bg-[#00D4FF] shadow-[0_0_12px_#00D4FF]'
                                : accent === 'gold'
                                  ? 'bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]'
                                  : accent === 'pink'
                                    ? 'bg-[#FF2D9B] shadow-[0_0_12px_#FF2D9B]'
                                    : 'bg-[#8B7DFF] shadow-[0_0_12px_#8B7DFF]'
                            }`}
                          />
                        )}

                        <span className="bh-sidebar-item-content flex min-w-0 items-center gap-3">
                          <span
                            data-nav-icon
                            className={`bh-sidebar-item-icon ${ICON_WELL} ${
                              isActive ? getActiveIconWellStyle(accent) : ICON_WELL_QUIET
                            }`}
                          >
                            <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                          </span>
                          {!isCollapsed && (
                            <span
                              className={`bh-sidebar-item-label truncate font-sans text-[13.5px] tracking-[-0.012em] motion-safe:transition-colors ${
                                isActive
                                  ? 'font-semibold text-ink'
                                  : 'font-medium text-ink-2 group-hover:text-ink'
                              }`}
                            >
                              {group.label}
                            </span>
                          )}
                        </span>

                        {!isCollapsed && hasSubItems && (
                          <ChevronDown
                            size={14}
                            strokeWidth={1.75}
                            aria-hidden="true"
                            className={`bh-sidebar-item-chevron shrink-0 text-ink-2 motion-safe:transition-transform motion-safe:duration-200 ${
                              isGroupExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>

                      {/* Sub-items Pocket — Expandable with animation */}
                      {!isCollapsed && hasSubItems && isGroupExpanded && (
                        <div className="bh-sidebar-subitems sidebar-subitems-pocket mt-1.5 mb-2 ml-[18px] mr-2 py-1.5 px-1 space-y-0.5 border-l-2 border-line/60">
                          {subItems.map((subItem) => {
                            const isSubActive = isSubItemActive(
                              subItem,
                              subItems,
                              activeTab,
                              appPath,
                            );
                            return (
                              <button
                                key={(subItem.path ?? subItem.tab) + subItem.label}
                                type="button"
                                onClick={(e) => selectTab(subItem.tab, e, subItem.path)}
                                className={`bh-sidebar-subitem group/sub flex h-[32px] w-full items-center rounded-[10px] px-3 text-left text-[12.5px] tracking-[-0.01em] ${EASE} ${FOCUS_RING} ${
                                  isSubActive
                                    ? accent === 'cyan'
                                      ? 'bg-[#00D4FF]/12 border border-[#00D4FF]/35 text-[#0284c7] dark:text-[#00D4FF] font-semibold'
                                      : accent === 'gold'
                                        ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#b45309] dark:text-[#F59E0B] font-semibold shadow-xs'
                                        : accent === 'pink'
                                          ? 'bg-[#FF2D9B]/15 border border-[#FF2D9B]/40 text-[#be185d] dark:text-[#FF2D9B] font-semibold shadow-xs'
                                          : 'bg-[#8B7DFF]/15 border border-[#8B7DFF]/40 text-[#6d28d9] dark:text-[#8B7DFF] font-semibold shadow-xs'
                                    : 'text-ink-2 hover:bg-surface hover:text-ink'
                                }`}
                                aria-current={isSubActive ? 'page' : undefined}
                                data-testid={`sidebar-sub-${subItem.path ?? subItem.tab}`}
                              >
                                <span
                                  className={`mr-2 h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                                    isSubActive
                                      ? 'bg-current shadow-[0_0_6px_currentColor]'
                                      : 'bg-line-strong group-hover/sub:bg-ink-2'
                                  }`}
                                  aria-hidden="true"
                                />
                                <span className="truncate">{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isCollapsed && hoveredGroupId === group.id && (
                        <div
                          className="sidebar-rail-popover-card fixed left-[4.75rem] z-50 ml-1 min-w-[14rem] p-2"
                          style={{ top: popoverTop !== null ? `${popoverTop}px` : undefined }}
                        >
                          <div className="flex items-center gap-1.5 px-2.5 pt-1 pb-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${sectionBadge.dot} shadow-[0_0_6px_currentColor]`}
                            />
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
                              {group.label}
                            </p>
                          </div>
                          {hasSubItems ? (
                            <div className="space-y-0.5">
                              {subItems.map((sub) => {
                                const isSubActive = isSubItemActive(
                                  sub,
                                  subItems,
                                  activeTab,
                                  appPath,
                                );
                                return (
                                  <button
                                    key={(sub.path ?? sub.tab) + sub.label}
                                    type="button"
                                    onClick={(e) => {
                                      selectTab(sub.tab, e, sub.path);
                                      setHoveredGroupId(null);
                                      setPopoverTop(null);
                                    }}
                                    className={`flex h-8 w-full items-center rounded-xl px-2.5 text-left text-[12px] tracking-[-0.011em] transition-all ${FOCUS_RING} ${
                                      isSubActive
                                        ? 'bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#0284c7] dark:text-[#00D4FF] font-semibold'
                                        : 'text-ink-2 hover:bg-surface hover:text-ink'
                                    }`}
                                  >
                                    <span className="truncate">{sub.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            group.primaryTab && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (group.primaryTab) {
                                    selectTab(group.primaryTab, e);
                                    setHoveredGroupId(null);
                                    setPopoverTop(null);
                                  }
                                }}
                                className={`flex h-8 w-full items-center rounded-xl px-2.5 text-left text-[12px] tracking-[-0.011em] text-ink-2 hover:bg-surface hover:text-ink transition-all ${FOCUS_RING}`}
                              >
                                <span>Abrir {group.label}</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Card — Impeccable CTA */}
        <footer
          className={`bh-sidebar-footer shrink-0 ${isCollapsed ? 'px-2 pt-3 pb-4' : 'px-3 pt-3 pb-4'}`}
        >
          <div
            aria-hidden="true"
            className="mb-3 h-px bg-gradient-to-r from-transparent via-line/60 to-transparent"
          />
          {!isCollapsed ? (
            <div className="bh-sidebar-footer-card sidebar-footer-card p-3 rounded-[14px]">
              <button
                type="button"
                onClick={() => openTab('intelligence')}
                className={`group flex w-full items-center justify-between gap-3 text-left ${EASE} ${FOCUS_RING}`}
                data-testid="sidebar-intelligence-cta"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="bh-sidebar-footer-card-icon grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#8B7DFF]/12 text-[#6d28d9] dark:text-[#8B7DFF] border border-[#8B7DFF]/30 shadow-[0_0_12px_rgba(139,125,255,0.2)] motion-safe:transition-all motion-safe:duration-200 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(139,125,255,0.35)]">
                    <Sparkles
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="motion-safe:transition-transform motion-safe:duration-200 group-hover:rotate-12"
                    />
                  </span>
                  <div className="bh-sidebar-footer-card-content min-w-0">
                    <div className="bh-sidebar-footer-card-title truncate font-display text-[13px] font-semibold text-ink group-hover:text-brand-text dark:group-hover:text-brand motion-safe:transition-colors">
                      Hub de IA &amp; Agentes
                    </div>
                    <div className="bh-sidebar-footer-card-meta flex items-center gap-[6px] mt-0.5">
                      <span
                        className="bh-sidebar-footer-card-status w-[6px] h-[6px] rounded-full bg-[#D4F434] shadow-[0_0_8px_#D4F434] motion-safe:animate-pulse"
                        aria-hidden="true"
                      />
                      <span className="bh-sidebar-footer-card-desc truncate font-mono text-[10px] font-medium text-ink-2">
                        12 Agentes Ativos
                      </span>
                    </div>
                  </div>
                </div>
                <span className="bh-sidebar-footer-card-badge font-mono text-[9px] font-bold px-2 py-1 rounded-[6px] bg-[#D4F434]/12 text-[#5a6b17] dark:text-[#D4F434] border border-[#D4F434]/25 shrink-0 uppercase tracking-[0.04em]">
                  AUTO
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openTab('intelligence')}
              className={`bh-sidebar-footer-card sidebar-footer-card mx-auto grid h-[42px] w-[42px] place-items-center rounded-[14px] text-[#6d28d9] dark:text-[#8B7DFF] hover:scale-105 motion-safe:transition-all ${FOCUS_RING}`}
              title="Ver Hub de IA"
              aria-label="Ver Hub de IA"
              data-testid="sidebar-intelligence-icon"
            >
              <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

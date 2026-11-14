import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { hasRequiredRole } from '../../lib/auth/authorization.js';
import { SoundFX } from '../../lib/soundEffects.js';
import { BirthHubLogo } from '../brand/BirthHubLogo.js';
import { getActiveModuleId, getRailModules, type ProductModule } from './moduleRegistry.js';
import { getModuleTheme } from './moduleThemes.js';
import { getModuleEmoji } from './navItemThemes.js';

interface ModuleRailProps {
  /** Painel contextual recolhido — rail ganha o botão de reabrir. */
  panelCollapsed: boolean;
  onTogglePanel: () => void;
}

const ITEM_EASE =
  'motion-safe:transition-all motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]';

const RAIL_BUTTON = `relative grid h-11 w-11 place-items-center rounded-[16px] border border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${ITEM_EASE}`;

type PanelAccent = 'cyan' | 'pink' | 'gold' | 'iris';

function railAccentClass(accent: PanelAccent, active: boolean): string {
  if (!active) return '';
  switch (accent) {
    case 'cyan':
      return 'bg-brand/12 text-sky-700 dark:text-brand border-brand/40 shadow-[0_0_14px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]';
    case 'pink':
      return 'bg-brand-2/12 text-pink-700 dark:text-brand-2 border-brand-2/40 shadow-[0_0_14px_color-mix(in_srgb,var(--color-brand-2)_25%,transparent)]';
    case 'gold':
      return 'bg-neon-gold/12 text-amber-700 dark:text-neon-gold border-neon-gold/40 shadow-[0_0_14px_color-mix(in_srgb,var(--color-neon-gold)_25%,transparent)]';
    case 'iris':
      return 'bg-iris/12 text-violet-700 dark:text-iris border-iris/40 shadow-[0_0_14px_color-mix(in_srgb,var(--color-iris)_25%,transparent)]';
  }
}

function activeBarClass(accent: PanelAccent): string {
  switch (accent) {
    case 'cyan':
      return 'bg-brand shadow-[0_0_10px_var(--color-brand)]';
    case 'pink':
      return 'bg-brand-2 shadow-[0_0_10px_var(--color-brand-2)]';
    case 'gold':
      return 'bg-neon-gold shadow-[0_0_10px_var(--color-neon-gold)]';
    case 'iris':
      return 'bg-iris shadow-[0_0_10px_var(--color-iris)]';
  }
}

/**
 * Rail global de módulos — substitui a sidebar de ~30 itens. Cada botão é um
 * dos 11 módulos oficiais (P01–P08, M09–M11) ou o Hub Central (logo).
 * Ícones-only por definição: rótulos vivem no tooltip e no painel contextual.
 */
export function ModuleRail({ panelCollapsed, onTogglePanel }: ModuleRailProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeModuleId = getActiveModuleId(pathname);
  const isHub = activeModuleId === 'hub';

  const { currentUser, isAdmin, canAccessCommercialIntelligence, canAccessCopilotoIa } = useAuth();
  const canManageOperations =
    !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);

  const modules = useMemo(
    () =>
      getRailModules({
        canAccessCommercialIntelligence,
        canAccessCopilotoIa,
        canManageOperations,
        isAdmin,
      }),
    [canAccessCommercialIntelligence, canAccessCopilotoIa, canManageOperations, isAdmin],
  );

  const goHome = () => {
    SoundFX.play('navigate');
    void navigate('/app');
  };

  const openModule = (module: ProductModule) => {
    if (module.id === activeModuleId && module.home) return;
    SoundFX.play('navigate');
    if (module.external && module.home) {
      // M11 Social Selling é rota top-level própria (RequireModuleAccess).
      window.location.assign(module.home);
      return;
    }
    if (module.home) void navigate(module.home);
  };

  return (
    <nav
      aria-label="Módulos do Birth Hub 360°"
      className="bh-module-rail relative z-30 flex h-full w-[68px] shrink-0 flex-col items-center gap-1 border-r border-line/80 bg-surface/95 py-3 backdrop-blur-xl dark:bg-bg/95"
    >
      {/* Hub Central — logo */}
      <button
        type="button"
        onClick={goHome}
        title="Hub Central — Visão Geral"
        aria-label="Hub Central — Visão Geral"
        aria-current={isHub ? 'page' : undefined}
        data-testid="module-rail-hub"
        className={`${RAIL_BUTTON} ${isHub ? railAccentClass('gold', true) : ''}`}
      >
        {isHub && (
          <span
            aria-hidden="true"
            className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${activeBarClass('gold')}`}
          />
        )}
        <BirthHubLogo
          variant="mark"
          animated={false}
          className="h-6 w-6 drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]"
        />
      </button>

      <div
        aria-hidden="true"
        className="my-1 h-px w-8 rounded-full bg-gradient-to-r from-transparent via-line/60 to-transparent"
      />

      {/* 11 módulos oficiais */}
      <div className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-line px-1.5">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModuleId === module.id;
          const isMobileOnly = module.availability === 'mobile';
          const theme = getModuleTheme(module.id);
          const emoji = getModuleEmoji(module.id);
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => openModule(module)}
              disabled={isMobileOnly}
              aria-disabled={isMobileOnly || undefined}
              title={
                isMobileOnly
                  ? `${emoji} ${module.label} — disponível no aplicativo mobile`
                  : `${emoji} ${module.label} — ${module.tagline}`
              }
              aria-label={module.label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`module-rail-${module.id}`}
              className={`${RAIL_BUTTON} group transition-all duration-200 ${
                isMobileOnly ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                backgroundColor: isActive
                  ? `color-mix(in srgb, ${theme.primaryColor} 16%, transparent)`
                  : undefined,
                borderColor: isActive
                  ? `color-mix(in srgb, ${theme.primaryColor} 55%, transparent)`
                  : undefined,
                color: isActive ? theme.primaryColor : undefined,
                boxShadow: isActive
                  ? `0 0 16px color-mix(in srgb, ${theme.primaryColor} 28%, transparent)`
                  : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isMobileOnly && !isActive) {
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primaryColor} 45%, transparent)`;
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${theme.primaryColor} 10%, transparent)`;
                  e.currentTarget.style.color = theme.primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 12px color-mix(in srgb, ${theme.primaryColor} 20%, transparent)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobileOnly && !isActive) {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = '';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{
                    backgroundColor: theme.primaryColor,
                    boxShadow: `0 0 10px ${theme.primaryColor}`,
                  }}
                />
              )}
              <Icon
                isActive={isActive}
                className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* Toggle do painel contextual */}
      <button
        type="button"
        onClick={onTogglePanel}
        title={panelCollapsed ? 'Expandir navegação do módulo' : 'Recolher navegação do módulo'}
        aria-label={
          panelCollapsed ? 'Expandir navegação do módulo' : 'Recolher navegação do módulo'
        }
        aria-expanded={!panelCollapsed}
        data-testid="module-rail-toggle-panel"
        className={RAIL_BUTTON}
      >
        <PanelToggleIcon collapsed={panelCollapsed} />
      </button>
    </nav>
  );
}

function moduleAccent(accent: ProductModule['accent']): PanelAccent {
  switch (accent) {
    case 'gold':
      return 'gold';
    case 'iris':
    case 'violet':
      return 'iris';
    case 'red':
      return 'pink';
    case 'slate':
      return 'cyan';
    default:
      return 'cyan';
  }
}

function PanelToggleIcon({ collapsed }: { collapsed: boolean }) {
  // Chevron duplo simples — sem dependência de ícone extra.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${collapsed ? '' : 'rotate-180'}`}
      aria-hidden="true"
    >
      <path d="m14 17 5-5-5-5" />
      <path d="m8 17-5-5 5-5" />
    </svg>
  );
}

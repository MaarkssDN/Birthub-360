import { useCallback, useState } from 'react';
import { ModuleNavPanel } from '../ModuleNavPanel.js';
import { ModuleRail } from '../ModuleRail.js';
import type { TabType } from '../tabMeta.js';

/**
 * Sidebar V2 — Agente 31 (Noa), Onda ONDA-DESIGN-PREMIUM-2026-11-24.
 *
 * Mesma arquitetura da Sidebar v1 (rail de módulos + painel contextual,
 * estado em URL, deep-linkável), com chrome premium v2: superfícies
 * `bg-card`/`border-border-default` e acento gold. A lógica de navegação
 * permanece em ModuleRail/ModuleNavPanel — nenhuma rota ou regra de
 * acesso foi duplicada.
 *
 * Mobile: o MobileNavDrawer v1 continua renderizando a Sidebar v1 —
 * a variante mobile v2 é handoff para a Fase 5 (ver runs/31-noa).
 */

const PANEL_COLLAPSED_KEY = '@birthhub:module-panel-collapsed';

interface SidebarV2Props {
  activeTab: TabType;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SidebarV2({ activeTab, mobileOpen = false, onCloseMobile }: SidebarV2Props) {
  const [panelCollapsed, setPanelCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true';
  });

  const togglePanel = useCallback(() => {
    setPanelCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PANEL_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  }, []);

  if (mobileOpen) {
    return (
      <div className="bh-sidebar bh-sidebar--mobile bh-sidebar--mobile-open flex h-full w-full flex-col">
        <ModuleNavPanel
          activeTab={activeTab}
          mobile
          onCloseMobile={onCloseMobile}
          onNavigate={onCloseMobile}
        />
      </div>
    );
  }

  return (
    <div className="bh-sidebar relative z-30 hidden h-full shrink-0 lg:flex">
      <ModuleRail panelCollapsed={panelCollapsed} onTogglePanel={togglePanel} />
      {!panelCollapsed && (
        <div className="bh-sidebar-panel hidden w-[248px] shrink-0 border-r border-border-default bg-card lg:flex lg:flex-col">
          <ModuleNavPanel activeTab={activeTab} />
        </div>
      )}
    </div>
  );
}

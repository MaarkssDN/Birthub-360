import { useCallback, useState } from 'react';
import { ModuleNavPanel } from './ModuleNavPanel.js';
import { ModuleRail } from './ModuleRail.js';
import type { TabType } from './tabMeta.js';
import './Sidebar.css';

/**
 * Navegação modular do Birth Hub 360° (missão navegação modular, Onda 01+).
 *
 * Substitui a sidebar plana de ~30 itens por duas camadas:
 * - `ModuleRail`: rail fixo de ícones com os 11 módulos oficiais (P01–P08,
 *   M09–M11) + Hub Central — entrar em outro módulo exige "sair" do atual.
 * - `ModuleNavPanel`: navegação contextual exclusiva do módulo ativo, com
 *   estado em URL (toda rota continua deep-linkável).
 *
 * `mobileOpen` preserva o contrato do MobileNavDrawer: no drawer a sidebar
 * renderiza apenas o painel (largura total), sem o rail — a troca de módulo
 * no mobile acontece pelo lançador de módulos dentro do próprio painel.
 */

const PANEL_COLLAPSED_KEY = '@birthhub:module-panel-collapsed';

interface SidebarProps {
  activeTab: TabType;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  activeTab,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
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
        <div className="bh-sidebar-panel hidden w-[248px] shrink-0 border-r border-line/80 lg:flex lg:flex-col">
          <ModuleNavPanel activeTab={activeTab} />
        </div>
      )}
    </div>
  );
}

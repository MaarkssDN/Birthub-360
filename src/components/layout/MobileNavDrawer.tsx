import { useEffect } from 'react';
import { Sidebar } from './Sidebar.js';
import type { TabType } from './tabMeta.js';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function MobileNavDrawer({ isOpen, onClose, activeTab }: MobileNavDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop Semântico e Acessível */}
      <button
        type="button"
        aria-label="Fechar menu de navegação"
        onClick={onClose}
        className="fixed inset-0 bg-overlay/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Gaveta da Sidebar Mobile com suporte a Safe Area */}
      <aside
        aria-label="Navegação móvel"
        className="relative z-50 flex h-full w-64 max-w-[85vw] flex-col bg-surface-elevated border-r border-line shadow-2xl animate-slide-in-left pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <Sidebar activeTab={activeTab as TabType} onCloseMobile={onClose} mobileOpen={isOpen} />
      </aside>
    </div>
  );
}

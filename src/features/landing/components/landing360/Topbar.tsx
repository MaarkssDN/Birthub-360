import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { BH360LogoMark } from './data.js';

interface Landing360TopbarProps {
  viewMode: 'public' | 'command';
  theme: string;
  onSwitchView: (mode: 'public' | 'command') => void;
  onOpenRoiSimulator: () => void;
  onGoToLogin: () => void;
  onToggleTheme: () => void;
}

/** Topbar fixa da landing adaptativa (modo público e command center). */
export function Landing360Topbar({
  viewMode,
  theme,
  onSwitchView,
  onOpenRoiSimulator,
  onGoToLogin,
  onToggleTheme,
}: Landing360TopbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <header className="b360-topbar">
      <div className="b360-shell">
        <div className="b360-toprow">
          <a href="#inicio" className="b360-brand" aria-label="Birth Hub 360">
            <BH360LogoMark size={38} />
            <span>
              Birth Hub <strong>360°</strong>
            </span>
          </a>

          {/* Seletor de Modo: Página Pública vs Command Center */}
          <nav className="b360-mode-switch" aria-label="Alternar modo de visualização">
            <button
              id="btn-public"
              type="button"
              className="b360-mode-btn"
              aria-pressed={viewMode === 'public'}
              onClick={() => onSwitchView('public')}
            >
              Página pública
            </button>
            <button
              id="btn-command"
              type="button"
              className="b360-mode-btn"
              aria-pressed={viewMode === 'command'}
              onClick={() => onSwitchView('command')}
            >
              Command Center
            </button>
          </nav>

          {/* Links de navegação desktop */}
          <nav className="b360-topnav" aria-label="Navegação principal">
            <a href="#destaques">11 módulos</a>
            <a href="#ia">IA Comercial</a>
            <a href="#provas-sociais">Casos & Métricas</a>
            <a href="#demonstracao">Agendar Demo</a>
            <a href="#ecossistema">Integrações</a>
            <button
              type="button"
              onClick={onOpenRoiSimulator}
              className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-[#00D4FF] hover:text-[#FF2D9B] transition-colors"
            >
              Simular ROI
            </button>
          </nav>

          {/* Navegação mobile (<720px) — o topnav desktop é ocultado via CSS */}
          <button
            type="button"
            className="b360-mobile-nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="b360-mobile-nav"
            aria-label={mobileNavOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
          {mobileNavOpen && (
            <nav id="b360-mobile-nav" className="b360-mobile-nav" aria-label="Navegação móvel">
              <a href="#destaques" onClick={() => setMobileNavOpen(false)}>
                11 módulos
              </a>
              <a href="#ia" onClick={() => setMobileNavOpen(false)}>
                IA Comercial
              </a>
              <a href="#provas-sociais" onClick={() => setMobileNavOpen(false)}>
                Casos & Métricas
              </a>
              <a href="#demonstracao" onClick={() => setMobileNavOpen(false)}>
                Agendar Demo
              </a>
              <a href="#ecossistema" onClick={() => setMobileNavOpen(false)}>
                Integrações
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenRoiSimulator();
                }}
              >
                Simular ROI
              </button>
            </nav>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition-colors ${theme === 'dark' ? 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-[#00D4FF]' : 'border-slate-300/80 bg-white/90 text-slate-700 hover:text-sky-600 shadow-sm'}`}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#FFC107]" />
              ) : (
                <Moon className="w-4 h-4 text-[#0284c7] dark:text-[#00D4FF]" />
              )}
            </button>

            <button className="b360-aurora b360-small" type="button" onClick={onGoToLogin}>
              <span className="b360-aurora-inner">
                Acessar Plataforma <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

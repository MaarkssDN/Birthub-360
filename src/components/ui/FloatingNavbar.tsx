import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils.js';
import { BirthHubLogo } from '../brand/BirthHubLogo.js';
import { Button } from './Button.js';

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface FloatingNavbarProps extends React.HTMLAttributes<HTMLElement> {
  links?: NavLinkItem[];
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLoginClick?: () => void;
  ctaText?: string;
}

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: 'Visão Geral', href: '#hero' },
  { label: 'Ecossistema', href: '#ecossistema' },
  { label: 'Métricas', href: '#metricas' },
  { label: 'Bento Grid', href: '#recursos' },
  { label: 'Planos', href: '#precos' },
  { label: 'FAQ', href: '#faq' },
];

export function FloatingNavbar({
  links = DEFAULT_LINKS,
  theme = 'dark',
  onToggleTheme,
  onLoginClick,
  ctaText = 'Entrar no Hub',
  className,
  ...props
}: FloatingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-3 sm:top-5 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6 transition-all duration-300',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300',
          'border border-black/5 dark:border-white/10 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
          scrolled
            ? 'bg-white/90 dark:bg-[#121316]/95 border-black/10 dark:border-white/15'
            : 'bg-white/70 dark:bg-[#141519]/80',
        )}
      >
        {/* Logo Mark */}
        <a href="#hero" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 pl-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 relative flex items-center justify-center">
            <BirthHubLogo variant="icon" title="Birth Hub 360" className="w-full h-full" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base sm:text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Birth Hub <span className="text-[#00D4FF]">360°</span>
            </span>
          </div>
        </a>

        {/* Links Centrais (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full font-sans text-xs sm:text-[13px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Ações (Direita) */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>
          )}

          <Button
            variant="electric"
            size="pill-sm"
            onClick={onLoginClick}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          {/* Botão Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-3xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#141519]/95 backdrop-blur-2xl shadow-xl space-y-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

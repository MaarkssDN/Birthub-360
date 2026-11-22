import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { SoundFX } from '@/lib/soundEffects';
import { PillarThemeColor } from './PillarRegistry.js';

export interface PillarDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  themeColor?: PillarThemeColor;
  children: React.ReactNode;
}

export function PillarDetailDialog({
  isOpen,
  onClose,
  theme,
  themeColor = 'cyan',
  children,
}: PillarDetailDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Gerenciamento de acessibilidade, focus trap, escape e trava de scroll do fundo
  useEffect(() => {
    if (!isOpen) return;

    // Salvar foco anterior para restauração
    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    // Trava de rolagem do fundo (body scroll lock)
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        SoundFX.play('click');
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Foco inicial no elemento interativo principal
    const timer = setTimeout(() => {
      const primaryBtn = modalRef.current?.querySelector<HTMLElement>(
        'button[data-primary-action="true"]',
      );
      if (primaryBtn) {
        primaryBtn.focus();
      } else {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button, [href]');
        firstFocusable?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Bordas finas com iluminação controlada e gradientes sutis
  const getContainerGlowBorder = () => {
    if (theme === 'dark') {
      switch (themeColor) {
        case 'pink':
          return 'border-pink-500/40 shadow-[0_0_50px_rgba(255,45,155,0.18),0_25px_70px_rgba(0,0,0,0.85)]';
        case 'gold':
          return 'border-amber-500/40 shadow-[0_0_50px_rgba(255,193,7,0.18),0_25px_70px_rgba(0,0,0,0.85)]';
        case 'iris':
          return 'border-violet-500/40 shadow-[0_0_50px_rgba(139,125,255,0.18),0_25px_70px_rgba(0,0,0,0.85)]';
        default:
          return 'border-cyan-500/40 shadow-[0_0_50px_rgba(0,212,255,0.18),0_25px_70px_rgba(0,0,0,0.85)]';
      }
    }
    // Light Mode
    switch (themeColor) {
      case 'pink':
        return 'border-pink-300 shadow-[0_20px_60px_rgba(219,39,119,0.12),0_4px_16px_rgba(0,0,0,0.06)]';
      case 'gold':
        return 'border-amber-300 shadow-[0_20px_60px_rgba(217,119,6,0.12),0_4px_16px_rgba(0,0,0,0.06)]';
      case 'iris':
        return 'border-violet-300 shadow-[0_20px_60px_rgba(124,58,237,0.12),0_4px_16px_rgba(0,0,0,0.06)]';
      default:
        return 'border-sky-300 shadow-[0_20px_60px_rgba(2,132,199,0.12),0_4px_16px_rgba(0,0,0,0.06)]';
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close com Escape tratado
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
        theme === 'dark' ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-slate-900/40 backdrop-blur-md'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="b360-dialog-title"
      aria-describedby="b360-dialog-desc"
      onClick={() => {
        SoundFX.play('click');
        onClose();
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal stopPropagation */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal stopPropagation */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col my-auto rounded-3xl border transition-all duration-300 overflow-hidden ${getContainerGlowBorder()} ${
          theme === 'dark' ? 'bg-[#0B132B]/98 text-slate-100' : 'bg-white/98 text-slate-900'
        }`}
      >
        {/* Botão de Fechar Superior Direito */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={() => {
              SoundFX.play('click');
              onClose();
            }}
            aria-label="Fechar painel"
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem suave */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  );
}

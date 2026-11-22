import { Bot, Sparkles } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BRAND } from '../../config/brand.js';
import { useBrandAccent } from '../../hooks/useBrandAccent.js';
import { OPEN_AI_CHAT_EVENT } from '../../lib/paletteIntent.js';
import { SoundFX } from '../../lib/soundEffects.js';

const FloatingChatbook = lazy(() =>
  import('../../features/chatbook/components/FloatingChatbook.js').then((module) => ({
    default: module.FloatingChatbook,
  })),
);

export function CopilotTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  // (identidade da plataforma vem de BRAND)
  const accent = useBrandAccent();

  // Permite que o Command Palette (⌘K) abra o copiloto a partir de qualquer tela.
  useEffect(() => {
    const handleOpen = () => {
      SoundFX.play('focus');
      setIsOpen(true);
    };
    window.addEventListener(OPEN_AI_CHAT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_AI_CHAT_EVENT, handleOpen);
  }, []);

  const handleOpenClick = () => {
    SoundFX.play('focus');
    setIsOpen(true);
  };

  return (
    <>
      {/* Botão Flutuante Omnipresente no Canto Inferior Direito */}
      <div className="fixed bottom-4 right-4 z-[900]">
        <button
          type="button"
          onClick={handleOpenClick}
          aria-label={`Abrir copiloto comercial ${BRAND.shortName}`}
          className={`group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br ${accent.gradient} text-on-brand ${accent.glow} hover:scale-105 active:scale-95 transition-all duration-300 border border-brand/40 shadow-[0_6px_25px_rgba(212,175,55,0.4)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.6)] cursor-pointer overflow-hidden`}
        >
          {/* Luz especular interna */}
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          <Bot className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 relative z-10" />

          {/* Indicador de disponibilidade do copiloto */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success border-2 border-surface" />
          </span>

          {/* Tooltip Hover */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-surface-elevated/95 backdrop-blur-md text-ink text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-line flex items-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 ${accent.text} animate-pulse`} />
            <span>{BRAND.shortName} Copilot · IA 2026</span>
          </div>
        </button>
      </div>

      {/* Slide-Over Drawer do Chatbot */}
      {isOpen && (
        <Suspense fallback={null}>
          <FloatingChatbook isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

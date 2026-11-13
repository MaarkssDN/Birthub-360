import { ArrowRight, Sparkles, X } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SoundFX } from '@/lib/soundEffects';
import { PillarContent } from './pillars/PillarContent.js';
import { PillarDetailDialog } from './pillars/PillarDetailDialog.js';
import {
  PILLARS_EDITORIAL_DATA,
  type PillarData,
  type PillarThemeColor,
} from './pillars/PillarRegistry.js';

export { PILLARS_EDITORIAL_DATA, type PillarData, type PillarThemeColor };

export interface PillarDetailModalProps {
  isOpen: boolean;
  pillarId: string | null;
  genericModal?: { title: string; desc: string } | null;
  onClose: () => void;
  onProceedToLogin: () => void;
  onOpenRoiSimulator?: () => void;
  theme: 'dark' | 'light';
}

export function PillarDetailModal({
  isOpen,
  pillarId,
  genericModal,
  onClose,
  onProceedToLogin,
  onOpenRoiSimulator,
  theme,
}: PillarDetailModalProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const isPillar = Boolean(pillarId && PILLARS_EDITORIAL_DATA[pillarId]);
  const pillar = isPillar && pillarId ? PILLARS_EDITORIAL_DATA[pillarId] : null;

  const handleAction = () => {
    SoundFX.play('click');
    onClose();
    if (pillar) {
      if (currentUser) {
        void navigate(pillar.route);
      } else {
        onProceedToLogin();
      }
    } else {
      onProceedToLogin();
    }
  };

  return (
    <PillarDetailDialog
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      themeColor={pillar?.themeColor ?? 'cyan'}
    >
      {pillar ? (
        <PillarContent
          pillar={pillar}
          theme={theme}
          onAction={handleAction}
          onClose={onClose}
          onOpenRoiSimulator={onOpenRoiSimulator}
        />
      ) : (
        /* Fallback estruturado para módulos gerais (ex: Command Center) */
        <div className="space-y-6 max-w-xl mx-auto py-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              MÓDULO PLATAFORMA
            </span>
          </div>

          <div className="space-y-2">
            <h2
              id="b360-dialog-title"
              className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight ${
                theme === 'dark' ? 'text-sky-400' : 'text-sky-700'
              }`}
            >
              {genericModal?.title ?? 'Detalhes do Módulo'}
            </h2>
            <p
              id="b360-dialog-desc"
              className={`text-sm sm:text-base font-sans leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {genericModal?.desc ?? ''}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-300'
              }`}
            >
              Fechar
            </button>
            <div className="relative inline-flex group p-[2px] rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02]">
              <span className="absolute inset-0 bg-gradient-to-r from-[#00D4FF] via-[#FF2D9B] to-[#FFC107] rounded-full opacity-80 group-hover:opacity-100 blur-[2px] transition-opacity duration-300 animate-pulse" />
              <button
                type="button"
                data-primary-action="true"
                onClick={handleAction}
                className="relative z-10 px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-mono font-bold bg-[#0B132B] text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <span>Acessar Plataforma →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PillarDetailDialog>
  );
}

import { Share2 } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 11 — Social Selling
 * Visualizador contextual de geração de abordagem por canal com copywriting assistido por IA.
 */
export function SocialSellingViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  const channels = ['LinkedIn', 'WhatsApp', 'E-mail'];
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-amber-500/30 bg-slate-900/80 text-slate-300'
          : 'border-amber-300 bg-amber-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> ApproachGenerator · Shadow Copy
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          Copy por IA
        </span>
      </div>
      <div className="flex gap-1.5">
        {channels.map((c, i) => (
          <span
            key={c}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${
              i === 0
                ? isDark
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
                : isDark
                  ? 'bg-slate-950/80 text-slate-400 border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <div
        className={`rounded-xl p-3 border space-y-1.5 ${
          isDark ? 'bg-slate-950/90 border-amber-500/25' : 'bg-white border-amber-200 shadow-sm'
        }`}
      >
        <p
          className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        >
          “Olá {'{nome}'}, vi que a {'{empresa}'} expandiu a operação comercial no Sul — exatamente
          o cenário em que ajudamos empresas como a sua a estruturar cadências multicanal em 30
          dias…”
        </p>
        <div className="flex items-center justify-between text-[9px] font-sans">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
            Tom: consultivo · Personalização: conta + decisor
          </span>
          <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>Aprovar →</span>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerSocialSelling = SocialSellingViewer;

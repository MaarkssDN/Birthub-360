import { PhoneCall } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 08 — Engajamento Comercial
 * Visualizador contextual de histórico multicanal, interações, telefonia e rastreabilidade.
 */
export function EngajamentoViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-violet-500/30 bg-slate-900/80 text-slate-300'
          : 'border-violet-300 bg-violet-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-violet-400' : 'text-violet-700'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" /> VoiceHub • Exemplo de transcrição
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          Sentimento simulado: Positivo (88%)
        </span>
      </div>

      <div
        className={`rounded-xl p-3 border space-y-2 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Ligação: Diretor de Tecnologia
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Duração: 04:18 • WebRTC
          </span>
        </div>
        <div
          className={`p-2 rounded-lg border font-sans text-[11px] leading-relaxed ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/60 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          &quot;Perfeito. Gostei da integração nativa com o nosso CRM e da segurança com LGPD.
          Podemos agendar a demonstração técnica para quinta-feira às 14h.&quot;
        </div>
        <div
          className={`flex items-center justify-between text-[10px] pt-1 font-sans ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <span>Ação automática: Reunião criada na agenda</span>
          <span
            className={`font-semibold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
          >
            Deal atualizado no CRM ✓
          </span>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerEngajamento = EngajamentoViewer;

import { Bot, Sparkles } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 06 — Inteligência Artificial
 * Visualizador contextual de diagnóstico, análise de entraves e recomendações fundamentadas.
 */
export function IaCopilotViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-pink-500/30 bg-slate-900/80 text-slate-300'
          : 'border-pink-300 bg-pink-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-pink-400' : 'text-pink-700'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> Copiloto IA • Recomendação Tática Contextual
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isDark
              ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
              : 'bg-pink-100 text-pink-800 border-pink-300'
          }`}
        >
          Confidence: 91%
        </span>
      </div>

      <div
        className={`rounded-xl p-3 border space-y-2 ${
          isDark ? 'bg-slate-950/90 border-pink-500/40' : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Objeção Detectada: &quot;Orçamento congelado até o próximo trimestre&quot;
          </span>
        </div>
        <p
          className={`text-[11px] font-sans leading-relaxed pl-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        >
          <strong>Recomendação Tática:</strong> Propor ativação em 2 etapas (Setup técnico no mês
          corrente com início de faturamento no próximo ciclo fiscal). No histórico da sua conta,
          esse modelo converteu <strong>78%</strong> das objeções semelhantes.
        </p>
      </div>

      <div
        className={`flex items-center justify-between text-[10px] px-1 font-sans ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        <span>Análise baseada em 142 negociações com perfil similar</span>
        <span className={`font-semibold font-mono ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
          Status: Ação Pronta para Envio
        </span>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerIaCopilot = IaCopilotViewer;

import { TrendingUp } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 05 — Previsibilidade Comercial
 * Visualizador contextual de cenários, projeção de receita e pipeline ponderado.
 */
export function PrevisibilidadeViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-sky-500/30 bg-slate-900/80 text-slate-300'
          : 'border-sky-300 bg-sky-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-sky-400' : 'text-sky-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Modelagem Estatística • Forecast Mensal
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}
        >
          94% Confiança
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div
          className={`p-2.5 rounded-xl border text-center ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            CONSERVADOR
          </span>
          <span className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            R$ 1.180.000
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            95% probabilidade
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center ${
            isDark
              ? 'bg-slate-950/90 border-sky-500/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
              : 'bg-white border-sky-300 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] font-bold block ${isDark ? 'text-sky-300' : 'text-sky-700'}`}
          >
            CENÁRIO PROVÁVEL
          </span>
          <span className={`text-base font-bold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
            R$ 1.450.000
          </span>
          <span
            className={`text-[9px] block font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
          >
            meta orçamentária
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            OTIMISTA
          </span>
          <span className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            R$ 1.720.000
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            upside mapeado
          </span>
        </div>
      </div>

      <div
        className={`p-2 rounded-lg border text-[10px] font-sans flex items-center justify-between ${
          isDark
            ? 'bg-sky-950/30 border-sky-500/20 text-sky-300'
            : 'bg-white border-slate-200 text-sky-800 shadow-sm'
        }`}
      >
        <span>
          Pipeline Ponderado Total: <strong>R$ 2.450.000</strong>
        </span>
        <span>
          Taxa de Slippage Prevista: <strong>6.2%</strong>
        </span>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerPrevisibilidade = PrevisibilidadeViewer;

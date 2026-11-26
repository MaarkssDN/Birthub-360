import { BarChart3 } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 04 — Performance Comercial
 * Visualizador contextual de metas, produtividade, conversão e velocidade do funil.
 */
export function PerformanceViewer({ theme = 'dark' }: PillarViewerProps) {
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
          <BarChart3 className="w-3.5 h-3.5" /> Telemetria de Conversão do Funil
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          Meta do Mês: 87% Atingida
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            ENTRADA
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            1.240
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            leads no mês
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-violet-400' : 'text-violet-700'}`}
          >
            QUALIF.
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>
            410
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            33.1% conv.
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}
          >
            PROPOSTA
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
            185
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            45.1% conv.
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            isDark
              ? 'bg-slate-950/80 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
              : 'bg-white border-emerald-300 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
          >
            GANHOS
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
            78
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            42.2% conv.
          </span>
        </div>
      </div>

      <div
        className={`p-2 rounded-lg border flex items-center justify-between text-[10px] ${
          isDark
            ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        }`}
      >
        <span>
          Velocidade Média do Ciclo:{' '}
          <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>18 dias</strong>
        </span>
        <span>
          Produtividade:{' '}
          <strong className={isDark ? 'text-violet-300' : 'text-violet-700'}>
            14 calls + 3 demos/dia por rep
          </strong>
        </span>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerPerformance = PerformanceViewer;

import { Smartphone } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 10 — Mobile & Field Sales
 * Visualizador contextual de FieldMeetingRecorder, offline sync e IA edge.
 */
export function FieldSalesViewer({ theme = 'dark' }: PillarViewerProps) {
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
          <Smartphone className="w-3.5 h-3.5" /> FieldMeetingRecorder · Android
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
              : 'bg-pink-100 text-pink-800 border-pink-300'
          }`}
        >
          Offline Sync
        </span>
      </div>
      <div
        className={`rounded-xl p-3 border space-y-2.5 ${
          isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
          >
            Visita técnica — Cliente Aurora (exemplo)
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-700'
            }`}
          >
            ● REC 12:04
          </span>
        </div>
        <div className="flex items-center gap-1 h-8">
          {[10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 15].map((h, i) => (
            <i key={i} className="flex-1 rounded-sm bg-pink-400/70" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="flex items-center justify-between text-[9px] font-sans">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            IA edge transcrevendo localmente
          </span>
          <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
            Sync pendente: 3 registros
          </span>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerFieldSales = FieldSalesViewer;

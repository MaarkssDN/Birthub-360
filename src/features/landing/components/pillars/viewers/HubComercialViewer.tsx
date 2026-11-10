import { Layers } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 01 — Hub Comercial (Orbit / CRM)
 * Visualizador contextual simulando pipeline kanban ativo, estágios de qualificação,
 * proposta e fechamento com alto contraste e suporte total a temas Dark/Light.
 */
export function HubComercialViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  return (
    <section
      aria-label="Simulação do Pipeline Comercial — Hub Comercial"
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-sky-500/30 bg-slate-900/80 text-slate-300'
          : 'border-sky-300 bg-sky-50/50 text-slate-700'
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
          <Layers className="w-3.5 h-3.5" aria-hidden="true" /> Pipeline Ativo • R$ 1.040.000
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}
        >
          3 Negócios em Foco
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Coluna 1: Qualificação */}
        <div
          className={`rounded-xl p-2.5 border space-y-1.5 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              QUALIFICAÇÃO
            </span>
            <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>R$ 180k</span>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isDark ? 'bg-slate-900/90 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
            >
              Indústria Alfa S/A
            </p>
            <p className={`text-[9px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Score ICP: 94 • 2 decisores
            </p>
            <span
              className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              Próx: Mapear Diretor
            </span>
          </div>
        </div>

        {/* Coluna 2: Proposta */}
        <div
          className={`rounded-xl p-2.5 border space-y-1.5 ${
            isDark
              ? 'bg-slate-950/90 border-sky-500/40 shadow-[0_0_12px_rgba(0,212,255,0.12)]'
              : 'bg-white border-sky-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className={`font-semibold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              PROPOSTA
            </span>
            <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>R$ 340k</span>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isDark ? 'bg-slate-900/90 border-sky-500/50' : 'bg-sky-50/70 border-sky-200'
            }`}
          >
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? 'text-sky-200' : 'text-sky-900'}`}
            >
              Varejo Global Ltda
            </p>
            <p
              className={`text-[9px] font-semibold font-sans ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
            >
              Próx: Reunião Diretoria
            </p>
            <span
              className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/30'
                  : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}
            >
              Proposta V2 Enviada
            </span>
          </div>
        </div>

        {/* Coluna 3: Fechamento */}
        <div
          className={`rounded-xl p-2.5 border space-y-1.5 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              FECHAMENTO
            </span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              R$ 520k
            </span>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isDark
                ? 'bg-slate-900/90 border-emerald-500/40'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
            >
              FinTech Horizons
            </p>
            <p
              className={`text-[9px] font-semibold font-sans ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
            >
              Minuta Jurídica (90%)
            </p>
            <span
              className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              Aguardando Assinatura
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Backward-compatible alias
export const VisualizerHubComercial = HubComercialViewer;

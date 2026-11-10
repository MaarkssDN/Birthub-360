import { Workflow } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 03 — Orquestração de Vendas (Aria)
 * Visualizador contextual simulando cadência executiva multicanal, SLA de atendimento,
 * próximas melhores ações (Next Best Action) e passagem de bastão SDR → Closer.
 */
export function OrquestracaoViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  return (
    <section
      aria-label="Simulação de Cadência Executiva — Orquestração de Vendas"
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
          <Workflow className="w-3.5 h-3.5" aria-hidden="true" /> Cadência Executiva • Passo 3 de 5
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          SLA Restante: 25 min
        </span>
      </div>

      <div className="space-y-2">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl border opacity-75 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            ✓
          </span>
          <div className="flex-1">
            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              D+0 • E-mail de Apresentação de Valor
            </span>
            <span
              className={`text-[10px] block font-sans ${isDark ? 'text-slate-500' : 'text-slate-500'}`}
            >
              Entregue • Aberto 2x pelo lead
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl border ${
            isDark
              ? 'bg-slate-950/90 border-amber-500/50 shadow-[0_0_12px_rgba(255,193,7,0.12)]'
              : 'bg-white border-amber-300 shadow-sm'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse ${
              isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
            }`}
          >
            3
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                D+2 • Ligação VoiceHub + Follow-up WhatsApp
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                }`}
              >
                NEXT BEST ACTION
              </span>
            </div>
            <span
              className={`text-[10px] block font-sans mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Roteiro tático: validar dor de controle do Diretor de Operações e propor passagem para
              Closer.
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 p-2 rounded-xl border text-[10px] ${
            isDark
              ? 'bg-slate-950/80 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}
          >
            4
          </span>
          <div className="flex-1">
            <span>D+4 • Passagem de Bastão (Handover SDR → Closer com Checklist BANT)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Backward-compatible alias
export const VisualizerOrquestracao = OrquestracaoViewer;

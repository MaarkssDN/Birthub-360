import { Network } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 07 — Automação e Conectividade
 * Visualizador contextual de fluxos, gatilhos, APIs e webhooks (exemplo ilustrativo).
 */
export function AutomacaoViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
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
          <Network className="w-3.5 h-3.5" /> Gateway de APIs & Webhooks • Telemetria ilustrativa
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          99.98% · simulação
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              API Bitrix24
            </span>
            <span
              className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Via REST / Webhook
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Webhooks REST
            </span>
            <span
              className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Retry Exponencial
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Event Bus
            </span>
            <span
              className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Latência simulada: 120ms
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
        </div>
      </div>

      <div
        className={`p-2 rounded border text-[10px] font-sans ${
          isDark
            ? 'bg-amber-950/30 border-amber-500/20 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <strong>Conectores disponíveis:</strong> Integração via API REST aberta, fila idempotente e
        webhooks seguros autenticados com chave HMAC.
      </div>
    </div>
  );
}

// Backward-compatible alias
export const VisualizerAutomacao = AutomacaoViewer;

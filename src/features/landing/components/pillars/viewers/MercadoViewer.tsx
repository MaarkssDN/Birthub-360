import { Database } from 'lucide-react';
import type { PillarViewerProps } from './types.js';

/**
 * 02 — Inteligência de Mercado (Nexus)
 * Visualizador contextual simulando enriquecimento de dados B2B, score ICP,
 * dados da Receita/QSA, decisores identificados e sinais de compra ativos.
 */
export function MercadoViewer({ theme = 'dark' }: PillarViewerProps) {
  const isDark = theme === 'dark';
  return (
    <section
      aria-label="Simulação de Enriquecimento B2B — Inteligência de Mercado"
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
          <Database className="w-3.5 h-3.5" aria-hidden="true" /> Enriquecimento CNPJ • Receita &
          QSA
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
              : 'bg-pink-100 text-pink-800 border-pink-300'
          }`}
        >
          ICP Score: 96/100
        </span>
      </div>

      <div
        className={`rounded-xl p-3 border space-y-2.5 ${
          isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <h4
              className={`text-sm font-bold font-sans tracking-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              TechLog Logística Integrada S/A
            </h4>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              CNPJ: 14.288.901/0001-44 • Matriz São Paulo/SP
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold w-fit ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            Receita Presumida: R$ 50M a R$ 100M
          </span>
        </div>

        <div
          className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t text-[11px] ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div>
            <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              CNAE Principal
            </span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              4930-2 (Cargas)
            </span>
          </div>
          <div>
            <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Decisor no QSA
            </span>
            <span className={`font-semibold ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
              Diretor Comercial
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Canal Corporativo
            </span>
            <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              E-mail Validado ✓
            </span>
          </div>
        </div>

        <div
          className={`p-2 rounded border text-[10px] font-sans ${
            isDark
              ? 'bg-pink-950/30 border-pink-500/20 text-pink-200'
              : 'bg-pink-50 border-pink-200 text-pink-900'
          }`}
        >
          <strong>Sinal de Compra:</strong> Contratação ativa de 8 executivos de vendas + Expansão
          recente de filiais no Sul.
        </div>
      </div>
    </section>
  );
}

// Backward-compatible alias
export const VisualizerMercado = MercadoViewer;

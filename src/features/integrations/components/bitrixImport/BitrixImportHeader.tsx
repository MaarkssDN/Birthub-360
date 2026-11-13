/**
 * Cabeçalho do importador Bitrix24 — extraído de BitrixImportPanel.tsx
 * (TAREFA-SANEAMENTO-004 / BT360-DT-0030). Componente puramente visual.
 */

import { Layers, RefreshCw } from 'lucide-react';

interface BitrixImportHeaderProps {
  total: number;
  loading: boolean;
  onRefresh: () => void;
}

export function BitrixImportHeader({ total, loading, onRefresh }: BitrixImportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-brand/10 via-brand-2/5 to-transparent p-5 rounded-3xl border border-brand/20 shadow-sm">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center text-on-brand shadow-lg shadow-brand/30">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            Importador Inteligente Bitrix24
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Conexão Segura & Ativa
            </span>
          </h3>
          <p className="text-xs text-ink-2">
            Filtre por vendedor, etapa e oportunidade. Importe com 1 clique.{' '}
            {total > 0 && (
              <strong className="text-ink font-bold">{total} registro(s) no portal.</strong>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-ink-2 hover:text-ink bg-surface border border-line rounded-2xl shadow-sm hover:shadow transition-colors disabled:opacity-50"
          title="Recarregar dados do Bitrix24"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Portal
        </button>
      </div>
    </div>
  );
}

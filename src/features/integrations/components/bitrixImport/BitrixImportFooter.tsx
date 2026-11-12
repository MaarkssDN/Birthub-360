import { Download, Edit3, Loader2 } from 'lucide-react';

interface BitrixImportFooterProps {
  start: number;
  next: number | null;
  loading: boolean;
  pageCount: number;
  total: number;
  selectedCount: number;
  importing: boolean;
  onLoad: (offset: number) => void;
  onOpenBulkEdit: () => void;
  onImportSelected: () => void;
}

export function BitrixImportFooter({
  start,
  next,
  loading,
  pageCount,
  total,
  selectedCount,
  importing,
  onLoad,
  onOpenBulkEdit,
  onImportSelected,
}: BitrixImportFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onLoad(Math.max(0, start - 50))}
          disabled={loading || start === 0}
          className="px-4 py-2 border border-line rounded-2xl text-xs font-bold text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => next != null && onLoad(next)}
          disabled={loading || next == null}
          className="px-4 py-2 border border-line rounded-2xl text-xs font-bold text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors"
        >
          Próxima →
        </button>
        <span className="text-xs text-ink-2 pl-2">
          Exibindo {start + 1}–{pageCount} de {total}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onOpenBulkEdit}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-2 hover:bg-line text-ink text-xs font-bold rounded-2xl transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar ({selectedCount})
          </button>
        )}
        <button
          type="button"
          onClick={onImportSelected}
          disabled={importing || selectedCount === 0}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-brand-active to-brand-2 hover:brightness-110 text-on-brand text-xs font-bold rounded-2xl shadow-md shadow-brand-active/20 transition-colors disabled:opacity-40"
        >
          {importing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {importing
            ? 'Importando...'
            : `Importar ${selectedCount > 0 ? `(${selectedCount})` : 'selecionados'}`}
        </button>
      </div>
    </div>
  );
}

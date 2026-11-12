import { CheckSquare, Sparkles, Square } from 'lucide-react';

interface BitrixBulkSelectionBarProps {
  availableCount: number;
  allPageSelected: boolean;
  onToggleAllPage: () => void;
  onSelectAllAvailable: () => void;
  selectedCount: number;
  onClearSelection: () => void;
}

export function BitrixBulkSelectionBar({
  availableCount,
  allPageSelected,
  onToggleAllPage,
  onSelectAllAvailable,
  selectedCount,
  onClearSelection,
}: BitrixBulkSelectionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-surface-2 to-soft border border-line rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleAllPage}
          className="flex items-center gap-2 text-xs font-bold text-ink hover:text-brand dark:hover:text-brand-2 transition-colors"
        >
          {allPageSelected ? (
            <CheckSquare className="w-4 h-4 text-brand" />
          ) : (
            <Square className="w-4 h-4 text-ink-2" />
          )}
          <span>Selecionar Todos da Página ({availableCount} disponíveis)</span>
        </button>

        <button
          type="button"
          onClick={onSelectAllAvailable}
          className="text-xs font-bold text-brand-ink hover:brightness-110 dark:text-brand flex items-center gap-1 underline underline-offset-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Marcar Todos
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-brand-ink dark:text-brand bg-soft px-3 py-1 rounded-full">
            {selectedCount} selecionado(s)
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs font-bold text-ink-2 hover:text-red-500 transition-colors"
          >
            Desmarcar Tudo
          </button>
        </div>
      )}
    </div>
  );
}

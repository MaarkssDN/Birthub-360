import { Search } from 'lucide-react';

interface CrmBoardUser {
  id: string;
  name: string;
}

interface CrmBoardFiltersBarProps {
  searchQuery: string;
  ownerFilter: string;
  enrichmentFilter: string;
  temperatureFilter: string;
  users: CrmBoardUser[];
  onSearchQueryChange: (value: string) => void;
  onOwnerFilterChange: (value: string) => void;
  onEnrichmentFilterChange: (value: string) => void;
  onTemperatureFilterChange: (value: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

/** Barra de filtros do pipeline (busca + dono + enriquecimento + temperatura,
 *  persistidos na URL) — extraída na TAREFA-SANEAMENTO-002 (W4). JSX verbatim. */
export function CrmBoardFiltersBar({
  searchQuery,
  ownerFilter,
  enrichmentFilter,
  temperatureFilter,
  users,
  onSearchQueryChange,
  onOwnerFilterChange,
  onEnrichmentFilterChange,
  onTemperatureFilterChange,
  onClearFilters,
  filteredCount,
  totalCount,
}: CrmBoardFiltersBarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface-subtle px-4 py-3 lg:px-6">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <label htmlFor="crm-board-search" className="sr-only">
          Buscar por empresa ou contato
        </label>
        <Search className="w-4 h-4 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="crm-board-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Buscar por empresa ou contato..."
          className="w-full rounded-full border border-line/80 bg-white dark:bg-[#15171C] py-2 pl-9 pr-3 text-xs text-[#0F2942] dark:text-[#E2F1FF] placeholder:text-[#5B7B98] focus:outline-none focus:border-[#00D4FF] focus-visible:ring-2 focus-visible:ring-[#00D4FF]/30 transition-all shadow-inner"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="crm-board-owner-filter" className="text-xs font-semibold text-ink-2">
          Filtrar por dono:
        </label>
        <select
          id="crm-board-owner-filter"
          value={ownerFilter}
          onChange={(e) => onOwnerFilterChange(e.target.value)}
          className="rounded-control border border-line bg-surface-elevated px-2.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all"
        >
          <option value="">Todos os donos</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="crm-board-enrichment-filter" className="text-xs font-semibold text-ink-2">
          Enriquecimento:
        </label>
        <select
          id="crm-board-enrichment-filter"
          value={enrichmentFilter}
          onChange={(e) => onEnrichmentFilterChange(e.target.value)}
          className="rounded-control border border-line bg-surface-elevated px-2.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all"
        >
          <option value="">Todos</option>
          <option value="Enriquecido">Enriquecidos</option>
          <option value="Pendente">Pendentes</option>
          <option value="Falhou">Falhou</option>
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="crm-board-temp-filter" className="text-xs font-semibold text-ink-2">
          Temperatura:
        </label>
        <select
          id="crm-board-temp-filter"
          value={temperatureFilter}
          onChange={(e) => onTemperatureFilterChange(e.target.value)}
          className="rounded-control border border-line bg-surface-elevated px-2.5 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all"
        >
          <option value="">Todas</option>
          <option value="Quente">🔥 Quente</option>
          <option value="Morno">🌤️ Morno</option>
          <option value="Frio">❄️ Frio</option>
        </select>
      </div>
      {(ownerFilter || searchQuery || enrichmentFilter || temperatureFilter) && (
        <>
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
          >
            Limpar filtros
          </button>
          <span className="text-xs text-ink-2 sm:ml-auto">
            {filteredCount} de {totalCount} leads
          </span>
        </>
      )}
    </div>
  );
}

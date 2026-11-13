import {
  ArrowUpDown,
  CalendarDays,
  Filter,
  Info,
  Lock,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  X,
} from 'lucide-react';
import type {
  BitrixDealPipeline,
  BitrixDealStage,
  BitrixFieldOption,
  BitrixUserOption,
} from '../BitrixImportPanel.js';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const selectClass =
  'h-9 text-sm rounded-xl border border-line bg-surface-2 text-ink px-3 disabled:opacity-40 min-w-[9rem] focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors outline-none cursor-pointer';
const filterLabelClass =
  'text-[10px] font-bold uppercase tracking-wide text-ink-2 flex items-center gap-1';

type QuickFilter = 'all' | 'unimported' | 'has_phone' | 'has_value';
type SortBy = 'recent' | 'value' | 'name';

interface BitrixImportFiltersPanelProps {
  mode: 'deals' | 'leads';
  canPickAnyVendor: boolean;
  search: string;
  setSearch: (value: string) => void;
  quickFilter: QuickFilter;
  setQuickFilter: (value: QuickFilter) => void;
  sortBy: SortBy;
  setSortBy: (value: SortBy) => void;
  customFieldCode: string;
  setCustomFieldCode: (value: string) => void;
  customFieldValue: string;
  setCustomFieldValue: (value: string) => void;
  fields: BitrixFieldOption[];
  pipelines: BitrixDealPipeline[];
  stages: BitrixDealStage[];
  users: BitrixUserOption[];
  stageId: string;
  setStageId: (value: string) => void;
  assignedById: string;
  setAssignedById: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  totalItems: number;
}

export function BitrixImportFiltersPanel({
  mode,
  canPickAnyVendor,
  search,
  setSearch,
  quickFilter,
  setQuickFilter,
  sortBy,
  setSortBy,
  customFieldCode,
  setCustomFieldCode,
  customFieldValue,
  setCustomFieldValue,
  fields,
  pipelines,
  stages,
  users,
  stageId,
  setStageId,
  assignedById,
  setAssignedById,
  month,
  setMonth,
  year,
  setYear,
  totalItems,
}: BitrixImportFiltersPanelProps) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              mode === 'deals'
                ? 'Buscar por empresa, oportunidade ou negócio...'
                : 'Buscar por nome do lead, empresa, e-mail...'
            }
            className="w-full h-10 text-sm rounded-2xl border border-line bg-surface-2 text-ink pl-10 pr-9 placeholder:text-ink-2 focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink p-1"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros Rápidos (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'all' ? 'bg-ink text-surface shadow-sm' : 'bg-surface-2 text-ink-2 hover:text-ink'}`}
          >
            Todos ({totalItems})
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('unimported')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'unimported' ? 'bg-brand-active text-on-brand shadow-sm shadow-brand-active/20' : 'bg-surface-2 text-ink-2 hover:text-ink'}`}
          >
            Disponíveis para Importar
          </button>
          {mode === 'deals' && (
            <button
              type="button"
              onClick={() => setQuickFilter('has_value')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'has_value' ? 'bg-green-600 text-white shadow-sm shadow-green-600/20' : 'bg-surface-2 text-ink-2 hover:text-ink'}`}
            >
              Com Valor (R$)
            </button>
          )}
          {mode === 'leads' && (
            <button
              type="button"
              onClick={() => setQuickFilter('has_phone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'has_phone' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-surface-2 text-ink-2 hover:text-ink'}`}
            >
              Com Telefone
            </button>
          )}
        </div>
      </div>

      {mode === 'deals' &&
        (pipelines.length === 0 ? (
          <p className="text-xs text-ink-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Este portal não tem um pipeline &quot;Comercial&quot; — as vendas dele provavelmente
            ficam na aba Leads, não em Negócios.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-line">
            <div className="flex flex-col gap-1">
              <span className={filterLabelClass}>
                <Filter className="w-3 h-3" /> Pipeline
              </span>
              <span className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-soft border border-brand/20 text-brand-ink dark:text-brand text-sm font-bold whitespace-nowrap">
                {pipelines[0].name}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bitrix-filter-stage" className={filterLabelClass}>
                <Tag className="w-3 h-3" /> Etapa
              </label>
              <select
                id="bitrix-filter-stage"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className={selectClass}
              >
                <option value="">Todas as etapas</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bitrix-filter-vendor" className={filterLabelClass}>
                {canPickAnyVendor ? <Users className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{' '}
                Vendedor
              </label>
              {canPickAnyVendor ? (
                <select
                  id="bitrix-filter-vendor"
                  value={assignedById}
                  onChange={(e) => setAssignedById(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Todos os vendedores</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  id="bitrix-filter-vendor"
                  className="flex items-center h-9 px-3 rounded-xl bg-surface-2 text-ink-2 text-sm font-medium"
                  title="Você só vê e importa o seu próprio dado do Bitrix24 (Trava de Isolamento por Vendedor)."
                >
                  Exclusivo do Seu Usuário
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bitrix-filter-month" className={filterLabelClass}>
                <CalendarDays className="w-3 h-3" /> Mês
              </label>
              <select
                id="bitrix-filter-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={`${selectClass} min-w-[7rem]`}
              >
                <option value="">Todos</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bitrix-filter-year" className={filterLabelClass}>
                Ano
              </label>
              <select
                id="bitrix-filter-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={`${selectClass} min-w-[5rem]`}
              >
                <option value="">Todos</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 ml-auto">
              <label htmlFor="bitrix-filter-sort" className={filterLabelClass}>
                <ArrowUpDown className="w-3 h-3" /> Ordenar Por
              </label>
              <select
                id="bitrix-filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'value' | 'name')}
                className={selectClass}
              >
                <option value="recent">Mais Recentes</option>
                <option value="value">Maior Valor (R$)</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        ))}

      {fields.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-line">
          <div className="flex flex-col gap-1">
            <label htmlFor="bitrix-import-custom-field" className={filterLabelClass}>
              <SlidersHorizontal className="w-3 h-3" /> Campo personalizado
            </label>
            <select
              id="bitrix-import-custom-field"
              value={customFieldCode}
              onChange={(e) => setCustomFieldCode(e.target.value)}
              className={`${selectClass} min-w-[13rem]`}
            >
              <option value="">Nenhum (não filtrar)</option>
              {fields.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          {customFieldCode && (
            <div className="flex flex-col gap-1">
              <label htmlFor="bitrix-import-custom-field-value" className={filterLabelClass}>
                Valor exato a filtrar
              </label>
              <input
                id="bitrix-import-custom-field-value"
                type="text"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                placeholder="Ex: Transportadora"
                className="h-9 text-sm rounded-xl border border-line bg-surface-2 text-ink px-3 min-w-[11rem] placeholder:text-ink-2 focus:bg-surface focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

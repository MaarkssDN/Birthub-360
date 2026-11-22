import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Download,
  Edit3,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Square,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext.js';
import { api } from '../../../lib/api.js';
import { hasRequiredRole } from '../../../lib/auth/authorization.js';
import { BitrixImportBulkEditModal } from './bitrixImport/BitrixImportBulkEditModal.js';
import { BitrixImportDealCard } from './bitrixImport/BitrixImportDealCard.js';
import { BitrixImportFilters } from './bitrixImport/BitrixImportFilters.js';
import { BitrixImportHeader } from './bitrixImport/BitrixImportHeader.js';
import { BitrixImportLeadCard } from './bitrixImport/BitrixImportLeadCard.js';
import { BitrixImportToolbar } from './bitrixImport/BitrixImportToolbar.js';
import type {
  BitrixDealPipeline,
  BitrixDealStage,
  BitrixDealSummary,
  BitrixFieldOption,
  BitrixImportMode,
  BitrixImportResult,
  BitrixLeadSummary,
  BitrixQuickFilter,
  BitrixSortBy,
  BitrixUserOption,
} from './bitrixImport/types.js';

interface BitrixImportPanelProps {
  connectionId: string;
}

export function BitrixImportPanel({ connectionId }: BitrixImportPanelProps) {
  const { currentUser } = useAuth();
  const canPickAnyVendor = !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);
  const [mode, setMode] = useState<BitrixImportMode>('deals');

  // ── Modo Negócios ──
  const [pipelines, setPipelines] = useState<BitrixDealPipeline[]>([]);
  const [stages, setStages] = useState<BitrixDealStage[]>([]);
  const [users, setUsers] = useState<BitrixUserOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [stageId, setStageId] = useState('');
  const [assignedById, setAssignedById] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [deals, setDeals] = useState<BitrixDealSummary[]>([]);

  // ── Modo Leads ──
  const [leads, setLeads] = useState<BitrixLeadSummary[]>([]);

  // ── Filtros Locais & Ordenação ──
  const [quickFilter, setQuickFilter] = useState<BitrixQuickFilter>('all');
  const [sortBy, setSortBy] = useState<BitrixSortBy>('recent');

  // ── Busca por Nome ──
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [fields, setFields] = useState<BitrixFieldOption[]>([]);
  const [customFieldCode, setCustomFieldCode] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [debouncedCustomFieldValue, setDebouncedCustomFieldValue] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCustomFieldValue(customFieldValue), 400);
    return () => clearTimeout(timer);
  }, [customFieldValue]);

  // ── Estado Compartilhado ──
  const [start, setStart] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importingSingleId, setImportingSingleId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<BitrixImportResult | null>(null);
  const [restrictedWarning, setRestrictedWarning] = useState('');

  // ── Modal de Edição em Lote ──
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkTemperature, setBulkTemperature] = useState<'Frio' | 'Morno' | 'Quente'>('Morno');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    api
      .get<BitrixDealPipeline[]>(`/api/bitrix/deal-pipelines?connectionId=${connectionId}`)
      .then((data) => {
        setPipelines(data);
        setCategoryId(data[0]?.id ?? '');
      })
      .catch(() => {
        setPipelines([]);
        setCategoryId('');
      });
    api
      .get<BitrixUserOption[]>(`/api/bitrix/users?connectionId=${connectionId}`)
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [connectionId]);

  useEffect(() => {
    setCustomFieldCode('');
    setCustomFieldValue('');
    const entity = mode === 'deals' ? 'deal' : 'lead';
    api
      .get<BitrixFieldOption[]>(`/api/bitrix/fields?connectionId=${connectionId}&entity=${entity}`)
      .then(setFields)
      .catch(() => setFields([]));
  }, [connectionId, mode]);

  useEffect(() => {
    setStageId('');
    if (!categoryId) {
      setStages([]);
      return;
    }
    api
      .get<BitrixDealStage[]>(
        `/api/bitrix/deal-stages?connectionId=${connectionId}&categoryId=${categoryId}`,
      )
      .then(setStages)
      .catch(() => setStages([]));
  }, [connectionId, categoryId]);

  const loadDeals = useCallback(
    async (from: number) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ start: String(from), connectionId });
        if (categoryId) params.set('categoryId', categoryId);
        if (stageId) params.set('stageId', stageId);
        if (assignedById) params.set('assignedById', assignedById);
        if (month) params.set('month', month);
        if (year) params.set('year', year);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (customFieldCode && debouncedCustomFieldValue.trim()) {
          params.set('customFieldCode', customFieldCode);
          params.set('customFieldValue', debouncedCustomFieldValue.trim());
        }
        const { data, meta } = await api.get<{
          data: { deals: BitrixDealSummary[]; next: number | null; total: number };
          meta: { restricted: boolean; warning?: string };
        }>(`/api/bitrix/deals?${params}`);
        setDeals(data.deals);
        setNext(data.next);
        setTotal(data.total);
        setStart(from);
        setRestrictedWarning(meta.warning || '');
      } catch (e: any) {
        setError(
          e instanceof Error ? e.message : 'Não foi possível carregar os negócios do Bitrix24.',
        );
      } finally {
        setLoading(false);
      }
    },
    [
      assignedById,
      categoryId,
      connectionId,
      customFieldCode,
      debouncedCustomFieldValue,
      debouncedSearch,
      month,
      stageId,
      year,
    ],
  );

  const loadLeads = useCallback(
    async (from: number) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ start: String(from), connectionId });
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (customFieldCode && debouncedCustomFieldValue.trim()) {
          params.set('customFieldCode', customFieldCode);
          params.set('customFieldValue', debouncedCustomFieldValue.trim());
        }
        const { data, meta } = await api.get<{
          data: { leads: BitrixLeadSummary[]; next: number | null; total: number };
          meta: { restricted: boolean; warning?: string };
        }>(`/api/bitrix/leads?${params}`);
        setLeads(data.leads);
        setNext(data.next);
        setTotal(data.total);
        setStart(from);
        setRestrictedWarning(meta.warning || '');
      } catch (e: any) {
        setError(
          e instanceof Error ? e.message : 'Não foi possível carregar os leads do Bitrix24.',
        );
      } finally {
        setLoading(false);
      }
    },
    [connectionId, customFieldCode, debouncedCustomFieldValue, debouncedSearch],
  );

  const load = useCallback(
    (from: number) => (mode === 'deals' ? loadDeals(from) : loadLeads(from)),
    [loadDeals, loadLeads, mode],
  );

  useEffect(() => {
    setSelected(new Set());
    setImportResult(null);
    load(0);
  }, [load]);

  // ── Processamento dos dados na tela (Quick Filter + Sorting) ──
  const processedDeals = useMemo(() => {
    let list = [...deals];
    if (quickFilter === 'unimported') list = list.filter((d) => !d.alreadyImported);
    if (quickFilter === 'has_value') list = list.filter((d) => Number(d.opportunity || 0) > 0);

    if (sortBy === 'value') {
      list.sort((a, b) => Number(b.opportunity || 0) - Number(a.opportunity || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'recent') {
      list.sort(
        (a, b) => new Date(b.dateCreate || 0).getTime() - new Date(a.dateCreate || 0).getTime(),
      );
    }
    return list;
  }, [deals, quickFilter, sortBy]);

  const processedLeads = useMemo(() => {
    let list = [...leads];
    if (quickFilter === 'unimported') list = list.filter((l) => !l.alreadyImported);
    if (quickFilter === 'has_phone') list = list.filter((l) => Boolean(l.phone));

    if (sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'recent') {
      list.sort(
        (a, b) => new Date(b.dateCreate || 0).getTime() - new Date(a.dateCreate || 0).getTime(),
      );
    }
    return list;
  }, [leads, quickFilter, sortBy]);

  const availableItems =
    mode === 'deals'
      ? processedDeals.filter((d) => !d.alreadyImported)
      : processedLeads.filter((l) => !l.alreadyImported);

  const totalSelectedValue = useMemo(() => {
    if (mode !== 'deals') return 0;
    return deals
      .filter((d) => selected.has(d.id))
      .reduce((acc, d) => acc + Number(d.opportunity || 0), 0);
  }, [deals, selected, mode]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  const allPageSelected =
    availableItems.length > 0 && availableItems.every((item) => selected.has(item.id));

  const toggleAllPage = () => {
    if (allPageSelected) {
      setSelected(new Set());
    } else {
      const nextSet = new Set(selected);
      availableItems.forEach((item) => {
        nextSet.add(item.id);
      });
      setSelected(nextSet);
    }
  };

  const selectAllAvailable = () => {
    const nextSet = new Set(selected);
    availableItems.forEach((item) => {
      nextSet.add(item.id);
    });
    setSelected(nextSet);
  };

  // Importação em Lote
  const importSelected = async () => {
    if (selected.size === 0) return null;
    setImporting(true);
    setError('');
    setImportResult(null);
    try {
      const endpoint = mode === 'deals' ? '/api/bitrix/deals/import' : '/api/bitrix/leads/import';
      const body =
        mode === 'deals'
          ? { connectionId, bitrixDealIds: Array.from(selected) }
          : { connectionId, bitrixLeadIds: Array.from(selected) };
      const result = await api.post<{
        imported: number;
        skipped: number;
        skippedConflicts: number;
        skippedNotOwned: number;
        failed: number;
        importedLeadIds: string[];
      }>(endpoint, body, { timeoutMs: 90_000 });
      setImportResult(result);
      setSelected(new Set());
      setShowBulkEditModal(false);
      await load(start);
      return result;
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Falha ao importar os itens selecionados.');
      return null;
    } finally {
      setImporting(false);
    }
  };

  // Confirmação do modal "Editar em Lote": importa e, em seguida, aplica a temperatura inicial
  // escolhida a cada lead realmente criado. Antes desta correção, bulkTemperature/bulkTriggerVoice
  // eram só estado local — o usuário configurava, via importSelected (mesma função do botão
  // "Importar Selecionados" simples), recebia toast de sucesso, e nada era de fato aplicado.
  const applyBulkEditAndImport = async () => {
    const result = await importSelected();
    if (!result?.importedLeadIds?.length) return;

    const outcomes = await Promise.allSettled(
      result.importedLeadIds.map((id) =>
        api.put(`/api/leads/${id}`, { temperature: bulkTemperature }),
      ),
    );
    const failedCount = outcomes.filter((o) => o.status === 'rejected').length;
    if (failedCount > 0) {
      setError(
        `Importação concluída, mas a temperatura inicial não pôde ser aplicada a ${failedCount} de ${result.importedLeadIds.length} lead(s) — os demais foram atualizados normalmente.`,
      );
    }
  };

  // Importação Individual de 1 Clique
  const importSingle = async (id: string) => {
    setImportingSingleId(id);
    setError('');
    try {
      const endpoint = mode === 'deals' ? '/api/bitrix/deals/import' : '/api/bitrix/leads/import';
      const body =
        mode === 'deals'
          ? { connectionId, bitrixDealIds: [id] }
          : { connectionId, bitrixLeadIds: [id] };
      const result = await api.post<{
        imported: number;
        skipped: number;
        skippedConflicts: number;
        skippedNotOwned: number;
        failed: number;
      }>(endpoint, body, { timeoutMs: 30_000 });
      setImportResult(result);
      await load(start);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Falha ao importar o item.');
    } finally {
      setImportingSingleId(null);
    }
  };

  const userName = (id: string | null) =>
    (id && users.find((u) => u.id === id)?.name) || (id ? `Usuário #${id}` : null);

  const currentItemsCount = mode === 'deals' ? deals.length : leads.length;

  return (
    <div className="mt-6 pt-6 border-t border-line space-y-4">
      <BitrixImportHeader total={total} loading={loading} onRefresh={() => load(start)} />

      <BitrixImportToolbar
        mode={mode}
        onModeChange={setMode}
        totalSelectedValue={totalSelectedValue}
        selectedCount={selected.size}
        importing={importing}
        onOpenBulkEdit={() => setShowBulkEditModal(true)}
        onImportSelected={() => void importSelected()}
      />

      <BitrixImportFilters
        mode={mode}
        totalCount={currentItemsCount}
        search={search}
        onSearchChange={setSearch}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        pipelines={pipelines}
        stages={stages}
        stageId={stageId}
        onStageChange={setStageId}
        assignedById={assignedById}
        onAssignedByChange={setAssignedById}
        users={users}
        canPickAnyVendor={canPickAnyVendor}
        month={month}
        onMonthChange={setMonth}
        year={year}
        onYearChange={setYear}
        currentYear={currentYear}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        fields={fields}
        customFieldCode={customFieldCode}
        onCustomFieldCodeChange={setCustomFieldCode}
        customFieldValue={customFieldValue}
        onCustomFieldValueChange={setCustomFieldValue}
      />

      {error && (
        <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3.5 rounded-2xl border border-red-200">
          {error}
        </p>
      )}
      {!error && restrictedWarning && (
        <p className="text-xs text-warning-active dark:text-warning flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 p-3.5 rounded-2xl border border-amber-200 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0 text-warning-active dark:text-warning" />{' '}
          {restrictedWarning}
        </p>
      )}

      {importResult && (
        <div className="text-xs space-y-1 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-3xl shadow-sm">
          <p className="text-green-700 dark:text-green-400 font-bold flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> {importResult.imported} registro(s)
            importado(s) com sucesso
            {importResult.skipped > 0 ? `, ${importResult.skipped} já existiam` : ''}.
          </p>
          {importResult.skippedConflicts > 0 && (
            <p className="text-warning-active dark:text-warning flex items-center gap-1.5 pl-6">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {importResult.skippedConflicts}{' '}
              bloqueado(s) — pertenciam a outro responsável.
            </p>
          )}
          {importResult.skippedNotOwned > 0 && (
            <p className="text-warning-active dark:text-warning flex items-center gap-1.5 pl-6">
              <Lock className="w-3.5 h-3.5 shrink-0" /> {importResult.skippedNotOwned} ignorado(s) —
              não atribuídos a você no Bitrix24.
            </p>
          )}
          {!!importResult.failed && importResult.failed > 0 && (
            <p className="text-red-600 dark:text-red-400 flex items-center gap-1.5 pl-6">
              <XCircle className="w-3.5 h-3.5 shrink-0" /> {importResult.failed} falharam de verdade
              (erro de rede/Bitrix) — os demais itens foram importados normalmente; tente novamente
              só para estes.
            </p>
          )}
        </div>
      )}

      {/* Barra Superior de Seleção em Massa */}
      {!loading && availableItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-surface-2 to-soft border border-line rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAllPage}
              className="flex items-center gap-2 text-xs font-bold text-ink hover:text-brand dark:hover:text-brand-2 transition-colors"
            >
              {allPageSelected ? (
                <CheckSquare className="w-4 h-4 text-brand" />
              ) : (
                <Square className="w-4 h-4 text-ink-2" />
              )}
              <span>Selecionar Todos da Página ({availableItems.length} disponíveis)</span>
            </button>

            <button
              type="button"
              onClick={selectAllAvailable}
              className="text-xs font-bold text-brand-ink hover:brightness-110 dark:text-brand flex items-center gap-1 underline underline-offset-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Marcar Todos
            </button>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-ink dark:text-brand bg-soft px-3 py-1 rounded-full">
                {selected.size} selecionado(s)
              </span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs font-bold text-ink-2 hover:text-red-500 transition-colors"
              >
                Desmarcar Tudo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de Cards Ricos para Registros de Clientes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <p className="text-xs font-bold text-ink-2">Carregando dados do Bitrix24...</p>
        </div>
      ) : (
        <div className="max-h-[34rem] overflow-y-auto space-y-3 pr-1">
          {mode === 'deals'
            ? processedDeals.map((deal) => (
                <BitrixImportDealCard
                  key={deal.id}
                  deal={deal}
                  selected={selected.has(deal.id)}
                  importingBulk={importing}
                  importingSingle={importingSingleId === deal.id}
                  userName={userName}
                  onToggle={() => toggle(deal.id)}
                  onImportSingle={() => void importSingle(deal.id)}
                />
              ))
            : processedLeads.map((lead) => (
                <BitrixImportLeadCard
                  key={lead.id}
                  lead={lead}
                  selected={selected.has(lead.id)}
                  importingBulk={importing}
                  importingSingle={importingSingleId === lead.id}
                  onToggle={() => toggle(lead.id)}
                  onImportSingle={() => void importSingle(lead.id)}
                />
              ))}

          {(mode === 'deals' ? processedDeals.length : processedLeads.length) === 0 && (
            <div className="p-10 text-center bg-surface-2 rounded-3xl border border-dashed border-line space-y-2">
              <Info className="w-8 h-8 text-ink-2 mx-auto" />
              <p className="text-sm font-bold text-ink">Nenhum registro encontrado</p>
              <p className="text-xs text-ink-2">
                Tente ajustar os filtros, mudar a busca ou selecionar outra aba.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paginação Inferior */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(Math.max(0, start - 50))}
            disabled={loading || start === 0}
            className="px-4 py-2 border border-line rounded-2xl text-xs font-bold text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => next != null && load(next)}
            disabled={loading || next == null}
            className="px-4 py-2 border border-line rounded-2xl text-xs font-bold text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors"
          >
            Próxima →
          </button>
          <span className="text-xs text-ink-2 pl-2">
            Exibindo {start + 1}–{start + currentItemsCount} de {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setShowBulkEditModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-2 hover:bg-line text-ink text-xs font-bold rounded-2xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar ({selected.size})
            </button>
          )}
          <button
            type="button"
            onClick={() => void importSelected()}
            disabled={importing || selected.size === 0}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-brand-active to-brand-2 hover:brightness-110 text-on-brand text-xs font-bold rounded-2xl shadow-md shadow-brand-active/20 transition-colors disabled:opacity-40"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {importing
              ? 'Importando...'
              : `Importar ${selected.size > 0 ? `(${selected.size})` : 'selecionados'}`}
          </button>
        </div>
      </div>

      <BitrixImportBulkEditModal
        isOpen={showBulkEditModal}
        selectedCount={selected.size}
        bulkTemperature={bulkTemperature}
        onBulkTemperatureChange={setBulkTemperature}
        importing={importing}
        onClose={() => setShowBulkEditModal(false)}
        onApplyAndImport={() => void applyBulkEditAndImport()}
      />
    </div>
  );
}

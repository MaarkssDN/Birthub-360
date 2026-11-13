import {
  Building2,
  CalendarDays,
  Check,
  DollarSign,
  ExternalLink,
  Info,
  Layers,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext.js';
import { api } from '../../../lib/api.js';
import { hasRequiredRole } from '../../../lib/auth/authorization.js';
import { BitrixBulkEditDialog } from './bitrixImport/BitrixBulkEditDialog.js';
import { BitrixBulkSelectionBar } from './bitrixImport/BitrixBulkSelectionBar.js';
import { BitrixImportFiltersPanel } from './bitrixImport/BitrixImportFiltersPanel.js';
import { BitrixImportFooter } from './bitrixImport/BitrixImportFooter.js';
import { BitrixImportModeBar } from './bitrixImport/BitrixImportModeBar.js';
import { BitrixImportResultBanners } from './bitrixImport/BitrixImportResultBanners.js';

export interface BitrixLeadSummary {
  id: string;
  title: string;
  companyTitle: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  statusLabel: string;
  sourceId: string | null;
  dateCreate: string | null;
  alreadyImported: boolean;
}

export interface BitrixDealSummary {
  id: string;
  title: string;
  stageLabel: string;
  assignedById: string | null;
  dateCreate: string | null;
  opportunity: string | null;
  alreadyImported: boolean;
}

export interface BitrixDealPipeline {
  id: string;
  name: string;
}

export interface BitrixDealStage {
  id: string;
  name: string;
}

export interface BitrixUserOption {
  id: string;
  name: string;
}

export interface BitrixFieldOption {
  code: string;
  label: string;
}

interface BitrixImportPanelProps {
  connectionId: string;
}

export function BitrixImportPanel({ connectionId }: BitrixImportPanelProps) {
  const { currentUser } = useAuth();
  const canPickAnyVendor = !!currentUser && hasRequiredRole(currentUser.role, ['ADMIN', 'GESTOR']);
  const [mode, setMode] = useState<'deals' | 'leads'>('deals');

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
  const [quickFilter, setQuickFilter] = useState<'all' | 'unimported' | 'has_phone' | 'has_value'>(
    'all',
  );
  const [sortBy, setSortBy] = useState<'recent' | 'value' | 'name'>('recent');

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
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    skippedConflicts: number;
    skippedNotOwned: number;
    failed?: number;
  } | null>(null);
  const [restrictedWarning, setRestrictedWarning] = useState('');

  // ── Modal de Edição em Lote ──
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkTemperature, setBulkTemperature] = useState<'Frio' | 'Morno' | 'Quente'>('Morno');

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

  return (
    <div className="mt-6 pt-6 border-t border-line space-y-4">
      {/* Header com Indicador de Saúde do Portal Bitrix */}
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
            onClick={() => load(start)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-ink-2 hover:text-ink bg-surface border border-line rounded-2xl shadow-sm hover:shadow transition-colors disabled:opacity-50"
            title="Recarregar dados do Bitrix24"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Portal
          </button>
        </div>
      </div>

      {/* Alternador de Modo: Negócios x Leads + Indicadores de Valor */}
      <BitrixImportModeBar
        mode={mode}
        onModeChange={setMode}
        totalSelectedValue={totalSelectedValue}
        selectedCount={selected.size}
        onOpenBulkEdit={() => setShowBulkEditModal(true)}
        onImportSelected={importSelected}
        importing={importing}
      />

      {/* Painel Avançado de Filtros e Busca */}
      <BitrixImportFiltersPanel
        mode={mode}
        canPickAnyVendor={canPickAnyVendor}
        search={search}
        setSearch={setSearch}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        customFieldCode={customFieldCode}
        setCustomFieldCode={setCustomFieldCode}
        customFieldValue={customFieldValue}
        setCustomFieldValue={setCustomFieldValue}
        fields={fields}
        pipelines={pipelines}
        stages={stages}
        users={users}
        stageId={stageId}
        setStageId={setStageId}
        assignedById={assignedById}
        setAssignedById={setAssignedById}
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        totalItems={mode === 'deals' ? deals.length : leads.length}
      />

      <BitrixImportResultBanners
        error={error}
        restrictedWarning={restrictedWarning}
        importResult={importResult}
      />

      {/* Barra Superior de Seleção em Massa */}
      {!loading && availableItems.length > 0 && (
        <BitrixBulkSelectionBar
          availableCount={availableItems.length}
          allPageSelected={allPageSelected}
          onToggleAllPage={toggleAllPage}
          onSelectAllAvailable={selectAllAvailable}
          selectedCount={selected.size}
          onClearSelection={() => setSelected(new Set())}
        />
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
            ? processedDeals.map((deal) => {
                const isSelected = selected.has(deal.id);
                const isSingleImporting = importingSingleId === deal.id;

                return (
                  <div
                    key={deal.id}
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border transition-colors ${
                      deal.alreadyImported
                        ? 'opacity-50 bg-surface-2 border-line'
                        : isSelected
                          ? 'bg-brand/10 border-brand/50 shadow-md shadow-brand/5 ring-1 ring-brand/30'
                          : 'bg-surface border-line hover:border-brand/40 hover:bg-soft shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="pt-1 shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={deal.alreadyImported}
                          onChange={() => toggle(deal.id)}
                          className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-soft text-brand-ink dark:text-brand flex items-center justify-center shrink-0 font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <h4 className="font-bold text-ink text-sm truncate">{deal.title}</h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soft text-brand-ink dark:text-brand border border-brand/20 text-[10px] font-bold">
                            <Tag className="w-3 h-3" />
                            {deal.stageLabel}
                          </span>
                          {deal.alreadyImported && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 text-[10px] font-bold">
                              <Check className="w-3 h-3" /> Já Importado
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-2">
                          {deal.assignedById && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-ink-2" />
                              {userName(deal.assignedById)}
                            </span>
                          )}
                          {deal.opportunity && (
                            <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                              <DollarSign className="w-3.5 h-3.5" />
                              R$ {Number(deal.opportunity).toLocaleString('pt-BR')}
                            </span>
                          )}
                          {deal.dateCreate && (
                            <span className="flex items-center gap-1 text-ink-2">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(deal.dateCreate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ação Individual de 1 Clique */}
                    {!deal.alreadyImported && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                        <button
                          type="button"
                          onClick={() => importSingle(deal.id)}
                          disabled={isSingleImporting || importing}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-soft hover:bg-brand/20 text-brand-ink dark:text-brand border border-brand/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isSingleImporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-brand" />
                          )}
                          {isSingleImporting ? 'Importando...' : 'Importar Agora'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            : processedLeads.map((lead) => {
                const isSelected = selected.has(lead.id);
                const isSingleImporting = importingSingleId === lead.id;
                const whatsappUrl = lead.phone
                  ? `https://wa.me/${lead.phone.replace(/\D/g, '')}`
                  : null;

                return (
                  <div
                    key={lead.id}
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border transition-colors ${
                      lead.alreadyImported
                        ? 'opacity-50 bg-surface-2 border-line'
                        : isSelected
                          ? 'bg-brand/10 border-brand/50 shadow-md shadow-brand/5 ring-1 ring-brand/30'
                          : 'bg-surface border-line hover:border-brand/40 hover:bg-soft shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="pt-1 shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={lead.alreadyImported}
                          onChange={() => toggle(lead.id)}
                          className="w-4 h-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-soft text-brand-ink dark:text-brand flex items-center justify-center shrink-0 font-bold text-xs">
                            <Users className="w-4 h-4" />
                          </div>
                          <h4 className="font-bold text-ink text-sm truncate">{lead.title}</h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soft text-brand-ink dark:text-brand border border-brand/20 text-[10px] font-bold">
                            <Tag className="w-3 h-3" />
                            {lead.statusLabel}
                          </span>
                          {lead.alreadyImported && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 text-[10px] font-bold">
                              <Check className="w-3 h-3" /> Já Importado
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink">
                          {lead.contactName && (
                            <span className="flex items-center gap-1 font-semibold">
                              <Users className="w-3.5 h-3.5 text-ink-2" />
                              {lead.contactName}
                            </span>
                          )}

                          {lead.phone && (
                            <span className="flex items-center gap-1 text-ink-2">
                              <Phone className="w-3.5 h-3.5 text-green-500" />
                              {lead.phone}
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-green-600 hover:text-green-700 inline-flex items-center gap-0.5 text-[10px] font-bold bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded"
                                  title="Abrir no WhatsApp"
                                >
                                  WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </span>
                          )}

                          {lead.email && (
                            <span className="flex items-center gap-1 text-ink-2">
                              <Mail className="w-3.5 h-3.5 text-blue-500" />
                              <a href={`mailto:${lead.email}`} className="hover:underline">
                                {lead.email}
                              </a>
                            </span>
                          )}

                          {lead.dateCreate && (
                            <span className="flex items-center gap-1 text-ink-2 ml-auto">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(lead.dateCreate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ação Individual de 1 Clique */}
                    {!lead.alreadyImported && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                        <button
                          type="button"
                          onClick={() => importSingle(lead.id)}
                          disabled={isSingleImporting || importing}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-soft hover:bg-brand/20 text-brand-ink dark:text-brand border border-brand/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isSingleImporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-brand" />
                          )}
                          {isSingleImporting ? 'Importando...' : 'Importar Agora'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

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
      <BitrixImportFooter
        start={start}
        next={next}
        loading={loading}
        pageCount={mode === 'deals' ? deals.length : leads.length}
        total={total}
        selectedCount={selected.size}
        importing={importing}
        onLoad={load}
        onOpenBulkEdit={() => setShowBulkEditModal(true)}
        onImportSelected={importSelected}
      />
      {/* Modal de Configurações e Edição em Lote */}
      <BitrixBulkEditDialog
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedCount={selected.size}
        temperature={bulkTemperature}
        onTemperatureChange={setBulkTemperature}
        importing={importing}
        onApply={applyBulkEditAndImport}
      />
    </div>
  );
}

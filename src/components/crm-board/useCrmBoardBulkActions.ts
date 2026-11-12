import { useCallback, useEffect, useMemo, useState } from 'react';
import { bitrixApi } from '../../features/integrations/bitrix/bitrix.api.js';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import type { Lead } from '../../types/index.js';

interface UseCrmBoardBulkActionsOptions {
  filteredLeads: Lead[];
  fetchLeads: () => void | Promise<void>;
}

/**
 * Seleção múltipla e ações em lote do CrmBoard (mover etapa, reatribuir dono,
 * exportar/enriquecer via Bitrix/IA), extraídos na TAREFA-SANEAMENTO-002 (W4).
 * Comportamento preservado verbatim — incluindo o uso do resultado real da API
 * (updatedCount/failedCount) em vez da contagem solicitada.
 */
export function useCrmBoardBulkActions({
  filteredLeads,
  fetchLeads,
}: UseCrmBoardBulkActionsOptions) {
  // Multi-seleção e ações em lote
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const ownerNameById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.name])),
    [users],
  );

  useEffect(() => {
    // /api/users nunca existiu como rota (404 silencioso todo carregamento — achado do teste
    // de console limpo em crm.spec.ts) — o endpoint real de nome/id de usuários da organização
    // pra reatribuição é /api/team/assignable (ver team.routes.ts).
    api
      .get<{ owners: { id: string; name: string }[] }>('/api/team/assignable')
      .then((res) => setUsers(res.owners))
      .catch(() => setUsers([]));
  }, []);

  const handleToggleSelect = useCallback((leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  // Opera sobre os leads FILTRADOS visíveis, não todos os `leads` carregados — "selecionar todos"
  // com um filtro ativo deve selecionar o que está na tela, não leads escondidos pelo filtro.
  const handleSelectAll = useCallback(() => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  }, [filteredLeads, selectedLeadIds.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleBatchMoveStage = async (newStatus: string) => {
    if (selectedLeadIds.size === 0 || !newStatus) return;
    setIsBatchUpdating(true);
    try {
      // Usa o resultado real da API (updatedCount/failedCount), não selectedLeadIds.size — o
      // backend filtra ids inexistentes/de outro tenant e só conta como atualizado quando algo
      // realmente mudou, então a contagem solicitada podia ser maior que a real sem o usuário
      // nunca saber (achado de auditoria).
      const result = await api.post<{ updatedCount: number; total: number; failedCount: number }>(
        '/api/leads/batch-update',
        { leadIds: Array.from(selectedLeadIds), updates: { status: newStatus } },
      );
      if (result.failedCount > 0) {
        toast.error(
          `${result.updatedCount} de ${result.total} leads movidos para "${newStatus}" — ${result.failedCount} falharam.`,
        );
      } else {
        toast.success(`${result.updatedCount} lead(s) movido(s) para "${newStatus}"!`);
      }
      fetchLeads();
      setSelectedLeadIds(new Set());
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Falha ao mover leads em lote.');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleBatchReassignOwner = async (ownerId: string) => {
    if (selectedLeadIds.size === 0) return;
    const ownerUser = users.find((u) => u.id === ownerId);
    const ownerName = ownerUser?.name || ownerId;
    setIsBatchUpdating(true);
    try {
      // Lead.owner é contrato User.id, não nome (DATA-003, mesma correção já aplicada em
      // handleOwnerChange de LeadDetailDrawer.tsx) — este caminho de reatribuição em lote gravava
      // o nome até aqui, divergindo do resto da aplicação (round-robin, import Bitrix, verificação
      // de duplicidade em LeadUseCases.ts, que resolve `existing.owner` via
      // `prisma.user.findUnique({ where: { id } })`) e do próprio KanbanCard.tsx, que já espera
      // resolver o nome de exibição a partir do id (ver ownerNameById acima). `ownerName` aqui
      // continua existindo só para a mensagem do toast, não para o payload.
      const result = await api.post<{ updatedCount: number; total: number; failedCount: number }>(
        '/api/leads/batch-update',
        { leadIds: Array.from(selectedLeadIds), updates: { owner: ownerId } },
      );
      if (result.failedCount > 0) {
        toast.error(
          `${result.updatedCount} de ${result.total} leads reatribuídos para "${ownerName}" — ${result.failedCount} falharam.`,
        );
      } else {
        toast.success(`${result.updatedCount} lead(s) reatribuído(s) para "${ownerName}"!`);
      }
      fetchLeads();
      setSelectedLeadIds(new Set());
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Falha ao reatribuir leads.');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleBatchExportBitrix = async () => {
    if (selectedLeadIds.size === 0) {
      // Se nenhum lead selecionado, pergunta se deseja exportar todos
      try {
        const res = await bitrixApi.exportLeadsBatch();
        toast.success(
          `Exportação concluída: ${res.data.exportedCount} leads enviados para o Bitrix24!`,
        );
        fetchLeads();
      } catch (err: any) {
        toast.error(err instanceof Error ? err.message : 'Falha ao exportar para Bitrix24.');
      }
      return;
    }

    setIsBatchUpdating(true);
    try {
      const res = await bitrixApi.exportLeadsBatch(Array.from(selectedLeadIds));
      toast.success(`${res.data.exportedCount} leads enviados com sucesso para o Bitrix24!`);
      fetchLeads();
      setSelectedLeadIds(new Set());
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Falha ao exportar para Bitrix24.');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleBatchEnrichSelected = async () => {
    if (selectedLeadIds.size === 0) return;
    setIsBatchUpdating(true);
    try {
      const res = await api.post<{
        success: boolean;
        data: { enqueued: number; enfileirado?: boolean; motivo?: string };
      }>('/api/leads/enrich-batch', { leadIds: Array.from(selectedLeadIds) });
      if (res.data?.enqueued > 0) {
        toast.success(
          `${res.data.enqueued} lead(s) selecionado(s) enviado(s) para enriquecimento com IA!`,
        );
        fetchLeads();
        setSelectedLeadIds(new Set());
      } else if (res.data?.enfileirado === false) {
        toast.error(`Falha ao enfileirar: ${res.data.motivo}`);
      } else {
        toast.info('Nenhum lead com empresa associada encontrado na seleção.');
      }
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enriquecer leads selecionados.');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  return {
    selectedLeadIds,
    setSelectedLeadIds,
    selectionMode,
    setSelectionMode,
    isBatchUpdating,
    users,
    ownerNameById,
    handleToggleSelect,
    handleSelectAll,
    handleClearSelection,
    handleBatchMoveStage,
    handleBatchReassignOwner,
    handleBatchExportBitrix,
    handleBatchEnrichSelected,
  };
}

import { useState } from 'react';
import { bitrixApi } from '../features/integrations/bitrix/bitrix.api.js';
import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';

interface UseCrmBoardBatchActionsOptions {
  selectedLeadIds: Set<string>;
  users: { id: string; name: string }[];
  fetchLeads: () => void;
  /** Equivalente ao `setSelectedLeadIds(new Set())` original — NÃO fecha o modo de seleção. */
  clearSelection: () => void;
}

/**
 * Ações em lote do board CRM (mover etapa, reatribuir dono, exportar p/ Bitrix, enriquecer),
 * extraídas de `src/components/CrmBoard.tsx` na refatoração de hotspot (Onda 3, handoff
 * 00→04). Comportamento idêntico ao que existia inline no componente — incluindo o uso do
 * `updatedCount`/`failedCount` reais da API nos toasts.
 */
export function useCrmBoardBatchActions({
  selectedLeadIds,
  users,
  fetchLeads,
  clearSelection,
}: UseCrmBoardBatchActionsOptions) {
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

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
      clearSelection();
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
      // resolver o nome de exibição a partir do id (ver ownerNameById em CrmBoard.tsx). `ownerName`
      // aqui continua existindo só para a mensagem do toast, não para o payload.
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
      clearSelection();
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
      clearSelection();
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
        clearSelection();
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
    isBatchUpdating,
    handleBatchMoveStage,
    handleBatchReassignOwner,
    handleBatchExportBitrix,
    handleBatchEnrichSelected,
  };
}

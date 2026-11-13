// ARCH-009 (auditoria de dívida técnica): 857L / complexidade proxy 203 — o maior do repo. Cinco
// responsabilidades reais conviviam no mesmo arquivo (conexões, listagem/import de Leads,
// listagem/import de Deals, push Atlas→Bitrix e regras de sincronização automática), cada uma
// com sua própria lógica de filtro/mapeamento de campos. Decomposto em service/:
// - service/client.ts: cliente HTTP de baixo nível (callBitrix), validação de webhook, cache de
//   status labels — o "BitrixClient" sugerido pelo checklist.
// - service/connections.ts: CRUD de conexões (portais Bitrix conectados a uma organização).
// - service/leads.ts: listagem/importação do objeto Lead do Bitrix.
// - service/deals.ts: listagem/importação do objeto Deal/Negócio (com pipeline/etapa).
// - service/outboundSync.ts: push Atlas → Bitrix (mapeamento de campos — o "BitrixFieldMapper"
//   sugerido pelo checklist vive dentro de syncLeadToBitrix, não fazia sentido isolar só o
//   mapeamento de um único caller sem introduzir uma camada artificial).
// - service/syncRules.ts: regras de sincronização automática + runBitrixSyncTick — o
//   "BitrixSyncService" sugerido pelo checklist.
// Este arquivo agora só reexporta a API pública, preservando os imports existentes em
// bitrix.routes.ts, prospecting.service.ts, bitrixSync.worker.ts e LeadUseCases.ts (import
// dinâmico) sem exigir nenhuma mudança neles.

export { getConnectionWebhookUrl } from './service/client.js';
export {
  connectBitrix,
  disconnectBitrix,
  listBitrixConnections,
  regenerateWebhookSecret,
  setInboundEventsEnabled,
  testBitrixConnection,
} from './service/connections.js';
export { getEntityFields } from './service/customFields.js';
// Plano Diário Operacional com integração Bitrix24
export type { DailyPlanItemOrigin } from './service/dailyPlan.service.js';
export {
  addDailyPlanItemNote,
  completeDailyPlanItem,
  createDailyPlanActivity,
  fetchUserDailyPlan,
} from './service/dailyPlan.service.js';
// Fechamento obrigatório do Plano Diário (parecer do dia anterior + metas do novo dia)
export {
  createDailyPlanClosing,
  getPendingDailyClosing,
} from './service/dailyPlanClosing.service.js';
export { fetchDailyPlanItemNotes } from './service/dailyPlanNotes.service.js';
export {
  getBitrixUsers,
  getDealPipelines,
  getDealStages,
  importSelectedBitrixDeals,
  listBitrixDeals,
} from './service/deals.js';
// Serviço real de Extrações Bitrix (Onda 7, Agente 06/06A) — ver service/extraction.ts para o
// racional de arquitetura (execução em segundo plano sem worker BullMQ dedicado nesta rodada).
export {
  cancelExtractionRun,
  createExtractionRun,
  deleteExtractionRun,
  downloadExtractionFile,
  getExtractionRun,
  listExtractionRuns,
  reconcileStuckRuns,
  retryExtractionRun,
} from './service/extraction.js';
export {
  findUnimportedBitrixLeadIds,
  getLeadStatuses,
  importSelectedBitrixLeads,
  listBitrixLeads,
} from './service/leads.js';
export {
  exportLeadToBitrixNow,
  postCommentToBitrix,
} from './service/outboundSync.js';
// Histórico real de sincronização (webhook de entrada + push/pull), consumido por WebhookMonitor.tsx.
export { listRecentBitrixSyncLogs } from './service/syncLogs.js';
export {
  createSyncRule,
  deleteSyncRule,
  listSyncRules,
  runBitrixSyncTick,
  setSyncRuleActive,
} from './service/syncRules.js';
export {
  resolveBirthubUserIdByEmail,
  resolveOwnBitrixUserId,
} from './service/userMapping.js';

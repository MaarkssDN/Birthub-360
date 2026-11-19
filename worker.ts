import { initTracing } from './src/lib/tracing.js';
initTracing();

import { registerProcessGuards } from './src/lib/process-guards.js';
registerProcessGuards();

import { startWorkerServer } from './src/bootstrap/workerServer.js';
import { logger } from './src/lib/logger.js';
import { prisma } from './src/lib/prisma.js';
import { assertDbRoleIsLeastPrivilege } from './src/bootstrap/dbRoleCheck.js';
import { setWorkerProcessUp } from './src/lib/queue/metrics.js';
import { env } from './src/config/env.js';

import { createLeadsWorker } from './src/lib/queue/index.js';
import { createAgentWorker } from './src/lib/queue/agent.worker.js';
import { createEnrichmentWorker } from './src/lib/queue/enrichment.queue.js';
import { createEnrichmentCascadeWorker } from './src/lib/queue/enrichmentCascade.worker.js';
import { createSearchWorker } from './src/lib/queue/search.queue.js';
import { createKnowledgeIngestionWorker } from './src/lib/queue/knowledgeIngestion.worker.js';
import { createCheckpointerPruneWorker, scheduleCheckpointerPrune } from './src/lib/queue/checkpointerPrune.worker.js';
import { initMeiliIndexes } from './src/lib/search/index.js';
import {
  createColdCallWorker,
  scheduleColdCallCampaigns,
} from './src/lib/queue/coldCall.worker.js';
import { createWhatsAppSignalWorker } from './src/lib/queue/whatsappSignal.worker.js';
import { createWhatsAppCommandWorker } from './src/lib/queue/whatsappCommand.worker.js';
import { enabledOrganizations } from './src/features/integrations/birth-voice/coldCall.service.js';
import {
  createSwarmSchedulerWorker,
  scheduleSwarmScheduler,
} from './src/lib/queue/swarmScheduler.worker.js';
import { enabledOrganizations as swarmSchedulerEnabledOrganizations } from './src/features/intelligence/services/swarmScheduler.service.js';
import { createBitrixSyncWorker, scheduleBitrixSync } from './src/lib/queue/bitrixSync.worker.js';
// DEBT-0003: consumidores das filas outbound existiam só no modo embedded
// (bootstrap/workers.ts). Na topologia dedicada (worker.ts) os jobs enfileirados
// em 'bitrix-outbound-sync'/'external-crm-outbound-sync' nunca eram processados.
import { createBitrixOutboundWorker } from './src/lib/queue/bitrixOutbound.queue.js';
import { createExternalCrmOutboundWorker } from './src/lib/queue/externalCrmOutbound.queue.js';
import {
  createFollowUpWorker,
  scheduleFollowUpJobs,
} from './src/features/crm/jobs/followUp.worker.js';
import {
  createExecutiveSummaryWorker,
  scheduleExecutiveSummaryJob,
} from './src/features/crm/jobs/dailyExecutiveSummary.worker.js';
import {
  createDeduplicationWorker,
  scheduleDeduplicationJob,
} from './src/features/crm/jobs/deduplication.worker.js';
import {
  createWinLossAnalysisWorker,
  scheduleWinLossAnalysisJob,
} from './src/features/intelligence/services/winLossAnalysis.worker.js';
import {
  createWeeklyPdfReportWorker,
  scheduleWeeklyPdfReportJob,
} from './src/features/crm/jobs/weeklyPdfReport.worker.js';
import {
  createAutoAnonymizeWorker,
  scheduleAutoAnonymizeJob,
} from './src/features/crm/jobs/autoAnonymizeDisqualified.worker.js';
import {
  createLandingLeadRetentionWorker,
  scheduleLandingLeadRetentionJob,
} from './src/features/lgpd/jobs/landingLeadRetention.worker.js';
import {
  createColdLeadsScannerWorker,
  scheduleColdLeadsScannerJob,
} from './src/features/automations/application/cold-leads-scanner.service.js';
import {
  createStagnationScannerWorker,
  scheduleStagnationScannerJob,
} from './src/features/automations/application/stagnation-scanner.service.js';
import {
  createCadenceRunWorker,
  scheduleCadenceRunJob,
} from './src/features/cadence/jobs/cadenceRun.worker.js';
import {
  createAgentMemoryCleanupWorker,
  scheduleAgentMemoryCleanupJob,
} from './src/features/intelligence/jobs/agentMemoryCleanup.worker.js';
import {
  createBitrixExtractionPurgeWorker,
  scheduleBitrixExtractionPurgeJob,
} from './src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.js';
import {
  createNewsMonitorWorker,
  scheduleGlobalNewsScan,
} from './src/lib/queue/newsMonitor.worker.js';
import {
  createAccountIntelligenceInsightsWorker,
  scheduleAccountIntelligenceInsightsJob,
} from './src/features/market-intelligence/jobs/accountIntelligenceInsights.worker.js';
import {
  createAccountIntelligenceSchedulerWorker,
  accountIntelligenceSchedulerQueue,
} from './src/features/market-intelligence/jobs/accountIntelligenceScheduler.worker.js';
import {
  createForecastSnapshotWorker,
  scheduleForecastSnapshotJob,
} from './src/features/commercial-intelligence/jobs/forecastSnapshotWeekly.worker.js';
import { createCopilotoTranscriptionWorker } from './src/features/copiloto-ia/jobs/transcribeConversation.worker.js';
import { MeetingSynthesisService } from './src/features/chatbook/services/meeting-synthesis.service.js';
// MEL-08 (Onda 2): consumidor da fila BullMQ 'webhooks' (webhook.service.ts enfileira, este
// worker entrega com HMAC/retry/DLQ). Sem este registro as entregas nunca saíam do processo.
import { startWebhookWorker } from './src/lib/voice-hub/services/webhook.worker.js';
// MEL-21 (Onda 3): relay da DomainEventOutbox + registro dos consumidores de domínio.
// Sem o relay, registros FAILED/PENDING da outbox transacional nunca eram reprocessados
// (startDomainEventOutboxRelay existia mas nenhum entrypoint o chamava). Os consumidores
// precisam estar registrados NESTE processo antes do relay despachar — deliver() só itera
// handlers locais e marca o registro DISPATCHED ao final.
import { bitrixEventMeshBridge } from './src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.js';
import { startDomainEventOutboxRelay } from './src/lib/queue/outbox/prismaRuntime.js';

async function start() {
  // Papel do banco com menor privilégio (sem superuser/BYPASSRLS/posse) — fatal em produção.
  await assertDbRoleIsLeastPrivilege(prisma, { logger });

  // MEL-21: consumidores do DomainEventMesh neste processo (mesmos do processo web via
  // setupDI → bitrixEventMeshBridge.register) e o relay que reprocessa FAILED/PENDING.
  // Retorna null fora do modo DOMAIN_EVENT_OUTBOX=prisma (memória/dev) — no-op seguro.
  bitrixEventMeshBridge.register();
  const domainEventRelay = startDomainEventOutboxRelay();
  if (domainEventRelay) {
    logger.info('DomainEventOutbox relay iniciado no processo worker');
  }

  const leadsWorker = createLeadsWorker();
  const agentWorker = createAgentWorker();
  const enrichmentWorker = createEnrichmentWorker();
  const enrichmentCascadeWorker = createEnrichmentCascadeWorker();
  const whatsappSignalWorker = createWhatsAppSignalWorker();
  const whatsappCommandWorker = createWhatsAppCommandWorker();
  const knowledgeIngestionWorker = createKnowledgeIngestionWorker();
  const checkpointerPruneWorker = createCheckpointerPruneWorker();
  const bitrixSyncWorker = createBitrixSyncWorker();
  const bitrixOutboundWorker = createBitrixOutboundWorker();
  const externalCrmOutboundWorker = createExternalCrmOutboundWorker();
  const followUpWorker = createFollowUpWorker();
  const execSummaryWorker = createExecutiveSummaryWorker();
  const deduplicationWorker = createDeduplicationWorker();
  const winLossWorker = createWinLossAnalysisWorker();
  const pdfWorker = createWeeklyPdfReportWorker();
  const autoAnonymizeWorker = createAutoAnonymizeWorker();
  const landingLeadRetentionWorker = createLandingLeadRetentionWorker();
  const coldLeadsScannerWorker = createColdLeadsScannerWorker();
  const stagnationScannerWorker = createStagnationScannerWorker();
  const cadenceRunWorker = createCadenceRunWorker();
  const agentMemoryCleanupWorker = createAgentMemoryCleanupWorker();
  const bitrixExtractionPurgeWorker = createBitrixExtractionPurgeWorker();
  const newsMonitorWorker = createNewsMonitorWorker();
  const accountIntelligenceInsightsWorker = createAccountIntelligenceInsightsWorker();
  const accountIntelligenceSchedulerWorker = createAccountIntelligenceSchedulerWorker();
  const forecastSnapshotWorker = createForecastSnapshotWorker();
  const copilotoTranscriptionWorker = createCopilotoTranscriptionWorker({
    meetingSynthesisPort: new MeetingSynthesisService(),
  });
  const webhookWorker = startWebhookWorker();

  const searchWorker = env.ENABLE_SEARCH ? createSearchWorker() : null;
  if (env.ENABLE_SEARCH) {
    initMeiliIndexes().catch((err) => logger.warn({ err }, 'Meilisearch offline'));
  }

  let coldCallWorker = null;
  const coldCallOrgs = await enabledOrganizations();
  if (coldCallOrgs.length > 0) {
    coldCallWorker = createColdCallWorker();
  }

  let swarmSchedulerWorker = null;
  const swarmOrgs = await swarmSchedulerEnabledOrganizations();
  if (swarmOrgs.length > 0) {
    swarmSchedulerWorker = createSwarmSchedulerWorker();
  }

  const workers = [
    { name: 'leads-enrichment', worker: leadsWorker },
    { name: 'intelligence-agents', worker: agentWorker },
    { name: 'enrichment-queue', worker: enrichmentWorker },
    { name: 'enrichment-cascade-queue', worker: enrichmentCascadeWorker },
    { name: 'search-indexing', worker: searchWorker },
    { name: 'whatsapp-conversation-signal', worker: whatsappSignalWorker },
    { name: 'whatsapp-command', worker: whatsappCommandWorker },
    { name: 'knowledge-ingestion-queue', worker: knowledgeIngestionWorker },
    { name: 'checkpointer-prune', worker: checkpointerPruneWorker },
    { name: 'bitrix-sync', worker: bitrixSyncWorker },
    { name: 'bitrix-outbound-sync', worker: bitrixOutboundWorker },
    { name: 'external-crm-outbound-sync', worker: externalCrmOutboundWorker },
    { name: 'whatsapp-followup-queue', worker: followUpWorker },
    { name: 'daily-executive-summary-queue', worker: execSummaryWorker },
    { name: 'deduplication-queue', worker: deduplicationWorker },
    { name: 'win-loss-analysis-queue', worker: winLossWorker },
    { name: 'weekly-pdf-report-queue', worker: pdfWorker },
    { name: 'auto-anonymize-disqualified-queue', worker: autoAnonymizeWorker },
    { name: 'landing-lead-retention-queue', worker: landingLeadRetentionWorker },
    { name: 'sdr-cold-call', worker: coldCallWorker },
    { name: 'swarm-scheduler', worker: swarmSchedulerWorker },
    { name: 'cold-leads-scanner-queue', worker: coldLeadsScannerWorker },
    { name: 'stagnation-scanner-queue', worker: stagnationScannerWorker },
    { name: 'cadence-run-scanner', worker: cadenceRunWorker },
    { name: 'agent-memory-cleanup', worker: agentMemoryCleanupWorker },
    { name: 'bitrix-extraction-purge', worker: bitrixExtractionPurgeWorker },
    { name: 'news-monitor', worker: newsMonitorWorker },
    { name: 'account-intelligence-insights', worker: accountIntelligenceInsightsWorker },
    { name: 'account-intelligence-scheduler', worker: accountIntelligenceSchedulerWorker },
    { name: 'forecast-snapshot-weekly-queue', worker: forecastSnapshotWorker },
    { name: 'copiloto-ia-transcription-queue', worker: copilotoTranscriptionWorker },
    { name: 'webhooks', worker: webhookWorker },
  ];

  await startWorkerServer(
    workers,
    async () => {
      await scheduleBitrixSync();
      await scheduleFollowUpJobs();
      await scheduleExecutiveSummaryJob();
      await scheduleDeduplicationJob();
      await scheduleWinLossAnalysisJob();
      await scheduleWeeklyPdfReportJob();
      await scheduleAutoAnonymizeJob();
      await scheduleLandingLeadRetentionJob();
      await scheduleColdLeadsScannerJob();
      await scheduleStagnationScannerJob();
      await scheduleCadenceRunJob();
      await scheduleAgentMemoryCleanupJob();
      await scheduleBitrixExtractionPurgeJob();
      await scheduleGlobalNewsScan();
      await scheduleCheckpointerPrune();
      await scheduleAccountIntelligenceInsightsJob();
      await scheduleForecastSnapshotJob();
      await accountIntelligenceSchedulerQueue.upsertJobScheduler(
        'daily-ldr-scheduler',
        { pattern: '0 2 * * *' },
        { name: 'accountIntelligenceScheduler', data: {} }
      );
      if (coldCallWorker) await scheduleColdCallCampaigns();
      if (swarmSchedulerWorker) await scheduleSwarmScheduler();
    },
    'all',
    // MEL-21: o relay não é BullMQ Worker — fecha o timer do poll no shutdown.
    async () => {
      domainEventRelay?.close();
    }
  );
}

start().catch((err) => {
  setWorkerProcessUp(false);
  logger.fatal({ err }, 'worker.ts: fatal bootstrap failure');
  process.exit(1);
});

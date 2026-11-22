# Auditoria Agente 01A — Dados, RLS e Retenção (READ-ONLY)
**Data:** 2026-11-18 | **Base:** `main @ b54060ad1` | working tree sujo ignorado.

## Verificações positivas (não reabrir)
- AILog/RLS: correção histórica presente (`20260813230000_fix_ailog_rls...`); bypass via `BYPASS_RLS_ALLOWED_MODELS`.
- DSR público / chat company do PR #381 **já existem em main**: migrations `20261117231500_data_subject_request_dsr`, `20261117230000_outbound_chat_tenant_company`, `dsrRequest.service.ts`, filtros `company` em chat.routes.
- BitrixExtractionRun schema ok + worker de expurgo LGPD é o melhor padrão do repo (varredura por org com `requestContext.run`).
- Erasure LGPD (`dataSubjectErasure.service.ts`) completo: anonimização em transação + OptOutRecord + AuditLog + remoção de áudio.
- Gate RLS estático existe e PASS (137 tabelas).

## Findings

### DB-01 — retentionPurge.service.ts é DEAD CODE e incompatível com RLS atual — P1, confiança Alta
- `src/shared/services/retentionPurge.service.ts:46-209`; sem caller em `src/**` nem scheduler em `src/bootstrap/workers.ts`.
- `executeRetentionPurge` nunca é chamado; `auditLogDays` calculado mas não usado; purgas de `AILog`/`BitrixSyncLog`/`ExternalCrmSyncLog` não executam.
- Service usa `prisma` global fora de `requestContext.run({tenantId})` — sem tenant, RLS esconde linhas de tenant → deleteMany não as alcança (falha silenciosa).
- Correção: worker dedicado no padrão bitrixExtractionPurge (descobrir orgs → requestContext por org); decidir política de AuditLog (append-only com triggers — não purgável por DELETE simples).
- Coberto por PR: parcial/incerto (#387 altera o service mas não vi scheduler nem requestContext por org — validar diff).

### DB-02 — Módulo outbound legado usa `company` string + SQL raw, sem RLS/organizationId canônico — P1 se alcançável / P2 se gated
- `src/features/prospecting/outbound/server/db.ts:29-56`; `auth.ts:226-246`; `chat.routes.ts:22-209`; migration `20261117230000` declara que RLS não é aplicada de propósito.
- `normalizeTenantCompany` colapsa qualquer valor com 'birthhub'/'360' para `'birthhub360'` (`auth.ts:230-238`). Rotas filtram por `LOWER(TRIM(COALESCE(company,'')))` — duas orgs reais com company normalizada igual compartilham escopo.
- SQL raw (`$queryRawUnsafe`/`$executeRawUnsafe`) escapa dos interceptores Prisma (soft-delete/auditoria/tenant).
- Correção: migrar para organizationId canônico + RLS, ou mapear company→Organization.id server-side e falhar fechado; documentar módulo desabilitado até lá.
- Coberto por PR: parcial (#381 adicionou coluna/filtros, não resolve RLS/tenant canônico).

### DB-03 — Importação Bitrix não atômica (Company/Contact/Lead) — P1, Alta
- `src/features/integrations/bitrix/service/leads.ts:321-377`; `deals.ts:436-502`.
- `company.create`, `contact.create`, `lead.create`, `AuditService.log` sequenciais fora de `$transaction`. Falha no meio → órfãos; enrichment enfileirado logo após Company (`:337-340`) pode enriquecer empresa que nunca vira lead.
- Correção: `runInTransaction` por item; enrichment só após commit; P2002 → rollback do item.
- Coberto por PR: não (#381/#387). Dono: 06/01 via handoff.

### DB-04 — Escritas de estágio/status não atômicas com histórico — P2, Alta
- `PrismaCrm360Repository.ts:458-503`; `PrismaLeadRepository.ts:411-448`; `LeadUseCases.ts:744-779`.
- `convertLead`/`updateStatus` atualizam lead primeiro, depois `recordStageTransition`/timeline em chamadas separadas. `batchUpdateLeads` documenta não-atomicidade (`:781-785`).
- Impacto: estágio sem LeadStageHistory → forecast/auditoria quebrados; batch reporta failedCount com status já persistido.
- Coberto por PR: parcial/incerto (#390 tem nota de atomicidade pendente de adendo do 24).

### DB-05 — Soft delete opt-in inconsistente — P2, Alta
- `prisma-interceptors.ts:157-176,316-346`; schema tem `deletedAt` em ~14 models; `AUDITABLE_MODELS` cobre só 9. `CopilotoConversation`, `CadenceSequence`, `Workflow`, `Agent`, `AgentSession` fora da lista; alguns sem `deletedBy`/`deleteReason`.
- Correção: derivar models soft-delete do schema ou ampliar lista; teste de paridade.
- Coberto por PR: não.

### DB-06 — Gate RLS estático com pontos cegos — P2, Alta
- `scripts/security/check-rls-coverage.ts:39-105`: só models com organizationId/tenantId direto; não modela DROP POLICY posterior; não cobre tabelas filhas (`Note`, `TimelineEvent`, `EnrichmentLog`, `DocumentChunk`, `CrmPipelineStage`, `WorkflowVersion`, `CallAttempt`) que dependem de policy via pai.
- Correção: inventário explícito de filhas ou verificação runtime vs pg_policy; documentar que gate é estático.
- Coberto por PR: não.

### DB-07 — Backup/restore sem evidência versionada de drill — P2, Média-alta
- `scripts/backup/run-backup-restore-drill.ts` existe e é robusto; relatório `docs/audits/prontidao-producao-20261017/09-...` afirma rotina, mas não há `BACKUP-RESTORE-DRILL-RESULT.json` nem log datado versionado.
- Correção: executar drill em ambiente representativo, versionar JSON com data/hash/RTO.
- Coberto por PR: não.

### DB-08 — Lacunas de integridade referencial/tenant no schema — P3, Média
- `DataSubjectRequest.contactId` scalar sem FK (`schema.prisma:5710-5760`); `Setting.organizationId` nullable + unique com NULL (`:5381-5395`); `Activity` tem orgId+leadId mas FK só para Lead (`:759-765`); tabelas filhas com orgId próprio sem FK composta `(parentId, organizationId)`.
- Coberto por PR: não.

## Pergunta pendente (requer decisão humana)
Janela oficial de retenção em dias para AuditLog, AILog, BitrixSyncLog, ExternalCrmSyncLog, AgentMemory, WhatsAppMessage, ConversationSignal, TimelineEvent, EnrichmentLog? Defaults soltos hoje (90/60/365; BitrixExtraction 45; landing 90; anonymize 90; AuditLog append-only). **Auditoria legal/LGPD deve ser respondida antes de ligar qualquer purge.**

## Top-5 riscos
1. Retenção de logs morta e incompatível com RLS.
2. Importação Bitrix não atômica → órfãos/duplicatas.
3. Outbound legado sem tenant canônico/RLS.
4. Histórico comercial fora da transação.
5. Sem evidência de backup/restore drill; soft-delete por lista manual incompleta.

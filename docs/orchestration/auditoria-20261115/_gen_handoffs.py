#!/usr/bin/env python3
"""Gera handoffs formais da auditoria DEM-20261115-001 em .agents/handoffs/auditoria-20261115/."""
from pathlib import Path

D = Path(r"C:\Github\Birthub-360\.agents\handoffs\auditoria-20261115")
D.mkdir(parents=True, exist_ok=True)

H = {
"15-para-01-retencao-lgpd-purge.md": ("15","01","bloqueador","alto",
"""## Problema
Retenção LGPD declarada não aplicada: `LANDING_LEAD_RETENTION_IDLE_DAYS`/`AFTER_DEMO_DAYS` sem worker consumidor; sem expurgo de Contact/Lead; anonimização não cobre EmailMessage, CadenceRun.attempts, MultichannelCadenceEnrollment, SignatureRequest, Note, WhatsAppMessage.phoneE164, Attachment(S3), EnrichmentLog.rawData; AuditLog retém PII sem retenção; `purge-expired-data.sql` é função morta e perigosa (não limpa índices cegos).

## Arquivo(s) envolvido(s)
src/config/env.ts:103-105; src/shared/services/dataSubjectErasure.service.ts; scripts/lgpd/purge-expired-data.sql; prisma/schema.prisma (modelos citados); src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.ts (padrão de referência).

## Evidência
docs/orchestration/auditoria-20261115/15-21-seguranca-lgpd.md; 17-22-cadencia-verificacao.md; 01-dados-schema-rls.md; 01-plataforma-dados.md.

## Alteração necessária
1. Worker de purge para landing leads + Contact/Lead conforme ROPA.
2. Estender dataSubjectErasure para EmailMessage, Cadence*, MultichannelCadenceEnrollment, SignatureRequest, Note, phoneE164, Attachment, EnrichmentLog.
3. Política de retenção para AuditLog.details.
4. Corrigir ou remover purge-expired-data.sql.

## Teste esperado
Teste de integração: anonimizar titular → assert SQL de que nenhum modelo listado retém PII; job de purge remove registro expirado e grava audit.

## Contexto adicional
Schema novo necessário: DataSubjectRequest (canal self-service — decisão de produto pendente com 00/21)."""),
"10-para-08-deploy-smoke-rollback.md": ("10","08","bloqueador","alto",
"""## Problema
Deploy de produção é 100% manual e os scripts de verificação são falsos: production-smoke-tests.sh e rollback-drill.sh só fazem echo+exit 0; deploy-aws.ps1/deploy-ec2.sh copiam dist/node_modules em container vivo sem migrate deploy, sem gate de CI, sem rollback, com StrictHostKeyChecking=no.

## Arquivo(s) envolvido(s)
scripts/deploy/production-smoke-tests.sh; scripts/deploy/rollback-drill.sh; deploy-aws.ps1; deploy-ec2.sh; deploy-ec2.ps1; docs/deploy/.

## Evidência
docs/orchestration/auditoria-20261115/10-infra-sre.md (P0-1..P0-3, P1-1, P1-4); 08-qa-release-deploy.md (P0, P1).

## Alteração necessária
1. Reescrever smoke tests reais (curl /health/live + /health/ready + /version).
2. Rollback drill real ou remoção honesta.
3. Deploy EC2 com imagem imutável por SHA, prisma migrate deploy, healthcheck /health/ready como gate, rollback por tag.
4. Remover StrictHostKeyChecking=no (known_hosts pinado).

## Teste esperado
Smoke falha → deploy aborta; rollback restaura tag anterior; migrate deploy roda antes do boot.

## Contexto adicional
Coordenar com 10 (infra) — scripts são do 08, host é do 10. Ver também A1/A2 (backup zero, docker 2375) — dependem de decisão humana."""),
"17-para-06-email-inbound-unsubscribe.md": ("17","06","bloqueador","alto",
"""## Problema
Canal de e-mail da cadência é surdo: nenhum transporte de inbound de e-mail alimenta emailReply.webhook.ts; e-mails de cadência/cold-email não contêm List-Unsubscribe nem rodapé de descadastro — titular não exerce oposição a partir da mensagem (LGPD Art. 18/21). Consequência: cadência não para quando lead responde por e-mail; opt-out por e-mail inalcançável.

## Arquivo(s) envolvido(s)
src/features/integrations/email/emailReply.webhook.ts; src/features/cadence/infra/dispatchers/CadenceDispatchers.ts:217-219; src/lib/email/mailer.ts; src/features/cadence/application/hasLeadReplied.ts.

## Evidência
docs/orchestration/auditoria-20261115/17-22-cadencia-verificacao.md (P0-1, P0-2).

## Alteração necessária
1. Definir provedor de inbound (inbound-parse/IMAP por tenant) e ligar ao webhook existente.
2. Adicionar List-Unsubscribe + URL/token de descadastro por tenant que chame recordOptOut.
3. Rodapé de opt-out nos templates de cadência.

## Teste esperado
E-mail de resposta real → EmailMessage persistido → hasLeadReplied bloqueia próximo toque; clique no unsubscribe → OptOutRecord scope email gravado.

## Contexto adicional
05 também envolvido (cold-email.service.ts já tem opt-out check — falta o transporte)."""),
"04-para-01-batchupdateleads-enum.md": ("04","01","bloqueador","alto",
"""## Problema
LeadUseCases.batchUpdateLeads grava updates.status cru (rótulo de exibição 'Qualificação (SDR)') no enum Prisma sem toPrismaLeadStatus → batch do Kanban falha 100% (failedCount silencioso). Agravante: mesmo com enum correto, o caminho bypassa dealClosureGate, broadcastEvent, fireAutomations, syncStatusChangeToCrms e sync de pipelineStageId/probability.

## Arquivo(s) envolvido(s)
src/features/crm/application/LeadUseCases.ts:699-724,760-766; src/components/CrmBoard.tsx:482-483; src/features/crm/routes/lead.routes.ts:39-41 (sem zod).

## Evidência
docs/orchestration/auditoria-20261115/04-05-crm-bi-prospeccao.md (ERRO-1 P1) + 04-crm-bi.md (P0).

## Alteração necessária
Rotear batch por updateLeadStatus/updateLead por item (mesmo pipeline do caminho unitário) ou rejeitar status em lote até lá; adicionar validateRequest no body.

## Teste esperado
Arrastar 3 leads no Kanban → status persiste como enum Prisma, gate CYC-007 aplicado, eventos disparados, failedCount=0.

## Contexto adicional
Decisão de produto pendente com 00: corrigir batch completo ou desabilitar mudança de status em lote."""),
"05-para-15-ssrf-webscraper.md": ("05","15","bloqueador","alto",
"""## Problema
webScraper.service.ts sem SSRF guard completo (sem DNS pinning, sem revalidação de redirect, sem limite de corpo) exposto via POST /api/prospecting/enrich sem requireRole — qualquer usuário autenticado (incl. VISUALIZADOR) pode acionar scraping arbitrário + Playwright. Google Places também é o único provider faturável fora do teto monthlyProspectingBudgetUsd e das métricas.

## Arquivo(s) envolvido(s)
src/features/prospecting/services/webScraper.service.ts; src/features/prospecting/prospecting.routes.ts (rota /enrich); src/lib/security/ssrfGuard.ts (padrão existente a reutilizar).

## Evidência
docs/orchestration/auditoria-20261115/05-prospeccao.md (P1-1).

## Alteração necessária
1. requireRole mínimo na rota /enrich (alinhar com rotas faturáveis ACH-05-01).
2. Aplicar assertSafeExternalUrl + revalidação por redirect + cap de corpo/tamanho no scraper.
3. Incluir Places no teto de budget/métricas.

## Teste esperado
Request com URL interna/redirect malicioso → 400/403; VISUALIZADOR → 403; Places decrementa budget."""),
"07-para-16-outbox-relay.md": ("07","16","alto","alto",
"""## Problema
startDomainEventOutboxRelay() definido em src/lib/queue/outbox/prismaRuntime.ts:72-78 mas nenhum entrypoint (worker.ts, server.ts, di/setup.ts) o chama. Com DOMAIN_EVENT_OUTBOX=prisma em produção, eventos que falham na entrega inline ficam FAILED para sempre — sem retry, sem DLQ. ~15 produtores do domainEventMesh afetados.

## Evidência
docs/orchestration/auditoria-20261115/07-ia-runtime.md (P1-1).

## Alteração necessária
Iniciar o relay no bootstrap do worker apropriado (mesmo padrão dos demais schedulers) + métrica de eventos FAILED + alerta.

## Teste esperado
Evento com entrega inline falha → relay reprocessa → evento entregue ou DLQ."""),
"07-para-21-pii-consent-winloss.md": ("07","21","alto","alto",
"""## Problema
winLossAnalysis.worker.ts:52-95 envia corpos de whatsAppMessages e timeline a getAiModel().invoke() sem assertPiiExternalConsent — o gate existe só em AgentExecutor e callsites manuais. PII de leads vai a provedor externo sem consentimento registrado.

## Evidência
docs/orchestration/auditoria-20261115/07-ia-runtime.md (P1-2).

## Alteração necessária
Adicionar gate de consentimento (hasPiiExternalConsent) antes da chamada + caminho BLOCKED_NO_CONSENT honesto; avaliar minimização de PII (minimizePii) como em ai.service.ts.

## Teste esperado
Org sem consentimento → worker não chama LLM e registra motivo; com consentimento → fluxo normal."""),
"23-para-07-agentexecutor-gateway.md": ("23","07","alto","alto",
"""## Problema
AgentExecutor.executeWithTools (~15 agentes: bdr, closer, crm, forecast, proposal, research, etc.) instancia ChatOpenAI direto via fallback.util.ts fora do gateway: sem logAiUsage por iteração (consumo invisível para budget.ts/tokenQuota), sem assertAiBudgetNotExceeded/enforceTokenQuota por chamada, sem circuit breaker/semantic cache/redaction, sem recursionLimit explícito, sem checkpointer/thread_id. É o caminho mais caro do sistema e o não governado.

## Evidência
docs/orchestration/auditoria-20261115/23-24-custo-performance-revisao.md (P1-1, P1-2); 07-ia-runtime.md (P1-3, P1-4).

## Alteração necessária
Roteamento do modelo do loop pelo gateway (com bindTools) ou replicação dos gates por iteração + logAiUsage por chamada + recursionLimit explícito + thread_id/checkpointer.

## Teste esperado
Agente com tools → cada iteração gera AILog; budget estourado → iteração bloqueada; sessão persiste estado entre invokes."""),
"06-para-01-bitrix-transacao-syncing.md": ("06","01","alto","alto",
"""## Problema
1) Importação Bitrix sem $transaction: company.create→contact.create→lead.create deixa órfãos em falha intermediária e company.create incondicional duplica empresas (leads.ts:322-368, deals.ts:437-501). 2) Lead pode ficar preso em bitrixSyncStatus='syncing' para sempre se o processo morre entre claim e update final — nada reconcilia (outboundSync.ts:61-90).

## Evidência
docs/orchestration/auditoria-20261115/06-integracoes-bitrix.md (seção 4, P1-04/P1-05).

## Alteração necessária
$transaction nas criações de import; reconciliação de runs 'syncing' travados (TTL ou job de varredura, mesmo padrão de reconcileStuckRuns de extrações).

## Teste esperado
Falha no meio do import → rollback sem órfãos; processo morto durante sync → status reconciliado para failed/pendente."""),
"02-03-para-08-a11y-gate.md": ("02/03","08","alto","alto",
"""## Problema
Achados P1 de a11y/UX que pedem gate: h1 duplicado em massa (AppTopbar + features); MobileNavDrawer sem focus trap/role=dialog/aria-modal; erros de formulário sem aria-describedby/role=alert; skip-link ausente; window.confirm/alert() nativos restantes em voice-hub/integrations/prospecting; ~2.963 hex hardcoded fora de tokens; design-lab exposto a qualquer autenticado.

## Evidência
docs/orchestration/auditoria-20261115/02-03-frontend-ux-design.md (P1-1..P1-3, P2-1..P2-6); 02-03-produto-ux-design.md.

## Alteração necessária
1. Gate axe/pa11y por rota crítica no CI (expandir tests/e2e/accessibility.spec.ts).
2. Convenção documentada de erro de formulário acessível (useFieldError).
3. Inventário de hex hardcoded com campanha de tokenização priorizada.

## Teste esperado
axe sem violações sérias nas ~15 rotas de maior tráfego; zero window.confirm/alert em src/; skip-link funcional."""),
"09-para-02-mobile-offline-claims.md": ("09","02","alto","alto",
"""## Problema
Offline sync é código morto (offlineSyncService.enqueue* sem consumidores; FieldMeetingRecorder sem rota) — marketing promete sincronização offline que não existe. SceneDelegate.swift tem URL Render desativada hardcoded e validTabs divergente do Android. Decisão de produto: implementar offline real ou remover claims.

## Evidência
docs/orchestration/auditoria-20261115/09-mobile.md (P0-1, P0-2, P1-2).

## Alteração necessária
1. Adicionar NSCameraUsageDescription/NSMicrophoneUsageDescription/NSLocationWhenInUseUsageDescription no Info.plist iOS (crash garantido sem elas).
2. Sincronizar serverURL/validTabs iOS com capacitor.config.ts.
3. Decisão 00: offline-first real vs. remoção honesta dos claims.

## Teste esperado
App iOS não crascha ao usar câmera/mic; deep link iOS navega para URL correta."""),
}

for name, (de, para, prio, sprint, body) in H.items():
    texto = f"""De: Agente {de}
Para: Agente {para}
Onda: auditoria-20261115
Status: aberto
Prioridade: {prio}
Bloqueador-ref: DEM-20261115-001
Sprint destino: {sprint}

{body}
"""
    (D / name).write_text(texto, encoding="utf-8")
    print("ok", name)
print(len(H), "handoffs criados em", D)

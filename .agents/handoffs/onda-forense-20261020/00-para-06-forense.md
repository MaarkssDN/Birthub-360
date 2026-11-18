De:00
Para:06
Onda:forense20261020
Status: em-andamento
Prioridade: alto
Bloqueador-ref:auditoria-real-ondas00-05
Sprint destino:a definir pelo00

## Problema
GATE-02 [P1] Typecheck falha na revisão82f8

## Arquivo(s) envolvido(s)
src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.ts:96
src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.ts:281

## Evidência
Base:82f848a39a7a45212956c1e949a8df28d8f946c9. Inspeção estática salvo comandos explicitamente reproduzidos; produto/API não presumidos testados.
GATE-02: Execução isolada npm run typecheck: exit2,TS2352 nos casts para WhatsAppMessageEventPayload e BitrixWebhookEventPayload.

## Alteração necessária
GATE-02: Validar payload contra contrato antes da conversão e executar typecheck/testes de erro e evento válido.

## Teste esperado
GATE-02: npm run typecheck exit0 na revisão de destino e regressão de payload inválido.

## Contexto adicional
Missão atual somente auditoria; nenhuma correção autorizada por este handoff. Ver matriz335requisitos, relatórioHTML e parecer24. Revalidar contra main de destino, que foi alterada por outro processo durante a auditoria. Complexidade depende do proprietário; hipóteses não são causa operacional comprovada.

## Resolução

> Reconciliação 2026-11-14 (Agente 00): veredicto DEFEITO-REAL — double-cast persiste (linhas 95,299); correção despachada ao Agente 06 em agente/06-reconciliacao-doublecast. Ver RESULTADOS-RECONCILIACAO-20261114.md.

Status anterior "resolvido" estava incorreto: a verificação confirmou que os dois `as unknown as` (double-cast cego) persistiam em `bitrixEventMeshBridge.service.ts` sem validação de contrato. Correção efetivamente implementada pelo Agente 06 na branch `agente/06-reconciliacao-doublecast` (worktree `Birthub-360-wt-fix-06`), base `origin/main`:

- `src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.ts`:
  - Adicionados type guards `isWhatsAppMessageEventPayload` e `isBitrixWebhookEventPayload` que validam os campos obrigatórios do contrato (`src/shared/contracts/domainEventMesh.contract.ts`): WhatsApp exige `waMessageId`/`phoneE164` string, `body` string|null, `direction` 'inbound'|'outbound'; webhook Bitrix exige `connectionId`/`eventType`/`bitrixRecordId` string e `entityType` 'lead'|'deal'.
  - `handleWhatsAppMessage` (antes ~linha 95): payload inválido → `logger.warn` + return, sem cast; payload válido usa narrowing do guard (sem `as unknown as`).
  - `handleBitrixWebhookInbound` (antes ~linha 299): mesma validação antes do acesso a `leadId`/`stageId`/`eventType`.
- `tests/unit/integrations/bitrixEventMeshBridge.test.ts`: 2 testes de regressão GATE-02 — payload WhatsApp fora do contrato não chama `syncActivityToBitrix`; payload de webhook Bitrix fora do contrato não chama `prisma.lead.findFirst`.

Evidência:
- `npx vitest run -c vitest.unit.config.ts tests/unit/integrations/bitrixEventMeshBridge.test.ts` → 11/11 testes passando (inclui os 2 novos de payload inválido; logs WARN "contrato violado" observados).
- `npx tsc --noEmit` → exit 0.
- Commit: ver git log da branch `agente/06-reconciliacao-doublecast` (mensagem `fix(06): validação de contrato no bitrixEventMeshBridge (reconciliação forense GATE-02)`).

Pendências: o handoff cobria apenas o GATE-02 (double-cast). Demais handlers do bridge (`handleVoiceCall`, `handleMeetingScheduled`, `handleDealRisk`, `handleCommercialBottleneck`, `handleProposalDrafted`, `handleOptOutEnforced`, `handleLeadReactivated`) usam `(event.payload || {}) as Record<string, unknown>` com narrowing defensivo campo a campo — não há double-cast, mas também não há validação formal de contrato para esses eventos; fica registrado como melhoria futura caso o 00 julgue necessário.

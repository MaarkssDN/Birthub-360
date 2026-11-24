- De: 00
- Para: 18 (APIs/Contratos)
- Status: ABERTO
- Prioridade: P2 (com sub-itens P1 de segurança em DEBT-0045)

## Achados (relatório: auditoria/contratos-api-openapi.md)

### DEBT-0042 — OpenAPI documenta endpoints inexistentes + drift cego a doc-sem-código — P2
`openapi.yaml:7082,7374` (/cadence/opt-outs/check, /runs/{id}/events não existem). `openapiRouteInventory.ts:176-180` + `verify-openapi-drift.ts:316-362` nunca checam path doc→código.
**Correção:** implementar ou remover do YAML; diff simétrico doc×código no verify.

### DEBT-0043 — 3+ envelopes de erro/sucesso heterogêneos — P2
Canônico `{success,error,code,retryable,requestId}` vs manuais `{success:false,error}` vs público `{ok}` que apiFetch não desembrulha. Migrar p/ AppError; padronizar.

### DEBT-0044 — POSTs sensíveis sem idempotência — P2
**Nota parecer 24: unificar com DEBT-0011 (05) — mesmo handoff, arquivos prospecting.routes.ts/cold-email.service.ts.** booking, promote, convert, mesa register: Idempotency-Key ou dedupe natural.

### DEBT-0045 (co 05/07) — Rotas IA/prospecção sem requireRole/Zod — P2
~24 endpoints intelligence.routes.ts + prospecção aceitam VISUALIZADOR → LLM/provider pago. Definir roles + validateRequest.

### API-05/06/09/10/11/12 — P3
Listas sem paginação (mesaTratamento:192 poll sem take); voiceHub.api campo divergente (currentTouchIndex vs currentTouchOrder → #NaN); tipos duplicados frontend↔backend; sem versionamento /v1; spec registra 500/501 como verdade; catch(any) sistemático.

## Contexto
~31k LOC de contratos mortos (voice-hub routes+pages, settings.routes, job-roles.routes, outbound/*) — não deixar reativar sem auditoria.

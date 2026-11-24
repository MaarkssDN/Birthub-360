# DIAGNÓSTICO BITRIX24 — ESTADO ATUAL DA INTEGRAÇÃO (Squad 50)

**Data:** 2026-11-24 · **Autor:** Agente 50 — Atlas · **Base:** `93e82c220` (`coord/squad-50`)
**Método:** leitura direta de código com evidência `arquivo:linha` + execução de testes unitários.
**Natureza:** diagnóstico NOVO do estado corrente. Não é recuperação do documento histórico.

## Proveniência do documento histórico

`BITRIX24-LEAD-FLOW-AUDIT.md` (673 linhas, datado 2026-08-09) **existiu no repositório e foi
removido deliberadamente** pelo commit `e9fba0b0c` ("chore(docs): remove auditorias/relatórios
de documentação do repositório — pedido explícito do usuário"). O conteúdo permanece no
histórico do Git (`git show e9fba0b0c^:BITRIX24-LEAD-FLOW-AUDIT.md`), mas **não foi restaurado**
aqui por respeito à decisão humana de retirada. Seus achados P0–P2 foram marcados como
remediados no commit `5f5cf12` já à época; achados que persistem foram re-verificados abaixo.

## Estado verificado no HEAD `93e82c220`

### Camada de transporte (saudável)

| Aspecto | Evidência | Estado |
|---|---|---|
| Retry | 4 tentativas + backoff exponencial com jitter, reativo a 429/`QUERY_LIMIT_EXCEEDED`/`Retry-After` | `service/client.ts:26`; `shared/http/retryWithBackoff.ts` |
| Timeout | 15s por request | `service/client.ts:29` |
| Circuit breaker | `BitrixCircuitBreaker` (CLOSED/OPEN/HALF_OPEN), fail-fast, opt-out por env | `src/lib/integrations/bitrix/client.ts:13-106`; `service/client.ts` |
| Correlação | `correlationId`/`AppError` sanitizado (sem vazar webhook/token) | `service/client.ts:77` |
| Testes | 24 testes do client (retry, 429, timeout, circuit breaker, sanitização) | `service/__tests__/client.test.ts` — **24/24 verdes** |

### Credenciais e tenancy

- `BitrixConnection` por organização; segredos em repouso via AES-256-GCM
  (`src/lib/crypto/secretFields.ts:21,114`), com trava que impede subir em produção sem
  `CREDENTIALS_ENCRYPTION_KEY` (`secretFields.ts:37`).
- Refresh de token com lock dedicado (`service/tokenRefreshLock.ts` + teste).
- Fallback de conexão default via env `BITRIX24_WEBHOOK_URL` (confirmar precedência
  tenant-vs-env na missão do 51-Bela).

### Sync, paginação e idempotência

- Paginação `next` do Bitrix é seguida em `syncRules.ts:100-142` (teto 25 IDs/tick por regra) —
  **o achado histórico de "nunca seguir `next`" está resolvido neste caminho**; revalidar
  `extraction.ts`/`paginatedExtractor.ts` na missão do 52-Lino.
- `callBitrixPaginated` centraliza paginação (`service/idempotentSync.ts:28`).
- Lock de sync (`idempotentSync.ts:108,132`) + dedup de webhook por fingerprint
  (`src/lib/integrations/webhookIdempotency.ts`, janela default 300s).
- Drift/reconciliação com base implementada: `service/driftMonitor.ts:8-33`
  (`bitrix_sync_drift_detected_total`, `checksum-mismatch|missing-local|missing-remote`).

### Pontos que permanecem abertos (insumo para 51–54/59)

1. **Retry em nível de job BullMQ** para workers de sync — verificar `src/lib/queue/bitrixSync.worker.ts`
   (propriedade 23-Pina; handoff de consumo necessário).
2. **Mapa `UF_CRM_*` (`bitrixFieldMap.ts`)**: o achado histórico de "mapa completo nunca usado"
   precisa ser revalidado — os arquivos `service/customFields.ts` e `lib/integrations/bitrix/mapping/mapper.ts`
   surgiram depois; confirmar cobertura real do de-para (missão 54-Rita).
3. **`syncRules` auto-import**: limites por tick existem; validar comportamento sob backlog grande.
4. **Precedência de credencial** env `BITRIX24_WEBHOOK_URL` vs `BitrixConnection` por tenant.
5. **Rotas HTTP** (`bitrix.routes.ts`, `hubTasks.routes.ts`, `dailyPlanRoutes.ts`): authz do
   hubtasks já corrigida (`hubTasks.service.ts:104-116` — filtro `CREATED_BY`/`RESPONSIBLE_ID`),
   mas a camada HTTP e os workers de fila estão fora da propriedade do Squad 50 — ver proposta
   de ownership `.agents/handoffs/squad-50/50-para-00-proposta-ownership-bitrix.md`.

## Testes executados nesta verificação

- `npx vitest run -c vitest.unit.config.ts src/features/integrations/bitrix/service/__tests__/client.test.ts`
  → **24/24 PASS**
- `npx vitest run -c vitest.unit.config.ts tests/unit/lib/integrations/` → **13/13 PASS**
  (circuit breaker, webhookIdempotency, whatsappAntiBan, bitrixBatchExtractor)

## Referências

- Skill: `.agents/skills/integration-audit/SKILL.md`
- Plano do squad: `.agents/runs/squads/squad-50-plano.md`
- Matriz de prontidão: `.agents/runs/squads/squad-50-matriz-prontidao-conectores.md`

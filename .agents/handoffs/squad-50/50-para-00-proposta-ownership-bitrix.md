# HANDOFF 50 → 00 (Astra): Proposta de redistribuição de ownership — Bitrix24 real

- **De:** Agente 50 — Atlas · **Para:** Agente 00 — Astra (publicar em `MATRIZ_PROPRIEDADE.md`)
- **Data:** 2026-11-24 · **Base:** `93e82c220` · **Branch:** `coord/squad-50`
- **Tipo:** proposta de matriz — **Atlas NÃO edita a matriz global**

## Problema

A matriz atual dá aos agentes 51–54 apenas `src/lib/integrations/bitrix/{auth,batch,mapping,webhooks}/**`,
mas essa árvore contém só 4 utilitários finos. O domínio Bitrix real está em
`src/features/integrations/bitrix/` (**58 arquivos .ts**, incluindo 14 suítes de teste) e
`src/features/integrations/AGENTS.md` o governa sob o dono legado "Agente 06".
Sem deliberação, nenhum executor do Squad 50 pode escrever no código que precisa corrigir.

## Proposta de redistribuição (por caminho real, com evidência)

### Núcleo compartilhado Bitrix → Agente 50 (Atlas) + ratificação

| Caminho | Papel | Evidência |
|---|---|---|
| `src/features/integrations/bitrix/service/client.ts` | HTTP client: retry 4×, timeout 15s, circuit breaker, `correlationId` | `service/client.ts:26,29`; testes `service/__tests__/client.test.ts` (24/24 verdes) |
| `src/lib/integrations/bitrix/client.ts` | Circuit breaker dedicado (`BitrixCircuitBreaker`) | `client.ts:13-106` |
| `src/features/integrations/bitrix/service/idempotentSync.ts` | `callBitrixPaginated` + lock de sync | `idempotentSync.ts:28,108,132` |
| `src/lib/integrations/webhookIdempotency.ts` | Dedup determinístico de webhooks (raiz de `lib/integrations` — **sem dono hoje**) | `webhookIdempotency.ts:1-78` |
| `src/features/integrations/bitrix/bitrix.api.ts`, `bitrix.service.ts` | Fachada/orquestração de domínio | verificar consumidores antes de fixar dono |

Justificativa: esses arquivos são transversais a 51–54; deixá-los sem dono recria o problema.
Proposta: ownership do Atlas (como coordenador) ou rodízio por mudança — decisão do Astra.

### 51 — Bela: Autenticação e credenciais

| Caminho | Evidência |
|---|---|
| `service/connections.ts` (+ `__tests__/connections.test.ts`) | gestão de `BitrixConnection` por org |
| `service/tokenRefreshLock.ts` (+ teste) | lock de refresh de token |
| `service/settings.ts`, `service/userMapping.ts`, `service/ownershipGuard.ts` (+ testes) | config por tenant, mapa usuário Bitrix↔local, guarda de ownership |
| `lib/integrations/bitrix/auth/**` (novo, quando necessário) | árvore já prevista na matriz |

Escopo: OAuth/token, criptografia em repouso (`src/lib/crypto/secretFields.ts` — propriedade
Squad 90/98, apenas consumo), fallback `BITRIX24_WEBHOOK_URL`, rotação (runbook
`docs/security/runbooks/ROTATE_BITRIX24_WEBHOOKS.md` já existe).

### 52 — Lino: Extração batch e paginação

| Caminho | Evidência |
|---|---|
| `service/extraction.ts` (1041 linhas), `extractionEntities.ts`, `extractionFiles.ts`, `extractionPeriod.ts` (+ 3 suítes de teste) | pipeline de extração |
| `paginatedExtractor.ts` | paginação dedicada |
| `lib/integrations/bitrix/batch/extractor.ts` (+ `tests/unit/lib/integrations/bitrixBatchExtractor.test.ts`) | validação de integridade de batch, `PartialBatchExtractionError` |
| `jobs/bitrixExtractionPurge.worker.ts` (+ teste) | purge de extrações |

### 53 — Vega: Sync bidirecional e webhooks

| Caminho | Evidência |
|---|---|
| `bitrix.webhook.ts` (+ `__tests__/bitrix.webhook.test.ts`), `bitrixWebhook.queue.ts` | ingestão de eventos |
| `service/syncRules.ts` (+ teste) | regras de sync automático; paginação `next` já corrigida (`syncRules.ts:100-142`) |
| `service/outboundSync.ts` (+ teste), `infra/BitrixLeadWritebackAdapter.ts`, `syncActivityToBitrix.ts` | escrita Bitrix→CRM local e vice-versa |
| `services/bitrixEventMeshBridge.service.ts` | ponte com event mesh |
| `service/syncLogs.ts`, `service/metrics.ts` | **compartilhado com 59-Ruy** (propor: syncLogs/metrics → 59; syncRules/outbound → 53) |

### 54 — Rita: Mapeamento de campos e entidades

| Caminho | Evidência |
|---|---|
| `bitrixFieldMap.ts` | mapa `UF_CRM_*` (achado histórico: mapa existia sem uso — revalidar estado atual) |
| `service/customFields.ts` (+ teste) | custom fields dinâmicos |
| `service/leads.ts`, `service/deals.ts` (+ testes) | wrappers de entidade lead/deal |
| `lib/integrations/bitrix/mapping/mapper.ts` | fallback tipado de custom fields |
| Modelos `CopilotoBitrixFieldMapping`, `ExternalCrmStageMapping` (schema — consumo apenas; schema é Pietro/11) | de-para persistido |

### 59 — Ruy: Observabilidade e reconciliação (B-11/B-12)

| Caminho | Evidência |
|---|---|
| `service/driftMonitor.ts` (+ teste) | `bitrix_sync_drift_detected_total`, `DriftReason` (`driftMonitor.ts:8-33`) |
| `service/syncLogs.ts`, `service/metrics.ts` (+ testes) | logs/métricas de sync |
| `lib/integrations/monitoring/**` (novo) | métricas/alertas de reconciliação |

### Arquivos Bitrix FORA da especialidade (propor reatribuição)

| Caminho | Natureza | Dono proposto |
|---|---|---|
| `bitrix.routes.ts`, `hubTasks.routes.ts`, `dailyPlanRoutes.ts` | Camada HTTP | Squad 20 (22-Hugo) com contrato do Squad 50 — ou manter em 50 se Astra preferir "rota de integração = integração" |
| `service/dailyPlan*.ts` (4 arquivos), `service/hubTasks.service.ts` | Lógica de produto CRM (plano diário, tarefas) | Squad 40 (45-Otto/42-Lívia) — **já houve handoff 43→50 de authz hubtasks, hoje resolvido** (`hubTasks.service.ts:104-116` filtra CREATED_BY/RESPONSIBLE_ID) |
| `services/bitrix-data-hygiene.service.ts` | Higiene de dados | Squad 40 (48-Jade) ou 59 |
| `src/lib/queue/bitrixSync.worker.ts`, `bitrixOutbound.queue.ts`, `externalCrmOutbound.queue.ts`, `whatsappCommand.*`, `whatsappSignal.worker.ts` | Infra de filas | **Squad 20 (23-Pina)** — `src/lib/queue/**` é propriedade dele; Squad 50 consome via contrato |

## Dependências a registrar

- **51 precede 52/53/54** (contrato de conexão/token).
- **53 e 59 compartilham `syncLogs.ts`/`metrics.ts`** — fixar dono único (proposta: 59) e 53 consome.
- **Squad 20**: rotas HTTP e workers de fila — handoffs formais necessários.
- **`src/features/integrations/AGENTS.md`** (dono "Agente 06") precisa ser atualizado pela
  governança quando a matriz for publicada — o arquivo hoje contradiz a nova topologia.

## Pedido

Publicar na `MATRIZ_PROPRIEDADE.md` (ou emendá-la) os caminhos acima. Até lá, Squad 50 mantém
missões Bitrix em modo read-only + testes, sem escrita em `src/features/integrations/bitrix/**`.

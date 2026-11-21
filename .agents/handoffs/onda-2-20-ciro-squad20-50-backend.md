# Relatório de Entrega e Handoff — Onda 2 (Squad 20 & Squad 50)

- **Agente Coordenador:** 20 — Ciro (Coordenador de Backend & Contratos)
- **Onda:** 2 (`integracao/onda-2`)
- **Branch:** `agente/20-onda2-backend`
- **Data:** 2026-11-20
- **Princípios aplicados:** P1 (Pensar antes de programar), P2 (Simplicidade primeiro), P3 (Alterações cirúrgicas), P4 (Execução orientada a objetivos com testes automatizados).

---

## 1. Resumo das Entregas por Especialista

### [28 · Milo] Parser de importação CSV com streaming por chunks (Node streams)
- **Arquivos:**
  - `src/features/onboarding/import/csv.parser.ts`
  - `src/features/onboarding/import/__tests__/csv.parser.test.ts`
- **Implementação:**
  - Criado `parseCsvStream` baseado em `AsyncGenerator` sobre `Readable` / `AsyncIterable<Buffer | string>` do Node.js, com decodificação UTF-8 em modo streaming (`TextDecoder` com `stream: true`), remoção de BOM (`\uFEFF`), suporte a quebras de linha dentro de campos entre aspas (RFC 4180), escape `""` e proteção contra exaustão de memória (`maxLineBytes`).
  - Criado `processCsvStreamInBatches` para processamento paginado por lotes (`batchSize`) respeitando backpressure natural do stream.

### [51 · Bela] Lock atômico distribuído no Redis para renovação concorrente de tokens Bitrix24
- **Arquivos:**
  - `src/features/integrations/bitrix/service/tokenRefreshLock.ts`
  - `src/features/integrations/bitrix/service/__tests__/tokenRefreshLock.test.ts`
- **Implementação:**
  - Criado `refreshBitrixTokenWithLock` utilizando `acquireDistributedLock` (`src/lib/queue/distributedLock.ts`, `SET key runId NX EX ttl` e release atômico compare-and-delete em Lua).
  - Chave escopada por tenant e conexão (`lock:bitrix:token-refresh:${organizationId}:${connectionId}`).
  - Implementado double-check antes e após aquisição da trava, reaproveitamento de token já renovado por réplica concorrente em caso de contenção (`reason: 'contended'`) e política fail-closed (`503`) quando o Redis está indisponível.

### [53 · Vega] Webhook Bitrix24 com resposta 200 imediata e enfileiramento assíncrono (BullMQ)
- **Arquivos:**
  - `src/features/integrations/bitrix/bitrixWebhook.queue.ts`
  - `src/features/integrations/bitrix/bitrix.webhook.ts`
  - `src/features/integrations/bitrix/__tests__/bitrix.webhook.test.ts`
- **Implementação:**
  - Validação síncrona de `validateWebhookTimestamp`, `application_token` (`timingSafeEqual`), `inboundEventsEnabled` e deduplicação (`claimWebhookDelivery`) antes do enfileiramento.
  - Resposta HTTP `200` imediata ao portal Bitrix24: quando `queuesEnabled` está ativo, enfileira na fila BullMQ `bitrix-webhook-inbound` (`enqueueBitrixWebhookEvent`) com `jobId` determinístico derivado do `deliveryFingerprint` e sem persistir segredos/`webhookUrl` no payload do Redis; quando as filas estão desligadas, responde `200` imediato e dispara `processEvent` em background.
  - Worker `processQueuedWebhookEvent` recarrega a conexão escopado por `requestContext.run({ tenantId: data.organizationId })`, preservando isolamento multi-tenant (RLS).

### [55 · Ícaro] Sanitização de e-mail inbound (remoção de pixels espiões e scripts)
- **Arquivos:**
  - `src/features/integrations/email/emailSanitizer.ts`
  - `src/features/integrations/email/emailReply.webhook.ts`
  - `src/features/integrations/email/__tests__/emailReply.webhook.test.ts`
- **Implementação:**
  - Criado `sanitizeInboundEmailBody` e integrado em `handleInboundEmail` (`emailReply.webhook.ts`) antes de `recordInboundEmail` / `prisma.emailMessage.create`.
  - Remove blocos `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<meta>`, `<link>`, `<form>`, `<base>`, atributos de evento inline `on*`, URIs `javascript:`/`vbscript:`/`data:text/html` e imagens de rastreamento (`1x1`, `0x0`, `display:none`, `visibility:hidden`, `opacity:0` e endpoints de open-tracking conhecidos), preservando HTML e imagens legítimas.

### [59 · Ruy] Monitor de drift por checksum Bitrix vs banco local
- **Arquivos:**
  - `src/features/integrations/bitrix/service/driftMonitor.ts`
  - `src/features/integrations/bitrix/service/__tests__/driftMonitor.test.ts`
- **Implementação:**
  - Criado `computeRecordChecksum` (SHA-256 determinístico com normalização estável e ordenação de chaves) e `detectBitrixLocalDrift` para comparar lotes de registros do Bitrix24 contra o banco local.
  - Classifica divergências em `checksum-mismatch` (identificando os campos divergentes), `missing-local` e `missing-remote`, incrementando o contador Prometheus `bitrix_sync_drift_detected_total` por `tenant`, `entity` e `reason`.

---

## 2. Evidências de Verificação (Vitest)

Comando executado:
```bash
npx.cmd vitest run --config vitest.unit.config.ts \
  src/features/onboarding/import/__tests__/csv.parser.test.ts \
  src/features/integrations/bitrix/service/__tests__/tokenRefreshLock.test.ts \
  src/features/integrations/bitrix/__tests__/bitrix.webhook.test.ts \
  src/features/integrations/email/__tests__/emailReply.webhook.test.ts \
  src/features/integrations/bitrix/service/__tests__/driftMonitor.test.ts
```

Resultado:
- **5 suítes aprovadas (25 testes passando, 0 falhas).**
- Nenhum arquivo fora do escopo (como `prisma/schema.prisma` ou arquivos de UX/landing) foi tocado.

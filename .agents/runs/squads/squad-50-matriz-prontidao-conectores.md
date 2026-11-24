# MATRIZ DE PRONTIDÃO DOS CONECTORES — SQUAD 50 (DEM-20261123-001)

- **Autor:** Agente 50 — Atlas · **Data:** 2026-11-24 · **Base:** `93e82c220` (`coord/squad-50`)
- **Método:** leitura direta de código com evidência `arquivo:linha` (skill `integration-audit`).
- **Ressalva:** `BITRIX24-LEAD-FLOW-AUDIT.md` (referenciado pela skill) **não existe no repositório**;
  achados Bitrix abaixo são re-verificados no HEAD atual, não herdados do audit antigo.
- **Legenda:** ✅ confirmado-ok · ⚠️ falha/risco confirmado · ❓ não verificável sem sandbox/credencial real · 🔶 risco estrutural de produto.

## 1. Matriz consolidada

| Conector | Credencial (onde/criptografia) | Timeout | Retry | Paginação | Webhook/Idempotência | Estado |
|---|---|---|---|---|---|---|
| **Bitrix24** | `BitrixConnection` por org (AES-256-GCM via `src/lib/crypto/secretFields.ts:21,114`) + fallback env `BITRIX24_WEBHOOK_URL`; trava de produção `secretFields.ts:37` | 15s `service/client.ts:29` | 4 tentativas + backoff/jitter `service/client.ts:26`, `shared/http/retryWithBackoff.ts`; reativo a 429/`Retry-After` | `callBitrixPaginated` `service/idempotentSync.ts:28`; `syncRules.ts:100-142` segue `next` até 25 IDs/tick (correção já aplicada — comentário L105-106) | `idempotentSync.ts:108,132` (lock), `webhookIdempotency.ts` (dedup determinístico, janela 300s), `bitrixWebhook.queue.ts` | ⚠️ ver §2 |
| **Google Workspace** (Calendar/Gmail) | OAuth2 `google-auth-library`; `state` HMAC sem sessão `google.service.ts:50-95`; refresh_token tratado (L91-95,146-151) | 15s `OAUTH_TOKEN_TIMEOUT_MS` L12 | via google-auth-library | n/a auditado aqui | redirect_uri separado do login better-auth | ✅ (parcial — chamadas de API Calendar fora de `lib/integrations/calendar/` precisam de 57-Nico) |
| **WhatsApp (Baileys)** | Sessões por `organizationId` em `Map` `whatsapp.service.ts:67` (em memória — não persiste entre restarts? verificar com 56) | — | Reconnect 5× backoff→60s `whatsapp.service.ts:36-38,267-273`; lock 5×/30s L49-51 | n/a | `webhookIdempotency.ts` provider `whatsapp` | 🔶 protocolo não-oficial — risco de quebra silenciosa pelo WhatsApp; anti-ban delay 8s `baileys.client.ts:12` |
| **3CX** | webhook pré-auth `src/bootstrap/webhooks.ts:23` | — | — | n/a | **❓ validar assinatura/origem no handler** (`threecx.routes.ts`) — ownership legado Agente 06 | ❓ |
| **Birth Voice** | webhook pré-auth `src/bootstrap/webhooks.ts:22` (`birthVoiceWebhookRoutes`, `voiceResult.webhook.js`) | — | — | n/a | **❓ validar assinatura/origem**; consentimento LGPD obrigatório (`AGENTS.md` da pasta — abertura obrigatória Gessica) | ❓ |
| **E-mail SMTP** | env `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` `src/lib/email/mailer.ts:28-46`; sem `SMTP_HOST` → `MailerNotConfiguredError` L23-24 (fallback explícito, não finge envio) | — | — | n/a | `emailReply.webhook.ts` existe | ⚠️ confirmar se fallback é comunicado na UI (skill) |
| **Enriquecimento CNPJ** | `src/lib/integrations/erp/cnpj.service.ts`; cache TTL 30d L1-2 | — | — | n/a | — | ✅ estrutura (rate limit Receita a verificar com 58) |
| **Apollo/Hunter** | providers ativos `features/prospecting/outbound/server/search/providers/*`; **órfão `lib/enrichment/apollo.ts`+`enrich.worker.ts` NÃO existe mais** (skill desatualizada) | — | — | — | `PROSPECTING_PROVIDER_MODE=hybrid` | ❓ rate-limit/timeout por provider — missão 58 |
| **AI gateway** (contexto, não-squad) | env; circuit breaker Redis `ai-gateway:circuit:*` | `AI_FALLBACK_TIMEOUT_MS` 60s | retry+backoff | n/a | — | ✅ referência de boa prática |

## 2. Bitrix24 — verificações específicas (pós-audit, HEAD `93e82c220`)

- **Retry em nível de job BullMQ:** `bitrixSync.worker.ts`/`bitrixOutbound.queue.ts` existem;
  confirmar se jobs de sync têm retry próprio ou dependem só do retry HTTP — pendente para 53-Vega.
- **Paginação `syncRules`:** corrigida (`next` seguido, teto 25 IDs/tick) — achado antigo do audit
  provavelmente resolvido; confirmar com teste.
- **Idempotência:** `@@unique([organizationId, bitrixLeadId/bitrixDealId])` no schema + lock de sync
  + dedup de webhook com janela de 5min — cobertura aparentemente boa; testes existem em
  `service/__tests__/`.
- **Camada `src/lib/integrations/bitrix/`:** `client.ts` (circuit breaker), `batch/extractor.ts`
  (validação de integridade de batch + `PartialBatchExtractionError`), `mapping/mapper.ts`
  (fallback tipado de custom fields) — são utilitários finos; o grosso está em `features/`.

## 3. Observabilidade/reconciliação (insumo para 59-Ruy)

- `driftMonitor.ts`: métrica Prometheus `bitrix_sync_drift_detected_total` (L8-14),
  `DriftReason = checksum-mismatch | missing-local | missing-remote` (L33) — **B-11/B-12 já têm
  base implementada**.
- `syncLogs.ts`, `metrics.ts`, `webhookIdempotency.ts` (chave Redis de dedup) — inventário inicial
  favorável; falta verificar alertas e reconciliação agendada.

## 4. Lacunas de processo (handoffs emitidos)

1. Ownership `src/features/integrations/**` × `src/lib/integrations/**` — divergência matriz/AGENTS legado.
2. Overlap WhatsApp 56 × Squad 60 (66/67/69).
3. Conectores sem dono: chatwoot, hubspot, monday, omie, pipedrive, rdstation, slack, stripe, signature.
4. `BITRIX24-LEAD-FLOW-AUDIT.md` ausente do repositório.
5. `src/lib/integrations/index.ts` (ownership do Atlas) não existe — decisão: criar registry ou
   manter plano; **adiado** até haver 2+ consumidores reais (P2).

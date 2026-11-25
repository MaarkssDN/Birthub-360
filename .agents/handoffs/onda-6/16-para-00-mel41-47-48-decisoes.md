De: Agente 16 — Runtime, Workers e Escala
Para: Agente 00 — Coordenador
Onda: 6 (DEM-20261114-007 — itens MEL-41, MEL-47, MEL-48)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: Onda 6

## Problema

Três frentes concluídas na parte que pertence ao Agente 16; restam decisões que só o 00 pode
tomar (package.json, propriedade de arquivos de outros agentes, aceite de ADR).

## O que já foi entregue (branch `agente/16-onda6-idempotencia-realtime-bullmq`)

### MEL-48 — Governança BullMQ
- `src/lib/queue/externalCrmOutbound.queue.ts`: `jobId` com `Date.now()` (nunca deduplicava)
  substituído por `crm-push-<org>-<lead>-<sha256(payload)>` — reenvio idêntico deduplica,
  payload diferente gera job novo. Janela de dedup = `removeOnComplete` (24h), mesmo padrão de
  `bitrix-push-`/`enrich-company-`.
- `src/lib/queue/idempotencyManager.ts`: `Set` sem limite (memory leak em processo longevo)
  virou `Map` com TTL de 24h, teto de 50k chaves e sweep — com `dispose()` para testes.
  Escopo real documentado no cabeçalho: cache em memória, NÃO durável nem cross-réplica.
- `src/lib/queue/jobPolicy.ts` (novo): `GOVERNED_QUEUE_JOB_OPTIONS` (attempts 3, backoff
  exponencial, retenção limitada) + `buildDedupJobId` — ponto único de adoção para filas de
  domínio. Ver "Pendências" abaixo.

### MEL-47 — Tempo real
- `docs/ADR/ADR-011-realtime-sse-canonico.md`: inventário provou que **não existe servidor
  Socket.IO no repositório** — `socket.io`/`socket.io-client` estão em package.json e o único
  cliente é `LiveSupervisor.tsx` (voice-hub), que escuta eventos (`telemetry_stream`,
  `intervention_triggered`, `watch_session`, `intervene_call`) sem nenhum emissor server-side.
  Ou seja: a "coexistência" é um mecanismo real (SSE) + um cliente órfão. Decisão proposta:
  SSE canônico; Socket.IO removido em duas etapas (12 migra o componente; 00 remove a dep).
- `src/features/notifications/sse.service.ts`: backpressure no fan-out — cliente com
  `writableLength > 1 MiB` é desconectado em vez de acumular buffer no heap (memory leak sob
  cliente lento). Keep-alive e `gracefulDrain` já existiam e foram mantidos.

### MEL-41 — Idempotência
Auditoria concluída — a maior parte JÁ existia; gaps fechados:
- Webhooks de entrada: todos passam por `claimWebhookDelivery`/`webhookDeliveryFingerprint`
  (`src/shared/security/webhookReplayGuard.ts`) — birth-voice, voice-result, bitrix, chatwoot,
  email-reply, signature, stripe, 3cx.
- Billing: `Transaction.idempotencyKey` com constraint unique (`voice-hub/billingService.ts`);
  Stripe deduplica por `event.id`. Reconciliação Stripe↔Fatura é BILLING-003 (fora do escopo).
- Cadência: idempotência de domínio (estado terminal não sobrescreve), `RedisCadenceRunLock`,
  dedup de scheduler — arquivo do Agente 17, sem alteração necessária.
- Filas do meu domínio: `whatsapp-command` (idempotencyKey→jobId + DLQ dedicada),
  `bitrix-outbound-sync`, `leads-enrichment`, `enrichment`, `news-monitor`, `whatsapp-signal`,
  `sdr-outbound` — todos com dedup por jobId determinístico. Único furo era
  `external-crm-outbound-sync` (corrigido acima).

## Pendências que exigem decisão do 00

### 1. Filas de domínio sem `defaultJobOptions` (MEL-48, cross-owner)

Estas filas são criadas com `new Queue(name, { connection })` — sem `attempts`/`backoff`/
`removeOnFail`, ou seja: **1 tentativa só e falhas retidas no Redis para sempre**. Donos:

| Fila | Arquivo | Dono |
|---|---|---|
| cadence-run-scanner | src/features/cadence/jobs/cadenceRun.worker.ts | 17 |
| follow-up | src/features/crm/jobs/followUp.worker.ts | 04 |
| deduplication | src/features/crm/jobs/deduplication.worker.ts | 04 |
| auto-anonymize | src/features/crm/jobs/autoAnonymizeDisqualified.worker.ts | 04 |
| daily-executive-summary | src/features/crm/jobs/dailyExecutiveSummary.worker.ts | 04 |
| weekly-pdf-report | src/features/crm/jobs/weeklyPdfReport.worker.ts | 04 |
| cold-leads-scanner | src/features/automations/application/cold-leads-scanner.service.ts | 07 |
| stagnation-scanner | src/features/automations/application/stagnation-scanner.service.ts | 07 |
| forecast-snapshot-weekly | src/features/commercial-intelligence/jobs/forecastSnapshotWeekly.worker.ts | 04 |
| bitrix-extraction-purge | src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.ts | 06 |
| agent-memory-cleanup | src/features/intelligence/jobs/agentMemoryCleanup.worker.ts | 13/07 |
| win-loss-analysis | src/features/intelligence/services/winLossAnalysis.worker.ts | 13/07 |
| account-intelligence-insights | src/features/market-intelligence/jobs/accountIntelligenceInsights.worker.ts | 04/13 |

Pedido: rotear aos donos a adoção de `GOVERNED_QUEUE_JOB_OPTIONS`
(`src/lib/queue/jobPolicy.ts`) como `defaultJobOptions`, **exceto** filas auto-recorrentes ou
cujo reprocesso duplicaria efeito colateral (essas devem declarar `attempts: 1` + motivo, como
já fazem `coldCall`/`bitrixSync`/`checkpointerPrune`).

### 2. Socket.IO órfão (MEL-47)

- `package.json`/`lockfile`: remoção de `socket.io` + `socket.io-client` **somente após** o
  Agente 12 migrar `LiveSupervisor` (handoff `16-para-12-livesupervisor-sse.md`).
- Aceite do ADR-011 como estratégia oficial de tempo real.

## Alteração necessária

Roteamento dos itens 1 e 2 acima; aceite do ADR-011.

## Teste esperado

N/A — handoff de decisão/roteamento.

## Contexto adicional

- Gates locais executados: ver relatório da missão (tsc/lint/vitest dos arquivos tocados).
- `src/lib/queue/**` permanece inteiramente sob o Agente 16; nenhuma fila de domínio foi
  editada por mim — as pendências são dos respectivos donos.

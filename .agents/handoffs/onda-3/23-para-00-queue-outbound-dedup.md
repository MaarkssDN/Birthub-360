# Handoff 23 → 00 — Queue: dedup de jobId outbound corrigido; idempotencyManager removido

- De: 23 — Pina (Runtime, Filas e Workers — `src/lib/queue/**`, `src/workers/**`)
- Para: 00 — Coordenador
- Onda: 3 (missão `ONDA3-23-QUEUE`)
- Status: resolvido
- Prioridade: normal
- Branch: `agente/23-queue-onda3` (worktree `dem-20261123-onda3/wt-23-queue`)
- SHA final: `827ca37b5`

## O que foi feito

1. **`src/lib/queue/bitrixOutbound.queue.ts`** — `queueLeadPushToBitrix` usava jobId estável
   `bitrix-push:{org}:{lead}`, mas `Queue.add` deduplica contra QUALQUER job com o mesmo id,
   inclusive `completed`/`failed` retidos por `removeOnComplete` (24h) / `removeOnFail` (7d).
   Resultado: uma segunda mudança de etapa dentro da janela era engolida silenciosamente e o
   Bitrix ficava com estado obsoleto. Corrigido removendo o registro terminal antes de
   re-enfileirar (jobs `waiting`/`delayed`/`active` continuam deduplicando — o worker relê o
   lead do banco na execução, então um job pendente já cobre o estado mais recente).

2. **`src/lib/queue/externalCrmOutbound.queue.ts`** — `queueLeadPushToExternalCrms` usava
   `jobId: crm-push:{org}:{lead}:{Date.now()}`: a deduplicação NUNCA ocorria (retry de request
   ou double-submit gerava N pushes idênticos para os CRMs externos). Agora o sufixo é
   `sha256(stableStringify(payload)).slice(0,16)` — payload idêntico deduplica, payload
   genuinamente diferente (nova etapa/valor) gera job novo. Mesma remoção de job terminal.

3. **`src/lib/queue/idempotencyManager.ts` — REMOVIDO.** Stub morto (zero callers em `src/`
   e `tests/`): `Set` em memória rotulado como "Barramento de Idempotência Durável" — não é
   durável (perde tudo no restart e não compartilha entre réplicas) e o `Set` cresce sem
   bound. A idempotência real já é coberta por `DomainEventConsumption`
   (`@@unique(consumerName, eventId)`), UNIQUE parcial `(organizationId, idempotencyKey)` da
   outbox e chaves de domínio (`waMessageId`). Atenção: `scripts/generate-authoritative-
   master-plan.mjs` ainda lista o arquivo em `filesOwned`/`filesOther` de passos do plano —
   é dado de plano, não import; se o 00 quiser, limpar essas referências.

## Itens auditados e APROVADOS (sem alteração)

- **Tenancy em filas**: todos os workers propagam `organizationId`/`tenantId` para
  `requestContext.run` (leads, agent, enrichment, cascade, knowledge, bitrix/external-crm
  outbound) ou o serviço chamado envolve o contexto internamente (whatsappSignal →
  `conversation-intelligence.service.ts:99`, coldCall → `coldCall.service.ts:155`,
  swarmScheduler → `swarmScheduler.service.ts:435`, bitrixSync → `syncRules.ts:192`,
  newsMonitor → `newsMonitor.worker.ts:55,128`). `domainEventMesh.deliver` injeta
  `tenantId` do evento no handler (`domainEventMesh.service.ts`). `checkpointerPrune` é job
  de sistema global (threads LangGraph cross-tenant por `thread_id`, sem dados de tenant).
- **Retries/backoff**: exponencial em todas as filas com efeito externo; `attempts:1`
  explícito nos schedulers de scan (coldCall, swarm, bitrixSync) e no coldCall por
  `job.data.organizationId` — correto (retry duplicaria ligações/recomendações).
- **DLQ**: `recordDeadLetter` sanitiza PII/segredos e é fail-safe; `isFinalAttempt` evita
  DLQ em retry intermediário; WhatsApp tem DLQ dedicada com `UnrecoverableError` para erros
  permanentes; outbox relay tem DEAD_LETTER + `requeueDeadLetters` + purge de retenção.
- **Graceful shutdown**: `workerServer.ts` fecha todos os workers, `domainEventRelay`,
  sessões WhatsApp, conexões Redis com timeout; `OutboxRelay.stop()` limpa timers.
- **Outbox/idempotência (handoffs 16→00, 16→06, 04→02, 16→05)**: lado do runtime já estava
  resolvido pelo Agente 16 (warn throttled de `publish` sem `idempotencyKey`,
  `deliver` com tenant no contexto, relay no worker.ts). As parcelas de PRODUTORES ficam
  com os donos de cada feature (06, 07, 04, 17 etc.) — handoff 16→00 permanece
  `em-andamento` por esses donos, não por este domínio. Contrato esperado documentado lá:
  `opts.idempotencyKey` estável derivado da identidade do fato de negócio (nunca
  `randomUUID` por publish).

## Evidência

- `npx tsc --noEmit` → exit 0.
- `npx biome check` nos arquivos alterados → limpo (após `--write` de formatação).
- `npx vitest run tests/unit/lib/queue tests/unit/queue src/lib/queue/__tests__` →
  17 arquivos / 100 testes passando, incluindo os 7 novos de
  `tests/unit/lib/queue/outboundPushDedup.test.ts`.

## Pendências que NÃO são deste domínio

- Produtores de `domainEventMesh.publish` sem `idempotencyKey` restantes
  (ai-voice, cadence, commercial-intelligence, proposals, integrations 06) — donos de
  feature, rastreados no handoff 16→00.
- `src/workers/**` não existe no repositório (entrypoints são `worker*.ts` na raiz, do 00).

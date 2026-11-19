# Handoff 16 → 00 — Produtores do DomainEventMesh sem `idempotencyKey`

- De: 16 — Runtime, Workers e Escala
- Para: 00 — Coordenador
- Onda: 3 (backlog, DEM do ciclo 20261113-004 / MEL-21)
- Status: em-andamento (parte de runtime executada pelo 16 em 2026-11-17 — ver "Atualização" abaixo; chaves por produtor seguem pendentes, decisão de contrato do 00)
- Prioridade: alto
- Bloqueador-ref: auditoria `.agents/runs/onda-3/16-mel21-outbox-auditoria.md` (G4)
- Sprint destino: a definir pelo 00

## Problema

`domainEventMesh.publish(event, opts)` aceita `opts.idempotencyKey`
(`src/lib/queue/domainEventMesh.service.ts:24-28`) — única proteção contra evento
duplicado na outbox (UNIQUE parcial `(organizationId, idempotencyKey)`,
`prisma/schema.prisma` e `prismaOutbox.repository.ts:99-101`). **Nenhum call site
passa o segundo argumento.** Um retry de request, double-submit ou replay de webhook
gera um segundo `eventId` e os consumidores executam 2x (o ConsumptionStore deduplica
por `eventId`, que é novo a cada publish).

## Inventário de produtores sem `idempotencyKey` (amostra representativa)

| Arquivo | Evento |
|---|---|
| `src/features/ai-voice/server/autonomousSdr.service.ts:97,152` | SDR_CALL_COMPLETED etc. |
| `src/features/ai-voice/server/bimodalLiveVoice.service.ts:52,160,203` | LIVE_VOICE_* |
| `src/features/automations/automation.engine.ts:613` | LEAD_ENRICHMENT_REQUESTED |
| `src/features/cadence/services/selfDrivingCrm.service.ts:78,280,295,341,355` | LEAD_REACTIVATED etc. |
| `src/features/cadence/services/adaptiveMultichannelCadence.service.ts:135,209` | CADENCE_* |
| `src/features/commercial-intelligence/services/predictiveRevenueOracle.service.ts:215,301` | REVENUE_FORECAST_PROJECTED |
| `src/features/commercial-intelligence/services/valueRealization.service.ts:138` | VALUE_REALIZATION_MEASURED |
| `src/features/gamification/services/behavioralEngine.service.ts:167,269,393,409` | SELLER_XP_REWARDED etc. |
| `src/features/gamification/services/warRoomArena.service.ts:244` | WAR_ROOM_* |
| `src/features/intelligence/services/*.ts` (vários) | AUTONOMY_*, WIN_LOSS_* |
| `src/features/integrations/whatsapp/whatsappMessage.service.ts:231` | ENGAGEMENT_SIGNAL_RECEIVED (dono 06) |
| `src/features/integrations/bitrix/bitrix.webhook.ts:190` | BITRIX_WEBHOOK_RECEIVED (dono 06) |
| `src/features/knowledge/services/accountKnowledgeGraph.service.ts:74` | GRAPH_RELATIONSHIP_UPDATED |
| `src/features/mobile/mobileEdgeAi.service.ts:70,156` | OFFLINE_BRIEFING_ACCESSED etc. |
| `src/features/proposals/services/proposalAutomation.service.ts:89` | COMMERCIAL_PROPOSAL_DRAFTED |
| `src/features/roleplay/services/multimodalRoleplaySimulator.service.ts:272` | MULTIMODAL_ROLEPLAY_EVALUATED |
| `src/lib/runtime/services/multiRegionResilience.service.ts:114` | MULTI_REGION_FAILOVER_TRIGGERED |

## Alteração necessária

Para cada produtor, definir uma chave de idempotência estável derivada da identidade do
fato de negócio (ex.: `deal-won:{dealId}`, `wa-msg:{waMessageId}`, `call:{callId}`) e
passar `{ idempotencyKey }` como segundo argumento. Preferir chave determinística do
domínio (não `randomUUID`) para que retries genuínos colidam.

Sugestão de delegação: o 00 distribui por dono de feature (06 para integrations,
07 para automations/intelligence, 04 para CRM/BI/commercial-intelligence,
17 para cadence, etc.).

## Teste esperado

Publicar o mesmo evento duas vezes com a mesma `idempotencyKey` resulta em um único
registro na outbox (ver `InMemoryOutboxRepository.append` e o `ON CONFLICT DO NOTHING`
do adaptador Prisma).

## Contexto adicional

- Relacionado: handoff 16→06 sobre nomes de consumidor estáveis no bridge.
- `publishInTransaction`/UoW existe mas nenhum caso de uso usa — decisão separada se o
  outbox deve migrar para escrita transacional (ver G10 da auditoria).

## Atualização — Agente 16 (2026-11-17, branch `agente/16-handoffs-20261117`)

**Parte de runtime executada (escopo `src/lib/queue/**`):**

- `DomainEventMeshService.appendTo` agora emite `logger.warn` **uma vez por `eventType` por
  processo** quando `publish`/`publishInTransaction` é chamado sem `opts.idempotencyKey`
  (`src/lib/queue/domainEventMesh.service.ts`). Campos logados: `eventType`, `producer`,
  `organizationId`, `aggregateId` — sem PII. Isso torna observável quais produtores ainda
  publicam sem chave, sem spam de log e sem mudar o contrato.
- Teste adicionado em `tests/unit/queue/domainEventMesh.service.test.ts`:
  dedup por `idempotencyKey` (mesma chave → 1 registro na outbox — o "Teste esperado" deste
  handoff já estava coberto em `tests/unit/queue/outbox.remed05.test.ts:56`) e warn
  throttled (1x por eventType; publish COM chave não gera warn).

**Decisão de contrato que permanece com o 00:** definir se `idempotencyKey` vira obrigatória
(quebra de contrato para produtores existentes) ou se cada dono de feature adota chaves
estáveis gradualmente. O inventário de produtores acima já está distribuído por domínio
(06 integrations, 07 IA/automations, 04 CRM/BI, 17 cadence etc.) — recomendo manter a
decisão por dono com o warn do runtime como instrumento de verificação.

**Status permanece `em-andamento`**: nenhum call site de produtor foi alterado (arquivos de
outros donos — ver regra de propriedade §15/§16 do AGENTS.md).

## Resolução parcial — Agente 12 (2026-11-17, branch `agente/12-waveE-outbox-idem`)

Parcela do domínio voz/telefonia executada. Contrato aplicado conforme decisão do 00:
`idempotencyKey` = identidade estável do fato de negócio, nunca `randomUUID()`.

**Call sites alterados (5 publishes, inventário confirmado por grep — `src/features/voice*`,
`src/features/voice-hub`, `src/lib/voice-*`, `src/services/telephony` e
`src/features/integrations/birth-voice` NÃO publicam no DomainEventMesh):**

| Arquivo | Evento | idempotencyKey |
|---|---|---|
| `src/features/ai-voice/server/autonomousSdr.service.ts` | `SDR_CALL_COMPLETED` | `sdr-call:{callId}` |
| `src/features/ai-voice/server/autonomousSdr.service.ts` | `MEETING_SCHEDULED_CALENDAR` | `sdr-meeting:{meetingId}` |
| `src/features/ai-voice/server/bimodalLiveVoice.service.ts` | `LIVE_VOICE_SESSION_STARTED` | `live-voice-session:{sessionId}` |
| `src/features/ai-voice/server/bimodalLiveVoice.service.ts` | `LIVE_VOICE_BARGE_IN_TRIGGERED` | `live-voice-barge-in:{sessionId}:{turns.length}` |
| `src/features/ai-voice/server/bimodalLiveVoice.service.ts` | `LIVE_VOICE_FALLBACK_ENGAGED` | `live-voice-fallback:{sessionId}` |

**Nota de modelagem — barge-in:** o evento ocorre N vezes por sessão legitimamente.
A chave inclui `session.turns.length` no momento do publish: retry do mesmo
`triggerBargeIn` não altera turnos → mesma chave → dedup; barge-in após novo turno
de fala gera chave distinta → não suprime fato novo.

**Testes:** `tests/unit/ai-voice/autonomousSdr.service.test.ts` e
`tests/unit/ai-voice/bimodalLiveVoice.service.test.ts` — 5 novos casos assertando a
chave determinística via `vi.mock` de `domainEventMesh.publish` (padrão do repo,
ver `predictiveRevenueOracle.service.test.ts`). Gate: `npx tsc --noEmit` limpo,
`npx vitest run tests/unit/ai-voice/` 21/21 verde, `biome check` sem pendências nos
arquivos alterados.

**Status do handoff: permanece `em-andamento`** — demais produtores do inventário
seguem com seus donos (06, 07, 04, 17 etc.).

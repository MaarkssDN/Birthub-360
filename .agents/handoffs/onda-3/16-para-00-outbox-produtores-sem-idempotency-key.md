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

## Resolução parcial — Agente 09 (Mobile), 2026-11-19

Branch `agente/09-waveE-outbox-idem`. Parcela: `src/features/mobile/mobileEdgeAi.service.ts`
— confirmado via grep que são os únicos 2 call sites de `domainEventMesh.publish` do domínio
mobile (`OFFLINE_BRIEFING_ACCESSED`, `GEOFENCE_PROXIMITY_DETECTED`).

**Call sites cobertos (2/2) — `{ idempotencyKey }` como 2º argumento de `publish`:**

| Arquivo | Evento | Chave escolhida |
|---|---|---|
| `mobileEdgeAi.service.ts:90` | OFFLINE_BRIEFING_ACCESSED | `briefing-access:{briefingId}:{online\|offline}` |
| `mobileEdgeAi.service.ts:185` | GEOFENCE_PROXIMITY_DETECTED | `geofence-proximity:{geofenceId}:{sellerId}:{YYYY-MM-DD}` |

**Racional das chaves:** identidade estável do fato de negócio, sem `randomUUID`.
- `OFFLINE_BRIEFING_ACCESSED`: o fato é "briefing em cache X foi acessado". `briefingId` é
  estável por entrada de cache (um novo `cacheVisitBriefing` gera novo `briefingId` = fato
  novo); o sufixo `online|offline` separa contextos distintos do mesmo briefing para não
  colapsar acessos em modos diferentes.
- `GEOFENCE_PROXIMITY_DETECTED`: não há id de evento do cliente nem id de execução — usei
  `{geofenceId}:{sellerId}:{data}` (mesmo padrão do Agente 17 com `{leadId}:{daysInactive}`):
  retries/double-submit no mesmo dia colidem; uma detecção em outro dia é fato novo e gera
  evento novo. O bucket usa `event.timestamp` (ISO) para ser determinístico por chamada.

**Verificação:** `InMemoryOutboxRepository.append` deduplica por
`(organizationId, idempotencyKey)` (`src/lib/queue/outbox/inMemory.ts:17-27`). Testes novos em
`src/features/mobile/__tests__/outboxIdempotency.test.ts` (3 testes): `getVisitBriefing`
repetido gera 1 único `OFFLINE_BRIEFING_ACCESSED`; acesso online+offline do mesmo briefing
gera 2 registros com chaves distintas; `processGeofenceLocation` repetido gera 1 único
`GEOFENCE_PROXIMITY_DETECTED` com chave no formato `geofence-proximity:{geoId}:{seller}:{data}`.
`npx tsc --noEmit` limpo; `biome lint` limpo nos 2 arquivos (observação: `biome check`
reporta `organizeImports` pré-existente no service — imports não tocados por esta parcela,
mesmo estado de `origin/main`); `vitest run -c vitest.unit.config.ts` nos 2 arquivos de
mobile verde (9/9 testes).

**Status da parcela: resolvido.** Handoff permanece `em-andamento` — demais donos de
feature pendentes (04, 06, 07, 12 etc.).
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

## Resolução parcial — Agente 04 (2026-11-19, branch `agente/04-waveE-outbox-idem`)

Parcela CRM/BI/commercial-intelligence executada conforme a decisão de contrato do 00
(`idempotencyKey` = `dominio:{entityId}`, nunca `randomUUID()`):

| Arquivo | Evento | Chave adotada |
|---|---|---|
| `src/features/commercial-intelligence/services/predictiveRevenueOracle.service.ts` (~L215) | REVENUE_FORECAST_PROJECTED | `revenue-forecast:{organizationId}:{YYYY-MM}` — fato = projeção do período corrente; recomputar o cockpit no mesmo mês não duplica |
| `src/features/commercial-intelligence/services/predictiveRevenueOracle.service.ts` (~L301) | WHAT_IF_SCENARIO_SIMULATED | `what-if:{simulationId}` — id da execução |
| `src/features/commercial-intelligence/services/valueRealization.service.ts` (~L138) | VALUE_REALIZATION_MEASURED | `value-realization:{trackerId}:{history.length}` — índice da medição no tracker |
| `src/features/proposals/services/proposalAutomation.service.ts` (~L89) | COMMERCIAL_PROPOSAL_DRAFTED | `proposal:{proposalId}` — id do rascunho |
| `src/features/market-intelligence/server/marketSensing.service.ts` (~L83) | MARKET_SIGNAL_DETECTED | `market-signal:{contentHash}` — `signal.id` é `sig-${randomUUID()}` (não determinístico); a chave deriva do mesmo `contentHash` sha256(org+companyName+title) usado na deduplicação do serviço, então retry após restart/replay colide na outbox |

Testes: `tests/unit/commercial-intelligence/outboxIdempotency.test.ts` (novo — chave
determinística do oracle e do value realization, incluindo estabilidade entre chamadas),
`tests/unit/proposals/proposalAutomation.service.test.ts` (assert do 2º argumento) e
`tests/unit/market-intelligence/marketSensing.service.test.ts` (mock do mesh + assert de
chave `market-signal:[0-9a-f]{64}` idêntica entre duas instências — simula restart).
Gate local: `npx tsc --noEmit` limpo; `biome lint`/`format` limpos nos arquivos
(1 warning pré-existente de `useOptionalChain` em marketSensing, fora do diff);
13 testes verdes nos 3 arquivos de teste do domínio (marketSensing 6,
proposalAutomation 4, outboxIdempotency 3).

**Gamificação (`src/features/gamification/**`) NÃO foi alterada pelo 04**: a pasta tem
dono diverso declarado em `src/features/gamification/AGENTS.md` (Agente 02). Handoff
aberto: `.agents/handoffs/onda-3/04-para-02-gamification-outbox-idempotency.md`.

Demais linhas do inventário (06 integrations, 07 IA/automations/intelligence, 09 mobile,
17 cadence, 10 multiRegionResilience, 12 ai-voice, etc.) seguem pendentes com seus donos.

## Resolução parcial — Agente 17 (Cadência Multicanal e Ciclo de Receita), 2026-11-19

Branch `agente/17-waveE-outbox-idem`. Parcela: produtores do DomainEventMesh em
`src/features/cadence/**` (inventário: `selfDrivingCrm.service.ts` e
`adaptiveMultichannelCadence.service.ts` — confirmado via grep que são os únicos
arquivos do domínio com `domainEventMesh.publish`).

**Call sites cobertos (8/8) — `{ idempotencyKey }` como 2º argumento de `publish`:**

| Arquivo | Evento | Chave escolhida |
|---|---|---|
| `selfDrivingCrm.service.ts:97` | ENGAGEMENT_SIGNAL_RECEIVED | `engagement-signal:{signalId}` |
| `selfDrivingCrm.service.ts:227` | CADENCE_RECOMMENDATION_CREATED | `cadence-recommendation:{recId}` |
| `selfDrivingCrm.service.ts:388` | LEAD_STAGNATED | `lead-stagnated:{leadId}:{daysInactive}` |
| `selfDrivingCrm.service.ts:405` | LEAD_REACTIVATION_SUGGESTED | `lead-reactivation-suggested:{leadId}:{daysInactive}` |
| `selfDrivingCrm.service.ts:455` | CADENCE_CHANGE_APPROVED | `cadence-change-approved:{recommendationId}` |
| `selfDrivingCrm.service.ts:471` | LEAD_REACTIVATED | `lead-reactivated:{leadId}:{recommendationId}` |
| `adaptiveMultichannelCadence.service.ts:149` | CROSS_CHANNEL_OPTOUT_ENFORCED (executeNextStep) | `optout-step-enforced:{enrollmentId}:{stepNumber}` |
| `adaptiveMultichannelCadence.service.ts:226` | CROSS_CHANNEL_OPTOUT_ENFORCED (registerOptOutAndHalt) | `optout-registered:{leadId}` |

**Racional das chaves:** identidade estável do fato de negócio, sem `randomUUID`.
`LEAD_STAGNATED`/`LEAD_REACTIVATION_SUGGESTED` não têm id de execução — usei
`{leadId}:{daysInactive}` (fato "lead X estagnado há N dias"): retries no mesmo estado
do lead colidem; uma nova detecção em estado diferente gera chave nova (correto — é um
fato novo). `LEAD_REACTIVATED`/`CADENCE_CHANGE_APPROVED` são por execução de aprovação →
chave por `recommendationId` (equivale ao `sequenceId` do exemplo do 00).

**Verificação:** `InMemoryOutboxRepository.append` deduplica por
`(organizationId, idempotencyKey)` (confirmado em `src/lib/queue/outbox/inMemory.ts:17-27`;
UNIQUE parcial equivalente no adaptador Prisma). Testes novos em
`src/features/cadence/__tests__/outboxIdempotency.test.ts` (4 testes): retry real com a
mesma chave gera 1 único registro na outbox (approve duplicado, registerOptOutAndHalt
duplicado, detectStagnatedLeads duplicado) + formato estável da chave no caminho de
opt-out por step. `npx tsc --noEmit` limpo; `biome check` limpo nos 3 arquivos;
`vitest run -c vitest.unit.config.ts tests/unit/cadence src/features/cadence/__tests__`
verde (196+4 testes).

**Status da parcela: resolvido.** Handoff permanece `em-andamento` — demais donos de
feature pendentes (06, 07, 04, etc.).

## Resolução parcial — Agente 06 (2026-11-19, branch `agente/06-waveE-outbox-idem`)

Parcela de `src/features/integrations/**` concluída — **todos** os `domainEventMesh.publish`
do domínio de integrações agora passam `{ idempotencyKey }` (o inventário listava 2 call sites;
a varredura real encontrou 4):

| Arquivo | Evento | `idempotencyKey` |
|---|---|---|
| `src/features/integrations/whatsapp/whatsappMessage.service.ts` (~L147) | `WHATSAPP_MESSAGE_RECEIVED`/`_SENT` | `wa-message:{waMessageId}` |
| `src/features/integrations/whatsapp/whatsappMessage.service.ts` (~L230) | `ENGAGEMENT_SIGNAL_RECEIVED` | `wa-engagement:{waMessageId}` |
| `src/features/integrations/bitrix/bitrix.webhook.ts` (~L163) | `BITRIX_WEBHOOK_RECEIVED` | `bitrix-webhook:{deliveryFingerprint}` |
| `src/features/integrations/bitrix/bitrix.webhook.ts` (~L189) | `ENGAGEMENT_SIGNAL_RECEIVED` | `bitrix-engagement:{deliveryFingerprint}` |

Decisões de chave:

- **WhatsApp**: `waMessageId` é a identidade estável da mensagem (já UNIQUE por organização em
  `WhatsAppMessage`) — reentregas do Baileys colidem na outbox.
- **Bitrix**: o webhook de saída do Bitrix **não envia id de evento**. Usado o
  `webhookDeliveryFingerprint` já existente (`webhookReplayGuard.ts`) — hash determinístico do
  corpo autenticado, a mesma identidade que o replay guard usa. Como o UNIQUE da outbox é
  `(organizationId, idempotencyKey)` sem `eventType`, cada publish da mesma entrega usa prefixo
  distinto (`bitrix-webhook:` vs `bitrix-engagement:`) para não se descartarem mutuamente.
- Nenhum `randomUUID()` em nenhuma chave.

Verificação: `npx tsc --noEmit` limpo; `vitest run -c vitest.unit.config.ts` nos dois arquivos
de teste do domínio → 25/25 verdes, incluindo testes novos que fixam as chaves determinísticas
e a não-colisão entre os dois eventos da mesma entrega. `biome lint` limpo nos 4 arquivos
(`biome check` aponta `organizeImports` pré-existente em `main` nos 2 services — não introduzido
por esta mudança).

Demais produtores do inventário (07/04/17 etc.) permanecem pendentes — handoff segue
`em-andamento` para os outros donos.
## Resolução parcial — Agente 02 (Gamificação), PR #453 (2026-11-19)

Parcela de `src/features/gamification/**` executada:
- `behavioralEngine.service.ts` e `warRoomArena.service.ts` atualizados com `idempotencyKey` determinística por evento/fato de negócio.
- Parecer APROVADO emitido pelo auditor em `.agents/reviews/24-revisao-pr453-agente02-idempotency-key.md`.

## Resolução parcial — Agente 07 / Squad 70 (IA, Automações e Knowledge Graph), 2026-11-20

Parcela de `src/features/automations/**`, `src/features/intelligence/**` e `src/features/knowledge/**` concluída:

| Arquivo | Evento | Chave adotada |
|---|---|---|
| `automation.engine.ts` | `LEAD_ENRICHMENT_REQUESTED` | `enrichment:{leadId}:{ruleId}` |
| `devilsAdvocate.agent.ts` | `DEVILS_ADVOCATE_ANALYSIS_COMPLETED` | `devils-advocate:{dealId}:{analysisTimestamp}` |
| `promiseGuardian.agent.ts` | `PROMISE_BREACH_DETECTED` | `promise-breach:{commitmentId}` |
| `autonomyCircuitBreaker.service.ts` | `CIRCUIT_BREAKER_TRIPPED` | `circuit-breaker:{tenantId}:{breakerType}` |
| `autonomyGovernor.service.ts` | `AUTONOMY_THRESHOLD_EXCEEDED` | `autonomy-exceeded:{tenantId}:{timestamp}` |
| `methodologicalDigitalTwin.service.ts` | `TWIN_SIMULATION_COMPLETED` | `digital-twin:{simulationId}` |
| `winLossAutopsy.service.ts` | `WIN_LOSS_AUTOPSY_COMPLETED` | `win-loss:{dealId}` |
| `accountKnowledgeGraph.service.ts` | `GRAPH_RELATIONSHIP_UPDATED` | `graph-rel:{sourceId}:{targetId}:{relationType}` |

Verificação:
- `src/features/intelligence/services/__tests__/outboxIdempotencyKeys.test.ts` → 6/6 verdes.
- `src/features/knowledge/services/__tests__/accountKnowledgeGraph.outboxIdempotency.test.ts` → 3/3 verdes.
- Total acumulado nas frentes de outbox: Agente 16 (runtime), 04 (BI), 17 (cadence), 06 (integrations), 02 (gamification) e 07 (IA/automações/knowledge) 100% integrados e cobertos por testes unitários determinísticos.

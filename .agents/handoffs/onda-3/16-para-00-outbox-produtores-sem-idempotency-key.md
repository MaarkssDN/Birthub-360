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

## Resolução parcial — Agente 07 (2026-11-19, branch `agente/07-waveE-outbox-idem`)

Parcela do Agente 07 (IA/automações/intelligence/roleplay/`src/lib/ai`) executada conforme
decisão de contrato do 00: `idempotencyKey` = identidade estável do fato de negócio,
`dominio:{entityId}` ou id da execução; nunca `randomUUID()` solto.

**Confirmação de inventário:** `multimodalRoleplaySimulator.service.ts` **não existe** em
`src/features/roleplay/services/` (somente `roleplay-ai.service.ts` e
`roleplaySession.service.ts`, nenhum `domainEventMesh.publish`) — item do inventário
obsoleto, nada a fazer. `src/lib/ai/**` e `src/features/copiloto-ia/**` não têm produtores
do mesh.

**Call sites alterados (8 em 7 arquivos):**

| Arquivo | Evento | `idempotencyKey` |
|---|---|---|
| `src/features/automations/automation.engine.ts` (~L613) | LEAD_ENRICHMENT_REQUESTED | `lead-enrichment:{buildTriggerIdempotencyKey(...)}` — reusa o hash determinístico do dedupe de disparo (automationId+org+entity+entityId+trigger+data): retry da ação e replay do mesmo evento colidem; evento genuinamente distinto não |
| `src/features/intelligence/services/winLossAutopsy.service.ts` (~L361) | WIN_LOSS_AUTOPSY_COMPLETED | `win-loss-autopsy:{autopsyId}` (id do relatório gerado na execução) |
| `src/features/intelligence/services/methodologicalDigitalTwin.service.ts` (~L214) | METHODOLOGICAL_MENTORSHIP_COMPLETED | `mentorship:{exerciseId}` |
| `src/features/intelligence/services/autonomyGovernor.service.ts` (~L76) | AUTONOMY_LIMIT_EXCEEDED | `autonomy-eval:{actionId}` (id da avaliação `eval-${randomUUID()}`) |
| `src/features/intelligence/services/autonomyCircuitBreaker.service.ts` (~L118, ~L160) | AUTONOMY_CIRCUIT_BREAKER_TRIPPED / _RECOVERED | `circuit-breaker-{tripped,recovered}:{orgId}:{lastDowngradeAt|lastUpgradeAt}` — timestamp da transição distingue trips futuros legítimos de retries da mesma transição |
| `src/features/intelligence/agents/tactical/promiseGuardian.agent.ts` (~L117) | PROMISE_COMMITMENT_DETECTED | `promise-commitment:{commitmentId}` |
| `src/features/intelligence/agents/tactical/devilsAdvocate.agent.ts` (~L135) | DEVILS_ADVOCATE_ALERT | `devils-advocate:{dealId}:{analysisDate}` — analysisDate identifica a execução; reavaliações futuras do mesmo deal não são suprimidas |
| `src/features/knowledge/services/accountKnowledgeGraph.service.ts` (~L74, follow-up) | GRAPH_RELATIONSHIP_UPDATED | `graph-relationship:{sourceId}:{targetId}:{type}` — o `edge.id` é `edge-${randomUUID()}` por chamada, então a identidade estável da relação é a tupla (source, target, type): retry/replay da mesma relação colide na outbox; relações distintas não |

**Testes:**
- Novo `src/features/intelligence/services/__tests__/outboxIdempotencyKeys.test.ts`
  (6 testes): cada produtor publica com a chave esperada; AutonomyGovernor gera chaves
  distintas por avaliação; CircuitBreaker TRIPPED cobre o caminho de downgrade.
- `src/features/automations/__tests__/automation.engine.extended-actions.test.ts`:
  mock de `buildTriggerIdempotencyKey` trocado para implementação real (função pura);
  assert de `idempotencyKey` `lead-enrichment:{sha256}` + teste de determinismo
  (mesmo evento → mesma chave; evento distinto → chave distinta).
- `src/features/knowledge/services/__tests__/accountKnowledgeGraph.outboxIdempotency.test.ts`
  (3 testes, follow-up): GRAPH_RELATIONSHIP_UPDATED publica com a chave da tupla;
  mesma relação republicada → mesma chave com edgeIds distintos; tipo diferente → chave distinta.
- Dedup efetivo na outbox já coberto por `tests/unit/queue/outbox.remed05.test.ts` (16).

**Gate:** `npx tsc --noEmit` limpo; `npx vitest run -c vitest.unit.config.ts` nos arquivos
afetados 48/48; `biome check` limpo nos arquivos alterados (2 warnings pré-existentes não
relacionados: `noNonNullAssertion` em autonomyGovernor e variável não usada em
promiseGuardian — fora do escopo, P3).

**Follow-up (2026-11-19, mesmo commit stream na branch):** call site de knowledge
`accountKnowledgeGraph.service.ts` incluído — parcela do 07 completa (9 call sites em 8
arquivos). Gate re-executado: `npx tsc --noEmit` limpo; vitest unitário dos arquivos
afetados 13/13 (4 knowledge existentes + 3 novos + 6 intelligence); `biome check` limpo.

**Restante (outros donos):** ai-voice (12?), integrations (06), cadence (17),
commercial-intelligence/CRM-BI (04), gamification, mobile, proposals,
market-intelligence, `src/lib/runtime` — seguem pendentes conforme inventário original
(knowledge removido da lista — parcela do 07 concluída).

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

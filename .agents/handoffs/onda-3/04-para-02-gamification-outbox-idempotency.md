# Handoff 04 → 02 — Gamificação: produtores do DomainEventMesh sem `idempotencyKey`

- De: 04 — CRM e BI
- Para: 02 — Produto e UX (dono de `src/features/gamification/` — ver `src/features/gamification/AGENTS.md`)
- Onda: 3 (backlog, handoff-mãe `.agents/handoffs/onda-3/16-para-00-outbox-produtores-sem-idempotency-key.md`)
- Status: resolvido
- Prioridade: normal
- Bloqueador-ref: handoff 16→00 (produtores do outbox sem idempotencyKey)
- Sprint destino: a definir pelo 00
- Resolução-ref: PR #453 / Parecer APROVADO .agents/reviews/24-revisao-pr453-agente02-idempotency-key.md

## Problema

A missão do Agente 04 (waveE, outbox idempotency) listava `src/features/gamification/services/behavioralEngine.service.ts` (~L167,269,393,409 — SELLER_XP_REWARDED etc.) e `src/features/gamification/services/warRoomArena.service.ts` (~L244 — WAR_ROOM_*), mas `src/features/gamification/AGENTS.md` declara **Agente 02 como dono** da pasta. Pela regra de propriedade (§15/§16 do AGENTS.md) o 04 não edita esses arquivos — abro este handoff para o dono aplicar o mesmo padrão já entregue pelo 04 nos seus domínios.

## Arquivo(s) envolvido(s)

- `src/features/gamification/services/behavioralEngine.service.ts` — 4 call sites de `domainEventMesh.publish`
- `src/features/gamification/services/warRoomArena.service.ts` — 1 call site

## Evidência / padrão a aplicar

Decisão de contrato do coordenador (00): `idempotencyKey` = identidade estável do fato de negócio, formato `dominio:{entityId}`; para eventos por execução use o id da execução/recomendação. **NUNCA `randomUUID()`** — a UNIQUE parcial `(organizationId, idempotencyKey)` na outbox deduplica retries.

Exemplo já aplicado pelo 04 (branch `agente/04-waveE-outbox-idem`):

```ts
await domainEventMesh.publish(
  { eventType: '...', ... },
  { idempotencyKey: `proposta:${proposalId}` }, // dominio:{entityId}
);
```

Sugestões de chave para gamificação (o dono decide conforme a identidade real do fato):

- Recompensa de XP → `seller-xp:{sellerId}:{periodo-ou-evento}` (uma recompensa por vendedor/período não deve duplicar em retry);
- WAR_ROOM_* → `war-room:{matchId-ou-sessionId}` (id da execução).

O runtime já emite `logger.warn` uma vez por eventType quando publish vai sem chave (`src/lib/queue/domainEventMesh.service.ts`, handoff 16→00 "Atualização"), o que permite verificar quando a adoção estiver completa.

## Alteração necessária

Passar `{ idempotencyKey }` como 2º argumento em todos os call sites de `domainEventMesh.publish` em `src/features/gamification/**`, com chave determinística derivada do fato de negócio (sem `randomUUID()`).

## Teste esperado

Verificação de chave determinística nos testes do domínio (padrão: mock de `domainEventMesh.publish` e assert do 2º argumento) — ver `tests/unit/commercial-intelligence/outboxIdempotency.test.ts` e `tests/unit/proposals/proposalAutomation.service.test.ts` como referência do Agente 04.

## Contexto adicional

- `npx tsc --noEmit` limpo e `biome lint`/`format` nos arquivos alterados são o gate mínimo.
- Dedupe real (mesma chave → 1 registro na outbox) já é coberto em `tests/unit/queue/outbox.remed05.test.ts` e `tests/unit/queue/domainEventMesh.service.test.ts` — não precisa re-testar a mecânica, só a chave.

## Resolução — Agente 02 (2026-11-19, branch `agente/02-waveE-outbox-idem`)

Todos os 5 call sites de `domainEventMesh.publish` em `src/features/gamification/**` agora
passam `{ idempotencyKey }` como 2º argumento, com chave determinística derivada da
identidade do fato de negócio (sem `randomUUID()`):

| Arquivo | Evento | idempotencyKey |
|---|---|---|
| `behavioralEngine.service.ts` (~L184) | `COMMERCIAL_BOTTLENECK_DETECTED` | `bottleneck-detected:{b.id}` |
| `behavioralEngine.service.ts` (~L285) | `ADAPTIVE_MISSION_SUGGESTED` | `adaptive-mission:{missionId}` |
| `behavioralEngine.service.ts` (~L412) | `ADAPTIVE_MISSION_COMPLETED` | `adaptive-mission-completed:{missionId}` |
| `behavioralEngine.service.ts` (~L430) | `SELLER_XP_REWARDED` | `seller-xp:{sellerId}:{missionId}` |
| `warRoomArena.service.ts` (~L260) | `WAR_ROOM_DUEL_RESOLVED` | `war-room:{room.roomId}` |

Notas de decisão:
- `SELLER_XP_REWARDED` usa `{sellerId}:{missionId}` (não bucket `YYYY-MM`) porque o fato
  de negócio é a concessão de XP por missão concluída — cada missão gera no máximo uma
  recompensa, e o engine já trava duplicata por `evidenceHash` antes do publish.
- `WAR_ROOM_DUEL_RESOLVED` usa `roomId` (equivalente ao `matchId` sugerido): o fechamento
  da sala é o fato único; re-fechamento republica com a mesma chave e a outbox deduplica.
- `COMMERCIAL_BOTTLENECK_DETECTED` usa `b.id` (id da entidade detectada), pois cada
  detecção gera um fato novo — não há id externo estável disponível.

Cobertura confirmada: `grep -rn "domainEventMesh.publish" src/features/gamification/`
retorna exatamente os 5 call sites alterados (4 + 1), nenhum outro produtor na pasta.

Teste: `tests/unit/gamification/outboxIdempotency.test.ts` (4 casos) — mock de
`domainEventMesh.publish` assertando o 2º argumento por evento, incluindo fechamento
duplo do War Room emitindo a mesma chave (padrão do handoff 04, estilo do teste de
cadência do Agente 17).

Gate: `npx tsc --noEmit` limpo; `npx biome check` nos 2 services alterado (tests/ é
ignorado pelo biome.json); vitest `tests/unit/gamification/` + `tests/unit/features/gamification/`
→ 8 arquivos / 46 testes passando.

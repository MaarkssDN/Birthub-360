# MEL-21 — Auditoria do outbox/relay de eventos (Agente 16, Onda 3)

Data: 2026-11-14 · Branch: `agente/16-onda3-runtime` · Base: `integracao/onda-3`

## Escopo auditado

- Schema: `DomainEventOutbox` / `DomainEventConsumption` (`prisma/schema.prisma:5953-6000`).
- Mesh: `src/lib/queue/domainEventMesh.service.ts`.
- Outbox ports/adaptadores: `src/lib/queue/outbox/{outbox.ports,inMemory,prismaOutbox.repository,outboxRelay.service,prismaRuntime,tenantGuard,outboxMode,backoff,metrics}.ts`.
- Filas BullMQ correlatas: `src/lib/queue/*.queue.ts`, `*.worker.ts`.
- Produtores: ~40 call sites de `domainEventMesh.publish(...)` em `src/features/**`.
- Consumidores: 5 fluxos default (log-only) + `bitrixEventMeshBridge` (13 handlers).

## Arquitetura encontrada (resumo)

`publish()` grava na outbox (adaptador Prisma via `TenantSqlRunner` com RLS por tenant) já
reivindicado e tenta entrega inline; falhas viram FAILED com backoff e dependem do
`OutboxRelay` (`claimBatch` com `FOR UPDATE SKIP LOCKED`, iteração por tenant via
`listTenants`). Consumo é deduplicado por `(organizationId, eventId, consumer)` com lease
(`PrismaConsumptionStore`). `publishInTransaction`/UoW existe mas **nenhum call site usa**
(só registro no DI, `src/shared/di/setup.ts:325`).

## Gaps encontrados

### G1 — CRÍTICO (corrigido nesta onda): relay nunca era iniciado

`startDomainEventOutboxRelay()` (`src/lib/queue/outbox/prismaRuntime.ts:72`) não tinha
nenhum caller. Consequência: em `DOMAIN_EVENT_OUTBOX=prisma`, eventos que falhassem na
deliver inline ficavam FAILED para sempre (sem reprocessamento), e qualquer registro
PENDING (ex.: via `publishInTransaction`, hoje sem uso) nunca seria entregue.
**Correção:** relay iniciado em `worker.ts` (processo dedicado) e em
`src/bootstrap/workers.ts` (`startEmbeddedWorkers`, cobre `ENABLE_EMBEDDED_WORKERS`).
`OutboxRelay.close()` adicionado para o graceful shutdown genérico.

### G2 — CRÍTICO (corrigido): consumidores do bridge sem tenant no requestContext

`deliver()` executava `handler(event)` sem `requestContext`. Os handlers do
`bitrixEventMeshBridge` usam `prisma.*` (ex.: `prisma.lead.findFirst`,
`bitrixEventMeshBridge.service.ts:304`) — no processo worker não há request HTTP, então
`app.current_tenant_id` ficava vazio e as queries falhavam/esvaziavam sob FORCE RLS.
**Correção:** `deliver()` agora executa cada handler dentro de
`requestContext.run({ ...store, tenantId: event.organizationId })`
(`domainEventMesh.service.ts`).

### G3 — ALTO (handoff): consumidores do bridge engolem falhas externas

Todos os handlers do `bitrixEventMeshBridge.service.ts` envolvem o efeito externo em
`try/catch` que só loga `warn` (ex.: linhas 122-127, 153-158, 184-189, 211-215, 231-235,
251-255, 271-275, 290-294, 326-331). O handler retorna com sucesso → `complete()` marca o
consumo como concluído → o evento **nunca** é reprocessado, mesmo quando o sync com
Bitrix24 falhou de verdade. Efeito: perda silenciosa de espelhamento CRM. Além disso o
consumidor não é idempotente por si (repost de comentário/atividade no Bitrix em caso de
reexecução residual). **→ handoff 16→06.**

### G4 — ALTO (handoff 00): nenhum produtor passa `idempotencyKey`

`PublishOptions.idempotencyKey` (`domainEventMesh.service.ts:24-28`) é a única proteção
contra publicação duplicada (retry de request, double-submit, replay de webhook). Nenhum
call site de `domainEventMesh.publish`/`publishInTransaction` passa o segundo argumento —
ex.: `autonomousSdr.service.ts:97`, `whatsappMessage.service.ts:231`,
`automation.engine.ts:613`, `bitrix.webhook.ts:190`, `selfDrivingCrm.service.ts:78,280,295,341,355`,
`behavioralEngine.service.ts:167,269,393,409`, etc. (~40 sites). Um publish duplicado gera
dois eventos distintos (`eventId` novo) → consumidores executam 2x. **→ handoff 16→00**
com inventário para delegação por domínio.

### G5 — MÉDIO: ordenação por tenant não garante ordem por agregado

`claimBatch` ordena por `nextAttemptAt` (`prismaOutbox.repository.ts:181`), não por
`aggregateId`/`createdAt`. Semântica at-least-once + retries podem entregar eventos do
mesmo agregado fora de ordem (ex.: `DEAL_WON` antes de `DEAL_RISK_SPIKED` se o primeiro
foi reagendado). Não há sequenciador nem versionamento por agregado. Requer decisão de
design (hoje nenhum consumidor depende de ordem estrita, mas o contrato não documenta
isso). Registrado para decisão do 00/18.

### G6 — MÉDIO: nomes de consumidor default são frágeis

`subscribe()` sem `consumer` gera `${eventType}#${index}` (`domainEventMesh.service.ts:184`).
O índice depende da ordem de registro no processo; hoje é determinístico (defaults do
construtor → bridge no `setupDI`/`worker.ts`), mas qualquer novo subscriber muda os
sufixos e quebra a deduplicação durável (consumidor "novo" reexecuta eventos já
concluídos). O bridge (13 handlers) não passa nomes explícitos. **→ handoff 16→06**
(recomendar nomes estáveis tipo `bitrix-bridge:<handler>`).

### G7 — BAIXO: lease do consumidor (60s) < cenário de handler longo

`CONSUMER_LEASE_MS = 60_000` (`domainEventMesh.service.ts:43`) vs lease do relay
(30s default). Se um handler exceder 60s, outra instância pode reservar e executar em
paralelo → efeito duplicado possível (janela residual já documentada em
`outbox.ports.ts:131-135` como at-least-once). Aceitável enquanto handlers forem
curtos/idempotentes; registrar se surgir handler longo.

### G8 — BAIXO: comentário impreciso sobre unicidade de `eventId`

`prismaOutbox.repository.ts:118` comenta "eventId é único por organização", mas o schema
tem `eventId String @unique` **global** (`schema.prisma:5971`). Inócuo na prática
(`evt-${randomUUID()}` nunca colide), mas a documentação do adaptador está errada.

### G9 — BAIXO: código morto/legado no diretório da fila

`outboxDispatcher.service.ts`, `outboxRelay.worker.ts` (implementação paralela antiga,
stub `dispatch()` que só loga) e `idempotencyManager.ts` (Set em memória, "durável" só
no nome, zero callers) não são usados por nada. Mantidos por ora — remoção é decisão do
00 (podem ser referenciados por documentação externa).

### G10 — INFO: `publishInTransaction`/UoW registrada mas sem uso

`DomainEventOutboxUnitOfWork` registrada no DI (`setup.ts:325`) e
`PrismaOutboxUnitOfWork` implementada, porém nenhum caso de uso escreve negócio+evento na
mesma transação — todos os produtores usam `publish()` (outbox não-transacional +
deliver inline). Ou seja, na prática a garantia "mesma transação" do outbox ainda não é
exercida; o caminho real é publish-then-deliver com dedup na consumption store.

## Correções aplicadas nesta onda (domínio do 16)

| Arquivo | Correção |
|---|---|
| `worker.ts` | `bitrixEventMeshBridge.register()` + `startDomainEventOutboxRelay()` no boot do processo dedicado |
| `src/bootstrap/workers.ts` | relay iniciado em `startEmbeddedWorkers` (handle `domainEventOutboxRelay`, coberto pelo shutdown via `close()`) |
| `src/lib/queue/outbox/outboxRelay.service.ts` | `close()` alias de `stop()` para graceful shutdown |
| `src/lib/queue/domainEventMesh.service.ts` | `deliver()` injeta `tenantId` do evento no `requestContext` por handler |
| `src/lib/queue/enrichment.queue.ts` | `jobId` determinístico `enrich-company:{org}:{company}:{auto|force}` (dedup de enqueue) |
| `src/lib/queue/whatsappSignal.worker.ts` | `jobId` passa a incluir `organizationId` |
| `src/lib/queue/newsMonitor.worker.ts` | `jobId` `news-scan:{org}:{company}` + `getJob` antes do add (não consome cota do scan) |
| `tests/unit/bootstrap/shutdown.test.ts` | campo `domainEventOutboxRelay` no handle de teste |

## Verificação

- `npx tsc --noEmit` → exit 0.
- `npm run lint` (biome lint src) → exit 0 (warnings pré-existentes fora do escopo).
- `vitest run tests/unit/bootstrap/shutdown.test.ts src/lib/queue/__tests__ tests/unit/queue` → 43/44 passam; a única falha (`outbox.remed05-boot.test.ts` timeout de import do setupDI) **reproduz no baseline sem minhas alterações** (verificado via `git stash`).

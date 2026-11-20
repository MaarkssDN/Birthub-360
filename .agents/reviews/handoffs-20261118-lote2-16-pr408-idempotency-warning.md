# Parecer Agente 24 — PR #408 (Agente 16 — warning throttled em domainEventMesh)

- Missão: onda saneamento-handoffs-20261118, lote 2
- Autor: Agente 16 | Auditor: Agente 24
- Branch: `agente/16-handoffs-20261117` | Estado: **OPEN**
- Conteúdo: `warnedMissingIdempotencyKey: Set<string>` em `domainEventMesh.service.ts` + testes

## Verificações

- **Implementação**: `Set<string>` por `eventType` — loga **um warning por tipo de evento** quando `opts.idempotencyKey` ausente, em `publish` e `publishInTransaction`.
- **Campos do log**: eventType, producer, organizationId, aggregateId — **sem PII**.
- **Throttling correto**: `Set` evita spam — primeira ocorrência por tipo loga, subsequentes silenciam.
- **Contrato**: não altera comportamento de entrega — apenas observabilidade.
- **Testes**: `npx vitest run tests/unit/queue/domainEventMesh.service.test.ts` → **1 arquivo / 6 testes passaram**: dedup com mesma key, um warning por tipo, sem warning quando key presente.
- **Slot**: `src/lib/queue/**` é compartilhado 16↔06/07 — PR não colide com #406 (domínios diferentes dentro do mesh: publish-side vs bridge consumer-side).

## Achados

- **Decisão arquitetural pendente**: handoff permanece aberto — producers ainda não passam `idempotencyKey`; tornar obrigatório é decisão de contrato do Agente 00/donos de domínio. O warning é o instrumento correto para medir adoção antes de endurecer o contrato.
- Nenhum bloqueador funcional.

## Veredito

**APROVADO** — warning throttled correto, sem PII, testes cobrem os 3 cenários, contrato de fila preservado. Escopo aprovado: observabilidade apenas; **não** aprova tornar `idempotencyKey` obrigatório (decisão separada do 00).

# Handoff 22 → 01 — Persistência do store de idempotência (POS4-22-IDEM)

Data: 2026-11-24 · Agente: 22 — Hugo (Squad 20) → Agente 01 (schema) · cc: Agente 17 (Remo, Redis)

## Contexto

O middleware `src/shared/middlewares/idempotencyKey.ts` implementa dedup de mutações
HTTP por `X-Idempotency-Key` para o outbox mobile (Agente 85). Primeira iteração usa
**Map em memória** por processo (TTL 24h, teto 10k entradas). Documentado no header
do arquivo.

## Pedido

Avaliar modelagem de tabela persistente para substituir/complementar o store em
memória, com requisitos:

- `UNIQUE (organizationId, idempotencyKey)` — namespacing multi-tenant obrigatório
  (mesma key em orgs diferentes é permitida e independente).
- Campos: `organizationId`, `idempotencyKey`, `payloadHash` (SHA-256 hex),
  `method`, `path` (originalUrl), `statusCode`, `responseBody` (JSONB),
  `createdAt`, `expiresAt`.
- Índice/TTL: expurgo por `expiresAt` (job de limpeza — Olavo/Agente 15 pode ser
  o executor).
- Migration via pipeline normal do Agente 12 (Vera) — zero downtime.
- RLS: se o projeto usa RLS por tenant (Agente 13/Nilo), avaliar se a tabela entra
  no modelo de policies ou é acesso service-level only.

## Alternativa preferida (registrar decisão)

O store ideal provavelmente é **Redis** (Agente 17 — Remo): `SET NX EX` com TTL
nativo, compartilhado entre réplicas, sem tabela nova. Se Redis já é dependência
de infra do projeto (`src/lib/` — verificar cache/locks existentes), a tabela
Prisma pode ser desnecessária. Decisão de infra → Agente 17 + 90 (Hélio).

## Critérios de aceite do handoff

- [ ] Decisão registrada: tabela Prisma vs Redis vs híbrido.
- [ ] Se tabela: schema + migration + handoff de volta ao 22 para trocar o store.
- [ ] Se Redis: contrato de chaves/TTL definido e handoff ao 22.
- [ ] Sem regressão: middleware deve aceitar store injetável para testes.

## Por que não fiz sozinho

Schema/migrations são propriedade do Agente 01/11/12; Redis é do Agente 17.
O middleware em memória está funcional e coberto por testes; a persistência é
evolução, não bloqueador da missão POS4-22-IDEM.

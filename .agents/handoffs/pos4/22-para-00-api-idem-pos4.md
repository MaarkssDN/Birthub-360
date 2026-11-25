# Handoff 22 → 00 (Astra) — POS4-22-IDEM concluída, aguarda gate de integração

Data: 2026-11-24 · Agente: 22 — Hugo · Branch: `agente/22-api-idem-pos4` (worktree `wt-22-api-idem`)

## Entrega

Deduplicação/idempotência no backend para o outbox mobile do Agente 85, via header
`X-Idempotency-Key`, namespaced por `organizationId`.

### Arquivos

- `src/shared/middlewares/idempotencyKey.ts` (novo) — middleware + store em memória
  (TTL 24h, teto 10k, sweep 1h). Contrato: mesma key+payload → replay 2xx com
  `X-Idempotent-Replay: true`; key+payload divergente → 409 `IDEMPOTENCY_KEY_CONFLICT`;
  sem key → passthrough; só 2xx consome a key; key >255 chars → 400.
- `src/shared/middlewares/__tests__/idempotencyKey.unit.test.ts` (novo) — 7 testes.
- `src/bootstrap/routes.ts` (modificado) — middleware aplicado em:
  - `/api/leads` (cobre POST create, PUT update, batch etc.);
  - `/api/leads/:leadId/notes` (CREATE_NOTE — **adicionei nesta continuação**: o diff
    herdado não cobria esse mount separado);
  - `/api/mobile` (cobre POST `/field-meetings/sync`).

### Verificações executadas

- `npx vitest run -c vitest.unit.config.ts src/shared/middlewares/__tests__/idempotencyKey.unit.test.ts`
  → **7/7 passaram**.
- `npx tsc --noEmit` → **limpo** (exit 0).

### Auditoria do mecanismo existente

Greps por `idempot|dedup` em `src/` mostraram mecanismos de idempotência em domínios
específicos (automations, cadence, intelligence outbox keys, bitrix webhook) — nenhum
genérico HTTP por header. Este middleware é o primeiro contrato transversal; não há
duplicação com os existentes (eles operam em filas/domínios, não em camada HTTP).

### Pendências / handoffs abertos

- `22-para-85-api-idem-contrato.md` — contrato para o Agente 85 propagar a key no
  outbox (adapter `ApiClientAdapter` hoje não envia headers customizados).
- `22-para-01-api-idem-schema.md` — persistência do store (tabela vs Redis); store
  em memória é limitação documentada (não sobrevive restart, não deduplica entre
  réplicas).

### Observações para o gate

- `server.ts` NÃO foi tocado — middleware aplicado via `routes.ts` (mountFeatureRoutes),
  dentro da propriedade do Agente 22. Sem necessidade de aprovação extra do 00.
- Mudanças em `routes.ts` são aditivas (novo middleware posicionado após
  `authenticateToken`/`requireTenant`, antes dos routers) — sem alteração de
  comportamento para requests sem o header.
- Rebase/merge: `routes.ts` teve apenas reordenação de imports + 2 hunks de mount —
  conflito potencial baixo, mas o arquivo é quente (muitos agentes montam rotas).

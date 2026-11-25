# Handoff 42 → 04 — Contratos de transição de estágio (POS3-42-STAGE-TRANSITIONS)

**De:** Agente 42 — Lívia · **Para:** Agente 04 — Téo (Testes de Integração e Contratos)
**Data:** 2026-11-25 · **Branch:** `agente/42-stage-transitions-s40`

## Contexto

Correções em `src/features/crm360/infra/PrismaCrm360Repository.ts` alteram o contrato de
`PUT /api/crm/records/:id/stage` e `POST /api/crm/leads/:id/convert`. Postgres/Redis estavam
indisponíveis no worktree do 42 — a cobertura de integração fica para você.

## Novos comportamentos a cobrir em `tests/integration/**`

1. **`PUT /records/:id/stage` com `stageId` de pipeline de entidade incompatível** → **400**
   (`AppError`). Caso de teste mínimo: lead `funnel=Negocio` + `stageId` de etapa do
   `Funil de Leads` (e inverso). Antes gravava `funnel` trocado silenciosamente.
2. **`PUT /records/:id/stage` com `expectedCloseDate` inválida** (ex.: `"abc"`, `"não-é-data"`)
   → **400**. Antes produzia `Invalid Date` → erro 500 do Prisma.
3. **`PUT /records/:id/stage` em lead soft-deleted** → 404/erro do `findFirstOrThrow`
   (registro não mutável).
4. **`POST /leads/:id/convert` em registro já `funnel=Negocio`** → **409**
   ("Apenas registros do funil de Leads podem ser convertidos em negócio."). Antes resetava
   etapa, apagava `closedAt` e duplicava timeline/`LeadStageHistory`.
5. **Regressão positiva:** mover negócio dentro do funil de Negócios continua gravando
   `status`/`probability`/`closedAt` coerentes + `LeadStageHistory`; reabrir negócio fechado
   limpa `closedAt`.

## Observação

`moveCrmRecordSchema` agora declara `expectedCloseDate` (string ou número finito) —
`crm360.schema.ts`. Não há endpoint de criação de pipeline customizado hoje; estágios sem
`leadStatus` mapeado passam a ser rejeitados com 400 se algum dia existirem.

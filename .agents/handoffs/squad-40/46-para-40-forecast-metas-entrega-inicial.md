# Handoff — Agente 46 (Sofia) → Agente 40 (Ravi) · Squad 40

- **Data:** 2026-11-23 · **Demanda:** DEM-20261123-001
- **Branch:** `agente/46-forecast-s40` (worktree `wt-46`)
- **Base:** `integracao/onda-4-dem20261123` — **desvio documentado**: a branch `coord/squad-40` e o arquivo `.agents/runs/squads/squad-40-plano.md` **não existem** no repositório (verificado em branches locais e remotas). Usei a integração mais recente que contém a Onda 3/4 do Squad 40. Ravi deve confirmar se este é o base correto ou rebasear quando `coord/squad-40` existir.

## Entregue

Fatia mínima de "Forecast e Metas Comerciais" dentro do ownership exclusivo `src/features/crm/forecast/**` (confirmado em `.agents/MATRIZ_PROPRIEDADE.md`):

- `src/features/crm/forecast/forecastGoal.ts` (novo):
  - `computeGoalAttainment({ goalCents, projectedTotalRevenueCents, elapsedFraction? })` → `GoalAttainment` com `attainmentRatio`, `gapToGoalCents`, `paceRatio` e status `NO_GOAL | EXCEEDED | ON_TRACK | AT_RISK | OFF_TRACK`.
  - `buildForecastGoalReport({ deals, stages, goalCents?, elapsedFraction? })` → compõe `calculateWeightedForecast` (já existente em `forecast.service.ts`) + attainment em um relatório único.
  - Janela/pesos/incerteza documentados no cabeçalho do arquivo: projeção = closedWon + pipeline ponderado por probabilidade efetiva de etapa (Bayes em `computeEffectiveStageProbability`); `elapsedFraction` mede ritmo (`paceRatio = attainment/elapsed`); thresholds 1.0 / 0.75.
- `src/features/crm/forecast/__tests__/forecastGoal.test.ts` (novo): 8 testes cobrindo NO_GOAL, EXCEEDED, thresholds de pace, proxy sem elapsedFraction, clamps e o relatório integrado.

## Inventário do estado real (forecast)

- `forecast.service.ts`: **funcional** (funções puras: probabilidade efetiva por etapa com suavização Bayesiana, forecast ponderado por estágio). Coberto apenas por 1 smoke test em `tests/unit/features/crm/onda3CrmSquad40.test.tsx`.
- **Não existia**: comparação com meta, service de composição, filtro por período, adapter Prisma, rotas. Squad-40 CRM usa ports in-memory (`DealRepositoryPort` em `src/features/crm/deals/` — ownership do Agente 42), então optei por módulo puro sem adapter.

## Pendências / handoffs sugeridos

1. **Adapter de dados (Ravi/40 ou 42)**: `buildForecastGoalReport` espera `ForecastDealInput[]` e `StageHistoricalConversion[]`. Quem fornecer esses dados (ex.: a partir de `Lead`/`CrmPipelineStage`/`LeadStageHistory` do Prisma ou dos ports in-memory) decide a fiação. Não criei adapter para não invadir `deals/**` (dono: 42) nem rotas (`presentation/`, `routes/` sem dono claro no squad).
2. **Fonte da meta**: `commercial-intelligence` já persiste `CommercialGoal` (API `/goals`, ownership fora do Squad 40). O módulo aceita `goalCents` injetado — não dupliquei storage. Se a meta deve vir do `CommercialGoal`, handoff para o dono de commercial-intelligence ler o valor e injetar.
3. **Backtest temporal**: o critério de aceite pede "erro em backtest temporal". Já existe `forecastAccuracy`/`forecastCalibration`/`forecastSnapshot` em `src/features/commercial-intelligence/` (fora do meu ownership). Recomendo reusar aquilo em vez de duplicar; se o Squad 40 quiser backtest próprio sobre `crm/forecast`, abrir demanda.
4. **Persistência de snapshot semanal**: existe worker `forecastSnapshotWeekly.worker.ts` em commercial-intelligence; alinhar com 40 se o forecast do CRM deve alimentar snapshots.

## Gates executados

- `npx vitest run -c vitest.unit.config.ts src/features/crm/forecast/__tests__/forecastGoal.test.ts` → **8/8 pass**
- `npx vitest run ... tests/unit/features/crm/onda3CrmSquad40.test.tsx` → **5/5 pass** (regressão squad)
- `npx tsc --noEmit` → **limpo** (exit 0)
- `npx biome check src/features/crm/forecast/` → **limpo** (após `--write` de formatação)

## SHA congelado para Silas

- Ver `.agents/runs/squads/squad-40-run-46.md` (SHA do commit desta entrega).

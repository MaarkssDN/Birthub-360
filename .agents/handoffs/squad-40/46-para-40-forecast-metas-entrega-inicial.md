# Handoff — Agente 46 (Sofia) → Agente 40 (Ravi) · Squad 40

- **Data:** 2026-11-24 · **Demanda:** DEM-20261123-001 (`SQUAD40-46-FORECAST`)
- **Branch:** `agente/46-forecast-s40-v2` (worktree `wt-46`)
- **Base:** `coord/squad-40` @ `4a70fe798` (plano do Ravi + lease do squad)
- **Substitui:** entrega anterior `d8cf21b37` na branch `agente/46-forecast-s40`, cortada por engano do clone stale `D:/Github/Birthub-360` sobre `integracao/onda-4-dem20261123`. A v2 traz **apenas os mesmos arquivos** (sem linhagem onda-4); `d8cf21b37` permanece intacta para histórico.

## Entregue

Fatia mínima de "Forecast e Metas Comerciais" dentro do ownership exclusivo `src/features/crm/forecast/**` (confirmado em `.agents/MATRIZ_PROPRIEDADE.md` e no plano do squad §4):

- `src/features/crm/forecast/forecastGoal.ts` (novo):
  - `computeGoalAttainment({ goalCents, projectedTotalRevenueCents, elapsedFraction? })` → `GoalAttainment` com `attainmentRatio`, `gapToGoalCents`, `paceRatio` e status `NO_GOAL | EXCEEDED | ON_TRACK | AT_RISK | OFF_TRACK`.
  - `buildForecastGoalReport({ deals, stages, goalCents?, elapsedFraction? })` → compõe `calculateWeightedForecast` (já existente em `forecast.service.ts`) + attainment em um relatório único.
  - Janela/pesos/incerteza documentados no cabeçalho: projeção = closedWon + pipeline ponderado por probabilidade efetiva de etapa (Bayes em `computeEffectiveStageProbability`); `elapsedFraction` mede ritmo (`paceRatio = attainment/elapsed`); thresholds 1.0 / 0.75.
- `src/features/crm/forecast/__tests__/forecastGoal.test.ts` (novo): 8 testes cobrindo NO_GOAL, EXCEEDED, thresholds de pace, proxy sem elapsedFraction, clamps e o relatório integrado.
- `.agents/runs/leases/squad-40-wt46.lease` (novo, nesta branch).

## Inventário do estado real (forecast) — baseline coord/squad-40

- `forecast.service.ts`: **funcional** (funções puras: probabilidade efetiva por etapa com suavização Bayesiana, forecast ponderado por estágio). Idêntico à base onda-4 (diff vazio). Coberto apenas por 1 smoke test em `tests/unit/features/crm/onda3CrmSquad40.test.tsx`.
- **Não existia**: comparação com meta, service de composição, filtro por período, adapter Prisma, rotas. Squad-40 CRM usa ports in-memory (`DealRepositoryPort` em `src/features/crm/deals/` — ownership do Agente 42), então optei por módulo puro sem adapter.

## Pendências / handoffs sugeridos

1. **Adapter de dados (Ravi/40 ou 42)**: `buildForecastGoalReport` espera `ForecastDealInput[]` e `StageHistoricalConversion[]`. Quem fornecer esses dados (ex.: a partir de `Lead`/`CrmPipelineStage`/`LeadStageHistory` do Prisma ou dos ports in-memory) decide a fiação. Não criei adapter para não invadir `deals/**` (dono: 42) nem `presentation/`/`routes/`.
2. **Regra de ganho/perda (handoff 42→04, item §3.7 do plano)**: o plano sugere o 46 como candidato natural por "conhecer regras de ganho/perda". Minha entrega usa `status: 'OPEN'|'WON'|'LOST'` do contrato existente — se a máquina de estados de pipeline definir transições ganhas/perdidas formais, posso estender `forecastGoal.ts` para consumir essa regra. Aguardando designação formal do Astra ou diretriz do Ravi.
3. **Fonte da meta**: `commercial-intelligence` já persiste `CommercialGoal` (API `/goals`, ownership fora do Squad 40). O módulo aceita `goalCents` injetado — não dupliquei storage.
4. **Backtest temporal**: já existe `forecastAccuracy`/`forecastCalibration`/`forecastSnapshot` em `src/features/commercial-intelligence/` (fora do ownership). Recomendo reuso em vez de duplicar; se o Squad 40 quiser backtest próprio sobre `crm/forecast`, abrir demanda.

## Gates executados (neste worktree, base coord/squad-40)

- `npx vitest run -c vitest.unit.config.ts src/features/crm/forecast/__tests__/forecastGoal.test.ts` → **8/8 pass**
- `npx vitest run -c vitest.unit.config.ts tests/unit/features/crm/onda3CrmSquad40.test.tsx` → **5/5 pass**
- `npx tsc --noEmit` → **limpo**
- `npx biome check src/features/crm/forecast/` → **limpo**

## SHA congelado para Silas

- HEAD de `agente/46-forecast-s40-v2` no momento do handoff (SHA exato na mensagem de conclusão e em `.agents/runs/leases/squad-40-wt46.lease`).

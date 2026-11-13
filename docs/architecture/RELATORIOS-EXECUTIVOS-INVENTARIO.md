# Inventário — Relatórios Executivos (P04) e Baseline de Forecast (P05)

**Onda:** F4 — Auditoria + correções pequenas
**Data:** auditoria executada na branch de trabalho da Onda F4
**Escopo:** MOD-04 "Performance Comercial" (17 relatórios executivos, Win/Loss Deep Autopsy, War Room SSE) e MOD-05 "Previsibilidade Comercial" (forecast calibrado MAPE, health score) do `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.1.html`.
**Natureza:** auditoria somente-leitura + 1 correção pequena (mock → estado vazio honesto). Nenhum relatório novo implementado.

---

## 1. Achado estrutural principal

O Documento Mestre prevê o endpoint `GET /api/reports/commercial-intelligence/:reportType`
("17 tipos, cache < 800ms" — linha ~970 do HTML). **Esse endpoint não existe.** A implementação
real expõe cada relatório como um GET dedicado sob `/api/commercial-intelligence/*`
(`src/bootstrap/routes.ts:152-158` + `src/features/commercial-intelligence/routes/commercialIntelligence.routes.ts`).
Funcionalmente equivalente em cobertura; divergente em contrato de API documentado.

Os "17 relatórios" do doc correspondem exatamente aos **17 builders** em
`src/features/commercial-intelligence/application/queries/` (16 arquivos + `bitrixSyncHealthReport.ts`,
este último composto dentro de `crmQualityReport.ts` — não tem endpoint próprio).

## 2. Checklist — os 17 relatórios executivos

| # | Relatório (builder) | Endpoint real | Tela/componente | Status | Evidência |
|---|---|---|---|---|---|
| 1 | `executiveOverviewReport.ts` | `GET /api/commercial-intelligence/overview` | `ExecutiveOverviewTab.tsx` (aba "Visão Executiva") | **Existe** | `queries/executiveOverviewReport.ts`; `commercialIntelligence.routes.ts:42` |
| 2 | `pipelineCreationReport.ts` | `GET …/pipeline-creation` | `ExecutiveOverviewTab.tsx` (chama junto ao overview) | **Existe** | `routes:43`; `ExecutiveOverviewTab.tsx:166` |
| 3 | `performanceReport.ts` | `GET …/performance` | `PerformanceTab.tsx` | **Existe** | `routes:44`; `PerformanceTab.tsx:109` |
| 4 | `agingReport.ts` | `GET …/aging` | `AgingTab.tsx` ("Tempo de Permanência") | **Existe** | `routes:45`; `AgingTab.tsx` |
| 5 | `lossesReport.ts` | `GET …/losses` | `LossesTab.tsx` ("Perdas") | **Existe** | `routes:46`; `LossesTab.tsx` |
| 6 | `leadingIndicatorsReport.ts` | `GET …/leading-indicators` | `LeadingIndicatorsTab.tsx` | **Existe** | `routes:47-49`; `LeadingIndicatorsTab.tsx` |
| 7 | `alertsReport.ts` | `GET …/alerts` | `AlertsPanel.tsx` / `ExecutiveOverviewTab.tsx:163` | **Existe** | `routes:50` |
| 8 | `crmQualityReport.ts` | `GET …/crm-quality` | `CrmQualityTab.tsx` ("Qualidade do CRM") | **Existe** | `routes:51`; compõe `bitrixSyncHealthReport` |
| 9 | `bitrixSyncHealthReport.ts` | `GET …/bitrix-sync-health` (endpoint dedicado adicionado na execução deste handoff) + composto em `/crm-quality` | dentro de `CrmQualityTab` | **Existe** | `computeBitrixSyncHealth` via `CommercialIntelligenceUseCases.bitrixSyncHealth`; `commercialIntelligence.routes.ts` (`/bitrix-sync-health`) |
| 10 | `drillDownReport.ts` | `GET …/deals` + `GET …/deals/:leadId/forecast` | `DealDrillDownDrawer.tsx`, `PipelineForecastTab.tsx` | **Existe** | `routes:52-55` |
| 11 | `historicalTrendsReport.ts` | `GET …/trends` | `TrendChartCard.tsx`, `PerformanceTab.tsx:110` | **Existe** | `routes:61` |
| 12 | `forecastAccuracyReport.ts` | `GET …/forecast-accuracy` | `ForecastAccuracyCard.tsx` | **Existe** | `routes:65`; depende do worker semanal de snapshot |
| 13 | `closeDateIntelligenceReport.ts` | `GET …/close-date-intelligence` | `CloseDateIntelligenceCard.tsx` | **Existe** | `routes:81-83` |
| 14 | `journeyReport.ts` | `GET …/journey` | `JourneyTab.tsx` ("Jornada") | **Existe** | `routes:84` |
| 15 | `bottleneckReport.ts` | `GET …/funnel-bottlenecks` | `FunnelBottleneckCard.tsx`, aba diagnóstico | **Existe** | `routes:71-73` |
| 16 | `sellerBenchmarkReport.ts` | `GET …/seller-benchmark` | `SellerBenchmarkCard.tsx` | **Existe** | `routes:74` |
| 17 | `channelAttributionReport.ts` | `GET …/channel-attribution` | `ChannelAttributionCard.tsx` | **Existe** | `routes:78-80`; versão reduzida (single-touch), multi-touch é handoff bloqueado |

**Resumo:** 17/17 existem — 16 com endpoint próprio desde a auditoria + `bitrixSyncHealth` promovido a endpoint dedicado (`GET /api/commercial-intelligence/bitrix-sync-health`) na execução do handoff F4 (antes: parcial, só sub-métrica de `/crm-quality`).

### Relatórios/endpoints além dos 17 (P05 e suporte)

| Endpoint | Builder | Observação |
|---|---|---|
| `GET …/health-score` | `application/healthScore.ts` | Score composto de 6 pilares + `computeDealHealthScore` por deal |
| `GET …/forecast-calibration` | `application/forecastCalibration.ts` | Fator de correção do forecast (clamp 0.6–1.4, mín. 3 amostras) |
| `GET …/hiring-scenario` | `application/hiringScenarioSimulator.ts` | Simulador What-If de contratações |
| `GET …/export` | `application/executiveExport.ts` | Export CSV/JSON/HTML do relatório executivo |
| `GET …/metrics-dictionary` | `application/metricsDictionary.ts` | Dicionário de fórmulas (rastreabilidade) |
| `GET …/filter-options`, `GET …/goals`, `PUT …/goals` | `goalCommands.ts` | Metas comerciais por organização |
| `GET …/predictive/cockpit`, `GET …/predictive/backtest`, `POST …/predictive/rebalance/approvals` | `services/predictiveRevenueOracle.service.ts` etc. | Revenue Oracle real (histórico), backtest, aprovações persistidas |

### Rotas de tela (frontend, `src/App.tsx`)

| Rota | Componente | Fonte de dados |
|---|---|---|
| `/app/dashboard` | `AdaptiveDashboard` → `SinglePageDashboard` | `useAnalyticsDashboard` → `GET /api/analytics/dashboard`; widgets: `RealtimeCockpitWidget` → `/api/analytics/realtime-cockpit`; `ProductivityHeatmapWidget` → `/api/analytics/productivity-heatmap`; `UnifiedTimelineWidget` → `/api/analytics/unified-timeline`; `RealtimeFeed` → SSE `GET /api/events` |
| `/app/analytics` | `Analytics.tsx` (+ `CohortAnalysis`, `DashboardExtensions`, `GlowChart`) | `analyticsApi.dashboard` → `GET /api/analytics/dashboard`; cohort → `/api/analytics/cohort`, `/api/analytics/export/csv` |
| `/app/reports` | `ReportsHub.tsx` (feature `intelligence`) | `GET /api/intelligence/report/latest`, `/report/daily-summaries`, SSE `/report/stream`, `analyticsApi` |
| `/app/winloss` | `WinLossAnalysis.tsx` | `GET /api/intelligence/win-loss-analysis/latest`, `POST /api/intelligence/win-loss-analysis`, `analyticsApi.dashboard` |
| `/app/war-room` | `WarRoomArenaView.tsx` (feature `gamification`) | `warRoomArena.service.ts` — **arena de duelos de objeção em memória, NÃO o War Room executivo SSE do doc** |
| `/app/commercial_intelligence` | `CommercialIntelligenceHub.tsx` (8 abas) | `/api/commercial-intelligence/*` (tabela acima) |
| `/app/forecast` | `ForecastHub.tsx` (predictability) | compõe `/api/commercial-intelligence/{overview,performance,deals,seller-benchmark}` via `predictability.api.ts` |
| `/app/metas` | `MetasHub.tsx` | idem |
| `/app/pipeline_ponderado` | `PipelinePonderadoHub.tsx` | idem |
| `/app/daily-plan` | `DailyPlanHub.tsx` | `/api/bitrix/daily-plan*` |
| `/app/sdr-diagnostic` | `JoaoReisDiagnosticHub.tsx` | diagnóstico comercial |

## 3. Gaps vs Documento Mestre (MOD-04)

- **Endpoint `/api/reports/commercial-intelligence/:reportType` + cache <800ms (AC-PERF-001):** ausente. Não há evidência de benchmark dos 17 relatórios <800ms; os GETs são computados sob demanda (sem cache dedicado encontrado). Status: **parcial/ausente** — cobertura funcional existe, SLA e contrato não.
- **Win/Loss Deep Autopsy:** `/app/winloss` entrega análise de IA em prosa (`winLossAnalysis.worker.ts`, `winLossAutopsy.service.ts`, endpoints `/api/intelligence/win-loss-analysis*`) + contexto numérico real. **Não** há autópsia estatística "por segmento/concorrente" como o doc descreve (agrupamento semântico/estatístico). `application/lossTaxonomy.ts` e `POST /ai/loss-reason-analysis` existem como fundação. Status: **parcial**.
- **War Room Situacional SSE:** **ausente** como previsto. `/app/war-room` renderiza `WarRoomArenaView` (gamificação de duelos, salas em memória — `warRoomArena.service.ts`). A infra SSE existe (`GET /api/events` → `crmEventBus`; `GET /api/notifications/stream` → `sseService`), mas nenhum board executivo a consome para telemetria de vendas. Status: **ausente** (a rota existe, mas com semântica diferente do doc).
- **Ranking & Coaching Gamificado:** existe em `/app/gamification` (`GamificationView`, rotas `/api/gamification`) — fora do escopo P04/P05 mas presente no módulo.

## 4. Motor de forecast (P05) — o que existe e o que mede

**Tiers Commit/BestCase/Pipeline/Upside: existem.**
`src/features/commercial-intelligence/application/forecastEngine.ts` — motor determinístico
versionado (`FORECAST_RULES_VERSION = 'v2'`): probabilidade = probabilidade da etapa
(`CrmPipelineStage.probability`) + ajustes explicáveis (próxima ação, recência de interação,
close date, estagnação vs. média histórica de `LeadStageHistory`, penalidade por adiamentos de
`expectedCloseAt` via `LeadFieldChange`). Limiares: Commit ≥70, BestCase ≥40, Pipeline ≥10,
senão Upside. Nota: o doc usa "Omit"; a implementação usa "Upside" — divergência de nomenclatura.

**Calibração/MAPE: existe e é honesto.**
- `jobs/forecastSnapshotWeekly.worker.ts` grava snapshots semanais (`ForecastSnapshotStore`, Prisma).
- `queries/forecastAccuracyReport.ts` + `application/forecastAccuracy.ts` calculam
  `meanAbsoluteErrorPercent` por período fechado (snapshot mais antigo do mês vs. realizado);
  sem histórico → `available:false, reason:'sem_historico_suficiente'` — nunca erro fabricado.
- `application/forecastCalibration.ts` aplica fator de correção (média realizado/previsto,
  clamp [0.6, 1.4], mínimo 3 amostras) ao forecast atual.
- `services/mapeCalculator.service.ts` (MAPE clássico) e `services/predictiveRevenueOracle.service.ts`
  (percentis P10/P50/P90 empíricos, `ORACLE_CALIBRATED_MAX_MAPE = 15`) completam o baseline.

**Health score / deal risk: existe.**
- `application/healthScore.ts`: `computeHealthScore` (6 pilares — pipeline/coverage, conversão,
  produtividade, qualidade CRM, follow-up/aging, confiabilidade de forecast) + `computeDealHealthScore`
  por negócio (estagnação, próxima ação vencida, silêncio >14d, ajuste por `LiveCallInsight`).
- `application/dealRiskDetection.service.ts` + `POST /api/commercial-intelligence/ai/deal-risk-scan`
  (silêncio, tom negativo, concorrente mencionado — disparo manual, agendamento é follow-up).
- `application/pipelineEligibility.ts` exclui negócios inelegíveis do Commit (regra dos 21 dias
  de interação do doc).

**O que falta para "MAPE < 8%":**
1. O alvo MAPE<8% é **meta de produto, não garantia medida** — a infraestrutura mede o erro
   (`forecast-accuracy`) mas o patamar atingido depende de volume de snapshots reais; o oracle
   declara "calibrado" só com MAPE ≤15% (`ORACLE_CALIBRATED_MAX_MAPE`), acima do alvo do doc.
2. `forecastSnapshotWeekly.worker.ts` precisa rodar em produção (worker.ts / ENABLE_EMBEDDED_WORKERS);
   sem ele, `/forecast-accuracy` responde "sem histórico" (comportamento correto, documentado).
3. Sem evidência de benchmark de performance (<800ms) nem de acurácia MAPE<8% atingida em dados reais.

## 5. Correções aplicadas nesta onda

| Arquivo | Problema | Correção |
|---|---|---|
| `src/features/predictability/components/ForecastHub.tsx` | Aba "Cockpit Preditivo (P10/P50/P90)" renderizava `PredictiveRevenueCockpit` 100% mockado (`INITIAL_PROJECTIONS` com R$145k/485k/980k fixos, `INITIAL_RECOMMENDATIONS` com contas/vendedores fictícios, simulador What-If com coeficientes inventados e `organizationId:'org-default'`) apresentados como dados reais | Removido o import e a renderização do componente mock; a aba agora exibe `PredictabilityEmptyState` honesto ("Cockpit preditivo indisponível… use Forecast Operacional"). Backend real existe em `GET /api/commercial-intelligence/predictive/cockpit` — ligação UI↔API fica para onda futura. |

**Não corrigido (fora do escopo de "correção pequena" / precisa de decisão):**
- `src/features/predictability/components/PredictiveRevenueCockpit.tsx` permanece no repo como
  componente mock — ainda importado por 3 arquivos de teste
  (`tests/unit/components/cockpitsAndPanels.unit.test.tsx`, `tests/unit/ui/CockpitScreens.unit.test.tsx`).
  Recomendação: remover/arquivar em onda futura junto com os testes, ou religar ao endpoint real.
- `src/features/commercial-intelligence/components/PredictiveRevenueCockpit.tsx` é componente
  presentacional puro (props-driven, sem dados mock) e está **sem uso** em produção — candidato a remoção.

## 6. Gates

- `npx tsc --noEmit` — **PASS** (exit 0, sem erros) após a edição em `ForecastHub.tsx`.
- Escopo de propriedade: edição restrita a `src/features/predictability/components/ForecastHub.tsx`
  (feature predictability — consumidora de commercial-intelligence, dono efetivo Agente 04/CRM-BI
  conforme `src/features/commercial-intelligence/AGENTS.md`; predictability não tem AGENTS.md próprio).
  Nenhum arquivo de `prisma/`, `server.ts`, `package.json`, workflows ou prompts foi tocado.

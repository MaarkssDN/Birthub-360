/**
 * Fachada pública do módulo "Comercial Inteligente" (Revenue Command Center executivo).
 *
 * Esta classe NÃO contém mais lógica de negócio própria — ela só implementa a API pública estável
 * consumida por `CommercialIntelligenceController` e `CommercialIntelligenceAiService`, delegando
 * cada método a um módulo coeso de `application/`:
 *
 * - `scoring/dealScoring.ts` — carrega negócios + histórico e aplica o Forecast Ponderado
 *   Explicável a cada um (`ScoredDeal`), a base comum de todo relatório.
 * - `scoring/scopeFilter.ts` — aplica o filtro (owner/produto/origem/ICP/empresa).
 * - `scoring/stageHistoryAnalytics.ts` — transições de etapa e alcance histórico do funil.
 * - `dataReadiness.ts` — completude ponderada por impacto no forecast ("Confiabilidade dos Dados").
 * - `coverageProtection.ts` — classificação da "Proteção 90 dias".
 * - `goalCommands.ts` — leitura/escrita de `CommercialGoal` (único ponto de escrita do módulo).
 * - `queries/*.ts` — um arquivo por relatório (Overview, Pipeline Creation, Performance, Aging,
 *   Losses, Leading Indicators, Alerts, CRM Quality, Bitrix Sync Health, Drill-down, Historical
 *   Trends), cada um testável isoladamente com um repositório fake, sem depender desta fachada.
 *
 * Manter esta classe como fachada (em vez de apagá-la e expor as funções soltas) preserva 100% da
 * API pública já consumida fora deste módulo — nenhuma migração de import foi necessária nos
 * consumidores existentes.
 */
import type {
  AgingReport,
  ChannelAttributionReport,
  CommercialGoalDTO,
  CommercialIntelligenceFilter,
  CommercialIntelligenceRepository,
  CrmQualityIndex,
  DealDrillDownQuery,
  DealDrillDownResult,
  ExecutiveAlert,
  ExecutiveOverview,
  ExportFormat,
  FilterOptions,
  ForecastAccuracySummary,
  ForecastCalibrationResult,
  ForecastExplain,
  ForecastSnapshotStore,
  FunnelBottleneckReport,
  GoalMetric,
  HealthScoreResult,
  HiringScenarioResult,
  HistoricalTrendsReport,
  LeadingIndicatorsReport,
  LossAnalysis,
  PerformanceMetrics,
  PipelineCreation,
  SellerBenchmarkReport,
} from '../domain/CommercialIntelligence.js';
import type { CloseDateIntelligenceReport, JourneyReport } from '../domain/JourneyIntelligence.js';
import { computeForecastCalibration } from './forecastCalibration.js';
import { buildExecutiveExport, type ExecutiveExportPayload } from './executiveExport.js';
import { simulateHiringScenario } from './hiringScenarioSimulator.js';
import { getGoal as getGoalCommand, setGoal as setGoalCommand } from './goalCommands.js';
import { computeHealthScore } from './healthScore.js';
import { buildAging } from './queries/agingReport.js';
import { buildAlerts } from './queries/alertsReport.js';
import { buildFunnelBottlenecks } from './queries/bottleneckReport.js';
import { buildChannelAttribution } from './queries/channelAttributionReport.js';
import { buildCloseDateIntelligence } from './queries/closeDateIntelligenceReport.js';
import { buildCrmQuality } from './queries/crmQualityReport.js';
import { buildDealsDrillDown, buildForecastExplain } from './queries/drillDownReport.js';
import { buildExecutiveOverview } from './queries/executiveOverviewReport.js';
import { buildForecastAccuracy } from './queries/forecastAccuracyReport.js';
import { buildHistoricalTrends } from './queries/historicalTrendsReport.js';
import { buildJourney } from './queries/journeyReport.js';
import { buildLeadingIndicators } from './queries/leadingIndicatorsReport.js';
import { buildLosses } from './queries/lossesReport.js';
import { buildPerformance } from './queries/performanceReport.js';
import { buildPipelineCreation } from './queries/pipelineCreationReport.js';
import { buildSellerBenchmark } from './queries/sellerBenchmarkReport.js';
import { buildReportCacheKey, getCachedReport, setCachedReport } from './reportCache.js';

export {
  COVERAGE_PROTECTION_FALLBACK_HEALTHY,
  COVERAGE_PROTECTION_FALLBACK_WARNING,
  classifyCoverageProtection,
} from './coverageProtection.js';
// ─── Re-exports de compatibilidade — consumidos fora deste arquivo (ver cabeçalho) ───────────────
export { currentPeriod } from './shared/period.js';

export class CommercialIntelligenceUseCases {
  /**
   * `snapshotStore` é opcional só para preservar os consumidores existentes (testes, serviços
   * que nunca precisam de erro histórico). Em produção (`shared/di/setup.ts`) é sempre o
   * `PrismaForecastSnapshotStore` real — sem ele, `forecastAccuracy()`/o pilar "Confiabilidade
   * de Forecast" respondem "sem histórico suficiente" de forma honesta, nunca um número.
   */
  constructor(
    private repository: CommercialIntelligenceRepository,
    private snapshotStore: ForecastSnapshotStore | null = null,
  ) {}

  /**
   * Cache L2 (Redis, TTL 60s) dos relatórios quentes — Agente 23. A chave carrega
   * `organizationId` + filtro + `extra` (ver `reportCache.ts` para o porquê de cada decisão).
   *
   * `now` explícito NUNCA usa cache: é o caminho determinístico de testes/backtests e do job
   * semanal de snapshot (`forecastSnapshotWeekly.worker.ts`), que precisa do cálculo fresco —
   * cachear ali poderia gravar/ler resultado defasado sob um relógio fixo. Chamadas de
   * produção (controller/AI service/commercialCell) omitem `now` e usam `new Date()` aqui.
   *
   * Os sub-relatórios chamados DENTRO do loader também são invocados sem `now` de propósito:
   * assim `healthScore`/`executiveExport`/`hiringScenario`/`forecastCalibration` reutilizam as
   * entradas L2 dos relatórios-base em vez de recalcular `loadScoredDeals` por composição.
   */
  private async cachedReport<T>(
    report: string,
    organizationId: string,
    filter: CommercialIntelligenceFilter | undefined,
    now: Date | undefined,
    extra: string | undefined,
    load: (effectiveNow: Date) => Promise<T>,
  ): Promise<T> {
    const effectiveNow = now ?? new Date();
    if (now !== undefined) return load(effectiveNow);
    const key = buildReportCacheKey(report, organizationId, filter, extra);
    const hit = await getCachedReport<T>(key);
    if (hit !== null) return hit;
    const result = await load(effectiveNow);
    await setCachedReport(key, result);
    return result;
  }

  // ─── Metas ──────────────────────────────────────────────────────────────
  async getGoal(
    organizationId: string,
    period: string,
    metric: GoalMetric = 'NEW_MRR',
  ): Promise<CommercialGoalDTO | null> {
    return getGoalCommand(this.repository, organizationId, period, metric);
  }

  async setGoal(
    organizationId: string,
    period: string,
    amount: number,
    createdBy: string,
    currency = 'BRL',
    metric: GoalMetric = 'NEW_MRR',
  ): Promise<CommercialGoalDTO> {
    return setGoalCommand(
      this.repository,
      organizationId,
      period,
      amount,
      createdBy,
      currency,
      metric,
    );
  }

  // ─── Cockpit executivo (Fase 2 + 3) ─────────────────────────────────────
  async executiveOverview(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<ExecutiveOverview> {
    return this.cachedReport('overview', organizationId, filter, now, undefined, (n) =>
      buildExecutiveOverview(this.repository, organizationId, filter, n),
    );
  }

  // ─── Pipeline criado (Fase 3) ────────────────────────────────────────────
  async pipelineCreation(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<PipelineCreation> {
    return this.cachedReport('pipeline-creation', organizationId, filter, now, undefined, (n) =>
      buildPipelineCreation(this.repository, organizationId, filter, n),
    );
  }

  // ─── Eficiência (Fase 4) ─────────────────────────────────────────────────
  async performance(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<PerformanceMetrics> {
    return this.cachedReport('performance', organizationId, filter, now, undefined, (n) =>
      buildPerformance(this.repository, organizationId, filter, n),
    );
  }

  // ─── Aging (Fase 5) ──────────────────────────────────────────────────────
  async aging(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<AgingReport> {
    return this.cachedReport('aging', organizationId, filter, now, undefined, (n) =>
      buildAging(this.repository, organizationId, filter, n),
    );
  }

  // ─── Motivos de perda (Fase 7) ───────────────────────────────────────────
  async losses(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<LossAnalysis> {
    return this.cachedReport('losses', organizationId, filter, now, undefined, (n) =>
      buildLosses(this.repository, organizationId, filter, n),
    );
  }

  // ─── Leading Indicators (Fase 5/6) ───────────────────────────────────────
  async leadingIndicators(
    organizationId: string,
    now?: Date,
  ): Promise<LeadingIndicatorsReport> {
    return this.cachedReport('leading-indicators', organizationId, undefined, now, undefined, (n) =>
      buildLeadingIndicators(this.repository, organizationId, n),
    );
  }

  // ─── Alertas executivos (Fase 6) ─────────────────────────────────────────
  async alerts(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<ExecutiveAlert[]> {
    return this.cachedReport('alerts', organizationId, filter, now, undefined, (n) =>
      buildAlerts(this.repository, organizationId, filter, n),
    );
  }

  // ─── Qualidade do CRM (Fase 7) ───────────────────────────────────────────
  async crmQuality(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<CrmQualityIndex> {
    return this.cachedReport('crm-quality', organizationId, filter, now, undefined, (n) =>
      buildCrmQuality(this.repository, organizationId, filter, n),
    );
  }

  // ─── Drill-down (seção 29) ────────────────────────────────────────────────
  async dealsDrillDown(
    organizationId: string,
    query: DealDrillDownQuery,
    now = new Date(),
  ): Promise<DealDrillDownResult> {
    return buildDealsDrillDown(this.repository, organizationId, query, now);
  }

  async forecastExplain(
    organizationId: string,
    leadId: string,
    now = new Date(),
  ): Promise<ForecastExplain | null> {
    return buildForecastExplain(this.repository, organizationId, leadId, now);
  }

  // ─── Exportações (HTML/CSV/JSON/Relatório Executivo) ────────────────────
  //
  // "Proteção de Receita M/M+1/M+2/M+3" (revenueProtection()) foi avaliada nesta integração e
  // descartada — já existe como ExecutiveOverview.coverageProtection ("Proteção 90 dias"), mesmo
  // conceito. Decisão do dono do repositório: não duplicar com um segundo threshold de "atenção".
  /**
   * Reaproveita `executiveOverview`/`performance`/`pipelineCreation`/`alerts` (nenhum cálculo
   * novo aqui) e delega a serialização para `application/executiveExport.ts`.
   */
  async executiveExport(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    format: ExportFormat,
    now?: Date,
  ): Promise<ExecutiveExportPayload> {
    // `format` entra como `extra` da chave — csv/json/html do mesmo filtro são entradas
    // distintas. Os relatórios-base abaixo são chamados SEM `now` de propósito: reutilizam o
    // cache L2 deles (e, em miss, gravam para os GETs irmãos do cockpit).
    return this.cachedReport('executive-export', organizationId, filter, now, format, async (n) => {
      const [overview, performance, creation, alertsList] = await Promise.all([
        this.executiveOverview(organizationId, filter),
        this.performance(organizationId, filter),
        this.pipelineCreation(organizationId, filter),
        this.alerts(organizationId, filter),
      ]);
      return buildExecutiveExport(format, overview, performance, creation, alertsList, n);
    });
  }

  // ─── Opções de filtro reais (seção 18) ───────────────────────────────────
  async filterOptions(organizationId: string): Promise<FilterOptions> {
    return this.repository.getFilterOptions(organizationId);
  }

  // ─── Tendências históricas — 6 meses (seção 23) ───────────────────────────
  async historicalTrends(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<HistoricalTrendsReport> {
    return this.cachedReport('historical-trends', organizationId, filter, now, undefined, (n) =>
      buildHistoricalTrends(this.repository, organizationId, filter, n),
    );
  }

  // ─── Erro histórico do Forecast (previsto vs. realizado) ─────────────────
  //
  // Lê os snapshots REAIS gravados pelo job semanal (`jobs/forecastSnapshotWeekly.worker.ts`,
  // model `ForecastSnapshot`) e compara o snapshot mais antigo de cada mês já encerrado com o
  // Fechado realizado daquele mês. Sem store injetado, sem snapshot ou sem período encerrado,
  // devolve `available: false` com o motivo — nunca um erro fabricado.
  async forecastAccuracy(
    organizationId: string,
    now?: Date,
  ): Promise<ForecastAccuracySummary> {
    // Cacheado: lê `loadScoredDeals` inteiro para o realizado dos períodos encerrados e é
    // chamado tanto pelo GET /forecast-accuracy quanto de dentro do healthScore. O frescor de
    // 60s é seguro — a fronteira "período encerrado" só muda uma vez por mês.
    return this.cachedReport(
      'forecast-accuracy',
      organizationId,
      undefined,
      now,
      undefined,
      (n) => buildForecastAccuracy(this.repository, this.snapshotStore, organizationId, n),
    );
  }

  // ─── Health Score composto (Pipeline/Conversão/Produtividade/Qualidade de CRM/Follow-up/
  // Confiabilidade de Forecast) — ver application/healthScore.ts.
  //
  // `forecastAccuracy` pode ser injetado explicitamente (testes/backtest de uma amostra
  // específica); omitido, é calculado a partir dos snapshots reais via `forecastAccuracy()`.
  // Sem histórico, o pilar "Confiabilidade de Forecast" retorna "não disponível" em vez de um
  // número fabricado, exatamente como os demais pilares fazem quando faltam dados.
  async healthScore(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
    forecastAccuracy?: ForecastAccuracySummary,
  ): Promise<HealthScoreResult> {
    // `forecastAccuracy` injetado = amostra explícita de backtest/teste — o resultado depende
    // dela, então este caminho NUNCA usa cache (e `now` explícito já desliga o cache das
    // sub-chamadas abaixo, mantendo o cálculo determinístico).
    if (forecastAccuracy !== undefined) {
      const effectiveNow = now ?? new Date();
      const [overview, performance, aging, leadingIndicators, crmQuality] = await Promise.all([
        this.executiveOverview(organizationId, filter, effectiveNow),
        this.performance(organizationId, filter, effectiveNow),
        this.aging(organizationId, filter, effectiveNow),
        this.leadingIndicators(organizationId, effectiveNow),
        this.crmQuality(organizationId, filter, effectiveNow),
      ]);
      return computeHealthScore(
        {
          overview,
          performance,
          aging,
          leadingIndicators,
          crmQuality,
          forecastAccuracy,
        },
        effectiveNow,
      );
    }
    return this.cachedReport('health-score', organizationId, filter, now, undefined, async (n) => {
      const [overview, performance, aging, leadingIndicators, crmQuality, accuracy] =
        await Promise.all([
          this.executiveOverview(organizationId, filter),
          this.performance(organizationId, filter),
          this.aging(organizationId, filter),
          this.leadingIndicators(organizationId),
          this.crmQuality(organizationId, filter),
          this.forecastAccuracy(organizationId),
        ]);
      return computeHealthScore(
        {
          overview,
          performance,
          aging,
          leadingIndicators,
          crmQuality,
          forecastAccuracy: accuracy,
        },
        n,
      );
    });
  }

  // ─── CLOSEDATE Intelligence (adiamentos/antecipações da data prevista) ────
  async closeDateIntelligence(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<CloseDateIntelligenceReport> {
    return this.cachedReport('close-date-intelligence', organizationId, filter, now, undefined, (n) =>
      buildCloseDateIntelligence(this.repository, organizationId, filter, n),
    );
  }

  // ─── Jornada (handoffs, reentradas, sem interação, mapa de transições) ─────
  async journey(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<JourneyReport> {
    return this.cachedReport('journey', organizationId, filter, now, undefined, (n) =>
      buildJourney(this.repository, organizationId, filter, n),
    );
  }

  // ─── Detecção automática de gargalo de funil (comparação relativa entre etapas) ──────────
  async funnelBottlenecks(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<FunnelBottleneckReport> {
    return this.cachedReport('funnel-bottlenecks', organizationId, filter, now, undefined, (n) =>
      buildFunnelBottlenecks(this.repository, organizationId, filter, n),
    );
  }

  // ─── Benchmark de vendedor (Win Rate/Ciclo/Ticket vs. time e top performer) ──────────────
  async sellerBenchmark(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<SellerBenchmarkReport> {
    return this.cachedReport('seller-benchmark', organizationId, filter, now, undefined, (n) =>
      buildSellerBenchmark(this.repository, organizationId, filter, n),
    );
  }

  // ─── Forecast auto-calibrado (previsto vs. realizado retroalimenta o forecast atual) ────
  //
  // Reaproveita `executiveOverview()` (forecast bruto + meta) e `forecastAccuracy()` (erro
  // histórico real, snapshots semanais) — nenhum dado novo buscado aqui, só a composição dos dois
  // já existentes via `computeForecastCalibration` (puro, testado isoladamente).
  async forecastCalibration(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<ForecastCalibrationResult> {
    // `now` é repassado (não materializado aqui): quando omitido, as chamadas abaixo usam o
    // cache L2 dos relatórios-base; quando explícito, tudo recalcula deterministicamente.
    const [overview, accuracy] = await Promise.all([
      this.executiveOverview(organizationId, filter, now),
      this.forecastAccuracy(organizationId, now),
    ]);
    return computeForecastCalibration(
      accuracy.samples,
      overview.forecastAmount,
      overview.goal?.amount ?? null,
      overview.goal?.currency ?? 'BRL',
    );
  }

  // ─── Atribuição de receita por canal/origem — toque único (item 25, versão reduzida) ────
  async channelAttribution(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    now?: Date,
  ): Promise<ChannelAttributionReport> {
    return this.cachedReport('channel-attribution', organizationId, filter, now, undefined, (n) =>
      buildChannelAttribution(this.repository, organizationId, filter, n),
    );
  }

  // ─── Simulação de cenário (contratação de SDR/vendedor) ──────────────────────────────────
  //
  // Reaproveita `pipelineCreation()` (throughput real por vendedor, `byOwner`) e `performance()`
  // (Win Rate/Sales Cycle reais) do mesmo período do filtro — nenhum dado novo buscado aqui.
  async hiringScenario(
    organizationId: string,
    filter: CommercialIntelligenceFilter,
    additionalReps: number,
    now?: Date,
  ): Promise<HiringScenarioResult> {
    // `now` repassado como em forecastCalibration — as bases (pipelineCreation/performance)
    // resolvem via cache L2 quando `now` é omitido.
    const [creation, performance] = await Promise.all([
      this.pipelineCreation(organizationId, filter, now),
      this.performance(organizationId, filter, now),
    ]);
    const activeRepsInPeriod = creation.byOwner.length;
    const avgPipelineAmountPerRepPerMonth =
      activeRepsInPeriod > 0 ? creation.amount / activeRepsInPeriod : null;
    return simulateHiringScenario(
      additionalReps,
      avgPipelineAmountPerRepPerMonth,
      activeRepsInPeriod,
      performance.winRate,
      performance.salesCycle.medianDays,
      'BRL',
    );
  }
}

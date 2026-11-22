/**
 * Cache L2 (Redis) dos relatórios executivos de Comercial Inteligente — Agente 23 (Custo,
 * Performance e Limites de IA), onda do Coordenador 20261112.
 *
 * Motivação: auditoria do Agente 04 constatou que os endpoints quentes reexecutam
 * `loadScoredDeals` várias vezes por request (healthScore ~7x, historicalTrends ~12x,
 * executiveExport ~4x ≈ 16–48 queries bulk), com meta de <800ms. Os relatórios são leitura
 * pesada mas pouco volátil — o mesmo padrão já usado em `analytics.service.ts`
 * (`analytics:dash:*`, TTL 60s) se aplica aqui.
 *
 * Decisões de segurança e frescor:
 * - A chave SEMPRE inclui `organizationId` primeiro — vazamento cross-tenant via cache é o
 *   risco crítico deste desenho (mesmo critério do `cache-key-discriminator-audit`).
 * - A chave inclui TODOS os parâmetros do relatório (filtro + formato de export) serializados
 *   em ordem fixa — filtros diferentes nunca compartilham entrada.
 * - TTL de 60s: métricas derivadas de `now` (aging, dataAsOf, janelas de "últimos 30 dias")
 *   podem ficar até 60s defasadas. Decisão aceita e documentada: os endpoints já são
 *   executivos/agregados e o cockpit tolera esse frescor; escritas (metas, movimentação de
 *   deals) não são invalidáveis por este cache — o pior caso é um relatório "velho" por até
 *   1 minuto, nunca dado de outro tenant.
 * - `now` explícito (testes/backtests determinísticos) NUNCA usa cache — ver
 *   `CommercialIntelligenceUseCases.cachedReport`.
 *
 * Escopo coberto: todos os GETs de relatório agregado (`/overview`, `/pipeline-creation`,
 * `/performance`, `/aging`, `/losses`, `/leading-indicators`, `/alerts`, `/crm-quality`,
 * `/trends`, `/health-score`, `/forecast-accuracy`, `/close-date-intelligence`, `/journey`,
 * `/funnel-bottlenecks`, `/seller-benchmark`, `/channel-attribution`, `/export`). Os compostos
 * `forecast-calibration` e `hiring-scenario` não têm entrada própria — resolvem via cache das
 * bases. FORA do cache de propósito: `dealsDrillDown` e `forecastExplain` (drill-down por
 * lead/registro, espera frescor por entidade), `filterOptions`/`goals`/`metrics-dictionary`
 * (leituras baratas de catálogo, não passam por `loadScoredDeals`).
 * - Usa `cacheConnection` (conexão dedicada 'cache', fail-fast com commandTimeout) e só
 *   quando `redisConfigured` — mesma postura de `providerCache.ts`/`distributedLock.ts`.
 *   Redis indisponível ou `get`/`setex` falhando degrada para leitura direta do banco,
 *   silenciosamente (falha de cache não é erro de request).
 */
import { cacheConnection, redisConfigured } from '../../../lib/queue/redis.js';
import type { CommercialIntelligenceFilter } from '../domain/CommercialIntelligence.js';

export const REPORT_CACHE_TTL_SECONDS = 60;
const KEY_PREFIX = 'ci:report:';

/**
 * Segmento estável do filtro: ordem fixa dos campos, `null` para ausentes, JSON para não
 * depender de separador que possa colidir com valores reais (nomes de owner/company podem
 * conter qualquer caractere).
 */
function filterSegment(filter: CommercialIntelligenceFilter | undefined): string {
  if (!filter) return '-';
  return JSON.stringify([
    filter.month ?? null,
    filter.owner ?? null,
    filter.product ?? null,
    filter.source ?? null,
    filter.icp ?? null,
    filter.company ?? null,
  ]);
}

/**
 * Chave de cache de um relatório: `ci:report:<relatório>:<organizationId>:<filtro>[:extra]`.
 * `organizationId` é sempre o segundo segmento — discriminador de tenant obrigatório.
 */
export function buildReportCacheKey(
  report: string,
  organizationId: string,
  filter?: CommercialIntelligenceFilter,
  extra?: string,
): string {
  const base = `${KEY_PREFIX}${report}:${organizationId}:${filterSegment(filter)}`;
  return extra ? `${base}:${extra}` : base;
}

/**
 * Leitura de cache. Retorna `null` em miss, Redis não configurado ou qualquer falha —
 * o chamador sempre pode recarregar do banco. `null` nunca é cacheado como hit (payloads
 * de relatório são objetos, nunca `null` literal).
 */
export async function getCachedReport<T>(key: string): Promise<T | null> {
  if (!redisConfigured) return null;
  try {
    const raw = await cacheConnection.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Gravação de cache — falha é não-fatal por contrato (mesmo comentário do padrão analytics). */
export async function setCachedReport(key: string, value: unknown): Promise<void> {
  if (!redisConfigured) return;
  try {
    await cacheConnection.setex(key, REPORT_CACHE_TTL_SECONDS, JSON.stringify(value));
  } catch {
    // Falha de gravação de cache é não-fatal.
  }
}

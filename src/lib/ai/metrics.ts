import client from 'prom-client';
import { env } from '../../config/env.js';

/**
 * Métricas Prometheus de custo/orçamento de IA, expostas em `/metrics` (montado
 * condicionalmente por `EXPOSE_METRICS` em server.ts).
 *
 * Handoff: .agents/handoffs/onda-4/10-para-07-metricas-fila-orcamento-ia.md — o Agente 10
 * (Infra/SRE) já escreveu o alerta `AIBudgetOverrun` em
 * infrastructure/observability/alert.rules.yml referenciando `ai_usage_cost_usd_total` e
 * `ai_usage_budget_usd_total` como contrato de nome de métrica. Antes deste módulo, custo de IA só
 * existia em banco (tabela AILog, ver docs/deploy/producao.md seção 1.3) — nenhuma contraparte em
 * Prometheus, então o alerta ficava permanentemente "unknown".
 */

export const aiUsageCostUsdTotal = new client.Counter({
  name: 'ai_usage_cost_usd_total',
  help: 'Custo estimado acumulado (USD) de chamadas de IA via src/lib/ai/gateway.ts, por provedor e tenant.',
  labelNames: ['provider', 'tenant'] as const,
});

/**
 * Registra o custo estimado de uma chamada de IA bem-sucedida. Chamado de dentro de
 * `getAiModel().invoke()` (gateway.ts) — o mesmo ponto onde `traceAiGeneration` já é disparado —
 * logo após o provedor real (`providerUsed`) e o uso de tokens serem conhecidos, para o rótulo
 * `provider` refletir quem de fato atendeu a chamada (não uma aproximação pelo nome do modelo).
 *
 * `tenant` cai para 'unattributed' fora de uma requisição HTTP (scripts, workers sem
 * requestContext) — mesmo tratamento que `logAiUsage` já dá a `organizationId: null` no AILog.
 */
export function recordAiUsageCost(
  provider: string,
  tenant: string | null | undefined,
  costUsd: number,
): void {
  if (!Number.isFinite(costUsd) || costUsd < 0) return;
  aiUsageCostUsdTotal.inc(
    { provider: provider || 'unknown', tenant: tenant || 'unattributed' },
    costUsd,
  );
}

/**
 * AI-011: contador de quantas chamadas de IA foram efetivamente bloqueadas pelo circuit breaker de
 * orçamento (src/lib/ai/budget.ts) por terem batido no teto de `AI_MONTHLY_BUDGET_USD`. Ao
 * contrário do gauge de orçamento abaixo (só um valor de referência estático), este é o sinal real
 * de que o bloqueio está acontecendo em produção — sem ele, um teto configurado bloqueando chamadas
 * silenciosamente não teria nenhuma métrica própria para alertar sobre isso.
 */
export const aiBudgetBlockedTotal = new client.Counter({
  name: 'ai_budget_blocked_total',
  help: 'Chamadas de IA bloqueadas pelo circuit breaker de orçamento mensal (AI-011) por excederem AI_MONTHLY_BUDGET_USD.',
});

export function recordAiBudgetBlocked(): void {
  aiBudgetBlockedTotal.inc();
}

/**
 * DEC-09 (onda 42): contraparte por ORGANIZAÇÃO de `aiBudgetBlockedTotal` acima — incrementado
 * quando `assertOrgAiBudgetNotExceeded` (src/lib/ai/budget.ts) bloqueia uma chamada por exceder o
 * teto mensal configurado (`Organization.monthlyAiBudgetUsd`) de UMA organização específica,
 * diferente do teto global de plataforma. Rotulado por organização para permitir alertar/painel
 * por tenant sem precisar somar contadores sem rótulo nenhum.
 */
export const aiOrgBudgetBlockedTotal = new client.Counter({
  name: 'ai_org_budget_blocked_total',
  help: 'Chamadas de IA bloqueadas pelo teto mensal de orçamento por organização (DEC-09, Organization.monthlyAiBudgetUsd), por organização.',
  labelNames: ['organization'] as const,
});

export function recordOrgAiBudgetBlocked(organizationId: string): void {
  aiOrgBudgetBlockedTotal.inc({ organization: organizationId });
}

/**
 * BILLING-009 (Onda 2): antes, `estimateCostUsd` (gateway/pricing.ts) caía silenciosamente no
 * preço de `local-llama3-fast` para qualquer modelo sem entrada em `PRICING_PER_MILLION_TOKENS`,
 * distorcendo o custo reportado sem nenhum sinal observável. Este contador torna esse fallback
 * visível em Prometheus, rotulado por modelo, para detectar um modelo novo esquecido na tabela de
 * preços antes que ele afete silenciosamente o orçamento por organização (src/lib/ai/budget.ts).
 */
export const aiPricingFallbackTotal = new client.Counter({
  name: 'ai_pricing_fallback_total',
  help: 'Chamadas de IA cujo modelo não tinha preço cadastrado e caiu no fallback de local-llama3-fast (BILLING-009), por modelo.',
  labelNames: ['model'] as const,
});

export function recordAiPricingFallback(model: string): void {
  aiPricingFallbackTotal.inc({ model: model || 'unknown' });
}

// Gauge de orçamento só é registrado (e, portanto, só aparece em /metrics) quando
// AI_MONTHLY_BUDGET_USD está configurada. Sem valor configurado, a série simplesmente não existe
// — não fabricamos um "0" que faria `ai_usage_cost_usd_total / ai_usage_budget_usd_total` virar
// +Inf a qualquer custo real (falso positivo no alerta AIBudgetOverrun).
if (env.AI_MONTHLY_BUDGET_USD !== undefined) {
  const aiUsageBudgetUsdTotal = new client.Gauge({
    name: 'ai_usage_budget_usd_total',
    help: 'Orçamento mensal de IA configurado (USD) via AI_MONTHLY_BUDGET_USD (AI-011: excedê-lo bloqueia novas chamadas de IA, ver src/lib/ai/budget.ts). Este gauge é só o valor de referência para o alerta AIBudgetOverrun, não o próprio bloqueio.',
  });
  aiUsageBudgetUsdTotal.set(env.AI_MONTHLY_BUDGET_USD);
}

// ─── FinOps: Governança de Quota de Tokens de IA (Onda 15) ─────────────────────────

/**
 * FINOPS-001: Métrica de consumo de tokens por organização e tier de assinatura.
 */
export const aiTokenUsageTotal = new client.Counter({
  name: 'ai_token_usage_total',
  help: 'Total de tokens consumidos acumulados por organização, tier e modelo.',
  labelNames: ['organization', 'tier', 'model'] as const,
});

export function recordTokenUsage(
  organization: string | null | undefined,
  tier: string,
  model: string,
  tokens: number,
): void {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  aiTokenUsageTotal.inc(
    {
      organization: organization || 'unattributed',
      tier: tier || 'unknown',
      model: model || 'unknown',
    },
    tokens,
  );
}

/**
 * FINOPS-002: Alertas de quota de tokens atingida (80% aviso / 100% estouro).
 */
export const aiTokenQuotaAlertTotal = new client.Counter({
  name: 'ai_token_quota_alert_total',
  help: 'Alertas de FinOps disparados quando uma organização atinge limites de quota mensal (80% warning ou 100% exceeded).',
  labelNames: ['organization', 'tier', 'level'] as const,
});

export function recordTokenQuotaAlert(
  organizationId: string,
  tier: string,
  level: 'warning_80' | 'exceeded_100',
): void {
  aiTokenQuotaAlertTotal.inc({
    organization: organizationId || 'unattributed',
    tier: tier || 'unknown',
    level,
  });
}

/**
 * FINOPS-003: Fallback econômico ativado por estouro de quota de tokens (fail-safe).
 */
export const aiTokenQuotaFallbackTotal = new client.Counter({
  name: 'ai_token_quota_fallback_total',
  help: 'Chamadas de IA redirecionadas para modelo econômico de fallback devido ao consumo de quota de tokens.',
  labelNames: ['organization', 'from_model', 'to_model'] as const,
});

export function recordTokenQuotaFallback(
  organizationId: string,
  fromModel: string,
  toModel: string,
): void {
  aiTokenQuotaFallbackTotal.inc({
    organization: organizationId || 'unattributed',
    from_model: fromModel || 'unknown',
    to_model: toModel || 'unknown',
  });
}

/**
 * FINOPS-004: Bloqueio estrito de chamada por quota de tokens esgotada sem fallback viável.
 */
export const aiTokenQuotaBlockedTotal = new client.Counter({
  name: 'ai_token_quota_blocked_total',
  help: 'Chamadas de IA bloqueadas estritamente por excederem a franquia mensal de tokens sem fallback viável.',
  labelNames: ['organization', 'tier'] as const,
});

export function recordTokenQuotaBlocked(organizationId: string, tier: string): void {
  aiTokenQuotaBlockedTotal.inc({
    organization: organizationId || 'unattributed',
    tier: tier || 'unknown',
  });
}

/**
 * FINOPS-005: Gauge do limite mensal de tokens contratado/alocado por organização.
 */
export const aiTokenQuotaLimitGauge = new client.Gauge({
  name: 'ai_token_quota_limit',
  help: 'Limite mensal de tokens de IA alocado para a organização conforme seu tier/plano.',
  labelNames: ['organization', 'tier'] as const,
});

export function setTokenQuotaLimitGauge(
  organizationId: string,
  tier: string,
  quotaTokens: number,
): void {
  if (!Number.isFinite(quotaTokens) || quotaTokens < 0) return;
  aiTokenQuotaLimitGauge.set(
    { organization: organizationId || 'unattributed', tier: tier || 'unknown' },
    quotaTokens,
  );
}

/**
 * FINOPS-006 (DEBT-0014): contador de eventos em que o TokenQuotaService degradou em modo
 * fail-open — ou seja, a checagem de quota foi pulada/zerada porque Postgres ou Redis estavam
 * indisponíveis. Sem este sinal, um outage de banco torna a governança de tokens invisível
 * (tudo retorna "uso = 0" e nenhuma chamada é bloqueada ou alertada). O fail-open em si é
 * decisão documentada em tokenQuota.service.ts; este contador existe para que a degradação
 * seja observável e alertável em vez de silenciosa.
 */
export const aiTokenQuotaFailOpenTotal = new client.Counter({
  name: 'ai_token_quota_fail_open_total',
  help: 'Eventos em que a governança de quota de tokens degradou para fail-open por indisponibilidade de Postgres/Redis.',
  labelNames: ['reason'] as const,
});

export function recordTokenQuotaFailOpen(reason: string): void {
  aiTokenQuotaFailOpenTotal.inc({ reason: reason || 'unknown' });
}

import { AppError } from '../../../shared/middlewares/errorHandler.js';

/**
 * Rate limiter anti-bloqueio de Social Selling (RN-SOC-03 / RECONST-028, MOD-11).
 *
 * Contexto honesto: hoje NÃO existe envio automatizado a plataformas sociais — RN-SOC-01
 * proíbe postagem sem clique humano e nenhum conector LinkedIn/Instagram real está implementado.
 * O que existe (e o que este limiter protege) é o registro de interações/abordagens na timeline
 * do CRM: sem um teto, um usuário (ou um script com a sessão dele) poderia inundar a timeline de
 * um tenant com "abordagens" em rajada — o equivalente interno a "disparo predatório" enquanto
 * o envio real não existe. Quando um dispatcher real for implementado (outro handoff), este mesmo
 * limiter deve ser reaplicado no ponto de envio.
 *
 * Janela fixa por organização (não token bucket): o volume esperado é baixo (dezenas de
 * interações/dia por tenant), então um contador "N por hora" é suficiente, O(1), determinístico
 * e trivialmente testável — mesmo espírito do bucket em memória de `providerRateLimit.ts`, sem a
 * complexidade de refill contínuo que só faria sentido para limites por minuto apertados.
 * Em memória por processo (aceito: proteção contra abuso local/rajada, não um SLA distribuído —
 * um limite 100% preciso entre réplicas exigiria Redis, como já documentado em providerBudget.ts).
 */

export const DEFAULT_SOCIAL_INTERACTIONS_PER_HOUR = 20;
const WINDOW_MS = 60 * 60 * 1000;

interface RateWindow {
  windowStartMs: number;
  count: number;
}

const windows = new Map<string, RateWindow>();
const MAX_TRACKED_ORGS = 1000;

function envVarName(): string {
  return 'SOCIAL_SELLING_RATE_LIMIT_PER_HOUR';
}

/** Lê o limite por hora (env), com fallback ao default documentado acima. `<= 0`/inválido =
 * limite default (proteção contra env mal configurada desativar a proteção sem querer). */
export function getSocialInteractionsPerHour(
  environment: NodeJS.ProcessEnv = process.env,
): number {
  const raw = environment[envVarName()];
  const parsed = raw != null ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_SOCIAL_INTERACTIONS_PER_HOUR;
}

export interface SocialRateLimitResult {
  allowed: boolean;
  /** Preenchido só quando `allowed` é false — ms até a janela atual virar e o contador zerar. */
  retryAfterMs: number;
  limitPerHour: number;
}

/**
 * Verifica (e consome, se permitido) UMA vaga na janela da organização. Chame ANTES de gravar a
 * TimelineEvent — nunca depois.
 */
export function checkSocialInteractionRateLimit(
  organizationId: string,
  now: number = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): SocialRateLimitResult {
  const limit = getSocialInteractionsPerHour(environment);
  const existing = windows.get(organizationId);

  const windowStartMs =
    existing && now - existing.windowStartMs < WINDOW_MS ? existing.windowStartMs : now;
  const count = windowStartMs === now && (!existing || now - existing.windowStartMs >= WINDOW_MS)
    ? 0
    : (existing?.count ?? 0);

  const next: RateWindow = { windowStartMs, count };

  if (next.count >= limit) {
    windows.set(organizationId, next);
    return {
      allowed: false,
      retryAfterMs: Math.max(1, windowStartMs + WINDOW_MS - now),
      limitPerHour: limit,
    };
  }

  next.count += 1;
  if (!windows.has(organizationId) && windows.size >= MAX_TRACKED_ORGS) {
    const oldestKey = windows.keys().next().value;
    if (oldestKey !== undefined) windows.delete(oldestKey);
  }
  windows.set(organizationId, next);
  return { allowed: true, retryAfterMs: 0, limitPerHour: limit };
}

/** Lança AppError 429 quando a janela da organização estourou — mesmo contrato HTTP dos demais
 * rate limiters do domínio (nunca vaza stack; mensagem acionável para o usuário). */
export function assertSocialInteractionRateLimit(
  organizationId: string,
  now?: number,
  environment?: NodeJS.ProcessEnv,
): void {
  const result = checkSocialInteractionRateLimit(organizationId, now, environment);
  if (result.allowed) return;
  const minutes = Math.max(1, Math.ceil(result.retryAfterMs / 60_000));
  throw new AppError(
    `Limite de ${result.limitPerHour} interações de Social Selling por hora atingido para esta organização. Tente novamente em ~${minutes} min.`,
    429,
  );
}

/** Só para testes: limpa as janelas em memória entre casos. */
export function resetSocialSellingRateLimitersForTests(): void {
  windows.clear();
}

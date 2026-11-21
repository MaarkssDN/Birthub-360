export interface AtomicRedisTokenCounterPort {
  incrBy(key: string, tokens: number): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
}

export interface TokenBudgetDecision {
  allowed: boolean;
  tenantId: string;
  redisKey: string;
  usedTokensToday: number;
  dailyLimitTokens: number;
  remainingTokens: number;
}

export class DailyTokenBudgetExceededError extends Error {
  readonly code = 'DAILY_TOKEN_BUDGET_EXCEEDED';
  readonly tenantId: string;
  readonly usedTokensToday: number;
  readonly dailyLimitTokens: number;

  constructor(tenantId: string, usedTokensToday: number, dailyLimitTokens: number) {
    super(
      `Orçamento diário de tokens de IA excedido para o tenant "${tenantId}" (${usedTokensToday}/${dailyLimitTokens} tokens).`,
    );
    this.name = 'DailyTokenBudgetExceededError';
    this.tenantId = tenantId;
    this.usedTokensToday = usedTokensToday;
    this.dailyLimitTokens = dailyLimitTokens;
  }
}

const SECONDS_PER_DAY_TTL = 86_400;

export class AtomicRedisTokenBudgetService {
  constructor(private readonly redis: AtomicRedisTokenCounterPort) {}

  buildDailyTenantKey(tenantId: string, date: Date = new Date()): string {
    const cleanTenant = tenantId?.trim();
    if (!cleanTenant) {
      throw new Error('tenantId é obrigatório para controle de orçamento FinOps de IA.');
    }
    const dayStr = date.toISOString().slice(0, 10);
    return `${cleanTenant}:ai:finops:daily_tokens:${dayStr}`;
  }

  async consumeTokensOrThrow(params: {
    tenantId: string;
    tokensToConsume: number;
    dailyLimitTokens: number;
    now?: Date;
  }): Promise<TokenBudgetDecision> {
    const tokens = Math.max(0, Math.trunc(params.tokensToConsume));
    const limit = Math.max(1, Math.trunc(params.dailyLimitTokens));
    const redisKey = this.buildDailyTenantKey(params.tenantId, params.now);

    const newTotal = await this.redis.incrBy(redisKey, tokens);
    if (newTotal === tokens) {
      await this.redis.expire(redisKey, SECONDS_PER_DAY_TTL);
    }

    if (newTotal > limit) {
      // Reverte os tokens que estouraram o orçamento para manter o contador fiel ao consumo aprovado
      if (tokens > 0) {
        await this.redis.incrBy(redisKey, -tokens);
      }
      throw new DailyTokenBudgetExceededError(params.tenantId, newTotal, limit);
    }

    return {
      allowed: true,
      tenantId: params.tenantId,
      redisKey,
      usedTokensToday: newTotal,
      dailyLimitTokens: limit,
      remainingTokens: Math.max(0, limit - newTotal),
    };
  }
}

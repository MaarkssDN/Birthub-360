export interface PlanEntitlements {
  tenantId: string;
  planCode: 'STARTER' | 'PRO' | 'ENTERPRISE';
  maxSeats: number;
  maxMonthlyAiTokens: number;
}

export interface EntitlementCachePort {
  get(key: string): Promise<PlanEntitlements | null>;
  set(key: string, value: PlanEntitlements, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

export class EntitlementPlanCacheChecker {
  constructor(
    private readonly cache: EntitlementCachePort,
    private readonly loader: (tenantId: string) => Promise<PlanEntitlements>,
    private readonly ttlSeconds: number = 300,
  ) {}

  buildCacheKey(tenantId: string): string {
    if (!tenantId?.trim()) {
      throw new Error('tenantId é obrigatório para verificação de entitlements.');
    }
    return `${tenantId.trim()}:billing:entitlements`;
  }

  async getEntitlements(tenantId: string): Promise<PlanEntitlements> {
    const key = this.buildCacheKey(tenantId);
    const cached = await this.cache.get(key);
    if (cached) return cached;

    const fresh = await this.loader(tenantId);
    await this.cache.set(key, fresh, this.ttlSeconds);
    return fresh;
  }

  /**
   * Invalida imediatamente o cache de plano após confirmação de upgrade via webhook financeiro
   * e opcionalmente pré-aquece os novos limites do plano.
   */
  async invalidateAndRefreshOnPlanUpgrade(
    tenantId: string,
    upgradedEntitlements?: PlanEntitlements,
  ): Promise<PlanEntitlements> {
    const key = this.buildCacheKey(tenantId);
    await this.cache.del(key);
    const next = upgradedEntitlements ?? (await this.loader(tenantId));
    await this.cache.set(key, next, this.ttlSeconds);
    return next;
  }
}

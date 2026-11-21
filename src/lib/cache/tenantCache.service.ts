import { logger } from '../logger.js';
import { cacheConnection, redisConfigured } from '../queue/redis.js';

export interface TenantCacheOptions {
  ttlSeconds?: number;
}

/**
 * TenantCacheService - Agente 17 (Remo)
 *
 * Garante isolamento estrito multi-tenant no cache Redis.
 * Toda e qualquer chave é prefixada obrigatoriamente com `tenant:${tenantId}:${key}`.
 * Lança erro ou rejeita se `tenantId` for nulo, indefinido, vazio ou contiver separadores inválidos.
 */
export class TenantCacheService {
  /**
   * Constrói a chave com prefixo canônico de isolamento por organização.
   */
  public static buildTenantKey(tenantId: string, key: string): string {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      throw new Error('[TenantCache] tenantId é obrigatório e não pode ser vazio.');
    }
    const cleanTenantId = tenantId.trim();
    const cleanKey = key?.trim();
    if (!cleanKey) {
      throw new Error('[TenantCache] chave de cache não pode ser vazia.');
    }
    return `tenant:${cleanTenantId}:${cleanKey}`;
  }

  /**
   * Obtém um valor deserializado do cache.
   */
  public async get<T>(tenantId: string, key: string): Promise<T | null> {
    const fullKey = TenantCacheService.buildTenantKey(tenantId, key);
    if (!redisConfigured) return null;

    try {
      const raw = await cacheConnection.get(fullKey);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn({ err, tenantId, key }, '[TenantCache] Falha ao recuperar chave do Redis');
      return null;
    }
  }

  /**
   * Armazena um valor no cache com TTL opcional em segundos.
   */
  public async set<T>(
    tenantId: string,
    key: string,
    value: T,
    options: TenantCacheOptions = {},
  ): Promise<boolean> {
    const fullKey = TenantCacheService.buildTenantKey(tenantId, key);
    if (!redisConfigured) return false;

    try {
      const serialized = JSON.stringify(value);
      if (options.ttlSeconds && options.ttlSeconds > 0) {
        await cacheConnection.set(fullKey, serialized, 'EX', options.ttlSeconds);
      } else {
        await cacheConnection.set(fullKey, serialized);
      }
      return true;
    } catch (err) {
      logger.warn({ err, tenantId, key }, '[TenantCache] Falha ao gravar chave no Redis');
      return false;
    }
  }

  /**
   * Remove uma chave específica do tenant.
   */
  public async del(tenantId: string, key: string): Promise<boolean> {
    const fullKey = TenantCacheService.buildTenantKey(tenantId, key);
    if (!redisConfigured) return false;

    try {
      const deleted = await cacheConnection.del(fullKey);
      return deleted > 0;
    } catch (err) {
      logger.warn({ err, tenantId, key }, '[TenantCache] Falha ao deletar chave do Redis');
      return false;
    }
  }

  /**
   * Invalida todas as chaves de um determinado padrão pertencentes estritamente ao tenant.
   */
  public async invalidatePattern(tenantId: string, pattern: string): Promise<number> {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      throw new Error('[TenantCache] tenantId é obrigatório para invalidação.');
    }
    if (!redisConfigured) return 0;

    const tenantPattern = `tenant:${tenantId.trim()}:${pattern}`;
    try {
      const keys = await cacheConnection.keys(tenantPattern);
      if (keys.length === 0) return 0;
      return await cacheConnection.del(...keys);
    } catch (err) {
      logger.warn({ err, tenantId, pattern }, '[TenantCache] Falha ao invalidar padrão no Redis');
      return 0;
    }
  }
}

export const tenantCache = new TenantCacheService();

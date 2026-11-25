import { describe, expect, it } from 'vitest';
import {
  CACHE_TTL,
  SEMANTIC_CACHE_KEY_PREFIX,
  SemanticCacheService,
  semanticCache,
} from '../../../src/lib/ai/cache/semanticCache.service.js';
import { SemanticCacheService as CanonicalSemanticCacheService } from '../../../src/lib/ai/gateway/semanticCache.js';

// A implementação canônica vive em src/lib/ai/gateway/semanticCache.ts e é coberta por
// tests/unit/ai/gateway/semanticCache.test.ts. Este arquivo valida apenas a fachada de
// compatibilidade retroativa em src/lib/ai/cache/semanticCache.service.ts.
describe('SemanticCacheService — fachada de compatibilidade', () => {
  it('re-exporta a implementação canônica do gateway', () => {
    expect(SemanticCacheService).toBe(CanonicalSemanticCacheService);
    expect(semanticCache).toBeInstanceOf(CanonicalSemanticCacheService);
  });

  it('expõe os TTLs canônicos (firmográfico público = 7 dias)', () => {
    expect(CACHE_TTL.FIRMOGRAPHIC_PUBLIC).toBe(7 * 86400);
    expect(CACHE_TTL.DEFAULT).toBe(86400);
    expect(SEMANTIC_CACHE_KEY_PREFIX).toBe('semcache');
  });

  it('resolve TTL por purpose via API pública do serviço', () => {
    const cache = new SemanticCacheService();
    expect(cache.resolveTtlSeconds({ purpose: 'firmographics' })).toBe(
      CACHE_TTL.FIRMOGRAPHIC_PUBLIC,
    );
    expect(cache.resolveTtlSeconds({ purpose: 'cnpj' })).toBe(CACHE_TTL.FIRMOGRAPHIC_PUBLIC);
    expect(cache.resolveTtlSeconds({ purpose: 'social-selling-approach' })).toBe(
      CACHE_TTL.DEFAULT,
    );
  });
});

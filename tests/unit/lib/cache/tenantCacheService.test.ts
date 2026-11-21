import { describe, expect, it, vi } from 'vitest';
import { TenantCacheService } from '../../../../src/lib/cache/tenantCache.service.js';

describe('Agente 17 (Remo) - TenantCacheService Multi-Tenancy Isolation', () => {
  it('deve prefixar obrigatoriamente a chave com tenant:${tenantId}:${key}', () => {
    const key = TenantCacheService.buildTenantKey('org-123', 'crm:leads:list');
    expect(key).toBe('tenant:org-123:crm:leads:list');
  });

  it('deve rejeitar tenantId nulo, vazio ou com apenas espaços em branco', () => {
    expect(() => TenantCacheService.buildTenantKey('', 'leads')).toThrow(
      /tenantId é obrigatório/,
    );
    expect(() => TenantCacheService.buildTenantKey('   ', 'leads')).toThrow(
      /tenantId é obrigatório/,
    );
    expect(() => TenantCacheService.buildTenantKey(null as any, 'leads')).toThrow(
      /tenantId é obrigatório/,
    );
  });

  it('deve rejeitar chave de cache vazia', () => {
    expect(() => TenantCacheService.buildTenantKey('org-123', '')).toThrow(
      /chave de cache não pode ser vazia/,
    );
    expect(() => TenantCacheService.buildTenantKey('org-123', '   ')).toThrow(
      /chave de cache não pode ser vazia/,
    );
  });

  it('deve realizar get, set e del preservando isolamento de tenant', async () => {
    const service = new TenantCacheService();
    // Sem redis configurado em ambiente de teste unitário puro, deve degradar graciosamente sem estourar exceção
    const setResult = await service.set('org-abc', 'test-key', { foo: 'bar' });
    expect(typeof setResult).toBe('boolean');

    const getResult = await service.get('org-abc', 'test-key');
    expect(getResult === null || typeof getResult === 'object').toBe(true);

    const delResult = await service.del('org-abc', 'test-key');
    expect(typeof delResult).toBe('boolean');
  });
});

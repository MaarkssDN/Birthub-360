import { describe, expect, it, vi } from 'vitest';
import {
  TenantActivityInboundInterceptor,
  createTenantActivityInboundInterceptor,
  extractTenantId,
  withTenantActivity,
} from '../../../../src/features/temporal-workers/interceptors.js';
import {
  scrapeProspect,
  TenantContextMissingError,
} from '../../../../src/features/temporal-workers/activities.js';
import { getTenantId, withTenantContext } from '../../../../src/lib/async-context.js';

// Mock crawler so unit test doesn't launch real browser
vi.mock('../../../../src/features/prospecting/crawlee/crawler.js', () => ({
  runCrawler: vi.fn(async (urls: string[]) =>
    urls.map((url) => ({
      url,
      title: 'Mocked Page',
      emails: ['contato@example.com'],
      socialMedia: ['https://linkedin.com/company/example'],
    })),
  ),
}));

// Mock da ponte de persistência — scrapeProspect não deve tocar Prisma em teste unitário.
vi.mock('../../../../src/features/prospecting/services/webCrawlPersistence.service.js', () => ({
  persistCrawledSignals: vi.fn(async (pages: Array<{ url: string }>) =>
    pages.map((p) => ({
      url: p.url,
      companyId: 'company_mock_1',
      matchedBy: 'websiteDomain',
      persisted: true,
      changed: true,
      emailsAdded: 1,
      socialFieldsAdded: 1,
    })),
  ),
}));

describe('Temporal Activities Multi-Tenant Isolation (B-10 & Rule §26)', () => {
  describe('extractTenantId', () => {
    it('returns null for null, undefined or non-objects', () => {
      expect(extractTenantId(null)).toBeNull();
      expect(extractTenantId(undefined)).toBeNull();
      expect(extractTenantId('string')).toBeNull();
      expect(extractTenantId(123)).toBeNull();
    });

    it('extracts tenantId when present and non-empty', () => {
      expect(extractTenantId({ tenantId: 'org_123' })).toBe('org_123');
      expect(extractTenantId({ tenantId: '  org_trimmed  ' })).toBe('org_trimmed');
    });

    it('extracts organizationId as fallback when tenantId is not present', () => {
      expect(extractTenantId({ organizationId: 'org_abc' })).toBe('org_abc');
    });

    it('returns null if tenantId and organizationId are empty or whitespace only', () => {
      expect(extractTenantId({ tenantId: '' })).toBeNull();
      expect(extractTenantId({ tenantId: '   ' })).toBeNull();
      expect(extractTenantId({ organizationId: '' })).toBeNull();
      expect(extractTenantId({})).toBeNull();
    });
  });

  describe('scrapeProspect activity', () => {
    it('throws TenantContextMissingError if params is missing or tenantId is missing', async () => {
      // @ts-expect-error test invalid input
      await expect(scrapeProspect(null)).rejects.toThrow(TenantContextMissingError);
      // @ts-expect-error test invalid input
      await expect(scrapeProspect({})).rejects.toThrow(TenantContextMissingError);
      await expect(scrapeProspect({ tenantId: '', url: 'https://example.com' })).rejects.toThrow(
        TenantContextMissingError,
      );
      await expect(scrapeProspect({ tenantId: '   ', url: 'https://example.com' })).rejects.toThrow(
        TenantContextMissingError,
      );
    });

    it('executes successfully, provides tenant context and persists crawled signals', async () => {
      const result = await scrapeProspect({
        tenantId: 'tenant_prospecting_001',
        url: 'https://birthub360.com',
      });

      expect(result.status).toBe('success');
      expect(result.crawled).toEqual([
        {
          url: 'https://birthub360.com',
          title: 'Mocked Page',
          emails: ['contato@example.com'],
          socialMedia: ['https://linkedin.com/company/example'],
        },
      ]);
      expect(result.persistence).toEqual([
        {
          url: 'https://birthub360.com',
          companyId: 'company_mock_1',
          matchedBy: 'websiteDomain',
          persisted: true,
          changed: true,
          emailsAdded: 1,
          socialFieldsAdded: 1,
        },
      ]);
    });

    it('accepts organizationId as valid tenant parameter', async () => {
      const result = await scrapeProspect({
        organizationId: 'tenant_org_fallback',
        url: 'https://birthub360.com/test',
      });

      expect(result.status).toBe('success');
      expect(result.crawled.map((c) => c.url)).toEqual(['https://birthub360.com/test']);
      expect(result.persistence).toHaveLength(1);
    });
  });

  describe('withTenantActivity wrapper', () => {
    it('throws TenantContextMissingError when payload has no tenant', async () => {
      const customActivity = withTenantActivity(async (params: { foo: string }) => {
        return `done-${params.foo}`;
      });

      // @ts-expect-error test missing tenant
      await expect(customActivity({ foo: 'bar' })).rejects.toThrow(TenantContextMissingError);
    });

    it('propagates tenant context to getTenantId() throughout activity lifecycle', async () => {
      const customActivity = withTenantActivity(
        async (params: { tenantId: string; counter: number }) => {
          const currentTenant = getTenantId();
          await new Promise((r) => setTimeout(r, 10));
          const currentTenantAfterAsync = getTenantId();
          return { currentTenant, currentTenantAfterAsync, counter: params.counter };
        },
      );

      const res = await customActivity({ tenantId: 'tenant-xyz', counter: 42 });
      expect(res).toEqual({
        currentTenant: 'tenant-xyz',
        currentTenantAfterAsync: 'tenant-xyz',
        counter: 42,
      });
    });
  });

  describe('TenantActivityInboundInterceptor', () => {
    it('intercepts execution and extracts tenant from payload args', async () => {
      const interceptor = createTenantActivityInboundInterceptor();
      let capturedTenantInsideNext: string | undefined;

      const next = vi.fn(async (input) => {
        capturedTenantInsideNext = getTenantId();
        return { success: true };
      });

      const input = {
        args: [{ tenantId: 'org-payload-99', data: 'test' }],
        headers: {} as any,
      };

      const result = await interceptor.execute!(input, next);

      expect(result).toEqual({ success: true });
      expect(capturedTenantInsideNext).toBe('org-payload-99');
      expect(next).toHaveBeenCalledWith(input);
    });

    it('intercepts execution and extracts tenant from headers', async () => {
      const interceptor = new TenantActivityInboundInterceptor();
      let capturedTenantInsideNext: string | undefined;

      const next = vi.fn(async (input) => {
        capturedTenantInsideNext = getTenantId();
        return 'header-result';
      });

      const input = {
        args: [{ payload: 'no-tenant-in-arg' }],
        headers: { 'tenant-id': 'org-from-header-123' } as any,
      };

      const result = await interceptor.execute!(input, next);

      expect(result).toBe('header-result');
      expect(capturedTenantInsideNext).toBe('org-from-header-123');
    });

    it('throws TenantContextMissingError if neither args nor headers provide tenant', async () => {
      const interceptor = new TenantActivityInboundInterceptor();
      const next = vi.fn(async () => 'should-not-run');

      const input = {
        args: [{ payload: 'data-only' }],
        headers: {} as any,
      };

      await expect(interceptor.execute!(input, next)).rejects.toThrow(TenantContextMissingError);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Activity Isolation', () => {
    it('guarantees tenant isolation under concurrent asynchronous execution', async () => {
      const isolatedActivity = withTenantActivity(
        async (params: { tenantId: string; delayMs: number }) => {
          const startTenant = getTenantId();
          await new Promise((resolve) => setTimeout(resolve, params.delayMs));
          const endTenant = getTenantId();
          return { startTenant, endTenant, expected: params.tenantId };
        },
      );

      const tasks = [
        isolatedActivity({ tenantId: 'tenant-Alpha', delayMs: 30 }),
        isolatedActivity({ tenantId: 'tenant-Beta', delayMs: 10 }),
        isolatedActivity({ tenantId: 'tenant-Gamma', delayMs: 20 }),
        isolatedActivity({ tenantId: 'tenant-Delta', delayMs: 5 }),
      ];

      const results = await Promise.all(tasks);

      for (const res of results) {
        expect(res.startTenant).toBe(res.expected);
        expect(res.endTenant).toBe(res.expected);
      }
    });
  });
});

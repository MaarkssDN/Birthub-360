import { describe, expect, it, vi } from 'vitest';
import {
  TenantIsolatedBullMQAdapter,
  mountBullBoard,
} from '../../../../src/bootstrap/bullBoard.js';
import { requestContext } from '../../../../src/lib/async-context.js';

vi.mock('@bull-board/api', () => ({
  createBullBoard: vi.fn(),
}));

vi.mock('@bull-board/api/bullMQAdapter', () => {
  class MockBullMQAdapter {
    queue: any;
    options: any;
    constructor(queue: any, options?: any) {
      this.queue = queue;
      this.options = options;
    }
    async getJobs(jobTypes: any[], start?: number, end?: number) {
      return this.queue?.jobs || [];
    }
    async getJob(id: string) {
      return this.queue?.jobs?.find((j: any) => j.id === id) || null;
    }
  }
  return {
    BullMQAdapter: MockBullMQAdapter,
  };
});

vi.mock('@bull-board/express', () => ({
  ExpressAdapter: vi.fn().mockImplementation(function () {
    return {
      setBasePath: vi.fn(),
      getRouter: vi.fn().mockReturnValue('mockedRouter'),
    };
  }),
}));

vi.mock('../../../../src/lib/queue/agent.worker.js', () => ({ agentQueue: {} }));
vi.mock('../../../../src/lib/queue/index.js', () => ({ leadsQueue: {} }));
vi.mock('../../../../src/lib/queue/redis.js', () => ({ queuesEnabled: true }));
vi.mock('../../../../src/lib/queue/search.queue.js', () => ({ searchQueue: {} }));

describe('mountBullBoard', () => {
  it('mounts bullBoard on the express app with quad-lock middleware and rate limiting (SEC-003)', () => {
    const mockApp = {
      use: vi.fn(),
    };

    mountBullBoard(mockApp as any);

    expect(mockApp.use).toHaveBeenCalledWith(
      '/admin/queues',
      expect.any(Function), // bullBoardLimiter
      expect.any(Function), // authenticateToken
      expect.any(Function), // requireTenant
      expect.any(Function), // requireRole(['ADMIN'])
      expect.any(Function), // requirePlatformOperator
      'mockedRouter',
    );
  });
});

describe('TenantIsolatedBullMQAdapter (SEC-003)', () => {
  const sampleJobs = [
    {
      id: 'job-1',
      name: 'sync-leads',
      data: {
        organizationId: 'tenant-alpha',
        leadId: 'lead-123',
        sensitiveCustomerEmail: 'ceo@alpha.com',
      },
    },
    {
      id: 'job-2',
      name: 'sync-leads',
      data: {
        tenantId: 'tenant-beta',
        leadId: 'lead-456',
        sensitiveCustomerEmail: 'cfo@beta.com',
      },
    },
    {
      id: 'job-3',
      name: 'maintenance',
      data: {
        systemAction: 'cleanup',
      },
    },
  ];

  const mockQueue = {
    jobs: sampleJobs,
  };

  it('preserves all jobs unredacted when running without tenant context (platform operator)', async () => {
    const adapter = new TenantIsolatedBullMQAdapter(mockQueue);
    const jobs = await adapter.getJobs(['completed']);

    expect(jobs).toHaveLength(3);
    expect(jobs[0].data.sensitiveCustomerEmail).toBe('ceo@alpha.com');
    expect(jobs[1].data.sensitiveCustomerEmail).toBe('cfo@beta.com');
  });

  it('redacts jobs belonging to other tenants when tenant context is active (getJobs)', async () => {
    const adapter = new TenantIsolatedBullMQAdapter(mockQueue);

    await requestContext.run({ tenantId: 'tenant-alpha' }, async () => {
      const jobs = await adapter.getJobs(['active']);

      expect(jobs).toHaveLength(3);

      // Job 1 belongs to tenant-alpha -> unredacted
      expect(jobs[0].data.organizationId).toBe('tenant-alpha');
      expect(jobs[0].data.sensitiveCustomerEmail).toBe('ceo@alpha.com');
      expect(jobs[0].data._redacted).toBeUndefined();

      // Job 2 belongs to tenant-beta -> redacted
      expect(jobs[1].data._redacted).toBe(true);
      expect(jobs[1].data.organizationId).toBe('[OUTRA ORGANIZAÇÃO]');
      expect(jobs[1].data.sensitiveCustomerEmail).toBeUndefined();
      expect(jobs[1].data.message).toContain('Isolamento multi-tenant (SEC-003)');

      // Job 3 has no organizationId -> unredacted system job
      expect(jobs[2].data.systemAction).toBe('cleanup');
      expect(jobs[2].data._redacted).toBeUndefined();
    });
  });

  it('redacts a specific job in getJob if it belongs to another organization', async () => {
    const adapter = new TenantIsolatedBullMQAdapter(mockQueue);

    await requestContext.run({ tenantId: 'tenant-alpha' }, async () => {
      const ownJob = await adapter.getJob('job-1');
      expect(ownJob?.data.sensitiveCustomerEmail).toBe('ceo@alpha.com');
      expect(ownJob?.data._redacted).toBeUndefined();

      const otherJob = await adapter.getJob('job-2');
      expect(otherJob?.data._redacted).toBe(true);
      expect(otherJob?.data.organizationId).toBe('[OUTRA ORGANIZAÇÃO]');
      expect(otherJob?.data.sensitiveCustomerEmail).toBeUndefined();
    });
  });

  it('returns null if job is not found', async () => {
    const adapter = new TenantIsolatedBullMQAdapter(mockQueue);
    const notFound = await adapter.getJob('non-existent');
    expect(notFound).toBeNull();
  });
});

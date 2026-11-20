import { describe, expect, it, vi } from 'vitest';
import {
  cancelPendingJobsForOptOut,
  recordOptOutAndPurgePendingJobs,
} from '../../../../src/features/notifications/opt-out/optout.service.js';
import type { OptOutRepository } from '../../../../src/shared/domain/optOut.js';

describe('Opt-Out Real BullMQ Purge (Agente 69 Eli)', () => {
  function createMockQueue(initialJobs: any[]) {
    return {
      name: 'mock-whatsapp-queue',
      getJobs: vi.fn().mockResolvedValue(initialJobs),
    } as any;
  }

  function createMockJob(id: string, data: any) {
    return {
      id,
      data,
      remove: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('removes pending jobs matching leadId from the queue', async () => {
    const job1 = createMockJob('job-1', {
      organizationId: 'org-1',
      context: { leadId: 'lead-target' },
      number: '5511999999999',
    });
    const job2 = createMockJob('job-2', {
      organizationId: 'org-1',
      context: { leadId: 'lead-other' },
      number: '5511888888888',
    });

    const queue = createMockQueue([job1, job2]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-target' },
      queue,
    );

    expect(result.cancelledJobsCount).toBe(1);
    expect(result.jobIds).toContain('job-1');
    expect(job1.remove).toHaveBeenCalledOnce();
    expect(job2.remove).not.toHaveBeenCalled();
  });

  it('removes pending jobs matching phone suffix', async () => {
    const job1 = createMockJob('job-phone-1', {
      organizationId: 'org-1',
      number: '+55 (11) 98765-4321',
    });
    const job2 = createMockJob('job-phone-2', {
      organizationId: 'org-1',
      number: '5511900000000',
    });

    const queue = createMockQueue([job1, job2]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', phoneE164: '+5511987654321' },
      queue,
    );

    expect(result.cancelledJobsCount).toBe(1);
    expect(result.jobIds).toContain('job-phone-1');
    expect(job1.remove).toHaveBeenCalledOnce();
    expect(job2.remove).not.toHaveBeenCalled();
  });

  it('strictly respects multi-tenant boundary (never purges jobs of other organizations)', async () => {
    const jobOrg1 = createMockJob('job-org-1', {
      organizationId: 'org-1',
      context: { leadId: 'lead-shared-id' },
    });
    const jobOrg2 = createMockJob('job-org-2', {
      organizationId: 'org-2',
      context: { leadId: 'lead-shared-id' },
    });

    const queue = createMockQueue([jobOrg1, jobOrg2]);

    const result = await cancelPendingJobsForOptOut(
      { organizationId: 'org-1', leadId: 'lead-shared-id' },
      queue,
    );

    expect(result.cancelledJobsCount).toBe(1);
    expect(result.jobIds).toEqual(['job-org-1']);
    expect(jobOrg1.remove).toHaveBeenCalledOnce();
    expect(jobOrg2.remove).not.toHaveBeenCalled();
  });

  it('recordOptOutAndPurgePendingJobs records opt-out and removes matching queue jobs atomically', async () => {
    const job = createMockJob('job-purge', {
      organizationId: 'org-test',
      number: '5511911112222',
    });
    const queue = createMockQueue([job]);

    const mockRepo: OptOutRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'optout-rec-1',
        organizationId: 'org-test',
        scope: 'channel_whatsapp',
        leadId: null,
        email: null,
        phoneE164: '+5511911112222',
        originChannel: 'whatsapp',
        createdAt: new Date(),
      }),
      findBySubject: vi.fn().mockResolvedValue([]),
    };

    const outcome = await recordOptOutAndPurgePendingJobs(
      mockRepo,
      {
        organizationId: 'org-test',
        scope: 'channel_whatsapp',
        originChannel: 'whatsapp',
        subject: { phoneE164: '+5511911112222' },
      },
      queue,
    );

    expect(outcome.record?.id).toBe('optout-rec-1');
    expect(outcome.purgeResult.cancelledJobsCount).toBe(1);
    expect(job.remove).toHaveBeenCalledOnce();
  });
});

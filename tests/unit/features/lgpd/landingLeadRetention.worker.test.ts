import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLeadFindMany = vi.fn();
const mockLeadFindFirst = vi.fn();
const mockContactFindFirst = vi.fn();
const mockEraseDataSubject = vi.fn();
const mockRecordDeadLetter = vi.fn();
const mockUpsertJobScheduler = vi.fn();

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    lead: {
      findMany: (...args: unknown[]) => mockLeadFindMany(...args),
      findFirst: (...args: unknown[]) => mockLeadFindFirst(...args),
    },
    contact: {
      findFirst: (...args: unknown[]) => mockContactFindFirst(...args),
    },
  },
}));

vi.mock('@/shared/services/dataSubjectErasure.service.js', () => ({
  ANONYMIZED_CONTACT_NAME: '[TITULAR ANONIMIZADO - LGPD]',
  eraseDataSubject: (...args: unknown[]) => mockEraseDataSubject(...args),
}));

vi.mock('@/lib/queue/deadLetter.js', () => ({
  isFinalAttempt: (made: number, max?: number) => made >= (max ?? 1),
  recordDeadLetter: (...args: unknown[]) => mockRecordDeadLetter(...args),
}));

vi.mock('@/lib/queue/metrics.js', () => ({
  registerQueueForMetrics: vi.fn(),
}));

vi.mock('@/lib/queue/redis.js', () => ({
  connection: {},
}));

const workerHandlers: Record<string, (...args: any[]) => void> = {};
let capturedProcessor: ((job: unknown) => Promise<unknown>) | null = null;

vi.mock('bullmq', () => ({
  Worker: class MockWorker {
    constructor(_name: string, processor: (job: unknown) => Promise<unknown>) {
      capturedProcessor = processor;
    }
    on(event: string, cb: (...args: any[]) => void) {
      workerHandlers[event] = cb;
      return this;
    }
  },
  Queue: class MockQueue {
    upsertJobScheduler(...args: unknown[]) {
      return mockUpsertJobScheduler(...args);
    }
  },
}));

const {
  createLandingLeadRetentionWorker,
  runLandingLeadRetentionSweep,
  scheduleLandingLeadRetentionJob,
} = await import('@/features/lgpd/jobs/landingLeadRetention.worker.js');

describe('landingLeadRetention.worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('anonimiza leads elegíveis e pula contatos ausentes, já anonimizados ou com outro lead ativo', async () => {
    mockLeadFindMany.mockResolvedValue([
      { id: 'l-no-contact', organizationId: 'org-1', contactId: null },
      { id: 'l-missing', organizationId: 'org-1', contactId: 'c-missing' },
      { id: 'l-already-anon', organizationId: 'org-1', contactId: 'c-anon' },
      { id: 'l-active-other', organizationId: 'org-1', contactId: 'c-active' },
      { id: 'l-eligible', organizationId: 'org-1', contactId: 'c-eligible' },
    ]);

    mockContactFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'c-anon', name: '[TITULAR ANONIMIZADO - LGPD]' })
      .mockResolvedValueOnce({ id: 'c-active', name: 'Maria' })
      .mockResolvedValueOnce({ id: 'c-eligible', name: 'João' });

    mockLeadFindFirst
      .mockResolvedValueOnce({ id: 'other-active-lead' })
      .mockResolvedValueOnce(null);

    mockEraseDataSubject.mockResolvedValue({});

    const res = await runLandingLeadRetentionSweep();
    expect(res).toEqual({ anonymizedCount: 1 });
    expect(mockEraseDataSubject).toHaveBeenCalledTimes(1);
    expect(mockEraseDataSubject).toHaveBeenCalledWith({
      organizationId: 'org-1',
      contactId: 'c-eligible',
    });
  });

  it('propaga erro quando a query falha e registra dead-letter no worker', async () => {
    mockLeadFindMany.mockRejectedValueOnce(new Error('db down'));
    await expect(runLandingLeadRetentionSweep()).rejects.toThrow('db down');

    createLandingLeadRetentionWorker();
    mockLeadFindMany.mockResolvedValueOnce([]);
    if (capturedProcessor) {
      await capturedProcessor({});
    }

    workerHandlers.failed?.(
      { id: 'j1', name: 'sweep', attemptsMade: 3, opts: { attempts: 3 } },
      new Error('boom'),
    );
    expect(mockRecordDeadLetter).toHaveBeenCalledTimes(1);

    workerHandlers.error?.(new Error('redis offline'));

    await scheduleLandingLeadRetentionJob();
    expect(mockUpsertJobScheduler).toHaveBeenCalledWith(
      'landing-lead-retention-daily',
      { pattern: '15 4 * * *' },
      { name: 'landing-lead-retention-sweep', data: {} },
    );
  });
});

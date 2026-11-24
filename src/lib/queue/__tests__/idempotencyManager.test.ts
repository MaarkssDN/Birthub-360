import { describe, expect, it } from 'vitest';
import { buildDedupJobId, GOVERNED_QUEUE_JOB_OPTIONS } from '../jobPolicy.js';

describe('jobPolicy (MEL-48)', () => {
  it('GOVERNED_QUEUE_JOB_OPTIONS tem retry finito com backoff e retenção limitada', () => {
    expect(GOVERNED_QUEUE_JOB_OPTIONS.attempts).toBe(3);
    expect(GOVERNED_QUEUE_JOB_OPTIONS.backoff).toEqual({
      type: 'exponential',
      delay: 5_000,
    });
    expect(GOVERNED_QUEUE_JOB_OPTIONS.removeOnFail).toBeDefined();
    expect(GOVERNED_QUEUE_JOB_OPTIONS.removeOnComplete).toBeDefined();
  });

  it('buildDedupJobId é determinístico e inclui todos os identificadores', () => {
    expect(buildDedupJobId('crm-push', 'org1', 'lead1', 'abc')).toBe(
      buildDedupJobId('crm-push', 'org1', 'lead1', 'abc'),
    );
    expect(buildDedupJobId('crm-push', 'org1', 'lead1', 'abc')).not.toBe(
      buildDedupJobId('crm-push', 'org1', 'lead1', 'def'),
    );
  });
});

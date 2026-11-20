import { describe, expect, it, vi } from 'vitest';
import {
  executeWebhookJobWithDlq,
  MAX_WEBHOOK_RETRIES,
  type WebhookDlqEntry,
} from '../../../../src/lib/resilience/retry.js';

describe('Webhook Resilience & DLQ (Agente 24 Ivo)', () => {
  it('enforces maximum retries boundary of 5 attempts', () => {
    expect(MAX_WEBHOOK_RETRIES).toBe(5);
  });

  it('re-throws transient errors when attemptsMade < 4 so BullMQ can perform exponential backoff', async () => {
    const mockJob = {
      id: 'job-webhook-transient',
      queueName: 'payment-webhooks',
      data: { invoiceId: 'inv-123', amount: 500 },
      attemptsMade: 2, // 3rd attempt
    };

    const failingHandler = vi.fn().mockRejectedValue(new Error('Gateway timeout 504'));

    await expect(
      executeWebhookJobWithDlq(mockJob, failingHandler),
    ).rejects.toThrow('Gateway timeout 504');

    expect(failingHandler).toHaveBeenCalledOnce();
  });

  it('routes to Dead Letter Queue (DLQ) and emits critical alert upon 5th consecutive failure', async () => {
    const mockJob = {
      id: 'job-webhook-fatal',
      queueName: 'payment-webhooks',
      data: { invoiceId: 'inv-critical-fail', amount: 9999 },
      attemptsMade: 4, // 5th attempt
    };

    const failingHandler = vi.fn().mockRejectedValue(new Error('Card processing service unavailable'));
    const mockDlqQueue = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    const result = await executeWebhookJobWithDlq(mockJob, failingHandler, mockDlqQueue);

    expect(result.success).toBe(false);
    expect(result.sentToDlq).toBe(true);
    expect(result.attemptsMade).toBe(5);
    expect(result.dlqEntry).toBeDefined();
    expect(result.dlqEntry?.reason).toBe('max_retries_exceeded');
    expect(result.dlqEntry?.originalJobId).toBe('job-webhook-fatal');

    expect(mockDlqQueue.add).toHaveBeenCalledWith(
      'dead-letter-webhook',
      expect.objectContaining({
        originalJobId: 'job-webhook-fatal',
        attemptsMade: 5,
        reason: 'max_retries_exceeded',
      }),
    );
  });
});

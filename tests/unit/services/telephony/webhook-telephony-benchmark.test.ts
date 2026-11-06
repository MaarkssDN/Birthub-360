import { describe, expect, it, vi } from 'vitest';
import { telephonyWebhookHandler } from '../../../../src/services/telephony/webhookHandler.service.js';

vi.mock('../../../../src/features/integrations/threecx/threecx.service.js', () => ({
  process3CXWebhook: vi.fn().mockResolvedValue({ status: 'processed', organizationId: 'org-1' }),
}));

describe('TelephonyWebhookHandler — Asynchronous Buffer & Benchmark', () => {
  it('responde 202 accepted imediatamente em menos de 50ms', async () => {
    const start = performance.now();
    const result = await telephonyWebhookHandler.handleIncoming3CXWebhook({
      eventType: 'CallEnded',
      callId: 'call-123',
    });
    const elapsed = performance.now() - start;

    expect(result.accepted).toBe(true);
    expect(result.queued).toBe(true);
    expect(result.jobId).toMatch(/^3cx-/);
    expect(elapsed).toBeLessThan(50);
  });

  it('suporta rajada concorrente de 50 requests mantendo latencia minima', async () => {
    const start = performance.now();
    const requests = Array.from({ length: 50 }, (_, i) =>
      telephonyWebhookHandler.handleIncoming3CXWebhook({
        eventType: 'CallEnded',
        callId: `call-burst-${i}`,
      }),
    );

    const results = await Promise.all(requests);
    const totalElapsed = performance.now() - start;

    expect(results).toHaveLength(50);
    expect(results.every((r) => r.accepted)).toBe(true);
    expect(totalElapsed).toBeLessThan(80); // Criterio do handoff: < 80ms sob carga
  });
});

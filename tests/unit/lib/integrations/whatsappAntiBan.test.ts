import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateAntiBanDelay,
  MAX_ANTI_BAN_DELAY_MS,
  MIN_ANTI_BAN_DELAY_MS,
  WhatsAppAntiBanThrottler,
} from '../../../../src/lib/integrations/whatsapp/baileys.client.js';

describe('WhatsApp Anti-Ban Throttler & Delay Calculation (Agente 56 Luna)', () => {
  let throttler: WhatsAppAntiBanThrottler;

  beforeEach(() => {
    throttler = new WhatsAppAntiBanThrottler();
  });

  it('calculates pseudo-random delays strictly bounded within [3000ms, 8000ms]', () => {
    expect(MIN_ANTI_BAN_DELAY_MS).toBe(3000);
    expect(MAX_ANTI_BAN_DELAY_MS).toBe(8000);

    const samples: number[] = [];
    for (let i = 0; i < 50; i++) {
      const delay = calculateAntiBanDelay();
      expect(delay).toBeGreaterThanOrEqual(MIN_ANTI_BAN_DELAY_MS);
      expect(delay).toBeLessThanOrEqual(MAX_ANTI_BAN_DELAY_MS);
      samples.push(delay);
    }

    const uniqueSamples = new Set(samples);
    expect(uniqueSamples.size).toBeGreaterThan(5); // Guarantees variance, not static
  });

  it('updates dispatch records per organization correctly', async () => {
    const orgId = 'org-tenant-alpha';

    // Fast mock throttle using a small custom delay
    const delay = await throttler.throttle(orgId, 10);
    expect(delay).toBe(10);

    const record = throttler.getRecord(orgId);
    expect(record).toBeDefined();
    expect(record?.totalDispatched).toBe(1);
    expect(record?.lastDispatchedAt).toBeGreaterThan(0);
  });

  it('isolates dispatch records between different organizations', async () => {
    await throttler.throttle('tenant-A', 5);
    await throttler.throttle('tenant-B', 5);

    expect(throttler.getRecord('tenant-A')?.totalDispatched).toBe(1);
    expect(throttler.getRecord('tenant-B')?.totalDispatched).toBe(1);
  });
});

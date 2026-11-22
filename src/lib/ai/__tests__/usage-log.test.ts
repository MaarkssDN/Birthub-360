// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ create: vi.fn(), price: vi.fn(() => 0.02) }));
vi.mock('../../prisma.js', () => ({ prisma: { aILog: { create: mocks.create } } }));
vi.mock('../../logger.js', () => ({ logger: { warn: vi.fn() } }));
vi.mock('../gateway/pricing.js', () => ({ estimateCostUsd: mocks.price }));

import { requestContext } from '../../async-context.js';
import { logAiUsage } from '../usage-log.js';

const input = {
  model: 'local-model',
  latencyMs: 10,
  usage: { totalTokens: 20, promptTokens: 10, completionTokens: 10 },
};
beforeEach(() => vi.clearAllMocks());
describe('usage ledger with mocked database', () => {
  it('persists explicit zero provider charge for local execution', async () => {
    await requestContext.run({ tenantId: 'tenant-a' }, () =>
      logAiUsage({ ...input, costInUsd: 0 }),
    );
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ cost: 0, organizationId: 'tenant-a' }),
    });
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it('preserves existing price estimation when no cost supplied', async () => {
    await requestContext.run({ tenantId: 'tenant-a' }, () => logAiUsage(input));
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ cost: 0.02 }) });
  });
  it('takes tenant from authenticated request context instead of caller override', async () => {
    await requestContext.run({ tenantId: 'tenant-a' }, () =>
      logAiUsage({ ...input, organizationId: 'tenant-b', costInUsd: 0.001 }),
    );
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'tenant-a', cost: 0.001 }),
    });
  });
});

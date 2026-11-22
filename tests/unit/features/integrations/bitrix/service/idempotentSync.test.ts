import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from '../../../../../../src/features/integrations/bitrix/service/client.js';
import {
  BitrixPaginationError,
  acquireBitrixSyncLock,
  callBitrixPaginated,
  releaseBitrixSyncLock,
} from '../../../../../../src/features/integrations/bitrix/service/idempotentSync.js';

describe('Bitrix idempotentSync & Pagination', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('manages idempotency locks correctly', () => {
    const org = 'org_123';
    const entityId = 'lead_999';

    // First acquisition succeeds
    const lock1 = acquireBitrixSyncLock(org, 'lead', entityId);
    expect(lock1).toBe(true);

    // Immediate duplicate acquisition fails
    const lock2 = acquireBitrixSyncLock(org, 'lead', entityId);
    expect(lock2).toBe(false);

    // After release, acquisition succeeds again
    releaseBitrixSyncLock(org, 'lead', entityId);
    const lock3 = acquireBitrixSyncLock(org, 'lead', entityId);
    expect(lock3).toBe(true);
    releaseBitrixSyncLock(org, 'lead', entityId);
  });

  it('paginates multi-page results seamlessly', async () => {
    const spy = vi
      .spyOn(clientModule, 'callBitrix')
      .mockImplementation(async (_url, _method, params) => {
        const start = (params as any)?.start || 0;
        if (start === 0) {
          return { result: [{ ID: '1' }, { ID: '2' }], next: 2, total: 4 };
        }
        return { result: [{ ID: '3' }, { ID: '4' }], total: 4 };
      });

    const res = await callBitrixPaginated<{ ID: string }>(
      'http://bitrix.test/webhook/',
      'crm.lead.list',
      {},
    );
    expect(res.items.length).toBe(4);
    expect(res.pagesProcessed).toBe(2);
    expect(res.exhausted).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('throws BitrixPaginationError when response format is invalid', async () => {
    vi.spyOn(clientModule, 'callBitrix').mockResolvedValue(null as any);

    await expect(
      callBitrixPaginated('http://bitrix.test/webhook/', 'crm.lead.list', {}),
    ).rejects.toThrow(BitrixPaginationError);
  });
});

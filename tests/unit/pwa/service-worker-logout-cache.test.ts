import { describe, expect, it, vi, beforeEach } from 'vitest';
import { pwaCachePurgeService } from '../../../src/serviceWorkerRegistration.js';

describe('PwaCachePurgeService — Cache Storage Purge on Logout (B-10)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deleta caches de dados de negocio ao acionar logout garantindo isolamento offline', async () => {
    const existingCaches = ['birthhub-api-v1', 'birthhub-leads-cache', 'static-assets-v1'];
    const deletedKeys: string[] = [];

    // Mock da CacheStorage API
    const mockCaches = {
      keys: vi.fn().mockResolvedValue(existingCaches),
      delete: vi.fn().mockImplementation((key: string) => {
        deletedKeys.push(key);
        return Promise.resolve(true);
      }),
    };

    vi.stubGlobal('caches', mockCaches);

    const purged = await pwaCachePurgeService.purgeOnLogout();

    expect(purged).toContain('birthhub-api-v1');
    expect(purged).toContain('birthhub-leads-cache');
    expect(deletedKeys).toContain('birthhub-api-v1');
    expect(deletedKeys).toContain('birthhub-leads-cache');
  });
});

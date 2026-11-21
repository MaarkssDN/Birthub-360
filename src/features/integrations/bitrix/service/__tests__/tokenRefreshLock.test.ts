import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DistributedLock } from '../../../../../lib/queue/distributedLock.js';
import {
  type BitrixOAuthTokenState,
  buildBitrixTokenRefreshLockKey,
  refreshBitrixTokenWithLock,
} from '../tokenRefreshLock.js';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { acquireDistributedLockMock } = vi.hoisted(() => ({
  acquireDistributedLockMock: vi.fn<
    (key: string, ttlSeconds: number) => Promise<DistributedLock>
  >(),
}));

vi.mock('../../../../../lib/queue/distributedLock.js', () => ({
  acquireDistributedLock: acquireDistributedLockMock,
}));

describe('[51 · Bela] Lock atômico distribuído no Redis para renovação de tokens Bitrix24', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adquire o lock distribuído com chave isolada por tenant+conexão, renova o token e libera o lock no final', async () => {
    const releaseMock = vi.fn().mockResolvedValue(undefined);
    acquireDistributedLockMock.mockResolvedValue({
      runId: 'run-1',
      acquired: true,
      reason: 'acquired',
      renew: vi.fn().mockResolvedValue(true),
      release: releaseMock,
    });

    const expired: BitrixOAuthTokenState = {
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresAtMs: Date.now() - 10_000,
    };
    const renewed: BitrixOAuthTokenState = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresAtMs: Date.now() + 3_600_000,
    };

    const loadTokens = vi.fn().mockResolvedValue(expired);
    const performRefresh = vi.fn().mockResolvedValue(renewed);

    const result = await refreshBitrixTokenWithLock({
      organizationId: 'org-1',
      connectionId: 'conn-1',
      lockTtlSeconds: 25,
      loadTokens,
      performRefresh,
    });

    expect(acquireDistributedLockMock).toHaveBeenCalledWith(
      buildBitrixTokenRefreshLockKey('org-1', 'conn-1'),
      25,
    );
    expect(performRefresh).toHaveBeenCalledTimes(1);
    expect(performRefresh).toHaveBeenCalledWith('old-refresh');
    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tokens: renewed, refreshed: true });
  });

  it('evita corrida quando duas réplicas tentam renovar simultaneamente: a segunda reaproveita o token renovado sem chamar performRefresh', async () => {
    const expired: BitrixOAuthTokenState = {
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresAtMs: Date.now() - 5_000,
    };
    const renewed: BitrixOAuthTokenState = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresAtMs: Date.now() + 3_600_000,
    };

    acquireDistributedLockMock.mockResolvedValue({
      runId: 'run-contended',
      acquired: false,
      reason: 'contended',
      renew: vi.fn().mockResolvedValue(false),
      release: vi.fn().mockResolvedValue(undefined),
    });

    const loadTokens = vi
      .fn()
      .mockResolvedValueOnce(expired)
      .mockResolvedValueOnce(renewed);
    const performRefresh = vi.fn();

    const result = await refreshBitrixTokenWithLock({
      organizationId: 'org-1',
      connectionId: 'conn-1',
      loadTokens,
      performRefresh,
    });

    expect(performRefresh).not.toHaveBeenCalled();
    expect(result).toEqual({ tokens: renewed, refreshed: false });
  });

  it('falha fechado (503) quando o Redis está indisponível para o lock distribuído', async () => {
    acquireDistributedLockMock.mockResolvedValue({
      runId: 'run-err',
      acquired: false,
      reason: 'redis-unavailable',
      renew: vi.fn().mockResolvedValue(false),
      release: vi.fn().mockResolvedValue(undefined),
    });

    const expired: BitrixOAuthTokenState = {
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresAtMs: Date.now() - 5_000,
    };

    const performRefresh = vi.fn();
    await expect(
      refreshBitrixTokenWithLock({
        organizationId: 'org-1',
        connectionId: 'conn-1',
        loadTokens: vi.fn().mockResolvedValue(expired),
        performRefresh,
      }),
    ).rejects.toThrow(/fail-closed/i);

    expect(performRefresh).not.toHaveBeenCalled();
  });
});

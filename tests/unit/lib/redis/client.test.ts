import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../../src/lib/queue/redis.js', () => ({
  cacheConnection: { ping: vi.fn(async () => 'PONG') },
  redisConfigured: false,
}));

const {
  getRedisClient,
  isRedisConfigured,
  pingRedisClient,
  redisClient,
  resetRedisClientForTesting,
  setRedisClientForTesting,
} = await import('../../../../src/lib/redis/client.js');
const { cacheConnection } = await import('../../../../src/lib/queue/redis.js');
const { logger } = await import('../../../../src/lib/logger.js');

function makeClient() {
  return {
    get: vi.fn(async () => 'v'),
    set: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
    scan: vi.fn(async () => ['0', ['k']] as [string, string[]]),
    exists: vi.fn(async () => 1),
    expire: vi.fn(async () => 1),
    ttl: vi.fn(async () => 42),
    ping: vi.fn(async () => 'PONG'),
  };
}

describe('src/lib/redis/client.ts', () => {
  afterEach(() => resetRedisClientForTesting());

  it('usa a conexão padrão e reporta configuração sem override', () => {
    expect(getRedisClient()).toBe(cacheConnection);
    expect(isRedisConfigured()).toBe(false);
  });

  it('usa o cliente injetado e o considera configurado', () => {
    const c = makeClient();
    setRedisClientForTesting(c);
    expect(getRedisClient()).toBe(c);
    expect(isRedisConfigured()).toBe(true);
  });

  it('pingRedisClient retorna true/false e loga falha', async () => {
    const c = makeClient();
    expect(await pingRedisClient(c)).toBe(true);
    c.ping.mockResolvedValueOnce('NOPE');
    expect(await pingRedisClient(c)).toBe(false);
    c.ping.mockRejectedValueOnce(new Error('down'));
    expect(await pingRedisClient(c)).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
    expect(await pingRedisClient()).toBe(true);
  });

  it('redisClient delega todas as operações ao cliente ativo', async () => {
    const c = makeClient();
    setRedisClientForTesting(c);
    expect(await redisClient.get('a')).toBe('v');
    expect(await redisClient.set('a', 'b', 'EX', 10)).toBe('OK');
    expect(c.set).toHaveBeenCalledWith('a', 'b', 'EX', 10);
    expect(await redisClient.del('a', 'b')).toBe(1);
    expect(await redisClient.scan(0, 'MATCH', 'x*')).toEqual(['0', ['k']]);
    expect(await redisClient.exists('a')).toBe(1);
    expect(await redisClient.expire('a', 5)).toBe(1);
    expect(await redisClient.ttl('a')).toBe(42);
    expect(await redisClient.ping()).toBe('PONG');
  });
});

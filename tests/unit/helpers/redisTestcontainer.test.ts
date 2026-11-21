import { describe, expect, it } from 'vitest';
import {
  REDIS_PORT,
  REDIS_TESTCONTAINER_IMAGE,
  startRedisTestcontainer,
} from '../../helpers/redisTestcontainer.js';

describe('Agente 02 (Bento) - Testcontainers Redis Harness', () => {
  it('exporta configuração canônica do container Redis 7 Alpine e factory assíncrona', () => {
    expect(REDIS_TESTCONTAINER_IMAGE).toBe('redis:7-alpine');
    expect(REDIS_PORT).toBe(6379);
    expect(typeof startRedisTestcontainer).toBe('function');
  });
});

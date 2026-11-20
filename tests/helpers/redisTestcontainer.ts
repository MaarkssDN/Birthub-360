import Redis from 'ioredis';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';

export interface EphemeralRedisInstance {
  container: StartedTestContainer;
  redisUrl: string;
  client: Redis;
  stop: () => Promise<void>;
}

export const REDIS_TESTCONTAINER_IMAGE = 'redis:7-alpine';
export const REDIS_PORT = 6379;

/**
 * Harness de Testcontainers para Redis nos testes de integração — Agente 02 (Bento).
 * Substitui mocks estáticos por uma instância real efêmera do Redis 7 quando
 * o daemon Docker está ativo (ex.: CI ou RUN_INFRA_TESTS=1).
 */
export async function startRedisTestcontainer(
  image: string = REDIS_TESTCONTAINER_IMAGE,
): Promise<EphemeralRedisInstance> {
  const container = await new GenericContainer(image)
    .withExposedPorts(REDIS_PORT)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(REDIS_PORT);
  const redisUrl = `redis://${host}:${port}`;
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    lazyConnect: false,
  });

  const stop = async (): Promise<void> => {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    await container.stop();
  };

  return {
    container,
    redisUrl,
    client,
    stop,
  };
}

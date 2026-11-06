import type { Server } from 'node:http';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/lib/queue/redis.js', () => ({
  connection: {
    duplicate: vi.fn(),
    publish: vi.fn(),
  },
  queuesEnabled: false,
}));

import { createGracefulShutdown } from '../../../../src/bootstrap/shutdown.js';
import type { EmbeddedWorkersHandle } from '../../../../src/bootstrap/workers.js';
import { sseService } from '../../../../src/features/notifications/sse.service.js';

function createMockSseClient() {
  const chunks: string[] = [];
  let ended = false;
  const closeHandlers: Array<() => void> = [];

  const req = {
    on: vi.fn((event: string, cb: () => void) => {
      if (event === 'close') closeHandlers.push(cb);
    }),
  } as unknown as Request;

  const res = {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => {
      if (ended) throw new Error('write after end');
      chunks.push(chunk);
      return true;
    }),
    end: vi.fn(() => {
      ended = true;
    }),
  } as unknown as Response;

  return { req, res, chunks, isEnded: () => ended };
}

describe('SSE Coordinated Graceful Drain on SIGTERM (DIV-AGENTE-10-002)', () => {
  beforeEach(async () => {
    await sseService.closeAll();
  });

  it('sends event: server_shutdown with reconnectAfterMs to all connected SSE clients before closing sockets', async () => {
    const clientA = createMockSseClient();
    const clientB = createMockSseClient();

    sseService.addClient(clientA.req, clientA.res, 'org-a');
    sseService.addClient(clientB.req, clientB.res, 'org-b');

    expect(sseService.getActiveClientCount()).toBe(2);

    const mockServer = {
      close: vi.fn((cb?: (err?: Error) => void) => cb?.()),
    } as unknown as Server;

    const mockConn = {
      quit: vi.fn().mockResolvedValue('OK'),
      disconnect: vi.fn(),
    };

    const exitSpy = vi.fn();

    const shutdown = createGracefulShutdown({
      httpServer: mockServer,
      workers: {} as EmbeddedWorkersHandle,
      sseService,
      prisma: { $disconnect: vi.fn().mockResolvedValue(undefined) },
      shutdownLangfuse: vi.fn().mockResolvedValue(undefined),
      connection: mockConn,
      rateLimiterConnection: mockConn,
      cacheConnection: mockConn,
      logger: { info: vi.fn(), error: vi.fn() },
      exit: exitSpy,
    });

    await shutdown('SIGTERM');

    expect(clientA.chunks.some((c) => c.includes('event: server_shutdown'))).toBe(true);
    expect(clientA.chunks.some((c) => c.includes('"reconnectAfterMs":3000'))).toBe(true);
    expect(clientA.isEnded()).toBe(true);

    expect(clientB.chunks.some((c) => c.includes('event: server_shutdown'))).toBe(true);
    expect(clientB.isEnded()).toBe(true);

    expect(sseService.getActiveClientCount()).toBe(0);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});

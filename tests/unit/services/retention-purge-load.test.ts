import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  aiLogFindManyMock,
  aiLogDeleteManyMock,
  bitrixFindManyMock,
  bitrixDeleteManyMock,
  crmFindManyMock,
  crmDeleteManyMock,
} = vi.hoisted(() => ({
  aiLogFindManyMock: vi.fn(),
  aiLogDeleteManyMock: vi.fn(),
  bitrixFindManyMock: vi.fn(),
  bitrixDeleteManyMock: vi.fn(),
  crmFindManyMock: vi.fn(),
  crmDeleteManyMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aILog: {
      findMany: aiLogFindManyMock,
      deleteMany: aiLogDeleteManyMock,
    },
    bitrixSyncLog: {
      findMany: bitrixFindManyMock,
      deleteMany: bitrixDeleteManyMock,
    },
    externalCrmSyncLog: {
      findMany: crmFindManyMock,
      deleteMany: crmDeleteManyMock,
    },
  },
}));

import { executeRetentionPurge } from '@/shared/services/retentionPurge.service.js';

beforeEach(() => {
  aiLogFindManyMock.mockReset();
  aiLogDeleteManyMock.mockReset();
  bitrixFindManyMock.mockReset();
  bitrixDeleteManyMock.mockReset();
  crmFindManyMock.mockReset();
  crmDeleteManyMock.mockReset();

  aiLogFindManyMock.mockResolvedValue([]);
  aiLogDeleteManyMock.mockResolvedValue({ count: 0 });
  bitrixFindManyMock.mockResolvedValue([]);
  bitrixDeleteManyMock.mockResolvedValue({ count: 0 });
  crmFindManyMock.mockResolvedValue([]);
  crmDeleteManyMock.mockResolvedValue({ count: 0 });
});

describe('Retention Purge & Log Archiving Service (DIV-AGENTE-01A-002)', () => {
  it('executa purga em múltiplos lotes (batching) até esgotar registros expirados', async () => {
    // Simula 2 lotes de 100 registros em AILog e depois vazio
    aiLogFindManyMock
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => ({ id: `ai-${i}` })))
      .mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => ({ id: `ai-second-${i}` })))
      .mockResolvedValueOnce([]);

    aiLogDeleteManyMock
      .mockResolvedValueOnce({ count: 100 })
      .mockResolvedValueOnce({ count: 50 });

    const result = await executeRetentionPurge({
      batchSize: 100,
      sleepBetweenBatchesMs: 0,
      policy: { aiLogDays: 90 },
      now: new Date('2026-11-01T00:00:00Z'),
    });

    expect(result.deletedAILogs).toBe(150);
    expect(result.batchesExecuted).toBe(2);
    expect(aiLogFindManyMock).toHaveBeenCalledTimes(2);
    expect(aiLogDeleteManyMock).toHaveBeenCalledTimes(2);
    expect(result.cutoffDates.aiLog.toISOString()).toBe('2026-08-03T00:00:00.000Z');
  });

  it('filtra por tenant específico quando organizationId for providenciado', async () => {
    aiLogFindManyMock.mockResolvedValueOnce([{ id: 'ai-tenant-1' }]);
    aiLogDeleteManyMock.mockResolvedValueOnce({ count: 1 });

    const result = await executeRetentionPurge({
      organizationId: 'org-tenant-specific',
      batchSize: 50,
      sleepBetweenBatchesMs: 0,
    });

    expect(result.deletedAILogs).toBe(1);
    expect(aiLogFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-tenant-specific',
        }),
      }),
    );
  });
});

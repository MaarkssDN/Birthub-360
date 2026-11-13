import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * TAREFA-SANEAMENTO-021 (BT360-DT-0035 / DIV-06A-003): rotina de purga periódica dos arquivos
 * temporários de extrações Bitrix antigas. O worker (`bitrixExtractionPurge.worker.ts`, Onda 42)
 * já existia registrado em `src/bootstrap/workers.ts`, mas não tinha NENHUM teste — estes casos
 * cobrem os caminhos de sucesso e de falha do critério de aceite da tarefa.
 *
 * `env` é mockado com um objeto mutável para alternar `BITRIX_EXTRACTION_PURGE_ENABLED` entre
 * casos sem depender de variáveis de ambiente do processo de teste.
 */
const mockEnv = {
  BITRIX_EXTRACTION_RETENTION_DAYS: 45,
  BITRIX_EXTRACTION_PURGE_ENABLED: true,
};
vi.mock('@/config/env.js', () => ({ env: mockEnv }));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const auditServiceMock = { log: vi.fn() };
vi.mock('@/lib/audit/audit.service', () => ({ AuditService: auditServiceMock }));

const prismaMock = {
  organization: { findMany: vi.fn() },
  bitrixExtractionRun: { findMany: vi.fn(), update: vi.fn() },
};
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const filesMock = { deleteExtractionRunFiles: vi.fn() };
vi.mock('../../service/extractionFiles.js', () => filesMock);

// bullmq/redis não devem abrir conexão real em teste unitário — mesmo padrão de
// src/lib/queue/__tests__/newsMonitor.worker.test.ts.
vi.mock('bullmq', () => ({
  Queue: class {
    on() {}
  },
  Worker: class {
    on() {}
  },
}));
vi.mock('@/lib/queue/redis.js', () => ({ connection: {} }));
vi.mock('@/lib/queue/deadLetter.js', () => ({
  isFinalAttempt: vi.fn(),
  recordDeadLetter: vi.fn(),
}));
vi.mock('@/lib/queue/metrics.js', () => ({ registerQueueForMetrics: vi.fn() }));

const { runBitrixExtractionPurgeSweep } = await import('../bitrixExtractionPurge.worker.js');

function expiredRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run-old',
    filters: { period: 'last7days', search: 'joao@empresa.com' },
    progress: { entities: [] },
    errorMessage: 'erro com dado pessoal',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnv.BITRIX_EXTRACTION_RETENTION_DAYS = 45;
  mockEnv.BITRIX_EXTRACTION_PURGE_ENABLED = true;
  prismaMock.organization.findMany.mockResolvedValue([{ id: 'org-1' }]);
  prismaMock.bitrixExtractionRun.findMany.mockResolvedValue([]);
  prismaMock.bitrixExtractionRun.update.mockResolvedValue({});
  filesMock.deleteExtractionRunFiles.mockResolvedValue(undefined);
});

describe('runBitrixExtractionPurgeSweep — TAREFA-SANEAMENTO-021', () => {
  it('flag desligada: não consulta organização nem extração alguma (fail-safe)', async () => {
    mockEnv.BITRIX_EXTRACTION_PURGE_ENABLED = false;

    const result = await runBitrixExtractionPurgeSweep();

    expect(result).toMatchObject({ enabled: false, purgedCount: 0 });
    expect(prismaMock.organization.findMany).not.toHaveBeenCalled();
    expect(prismaMock.bitrixExtractionRun.findMany).not.toHaveBeenCalled();
    expect(filesMock.deleteExtractionRunFiles).not.toHaveBeenCalled();
  });

  it('expurga execução antiga: apaga arquivos do disco e anonimiza a linha (files=null, search removido, purgedAt gravado)', async () => {
    prismaMock.bitrixExtractionRun.findMany.mockResolvedValue([expiredRun()]);

    const result = await runBitrixExtractionPurgeSweep();

    expect(result).toMatchObject({ enabled: true, purgedCount: 1, organizationsProcessed: 1 });

    // Arquivo primeiro, linha depois — o expurgo real do dado pessoal exportado.
    expect(filesMock.deleteExtractionRunFiles).toHaveBeenCalledWith('org-1', 'run-old');
    expect(filesMock.deleteExtractionRunFiles.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMock.bitrixExtractionRun.update.mock.invocationCallOrder[0],
    );

    expect(prismaMock.bitrixExtractionRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-old' },
        data: expect.objectContaining({
          files: null,
          errorMessage: '[erro anonimizado — LGPD]',
          purgedAt: expect.any(Date),
        }),
      }),
    );
    const updateData = prismaMock.bitrixExtractionRun.update.mock.calls[0][0].data;
    // `filters.search` (texto livre, pode conter dado pessoal) é removido; o resto do filtro fica.
    expect(updateData.filters).toEqual({ period: 'last7days' });
    // `progress` preserva o registro estatístico e ganha a marca de expurgo (idempotência).
    expect(updateData.progress).toMatchObject({ entities: [], purgedAt: expect.any(String) });
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        entity: 'BitrixExtractionRun',
        entityId: 'run-old',
        tenantId: 'org-1',
      }),
    );
  });

  it('consulta apenas execuções em estado terminal e mais antigas que a retenção, com purgedAt nulo', async () => {
    await runBitrixExtractionPurgeSweep();

    expect(prismaMock.bitrixExtractionRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          status: { in: ['completed', 'completed_partial', 'failed', 'cancelled'] },
          purgedAt: null,
        }),
      }),
    );
    const cutoff =
      prismaMock.bitrixExtractionRun.findMany.mock.calls[0][0].where.createdAt.lte;
    const expectedCutoff = new Date();
    expectedCutoff.setDate(expectedCutoff.getDate() - 45);
    // Margem de alguns segundos entre a montagem do cutoff dentro do worker e a asserção aqui.
    expect(Math.abs(cutoff.getTime() - expectedCutoff.getTime())).toBeLessThan(10_000);
  });

  it('pula linha já marcada como expurgada dentro de progress (defesa em profundidade da idempotência)', async () => {
    prismaMock.bitrixExtractionRun.findMany.mockResolvedValue([
      expiredRun({ progress: { entities: [], purgedAt: '2026-01-01T00:00:00.000Z' } }),
    ]);

    const result = await runBitrixExtractionPurgeSweep();

    expect(result.purgedCount).toBe(0);
    expect(filesMock.deleteExtractionRunFiles).not.toHaveBeenCalled();
    expect(prismaMock.bitrixExtractionRun.update).not.toHaveBeenCalled();
  });

  it('falha em UMA execução não impede as demais da mesma organização nem as outras organizações', async () => {
    prismaMock.organization.findMany.mockResolvedValue([{ id: 'org-1' }, { id: 'org-2' }]);
    prismaMock.bitrixExtractionRun.findMany
      .mockResolvedValueOnce([expiredRun({ id: 'run-bad' }), expiredRun({ id: 'run-good' })])
      .mockResolvedValueOnce([expiredRun({ id: 'run-org2' })]);
    filesMock.deleteExtractionRunFiles
      .mockRejectedValueOnce(new Error('ENOSPC: sem espaço em disco'))
      .mockResolvedValue(undefined);

    const result = await runBitrixExtractionPurgeSweep();

    expect(result.purgedCount).toBe(2); // run-good + run-org2 — run-bad falhou e foi pulada
    expect(prismaMock.bitrixExtractionRun.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.bitrixExtractionRun.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'run-bad' } }),
    );
  });

  it('falha ao listar organizações/extrações de uma organização não derruba a varredura inteira', async () => {
    prismaMock.organization.findMany.mockResolvedValue([{ id: 'org-1' }, { id: 'org-2' }]);
    prismaMock.bitrixExtractionRun.findMany
      .mockRejectedValueOnce(new Error('connection reset'))
      .mockResolvedValueOnce([expiredRun({ id: 'run-org2' })]);

    const result = await runBitrixExtractionPurgeSweep();

    expect(result).toMatchObject({ enabled: true, purgedCount: 1, organizationsProcessed: 2 });
    expect(filesMock.deleteExtractionRunFiles).toHaveBeenCalledWith('org-2', 'run-org2');
  });
});

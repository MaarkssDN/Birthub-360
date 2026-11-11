import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IEnrichmentRepository } from '@/features/prospecting/domain/IEnrichmentRepository';
import {
  computeEnrichmentLogCutoff,
  enrichCompany,
  getEnrichmentLogRetentionMs,
  maybePurgeExpiredEnrichmentLogs,
  purgeExpiredEnrichmentLogs,
  resetEnrichmentLogPurgeThrottleForTests,
} from '@/features/prospecting/services/enrichment.service';
import { logger } from '@/lib/logger';

// TAREFA-SANEAMENTO-019 / BT360-DT-0027 — ciclo de vida (TTL/expurgo) do cache de enriquecimento.
// O acúmulo real é a tabela `EnrichmentLog`: cada runEnrichment grava ~7 linhas com payload bruto
// do provider em `rawData` e nada as removia. Estes testes cobrem a política de retenção
// (default 60 dias, configurável via ENRICHMENT_LOG_RETENTION_DAYS), o corte temporal, o expurgo
// efetivo via repositório, o throttle oportunista de 24h e o caminho de falha (erro de banco no
// expurgo não pode derrubar o enriquecimento, mas precisa ser observável via logger.warn).

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function makeRepo(overrides: Partial<IEnrichmentRepository> = {}): IEnrichmentRepository {
  return {
    findCompanyById: vi.fn(),
    updateCompany: vi.fn(),
    findContactsEmailsAndPhones: vi.fn(),
    createContacts: vi.fn(),
    createEnrichmentLog: vi.fn(),
    deleteEnrichmentLogsCreatedBefore: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as IEnrichmentRepository;
}

const DAY_MS = 24 * 60 * 60 * 1000;

describe('getEnrichmentLogRetentionMs', () => {
  it('usa 60 dias como default quando a env não está definida', () => {
    expect(getEnrichmentLogRetentionMs({} as NodeJS.ProcessEnv)).toBe(60 * DAY_MS);
  });

  it('respeita ENRICHMENT_LOG_RETENTION_DAYS quando configurada com valor válido', () => {
    expect(
      getEnrichmentLogRetentionMs({
        ENRICHMENT_LOG_RETENTION_DAYS: '30',
      } as NodeJS.ProcessEnv),
    ).toBe(30 * DAY_MS);
  });

  it('cai no default de 60 dias quando a env é inválida (não-numérica, zero ou negativa)', () => {
    for (const value of ['abc', '0', '-5']) {
      expect(
        getEnrichmentLogRetentionMs({
          ENRICHMENT_LOG_RETENTION_DAYS: value,
        } as NodeJS.ProcessEnv),
      ).toBe(60 * DAY_MS);
    }
  });
});

describe('computeEnrichmentLogCutoff', () => {
  it('retorna now - retentionMs', () => {
    const now = new Date('2026-11-10T12:00:00.000Z');
    const cutoff = computeEnrichmentLogCutoff(now, 60 * DAY_MS);
    expect(cutoff.toISOString()).toBe('2026-09-11T12:00:00.000Z');
  });
});

describe('purgeExpiredEnrichmentLogs', () => {
  it('chama deleteEnrichmentLogsCreatedBefore com o cutoff now - retenção e devolve a contagem', async () => {
    const repo = makeRepo();
    vi.mocked(repo.deleteEnrichmentLogsCreatedBefore).mockResolvedValue(42);
    const now = new Date('2026-11-10T12:00:00.000Z');

    const deleted = await purgeExpiredEnrichmentLogs(repo, { now, retentionMs: 30 * DAY_MS });

    expect(deleted).toBe(42);
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledTimes(1);
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledWith(
      new Date('2026-10-11T12:00:00.000Z'),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('sem retenção explícita usa o default de 60 dias', async () => {
    const repo = makeRepo();
    const now = new Date('2026-11-10T12:00:00.000Z');

    await purgeExpiredEnrichmentLogs(repo, { now });

    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledWith(
      new Date('2026-09-11T12:00:00.000Z'),
    );
  });

  it('propaga o erro do repositório (tratamento explícito fica a cargo do chamador)', async () => {
    const repo = makeRepo();
    vi.mocked(repo.deleteEnrichmentLogsCreatedBefore).mockRejectedValue(
      new Error('db indisponível'),
    );

    await expect(purgeExpiredEnrichmentLogs(repo)).rejects.toThrow('db indisponível');
  });
});

describe('maybePurgeExpiredEnrichmentLogs', () => {
  beforeEach(() => {
    resetEnrichmentLogPurgeThrottleForTests();
    vi.clearAllMocks();
  });

  it('executa o expurgo na primeira chamada e respeita o throttle de 24h nas seguintes', async () => {
    const repo = makeRepo();
    const t0 = new Date('2026-11-10T12:00:00.000Z');

    await maybePurgeExpiredEnrichmentLogs(repo, t0);
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledTimes(1);

    // 1h depois: dentro do intervalo — não tenta de novo.
    await maybePurgeExpiredEnrichmentLogs(repo, new Date(t0.getTime() + 60 * 60 * 1000));
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledTimes(1);

    // 25h depois: novo ciclo de retenção.
    await maybePurgeExpiredEnrichmentLogs(repo, new Date(t0.getTime() + 25 * 60 * 60 * 1000));
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledTimes(2);
  });

  it('falha do banco no expurgo é observável (logger.warn) e retorna 0 sem lançar', async () => {
    const repo = makeRepo();
    vi.mocked(repo.deleteEnrichmentLogsCreatedBefore).mockRejectedValue(
      new Error('connection reset'),
    );

    const deleted = await maybePurgeExpiredEnrichmentLogs(
      repo,
      new Date('2026-11-10T12:00:00.000Z'),
    );

    expect(deleted).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      expect.stringContaining('expurgo'),
    );
  });
});

describe('enrichCompany — gatilho do expurgo', () => {
  beforeEach(() => {
    resetEnrichmentLogPurgeThrottleForTests();
    vi.clearAllMocks();
  });

  it('dispara o expurgo de EnrichmentLog mesmo quando cai no caminho de cache (sem chamada a provider)', async () => {
    const repo = makeRepo();
    const now = new Date();
    const freshCompany = {
      id: 'comp-1',
      organizationId: 'org-1',
      status: 'ACTIVE',
      enrichmentStatus: 'Enriquecido',
      enrichedAt: now,
      enrichmentSource: 'Teste',
      situacaoCadastral: 'ATIVA',
      capitalSocial: null,
      employeeCount: null,
      segment: null,
      city: null,
      state: null,
      technologies: [],
      lookalikeScore: null,
      lookalikeTopMatches: null,
    };
    vi.mocked(repo.findCompanyById).mockResolvedValue(freshCompany as never);

    const result = await enrichCompany('org-1', 'comp-1', {}, repo);

    // Caminho de cache: nenhuma escrita nem chamada externa, mas o expurgo rodou.
    expect(result.cached).toBe(true);
    expect(repo.updateCompany).not.toHaveBeenCalled();
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledTimes(1);
    expect(repo.deleteEnrichmentLogsCreatedBefore).toHaveBeenCalledWith(
      expect.any(Date) as Date,
    );
  });
});

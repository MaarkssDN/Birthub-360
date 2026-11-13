/**
 * Testes do cache L2 (Redis, TTL 60s) dos relatórios quentes de Comercial Inteligente —
 * Agente 23. Cobre os 4 requisitos do handoff:
 * (a) segunda chamada idêntica usa cache (contagem de `findDeals` não cresce);
 * (b) tenants diferentes nunca compartilham cache (organizationId na chave);
 * (c) parâmetros/filtros diferentes geram chaves diferentes;
 * (d) Redis indisponível → fallback gracioso para leitura direta do banco.
 * Bônus: `now` explícito (testes/backtests/job semanal) nunca usa cache.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CommercialGoalDTO,
  CommercialIntelligenceRepository,
  DealRow,
  FilterOptions,
  LeadFieldChangeRow,
  StageDefinition,
} from '../domain/CommercialIntelligence.js';
import { buildReportCacheKey, REPORT_CACHE_TTL_SECONDS } from '../application/reportCache.js';
import { CommercialIntelligenceUseCases } from '../application/CommercialIntelligenceUseCases.js';

// ─── Redis mockado em memória ─────────────────────────────────────────────────
// `redisConfigured: true` força o caminho de cache mesmo sem REDIS_URL no ambiente de teste;
// `importOriginal` preserva os demais exports do módulo (connection, queuesEnabled etc.) para
// qualquer import transitivo que precise deles.
const redisStore = vi.hoisted(() => new Map<string, string>());
const cacheConnectionMock = vi.hoisted(() => ({
  get: vi.fn(async (key: string) => (redisStore.has(key) ? redisStore.get(key)! : null)),
  setex: vi.fn(async (key: string, _ttl: number, value: string) => {
    redisStore.set(key, value);
    return 'OK';
  }),
}));

vi.mock('../../../lib/queue/redis.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/queue/redis.js')>();
  return {
    ...actual,
    redisConfigured: true,
    cacheConnection: cacheConnectionMock,
  };
});

// ─── Repositório fake mínimo (mesma forma do FakeRepository dos outros testes) ──
class FakeRepository implements CommercialIntelligenceRepository {
  findDealsCalls: string[] = [];

  async findDeals(organizationId: string): Promise<DealRow[]> {
    this.findDealsCalls.push(organizationId);
    return [];
  }
  async findDealPipelineStages(): Promise<StageDefinition[]> {
    return [];
  }
  async countCompletedMeetings(): Promise<number> {
    return 0;
  }
  async countTimelineEventsByType(): Promise<number> {
    return 0;
  }
  async findCompletedMeetingDates(): Promise<Date[]> {
    return [];
  }
  async findTimelineEventDatesByType(): Promise<Date[]> {
    return [];
  }
  async findStageHistory() {
    return [];
  }
  async findFieldChanges(): Promise<LeadFieldChangeRow[]> {
    return [];
  }
  async findFirstCompletedActivityDates(): Promise<Map<string, Date>> {
    return new Map();
  }
  async countDuplicateCompanyGroupsAmongOpenDeals(): Promise<number> {
    return 0;
  }
  async hasBitrixConnection(): Promise<boolean> {
    return false;
  }
  async getBitrixSyncActivity() {
    return { lastSyncAt: null, syncedCount: 0, failedCount: 0 };
  }
  async getFilterOptions(): Promise<FilterOptions> {
    return { owners: [], products: [], sources: [], icps: [], companies: [] };
  }
  async getGoal(): Promise<CommercialGoalDTO | null> {
    return null;
  }
  async getGoals(): Promise<Map<string, CommercialGoalDTO>> {
    return new Map();
  }
  async upsertGoal(): Promise<CommercialGoalDTO> {
    throw new Error('não usado neste teste');
  }
}

const PERIOD = '2026-08';
const FILTER = { month: PERIOD };

function dealsCallsFor(repo: FakeRepository, organizationId: string): number {
  return repo.findDealsCalls.filter((org) => org === organizationId).length;
}

describe('reportCache.buildReportCacheKey', () => {
  it('inclui organizationId como discriminador de tenant e é estável para mesmos parâmetros', () => {
    const a = buildReportCacheKey('performance', 'org-a', FILTER);
    const b = buildReportCacheKey('performance', 'org-a', FILTER);
    expect(a).toBe(b);
    expect(a).toContain('org-a');
    expect(a).toContain('performance');
    expect(a).toContain(PERIOD);
  });

  it('tenants diferentes geram chaves diferentes', () => {
    expect(buildReportCacheKey('performance', 'org-a', FILTER)).not.toBe(
      buildReportCacheKey('performance', 'org-b', FILTER),
    );
  });

  it('parâmetros de filtro diferentes geram chaves diferentes', () => {
    const base = buildReportCacheKey('performance', 'org-a', FILTER);
    expect(buildReportCacheKey('performance', 'org-a', { month: '2026-07' })).not.toBe(base);
    expect(
      buildReportCacheKey('performance', 'org-a', { month: PERIOD, owner: 'ana@x.com' }),
    ).not.toBe(base);
    expect(
      buildReportCacheKey('performance', 'org-a', { month: PERIOD, product: 'SKU-1' }),
    ).not.toBe(base);
    // owner com caractere separador não pode colidir com outro filtro
    expect(buildReportCacheKey('performance', 'org-a', { month: PERIOD, owner: 'a|b' })).not.toBe(
      buildReportCacheKey('performance', 'org-a', { month: PERIOD, owner: 'a', product: 'b' }),
    );
  });

  it('relatório e extra (formato de export) diferentes geram chaves diferentes', () => {
    expect(buildReportCacheKey('executive-export', 'org-a', FILTER, 'csv')).not.toBe(
      buildReportCacheKey('executive-export', 'org-a', FILTER, 'json'),
    );
    expect(buildReportCacheKey('performance', 'org-a', FILTER)).not.toBe(
      buildReportCacheKey('aging', 'org-a', FILTER),
    );
  });
});

describe('CommercialIntelligenceUseCases — cache L2 dos relatórios quentes', () => {
  beforeEach(() => {
    redisStore.clear();
    cacheConnectionMock.get.mockClear();
    cacheConnectionMock.setex.mockClear();
  });

  it('(a) segunda chamada idêntica usa cache — findDeals não é rechamado', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);

    const first = await useCases.performance('org-a', FILTER);
    const callsAfterFirst = dealsCallsFor(repo, 'org-a');
    expect(callsAfterFirst).toBeGreaterThan(0);

    const second = await useCases.performance('org-a', FILTER);
    expect(second).toEqual(first);
    expect(dealsCallsFor(repo, 'org-a')).toBe(callsAfterFirst);
    expect(cacheConnectionMock.setex).toHaveBeenCalledWith(
      expect.stringContaining('ci:report:performance:org-a:'),
      REPORT_CACHE_TTL_SECONDS,
      expect.any(String),
    );
  });

  it('(b) tenants diferentes não compartilham cache', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);

    await useCases.performance('org-a', FILTER);
    const callsOrgA = dealsCallsFor(repo, 'org-a');
    await useCases.performance('org-b', FILTER);
    expect(dealsCallsFor(repo, 'org-b')).toBeGreaterThan(0);
    expect(dealsCallsFor(repo, 'org-a')).toBe(callsOrgA); // org-a não foi reconsultado
  });

  it('(c) parâmetros diferentes geram keys diferentes — novo filtro recalcula', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);

    await useCases.performance('org-a', FILTER);
    const callsAfterBase = dealsCallsFor(repo, 'org-a');

    await useCases.performance('org-a', { month: '2026-07' });
    expect(dealsCallsFor(repo, 'org-a')).toBeGreaterThan(callsAfterBase);

    const callsAfterMonth = dealsCallsFor(repo, 'org-a');
    await useCases.performance('org-a', { month: PERIOD, owner: 'ana@x.com' });
    expect(dealsCallsFor(repo, 'org-a')).toBeGreaterThan(callsAfterMonth);
  });

  it('(d) Redis indisponível → fallback gracioso: relatório é calculado do banco', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);

    cacheConnectionMock.get.mockRejectedValueOnce(new Error('redis down'));
    cacheConnectionMock.setex.mockRejectedValueOnce(new Error('redis down'));

    const result = await useCases.performance('org-a', FILTER);
    expect(result).toBeDefined();
    expect(dealsCallsFor(repo, 'org-a')).toBeGreaterThan(0);

    // e a chamada seguinte, com Redis "de volta", continua funcionando
    const again = await useCases.performance('org-a', FILTER);
    expect(again).toEqual(result);
  });

  it('healthScore: repetição idêntica usa cache e reutiliza os sub-relatórios já aquecidos', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);

    const first = await useCases.healthScore('org-a', FILTER);
    const callsAfterHealth = dealsCallsFor(repo, 'org-a');
    expect(callsAfterHealth).toBeGreaterThan(0);

    const second = await useCases.healthScore('org-a', FILTER);
    expect(second).toEqual(first);
    expect(dealsCallsFor(repo, 'org-a')).toBe(callsAfterHealth);

    // `performance` já foi calculado dentro do healthScore com o mesmo filtro — o GET irmão
    // do cockpit deve acertar o cache L2 sem nenhuma query nova.
    await useCases.performance('org-a', FILTER);
    expect(dealsCallsFor(repo, 'org-a')).toBe(callsAfterHealth);
  });

  it('executiveExport: formatos diferentes não compartilham entrada de cache', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);

    const csv = await useCases.executiveExport('org-a', FILTER, 'csv');
    const callsAfterCsv = dealsCallsFor(repo, 'org-a');
    expect(callsAfterCsv).toBeGreaterThan(0);

    // csv repetido → cache hit
    await useCases.executiveExport('org-a', FILTER, 'csv');
    expect(dealsCallsFor(repo, 'org-a')).toBe(callsAfterCsv);

    // json do mesmo filtro → key diferente → recalcula (e reusa sub-relatórios em cache,
    // então só o próprio loadScoredDeals do overview agregado pode variar — assert só que
    // não lança e devolve payload distinto do csv)
    const json = await useCases.executiveExport('org-a', FILTER, 'json');
    expect(json.content).not.toBe(csv.content);
  });

  it('`now` explícito (backtest/teste/job semanal) nunca usa cache', async () => {
    const repo = new FakeRepository();
    const useCases = new CommercialIntelligenceUseCases(repo);
    const NOW = new Date('2026-08-15T12:00:00Z');

    await useCases.performance('org-a', FILTER, NOW);
    const callsAfterFirst = dealsCallsFor(repo, 'org-a');
    await useCases.performance('org-a', FILTER, NOW);
    // mesma entrada, mesmo `now`, mas caminho determinístico → sempre recalcula
    expect(dealsCallsFor(repo, 'org-a')).toBe(callsAfterFirst * 2);
    expect(cacheConnectionMock.setex).not.toHaveBeenCalled();
  });
});

/**
 * TAREFA-SANEAMENTO-018 (BT360-DT-0024): o catch de `getOverview` antes era
 * `catch {}` silencioso — uma falha de banco/RLS virava "KPIs zerados" sem nenhum
 * rastro. O fallback de resposta foi mantido (não quebrar o painel), mas agora o
 * erro é registrado via `logger.error`. Este teste prova os dois lados: payload
 * zerado continua sendo respondido E a falha fica observável no log.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { Crm360Controller } from '@/features/crm360/presentation/Crm360Controller';
import type { Crm360UseCases } from '@/features/crm360/application/Crm360UseCases';
import { logger } from '@/lib/logger.js';

vi.mock('@/lib/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const ZEROED_PAYLOAD = {
  kpis: {
    leads: 0,
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    conversionRate: 0,
    pipelineValue: 0,
    weightedPipeline: 0,
    overdueActivities: 0,
    todayActivities: 0,
    pendingDocuments: 0,
  },
  focusActivities: [],
  recentDeals: [],
  stageCounts: [],
};

describe('Crm360Controller — getOverview (fallback observável, TAREFA-SANEAMENTO-018)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falha do caso de uso: responde KPIs zerados (não quebra o painel) e registra o erro no log', async () => {
    const failure = new Error('RLS denied on Lead');
    const mockUseCases = {
      getOverview: vi.fn().mockRejectedValue(failure),
    } as unknown as Crm360UseCases;

    const controller = new Crm360Controller(mockUseCases);

    const req = {
      user: { organizationId: 'org-test' },
    } as unknown as Request;

    const jsonMock = vi.fn();
    const res = { json: jsonMock } as unknown as Response;
    const next = vi.fn();

    await controller.getOverview(req, res, next);

    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: ZEROED_PAYLOAD });
    expect(next).not.toHaveBeenCalled();
    // O ponto da mudança: antes `catch {}` não deixava rastro nenhum da falha real.
    expect(logger.error).toHaveBeenCalledWith(
      { err: failure },
      'crm360.getOverview falhou — respondendo KPIs zerados',
    );
  });

  it('caminho feliz: devolve os dados do caso de uso sem cair no fallback', async () => {
    const overview = { kpis: { leads: 7 }, focusActivities: [], recentDeals: [], stageCounts: [] };
    const mockUseCases = {
      getOverview: vi.fn().mockResolvedValue(overview),
    } as unknown as Crm360UseCases;

    const controller = new Crm360Controller(mockUseCases);

    const req = {
      user: { organizationId: 'org-test' },
    } as unknown as Request;

    const jsonMock = vi.fn();
    const res = { json: jsonMock } as unknown as Response;
    const next = vi.fn();

    await controller.getOverview(req, res, next);

    expect(mockUseCases.getOverview).toHaveBeenCalledWith('org-test');
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: overview });
    expect(logger.error).not.toHaveBeenCalled();
  });
});

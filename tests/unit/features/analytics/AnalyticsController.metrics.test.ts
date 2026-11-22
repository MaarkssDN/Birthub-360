import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { AnalyticsController } from '@/features/analytics/presentation/AnalyticsController';
import type { AnalyticsUseCases } from '@/features/analytics/application/AnalyticsUseCases';

describe('AnalyticsController — tratamento defensivo em /api/analytics', () => {
  it('retorna { metrics: [], total: 0 } com status 200 quando o banco estiver vazio', async () => {
    const mockUseCases = {
      getMetrics: vi.fn().mockResolvedValue({ metrics: [], total: 0 }),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);

    const req = {
      user: { organizationId: 'org-test' },
    } as unknown as Request;

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
    const next = vi.fn();

    await controller.getMetrics(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [],
        total: 0,
      }),
    );
  });

  it('encaminha o erro para next() quando a agregação estoura exceção', async () => {
    const testError = new Error('Connection failed or table empty');
    const mockUseCases = {
      getMetrics: vi.fn().mockRejectedValue(testError),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);

    const req = {
      user: { organizationId: 'org-test' },
    } as unknown as Request;

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
    const next = vi.fn();

    await controller.getMetrics(req, res, next);

    expect(next).toHaveBeenCalledWith(testError);
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('DEBT-UX-003: encaminha erro para next() em getOverview quando repository falha', async () => {
    const testError = new Error('Database query failure on overview');
    const mockUseCases = {
      overview: vi.fn().mockRejectedValue(testError),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);
    const req = { user: { organizationId: 'org-test' } } as unknown as Request;
    const res = { json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await controller.getOverview(req, res, next);

    expect(next).toHaveBeenCalledWith(testError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('DEBT-UX-003: encaminha erro para next() em getDashboard quando repository falha', async () => {
    const testError = new Error('Database query failure on dashboard');
    const mockUseCases = {
      dashboard: vi.fn().mockRejectedValue(testError),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);
    const req = {
      user: { organizationId: 'org-test' },
      query: { months: '6' },
    } as unknown as Request;
    const res = { json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await controller.getDashboard(req, res, next);

    expect(next).toHaveBeenCalledWith(testError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('DEBT-UX-003: encaminha erro para next() em getSalesSummary quando overview falha', async () => {
    const testError = new Error('Database failure on sales summary');
    const mockUseCases = {
      overview: vi.fn().mockRejectedValue(testError),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);
    const req = { user: { organizationId: 'org-test' } } as unknown as Request;
    const res = { json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await controller.getSalesSummary(req, res, next);

    expect(next).toHaveBeenCalledWith(testError);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('responde 200 com eventos e meta em getUnifiedTimeline', async () => {
    const mockEvents = [
      { id: 'ev-1', title: 'Chamada Realizada', timestamp: '2026-11-03T10:00:00Z', entityType: 'call', outcome: 'success', actor: 'SDR' },
    ];
    const mockUseCases = {
      unifiedTimeline: vi.fn().mockResolvedValue({
        events: mockEvents,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);
    const req = {
      user: { organizationId: 'org-test' },
      query: { period: '7d', entityType: 'call', page: '1', limit: '20' },
    } as unknown as Request;
    const res = { json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await controller.getUnifiedTimeline(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockEvents,
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('encaminha erro para next() em getUnifiedTimeline quando useCases falha', async () => {
    const testError = new Error('Falha no caso de uso');
    const mockUseCases = {
      unifiedTimeline: vi.fn().mockRejectedValue(testError),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);
    const req = { user: { organizationId: 'org-test' }, query: {} } as unknown as Request;
    const res = { json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await controller.getUnifiedTimeline(req, res, next);

    expect(next).toHaveBeenCalledWith(testError);
  });

  it('exporta timeline como CSV em exportUnifiedTimeline', async () => {
    const mockEvents = [
      { id: 'ev-1', title: 'Chamada', timestamp: '2026-11-03T10:00:00Z', entityType: 'call', outcome: 'success', actor: 'SDR' },
    ];
    const mockUseCases = {
      unifiedTimeline: vi.fn().mockResolvedValue({
        events: mockEvents,
        total: 1,
        page: 1,
        limit: 1000,
        totalPages: 1,
      }),
    } as unknown as AnalyticsUseCases;

    const controller = new AnalyticsController(mockUseCases);
    const req = { user: { organizationId: 'org-test' }, query: {} } as unknown as Request;
    const setHeader = vi.fn();
    const send = vi.fn();
    const res = { setHeader, send } as unknown as Response;
    const next = vi.fn();

    await controller.exportUnifiedTimeline(req, res, next);

    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(send).toHaveBeenCalled();
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '@/features/analytics/analytics.api';
import { useRealtimeCockpit, useUnifiedTimeline } from '@/hooks/useDatabase';

vi.mock('@/features/analytics/analytics.api', () => ({
  analyticsApi: {
    realtimeCockpit: vi.fn(),
    unifiedTimeline: vi.fn(),
  },
}));

vi.mock('@/lib/sse.js', () => ({
  readSseStream: vi.fn(),
}));

describe('useUnifiedTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega eventos da timeline unificada com sucesso', async () => {
    const mockEvents = [
      {
        id: 'act_1',
        timestamp: '2026-11-03T10:00:00.000Z',
        entityType: 'lead',
        title: 'Lead Criado: Acme',
        actor: 'SDR',
        outcome: 'success',
      },
    ];

    vi.mocked(analyticsApi.unifiedTimeline).mockResolvedValueOnce(mockEvents as any);

    const { result } = renderHook(() => useUnifiedTimeline({ period: '7d' }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.error).toBeNull();
  });

  it('trata erro na chamada de timeline unificada', async () => {
    vi.mocked(analyticsApi.unifiedTimeline).mockRejectedValueOnce(new Error('Falha na API'));

    const { result } = renderHook(() => useUnifiedTimeline());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Falha na API');
    expect(result.current.events).toEqual([]);
  });
});

describe('useRealtimeCockpit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: null,
    } as any);
  });

  it('carrega métricas do cockpit em tempo real com sucesso', async () => {
    const mockData = {
      today: {
        leadsToday: 10,
        dealsWonToday: 2,
        wonRevenueToday: 50000,
        activitiesToday: 25,
        conversionRateToday: 20,
      },
      baseline: {
        avgLeadsPerDay: 8,
        avgDealsWonPerDay: 1.5,
        avgActivitiesPerDay: 20,
      },
      anomaly: { detected: false, deviationPct: 0 },
    };

    vi.mocked(analyticsApi.realtimeCockpit).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useRealtimeCockpit());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });
});

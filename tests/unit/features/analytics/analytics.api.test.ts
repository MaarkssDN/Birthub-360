import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn(async () => ({ data: {} }));

vi.mock('@/lib/api.js', () => ({
  api: { get: (...args: unknown[]) => getMock(...args) },
}));

import { analyticsApi, formatMonthLabel } from '@/features/analytics/analytics.api';

describe('analyticsApi', () => {
  beforeEach(() => getMock.mockClear());

  it('dashboard monta URL com months e timeout', async () => {
    await analyticsApi.dashboard(12);
    expect(getMock).toHaveBeenCalledWith('/api/analytics/dashboard?months=12', { timeoutMs: 30_000 });
  });

  it('salesSummary e productivityHeatmap usam endpoints e timeouts corretos', async () => {
    await analyticsApi.salesSummary();
    expect(getMock).toHaveBeenLastCalledWith('/api/analytics/sales-summary', { timeoutMs: 15_000 });
    await analyticsApi.productivityHeatmap(90);
    expect(getMock).toHaveBeenLastCalledWith('/api/analytics/productivity-heatmap?days=90', {
      timeoutMs: 15_000,
    });
    await analyticsApi.productivityHeatmap();
    expect(getMock).toHaveBeenLastCalledWith('/api/analytics/productivity-heatmap?days=30', {
      timeoutMs: 15_000,
    });
  });

  it('realtimeCockpit chama endpoint dedicado', async () => {
    await analyticsApi.realtimeCockpit();
    expect(getMock).toHaveBeenCalledWith('/api/analytics/realtime-cockpit', { timeoutMs: 15_000 });
  });

  it('unifiedTimeline serializa todos os filtros na query', async () => {
    await analyticsApi.unifiedTimeline({
      period: '7d',
      entityType: 'lead',
      outcome: 'failed',
      search: 'foo bar',
      page: 2,
      limit: 50,
    });
    const url = getMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/analytics/unified-timeline?');
    expect(url).toContain('period=7d');
    expect(url).toContain('entityType=lead');
    expect(url).toContain('outcome=failed');
    expect(url).toContain('search=foo+bar');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=50');
  });

  it('unifiedTimeline sem query não adiciona "?"', async () => {
    await analyticsApi.unifiedTimeline();
    expect(getMock).toHaveBeenCalledWith('/api/analytics/unified-timeline', { timeoutMs: 20_000 });
  });

  it('exportUnifiedTimelineUrl gera URL de exportação com filtros', () => {
    const url = analyticsApi.exportUnifiedTimelineUrl({ period: '30d', outcome: 'success' });
    expect(url).toContain('/api/analytics/unified-timeline/export?');
    expect(url).toContain('period=30d');
    expect(url).toContain('outcome=success');
    expect(analyticsApi.exportUnifiedTimelineUrl()).toBe('/api/analytics/unified-timeline/export');
  });
});

describe('formatMonthLabel', () => {
  it('formata YYYY-MM para rótulo curto', () => {
    expect(formatMonthLabel('2026-07')).toBe('jul/26');
    expect(formatMonthLabel('2026-01')).toBe('jan/26');
    expect(formatMonthLabel('2026-12')).toBe('dez/26');
  });

  it('retorna entrada original quando formato é inválido', () => {
    expect(formatMonthLabel('2026-13')).toBe('2026-13');
    expect(formatMonthLabel('abc')).toBe('abc');
    expect(formatMonthLabel('2026/07')).toBe('2026/07');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn(async () => ({ data: {} }));
const postMock = vi.fn(async () => ({ data: {} }));

vi.mock('@/lib/api.js', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

import { gamificationApi } from '@/features/gamification/api/gamification.api';

describe('gamificationApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: {} });
    postMock.mockReset();
    postMock.mockResolvedValue({ data: {} });
  });

  it('getLeaderboard monta URL com período e desempacota rankings', async () => {
    getMock.mockResolvedValue({
      data: { period: 'week', rankings: [{ sellerName: 'Ana', score: 10 }] },
    });
    const result = await gamificationApi.getLeaderboard('week');
    expect(getMock).toHaveBeenCalledWith('/api/gamification/leaderboard?period=week');
    expect(result.period).toBe('week');
    expect(result.rankings).toHaveLength(1);
  });

  it('getLeaderboard retorna fallback vazio em erro', async () => {
    getMock.mockRejectedValue(new Error('network'));
    const result = await gamificationApi.getLeaderboard('month');
    expect(result).toEqual({ period: 'month', rankings: [] });
  });

  it('getSellerProfile codifica seller e retorna null sem sellerName', async () => {
    getMock.mockResolvedValue({ data: { period: 'month' } });
    const result = await gamificationApi.getSellerProfile('Vendedor & Cia');
    expect(getMock).toHaveBeenCalledWith(
      `/api/gamification/profile?seller=${encodeURIComponent('Vendedor & Cia')}`,
    );
    expect(result).toBeNull();
  });

  it('getCoaching retorna coaching data desempacotado', async () => {
    getMock.mockResolvedValue({ data: { coaching: 'foco em follow-up' } });
    const result = await gamificationApi.getCoaching('ana');
    expect(getMock).toHaveBeenCalledWith('/api/gamification/coaching?seller=ana');
    expect(result?.coaching).toBe('foco em follow-up');
  });

  it('getCoaching retorna null em erro de rede', async () => {
    getMock.mockRejectedValue(new Error('network'));
    const result = await gamificationApi.getCoaching('ana');
    expect(result).toBeNull();
  });

  it('getWeeklyCoaching faz POST em /api/gamification/coaching/weekly com role', async () => {
    postMock.mockResolvedValue({ data: { period: 'week', coaching: 'semana produtiva' } });
    const result = await gamificationApi.getWeeklyCoaching('SDR');
    expect(postMock).toHaveBeenCalledWith('/api/gamification/coaching/weekly', { role: 'SDR' });
    expect(result?.coaching).toBe('semana produtiva');
  });

  it('getWeeklyCoaching retorna null em erro de rede', async () => {
    postMock.mockRejectedValue(new Error('network'));
    const result = await gamificationApi.getWeeklyCoaching();
    expect(result).toBeNull();
  });
});

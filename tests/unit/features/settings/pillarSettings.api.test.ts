import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
const putMock = vi.fn();

vi.mock('@/lib/api.js', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    put: (...args: unknown[]) => putMock(...args),
  },
}));

const { pillarSettingsApi } = await import('@/features/settings/pillarSettings.api.js');

describe('pillarSettingsApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
  });

  it('GET chama /api/settings/pillars/:pillar', async () => {
    const view = { pillar: 'hub', values: {}, configured: false, updatedAt: null };
    getMock.mockResolvedValueOnce(view);
    await expect(pillarSettingsApi.get('hub')).resolves.toEqual(view);
    expect(getMock).toHaveBeenCalledWith('/api/settings/pillars/hub');
  });

  it('PUT envia { values } para /api/settings/pillars/:pillar', async () => {
    const values = { minRevenue: 'R$ 1.000.000', autoEnrich: false };
    const view = { pillar: 'market', values, configured: true, updatedAt: '2026-11-11T12:00:00.000Z' };
    putMock.mockResolvedValueOnce(view);
    await expect(pillarSettingsApi.update('market', values)).resolves.toEqual(view);
    expect(putMock).toHaveBeenCalledWith('/api/settings/pillars/market', { values });
  });
});

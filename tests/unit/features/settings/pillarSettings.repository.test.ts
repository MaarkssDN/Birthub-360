import { beforeEach, describe, expect, it, vi } from 'vitest';

const findSetting = vi.fn();
const upsertSetting = vi.fn();

vi.mock('@/lib/voice-hub/repositories/settingRepository.js', () => ({
  findSetting: (...args: unknown[]) => findSetting(...args),
  upsertSetting: (...args: unknown[]) => upsertSetting(...args),
}));

const { SettingPillarSettingsRepository } = await import(
  '@/features/settings/infrastructure/PillarSettingsSettingRepository.js'
);

describe('SettingPillarSettingsRepository', () => {
  const repo = new SettingPillarSettingsRepository();

  beforeEach(() => {
    findSetting.mockReset();
    upsertSetting.mockReset();
  });

  it('load devolve null quando não há linha persistida', async () => {
    findSetting.mockResolvedValueOnce(null);
    await expect(repo.load('org-1', 'hub')).resolves.toBeNull();
    expect(findSetting).toHaveBeenCalledWith('org-1', null, 'settings.pilar.hub');
  });

  it('load ignora valores inválidos (não-objeto ou array)', async () => {
    findSetting.mockResolvedValueOnce({ value: 'texto' });
    await expect(repo.load('org-1', 'hub')).resolves.toBeNull();
    findSetting.mockResolvedValueOnce({ value: [1, 2] });
    await expect(repo.load('org-1', 'hub')).resolves.toBeNull();
  });

  it('load saneia version/values/autor ausentes ou com tipo errado', async () => {
    findSetting.mockResolvedValueOnce({
      value: { version: '1', values: 'nope', updatedByUserId: 99, updatedAt: 1 },
    });
    await expect(repo.load('org-1', 'ai')).resolves.toEqual({
      version: 1,
      values: {},
      updatedByUserId: null,
      updatedAt: null,
    });
  });

  it('load devolve o estado persistido válido', async () => {
    const stored = {
      version: 3,
      values: { stagnationDays: 30 },
      updatedByUserId: 'u-1',
      updatedAt: '2026-11-11T12:00:00.000Z',
    };
    findSetting.mockResolvedValueOnce({ value: stored });
    await expect(repo.load('org-1', 'hub')).resolves.toEqual(stored);
  });

  it('save grava o estado na chave do pilar com userId nulo (escopo da org)', async () => {
    upsertSetting.mockResolvedValueOnce(undefined);
    const state = {
      version: 2,
      values: { clickToCall: false },
      updatedByUserId: 'admin-1',
      updatedAt: '2026-11-11T13:00:00.000Z',
    };
    await repo.save('org-9', 'engagement', state);
    expect(upsertSetting).toHaveBeenCalledWith('org-9', null, 'settings.pilar.engagement', state);
  });
});

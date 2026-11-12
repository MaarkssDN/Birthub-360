import { describe, expect, it } from 'vitest';
import type { PillarSettingsRepository } from '../../../../src/features/settings/infrastructure/PillarSettingsSettingRepository.js';
import type {
  PillarSettingsStoredState,
  PillarSlug,
} from '../../../../src/features/settings/domain/pillarSettings.js';
import {
  PillarSettingsService,
  PillarSettingsServiceError,
} from '../../../../src/features/settings/services/pillarSettings.service.js';

class InMemoryRepo implements PillarSettingsRepository {
  private data = new Map<string, PillarSettingsStoredState>();

  private key(org: string, slug: string) {
    return `${org}:${slug}`;
  }

  async load(organizationId: string, slug: PillarSlug) {
    const found = this.data.get(this.key(organizationId, slug));
    return found ? { ...found, values: { ...found.values } } : null;
  }

  async save(organizationId: string, slug: PillarSlug, state: PillarSettingsStoredState) {
    this.data.set(this.key(organizationId, slug), { ...state, values: { ...state.values } });
  }
}

describe('PillarSettingsService — persistência por pilar (Onda F1)', () => {
  const ORG = 'org-1';
  const USER = 'admin-1';

  it('GET sem registro retorna defaults mesclados e configured=false', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    const view = await service.get(ORG, 'hub');
    expect(view.configured).toBe(false);
    expect(view.values).toEqual({
      stagnationDays: 14,
      requireLossReason: true,
      dedupCnpj: true,
    });
  });

  it('PUT persiste e GET subsequente reflete os valores salvos', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    const updated = await service.update(ORG, USER, 'hub', {
      stagnationDays: 30,
      requireLossReason: false,
    });
    expect(updated.configured).toBe(true);
    expect(updated.values.stagnationDays).toBe(30);
    // Campo não enviado preserva o valor anterior/default.
    expect(updated.values.dedupCnpj).toBe(true);

    const reloaded = await service.get(ORG, 'hub');
    expect(reloaded.values.stagnationDays).toBe(30);
    expect(reloaded.values.requireLossReason).toBe(false);
    expect(reloaded.updatedAt).toBe(updated.updatedAt);
  });

  it('incrementa version a cada save', async () => {
    const repo = new InMemoryRepo();
    const service = new PillarSettingsService(repo);
    const v1 = await service.update(ORG, USER, 'sales', { requireBant: false });
    const stored1 = await repo.load(ORG, 'sales');
    expect(stored1?.version).toBe(1);
    await service.update(ORG, USER, 'sales', { dailyTouchesLimit: 50 });
    const stored2 = await repo.load(ORG, 'sales');
    expect(stored2?.version).toBe(2);
    expect(v1.values.dailyTouchesLimit).toBe(40);
  });

  it('rejeita chave desconhecida com 400', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    await expect(
      service.update(ORG, USER, 'hub', { campoInventado: true }),
    ).rejects.toBeInstanceOf(PillarSettingsServiceError);
  });

  it('rejeita tipo inválido (boolean onde se espera número)', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    await expect(
      service.update(ORG, USER, 'hub', { stagnationDays: 'trinta' }),
    ).rejects.toThrow(/numérico/);
  });

  it('rejeita valor fora da faixa (freezeDay > 28)', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    await expect(
      service.update(ORG, USER, 'predictability', { freezeDay: 31 }),
    ).rejects.toThrow(/<= 28/);
  });

  it('rejeita enum inválido em predictability.modelType', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    await expect(
      service.update(ORG, USER, 'predictability', { modelType: 'ia-magica' }),
    ).rejects.toThrow(/historico, manual/);
  });

  it('isolamento por pilar: salvar hub não afeta market', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    await service.update(ORG, USER, 'hub', { stagnationDays: 60 });
    const market = await service.get(ORG, 'market');
    expect(market.configured).toBe(false);
    expect(market.values.autoEnrich).toBe(true);
  });

  it('GET e UPDATE exigem organizationId', async () => {
    const service = new PillarSettingsService(new InMemoryRepo());
    await expect(service.get('', 'hub')).rejects.toMatchObject({
      name: 'PillarSettingsServiceError',
      statusCode: 400,
    });
    await expect(service.update('', USER, 'hub', { stagnationDays: 10 })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

});

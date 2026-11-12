import { describe, expect, it } from 'vitest';
import {
  isPillarSlug,
  mergePillarValues,
  pillarSettingKey,
  validatePillarPatch,
  PillarSettingsValidationError,
} from '@/features/settings/domain/pillarSettings.js';

describe('pillarSettings domain', () => {
  it('reconhece slugs oficiais e monta a chave de Setting', () => {
    expect(isPillarSlug('hub')).toBe(true);
    expect(isPillarSlug('desconhecido')).toBe(false);
    expect(pillarSettingKey('market')).toBe('settings.pilar.market');
  });

  it('rejeita patch que não é objeto', () => {
    expect(() => validatePillarPatch('hub', null)).toThrow(PillarSettingsValidationError);
    expect(() => validatePillarPatch('hub', [])).toThrow(/objeto/i);
  });

  it('rejeita string vazia e aplica trim no texto válido', () => {
    expect(() => validatePillarPatch('market', { minRevenue: '   ' })).toThrow(/texto não vazio/i);
    expect(validatePillarPatch('market', { minRevenue: '  R$ 10.000  ' })).toEqual({
      minRevenue: 'R$ 10.000',
    });
  });

  it('aceita enum válido e rejeita valor fora da lista', () => {
    expect(validatePillarPatch('predictability', { modelType: 'manual' })).toEqual({
      modelType: 'manual',
    });
    expect(() => validatePillarPatch('predictability', { modelType: 'outro' })).toThrow(
      /historico, manual/i,
    );
  });

  it('rejeita número abaixo do mínimo e mescla defaults com persistido', () => {
    expect(() => validatePillarPatch('hub', { stagnationDays: 0 })).toThrow(/>= 1/i);
    expect(mergePillarValues('hub', { stagnationDays: 30 })).toMatchObject({
      stagnationDays: 30,
      requireLossReason: true,
      dedupCnpj: true,
    });
    expect(mergePillarValues('ai', null).model).toBe('Claude 3.5 Sonnet');
  });
});

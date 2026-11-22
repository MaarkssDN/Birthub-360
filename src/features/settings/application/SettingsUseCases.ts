/**
 * Settings Application Layer — BirthHub 360
 * UseCases for organization settings and preferences
 */

import type { ISettingsRepository, OrganizationSettings } from '../domain/SettingsDomain.js';

export class SettingsUseCases {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async getSettings(organizationId: string): Promise<OrganizationSettings> {
    if (!organizationId) {
      throw new Error('Identificador da organização é obrigatório');
    }

    const settings = await this.settingsRepository.findByOrganizationId(organizationId);
    if (!settings) {
      throw new Error('Configurações não encontradas para a organização informada');
    }

    return settings;
  }

  async updateSettings(settings: OrganizationSettings): Promise<OrganizationSettings> {
    if (!settings.organizationId) {
      throw new Error('Identificador da organização é obrigatório');
    }

    return this.settingsRepository.saveSettings(settings);
  }
}

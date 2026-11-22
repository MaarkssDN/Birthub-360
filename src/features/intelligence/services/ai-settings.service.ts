import type { AiSettingInput, AiSettingItem, AiSettingsRepository } from '../domain/AiSettings.js';
import { prismaAiSettingsRepository } from '../infrastructure/PrismaAiSettingsRepository.js';

export type { AiSettingInput, AiSettingItem, AiSettingsRepository };

export class AiSettingsService {
  constructor(private readonly repository: AiSettingsRepository = prismaAiSettingsRepository) {}

  async listSettings(): Promise<AiSettingItem[]> {
    return this.repository.listAll();
  }

  async saveSettings(settings: AiSettingInput[]): Promise<AiSettingItem[]> {
    return this.repository.saveMany(settings);
  }
}

export const aiSettingsService = new AiSettingsService();

export async function listAiSettings(): Promise<AiSettingItem[]> {
  return aiSettingsService.listSettings();
}

export async function saveAiSettings(settings: AiSettingInput[]): Promise<AiSettingItem[]> {
  return aiSettingsService.saveSettings(settings);
}

/**
 * Domain types and Repository port for AI Engine Settings
 * (Global tool configuration: provider, model, temperature, maxTokens, topP)
 */

export interface AiSettingItem {
  id?: string;
  toolKey: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens?: number | null;
  topP?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AiSettingInput {
  toolKey: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
}

export interface AiSettingsRepository {
  listAll(): Promise<AiSettingItem[]>;
  saveMany(settings: AiSettingInput[]): Promise<AiSettingItem[]>;
}

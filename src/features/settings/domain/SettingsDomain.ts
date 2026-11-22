/**
 * Settings & Organization Preferences Domain Layer — BirthHub 360
 * Clean Architecture Modular Domain Contracts
 */

export interface OrganizationSettings {
  organizationId: string;
  companyName: string;
  cnpj?: string;
  timezone: string;
  currency: 'BRL' | 'USD';
  defaultLeadSource: string;
  aiEngineConfig: {
    preferredProvider: 'openai' | 'anthropic' | 'groq' | 'litellm';
    model: string;
    temperature: number;
    maxTokens: number;
  };
  revOpsRules: {
    leadDeduplicationStrategy: 'EXACT_CNPJ' | 'FUZZY_NAME_AND_DOMAIN' | 'MANUAL';
    autoAssignmentEnabled: boolean;
    voiceCallRecordingRetentionDays: number;
  };
  updatedAt: Date;
}

export interface ISettingsRepository {
  findByOrganizationId(organizationId: string): Promise<OrganizationSettings | null>;
  saveSettings(settings: OrganizationSettings): Promise<OrganizationSettings>;
}

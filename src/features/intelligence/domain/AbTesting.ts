/**
 * Tipos de domínio e Porta (Repository) para Testes A/B de Inteligência Comercial
 */

export interface LogPromptUsageInput {
  leadId: string;
  promptVariant: 'A' | 'B';
  promptName: string;
}

export interface AbTestingRepository {
  recordPromptUsage(input: LogPromptUsageInput): Promise<void>;
  findLeadIdsForVariant(variant: 'A' | 'B', promptName: string): Promise<string[]>;
  countConvertedLeads(leadIds: string[]): Promise<number>;
}

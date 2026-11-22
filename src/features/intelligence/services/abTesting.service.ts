import type { AbTestingRepository } from '../domain/AbTesting.js';
import { prismaAbTestingRepository } from '../infrastructure/PrismaAbTestingRepository.js';

export class ABTestingService {
  constructor(private readonly repository: AbTestingRepository = prismaAbTestingRepository) {}

  /**
   * Registra o uso de um prompt específico para um Lead.
   */
  async logPromptUsage(
    leadId: string,
    promptVariant: 'A' | 'B',
    promptName: string,
  ): Promise<void> {
    return this.repository.recordPromptUsage({ leadId, promptVariant, promptName });
  }

  /**
   * Retorna taxa de conversão (status = 'Negocios_Ganhos') de leads que receberam variante A vs B.
   */
  async getConversionRates(promptName: string): Promise<{ variantA: number; variantB: number }> {
    const [variantA, variantB] = await Promise.all([
      this.conversionRateForVariant('A', promptName),
      this.conversionRateForVariant('B', promptName),
    ]);

    return { variantA, variantB };
  }

  /** Retorna 0 quando a variante ainda não tem nenhuma interação rastreada — zero real, não invenção. */
  private async conversionRateForVariant(variant: 'A' | 'B', promptName: string): Promise<number> {
    const leadIds = await this.repository.findLeadIdsForVariant(variant, promptName);
    if (leadIds.length === 0) return 0;

    const wonCount = await this.repository.countConvertedLeads(leadIds);
    return (wonCount / leadIds.length) * 100;
  }
}

export const abTestingService = new ABTestingService();

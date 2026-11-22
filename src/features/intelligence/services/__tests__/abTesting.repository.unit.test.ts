import { describe, expect, it } from 'vitest';
import type { AbTestingRepository, LogPromptUsageInput } from '../../domain/AbTesting';
import { ABTestingService } from '../abTesting.service';

class FakeAbTestingRepository implements AbTestingRepository {
  public loggedUsages: LogPromptUsageInput[] = [];
  public variantLeadIds: Record<string, string[]> = { A: [], B: [] };
  public wonLeadIds: Set<string> = new Set();

  async recordPromptUsage(input: LogPromptUsageInput): Promise<void> {
    this.loggedUsages.push(input);
  }

  async findLeadIdsForVariant(variant: 'A' | 'B', _promptName: string): Promise<string[]> {
    return this.variantLeadIds[variant] || [];
  }

  async countConvertedLeads(leadIds: string[]): Promise<number> {
    return leadIds.filter((id) => this.wonLeadIds.has(id)).length;
  }
}

describe('ABTestingService with Repository', () => {
  it('registra uso do prompt no repositório sem tocar banco', async () => {
    const repo = new FakeAbTestingRepository();
    const service = new ABTestingService(repo);

    await service.logPromptUsage('lead-1', 'A', 'cold-email');

    expect(repo.loggedUsages).toHaveLength(1);
    expect(repo.loggedUsages[0]).toEqual({
      leadId: 'lead-1',
      promptVariant: 'A',
      promptName: 'cold-email',
    });
  });

  it('calcula taxa de conversão proporcional entre variantes', async () => {
    const repo = new FakeAbTestingRepository();
    repo.variantLeadIds.A = ['lead-1', 'lead-2'];
    repo.variantLeadIds.B = ['lead-3', 'lead-4', 'lead-5', 'lead-6'];
    repo.wonLeadIds.add('lead-1'); // 1/2 = 50%
    repo.wonLeadIds.add('lead-3'); // 1/4 = 25%

    const service = new ABTestingService(repo);
    const rates = await service.getConversionRates('cold-email');

    expect(rates.variantA).toBe(50);
    expect(rates.variantB).toBe(25);
  });

  it('retorna 0 para variantes sem leads associados', async () => {
    const repo = new FakeAbTestingRepository();
    const service = new ABTestingService(repo);

    const rates = await service.getConversionRates('novo-prompt');
    expect(rates.variantA).toBe(0);
    expect(rates.variantB).toBe(0);
  });
});

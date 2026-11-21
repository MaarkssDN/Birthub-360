import { describe, expect, it, vi } from 'vitest';
import { PrismaLeadRepository } from '../../../../src/features/crm/infra/PrismaLeadRepository.js';
import { prisma } from '../../../../src/lib/prisma.js';

describe('Agente 16 (Cora) - Otimização de queries de CRM e Prevenção de N+1', () => {
  it('findAllWithFilters deve carregar relações company e contact em lote via include e forecast via batch query', async () => {
    const mockLeads = [
      {
        id: 'lead-1',
        title: 'Lead Alpha',
        status: 'Lead_Recebido',
        probability: 50,
        organizationId: 'org-test',
        company: { id: 'comp-1', name: 'Empresa Alpha', status: 'Ativo' },
        contact: { id: 'cont-1', name: 'Contato Alpha' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'lead-2',
        title: 'Lead Beta',
        status: 'Qualificacao_SDR',
        probability: 70,
        organizationId: 'org-test',
        company: { id: 'comp-2', name: 'Empresa Beta', status: 'Ativo' },
        contact: { id: 'cont-2', name: 'Contato Beta' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let findManyCalls = 0;
    let findManyArgs: any = null;

    vi.spyOn(prisma.lead, 'findMany').mockImplementation(async (args: any) => {
      findManyCalls++;
      findManyArgs = args;
      return mockLeads as any;
    });

    vi.spyOn(prisma.lead, 'count').mockResolvedValue(2);

    let forecastSnapshotCalls = 0;
    vi.spyOn(prisma.copilotoDealHealthSnapshot, 'findMany').mockImplementation(async (args: any) => {
      forecastSnapshotCalls++;
      expect(args.where.leadId.in).toEqual(['lead-1', 'lead-2']);
      return [
        { leadId: 'lead-1', forecastProbabilityAi: 60 },
        { leadId: 'lead-2', forecastProbabilityAi: 75 },
      ] as any;
    });

    const repo = new PrismaLeadRepository();
    const result = await repo.findAllWithFilters('org-test', undefined, 1, 20);

    // 1 query para buscar leads com include estruturado
    expect(findManyCalls).toBe(1);
    expect(findManyArgs.include).toEqual({ company: true, contact: true });
    // 1 query em lote (in: leadIds) para buscar previsões de IA sem N+1
    expect(forecastSnapshotCalls).toBe(1);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].forecastProbabilityAi).toBe(60);
    expect(result.data[1].forecastProbabilityAi).toBe(75);
  });
});

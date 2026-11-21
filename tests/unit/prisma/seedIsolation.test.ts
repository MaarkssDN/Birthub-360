import { describe, expect, it, vi } from 'vitest';
import { runIsolatedSeed } from '../../../prisma/seed.js';

describe('Agente 14 (Bia) - Isolamento Estrito em prisma/seed.ts', () => {
  it('deve gerar IDs randômicos UUID v4 e manter isolamento por tenantId sem colisões', async () => {
    const createdRecords: Record<string, any[]> = {
      organization: [],
      user: [],
      company: [],
      contact: [],
      lead: [],
    };

    const mockPrisma: any = {
      organization: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          createdRecords.organization.push(data);
          return data;
        }),
      },
      user: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          createdRecords.user.push(data);
          return data;
        }),
      },
      company: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          createdRecords.company.push(data);
          return data;
        }),
      },
      contact: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          createdRecords.contact.push(data);
          return data;
        }),
      },
      lead: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          createdRecords.lead.push(data);
          return data;
        }),
      },
      $disconnect: vi.fn(),
    };

    const res1 = await runIsolatedSeed(mockPrisma);
    const res2 = await runIsolatedSeed(mockPrisma);

    // Ambas as execuções devem gerar IDs únicos e independentes
    expect(res1.organization.id).not.toBe(res2.organization.id);
    expect(res1.adminUser.email).not.toBe(res2.adminUser.email);
    expect(res1.company.id).not.toBe(res2.company.id);

    // Todas as entidades filhas devem herdar estritamente o organizationId pai da execução
    expect(res1.adminUser.organizationId).toBe(res1.organization.id);
    expect(res1.company.organizationId).toBe(res1.organization.id);
    expect(res1.contact.organizationId).toBe(res1.organization.id);
    expect(res1.lead.organizationId).toBe(res1.organization.id);

    // Dados sintéticos devem conter o prefixo rastreável [DEMO-SYNTHETIC]
    expect(res1.company.legalName).toContain('[DEMO-SYNTHETIC]');
    expect(res1.lead.title).toContain('[DEMO-SYNTHETIC]');
  });
});

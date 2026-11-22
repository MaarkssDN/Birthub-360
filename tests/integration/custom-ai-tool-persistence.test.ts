import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';

const withRlsBypass = <T>(fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ bypassRls: true }, fn);
const asOrg = <T>(tenantId: string, fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ tenantId }, fn);

const ORG_A = 'test-org-id';
const ORG_B = 'test-org-id-b';

describe('DT-006: CustomAiTool — Persistência real em PostgreSQL e isolamento multi-tenant', () => {
  beforeEach(async () => {
    await withRlsBypass(async () => {
      const existsA = await prisma.organization.findUnique({ where: { id: ORG_A } });
      if (!existsA) {
        await prisma.organization.create({ data: { id: ORG_A, name: 'Test Org A' } });
      }
      const existsB = await prisma.organization.findUnique({ where: { id: ORG_B } });
      if (!existsB) {
        await prisma.organization.create({ data: { id: ORG_B, name: 'Test Org B' } });
      }
    });
  });

  afterEach(async () => {
    await asOrg(ORG_A, () =>
      prisma.customAiTool.deleteMany({ where: { organizationId: ORG_A } }),
    );
    await asOrg(ORG_B, () =>
      prisma.customAiTool.deleteMany({ where: { organizationId: ORG_B } }),
    );
  });

  it('persiste ferramenta customizada no PostgreSQL com integridade referencial ao tenant', async () => {
    const created = await asOrg(ORG_A, () =>
      prisma.customAiTool.create({
        data: {
          id: 'tool-cnpj-validator',
          organizationId: ORG_A,
          name: 'CNPJ Validator Real',
          category: 'enrichment',
          prompt: 'Valide o CNPJ informado consultando a base da Receita Federal e retorne os dados cadastrais.',
        },
      }),
    );

    expect(created.id).toBe('tool-cnpj-validator');
    expect(created.organizationId).toBe(ORG_A);
    expect(created.name).toBe('CNPJ Validator Real');
    expect(created.category).toBe('enrichment');
    expect(created.prompt).toContain('Receita Federal');

    // Consulta do banco confirma persistência estruturada
    const fetched = await asOrg(ORG_A, () =>
      prisma.customAiTool.findUnique({ where: { id: 'tool-cnpj-validator' } }),
    );

    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('CNPJ Validator Real');
    expect(fetched?.prompt).toContain('Receita Federal');
  });

  it('bloqueia leitura cross-tenant (RLS / isolamento): ORG_B não enxerga ferramentas de ORG_A', async () => {
    await asOrg(ORG_A, () =>
      prisma.customAiTool.create({
        data: {
          id: 'tool-secret-org-a',
          organizationId: ORG_A,
          name: 'Ferramenta Privada Org A',
          category: 'strategy',
          prompt: 'Prompt confidencial de negociação corporativa para a Org A.',
        },
      }),
    );

    // ORG_A localiza a própria ferramenta
    const toolA = await asOrg(ORG_A, () =>
      prisma.customAiTool.findMany({ where: { organizationId: ORG_A } }),
    );
    expect(toolA.some((t) => t.id === 'tool-secret-org-a')).toBe(true);

    // ORG_B consultando suas próprias ferramentas não vê nada de ORG_A
    const toolB = await asOrg(ORG_B, () =>
      prisma.customAiTool.findMany({ where: { organizationId: ORG_B } }),
    );
    expect(toolB.some((t) => t.id === 'tool-secret-org-a')).toBe(false);

    // ORG_B tentando consultar diretamente com where organizationId: ORG_A é bloqueado pela RLS
    const crossQuery = await asOrg(ORG_B, () =>
      prisma.customAiTool.findMany({ where: { organizationId: ORG_A } }),
    );
    expect(crossQuery).toHaveLength(0);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Regressão do DEBT-0018 (auditoria 2026-11-18, CRM-04): `contactSchema.companyId` é `z.string()`
 * puro e o repositório gravava o vínculo sem conferir se a empresa pertence ao tenant — um id de
 * empresa de outra organização criava contato cross-tenant. Agora create/update validam a FK com
 * `company.findFirst` escopado por `organizationId` (mesmo padrão de
 * `assertLeadRelationsInTenant` em PrismaLeadRepository).
 */
const prismaMock = {
  company: {
    findFirst: vi.fn(),
  },
  contact: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../../../../lib/prisma', () => ({ prisma: prismaMock }));

const { PrismaContactRepository } = await import('../PrismaContactRepository.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('PrismaContactRepository — validação de tenant de companyId (DEBT-0018)', () => {
  it('create: rejeita companyId de outra organização com 404 e não grava', async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);
    const repo = new PrismaContactRepository();

    await expect(
      repo.create('org-1', { name: 'Fulano', companyId: 'company-de-outra-org' } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.contact.create).not.toHaveBeenCalled();
  });

  it('create: grava quando a empresa pertence ao tenant', async () => {
    prismaMock.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prismaMock.contact.create.mockResolvedValue({ id: 'ct1', companyId: 'company-1' });
    const repo = new PrismaContactRepository();

    await repo.create('org-1', { name: 'Fulano', companyId: 'company-1' } as never);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: { id: 'company-1', organizationId: 'org-1' },
      select: { id: true },
    });
    expect(prismaMock.contact.create).toHaveBeenCalled();
  });

  it('update: rejeita troca para companyId de outra organização', async () => {
    prismaMock.contact.findFirst.mockResolvedValue({ id: 'ct1', organizationId: 'org-1' });
    prismaMock.company.findFirst.mockResolvedValue(null);
    const repo = new PrismaContactRepository();

    await expect(
      repo.update('org-1', 'ct1', { companyId: 'company-alheia' } as never),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.contact.update).not.toHaveBeenCalled();
  });

  it('update: não valida companyId quando o payload não toca o campo (update parcial)', async () => {
    prismaMock.contact.findFirst.mockResolvedValue({ id: 'ct1', organizationId: 'org-1' });
    prismaMock.contact.update.mockResolvedValue({ id: 'ct1' });
    const repo = new PrismaContactRepository();

    await repo.update('org-1', 'ct1', { name: 'Novo Nome' } as never);

    expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.contact.update).toHaveBeenCalled();
  });

  it('update: aceita limpar o vínculo (companyId null) sem consultar empresa', async () => {
    prismaMock.contact.findFirst.mockResolvedValue({ id: 'ct1', organizationId: 'org-1' });
    prismaMock.contact.update.mockResolvedValue({ id: 'ct1', companyId: null });
    const repo = new PrismaContactRepository();

    await repo.update('org-1', 'ct1', { companyId: null } as never);

    expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.contact.update).toHaveBeenCalled();
  });
});

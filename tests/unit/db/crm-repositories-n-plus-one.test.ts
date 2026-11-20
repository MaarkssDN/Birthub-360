import { afterEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  contact: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock('../../../src/lib/prisma.js', () => ({ prisma: prismaMock }));

const { PrismaContactRepository } = await import(
  '../../../src/features/contacts/infra/PrismaContactRepository.js'
);
const { PrismaActivityRepository } = await import(
  '../../../src/features/activities/infra/PrismaActivityRepository.js'
);

afterEach(() => {
  vi.clearAllMocks();
});

describe('[16 Cora] PrismaContactRepository & PrismaActivityRepository — ausência de N+1', () => {
  it('PrismaContactRepository.findAllWithFilters: carrega company via include em lote único (1 findMany + 1 count)', async () => {
    prismaMock.contact.findMany.mockResolvedValue([
      { id: 'c1', name: 'Ana', company: { id: 'co1', tradeName: 'Acme' } },
      { id: 'c2', name: 'Beto', company: { id: 'co2', tradeName: 'Beta' } },
    ]);
    prismaMock.contact.count.mockResolvedValue(2);

    const repo = new PrismaContactRepository();
    const res = await repo.findAllWithFilters('org-1', undefined, 1, 20);

    expect(prismaMock.contact.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
        include: { company: true },
      }),
    );
    expect(prismaMock.contact.findFirst).not.toHaveBeenCalled();
    expect(res.data).toHaveLength(2);
  });

  it('PrismaContactRepository.findById: carrega company e leads na mesma query', async () => {
    prismaMock.contact.findFirst.mockResolvedValue({
      id: 'c1',
      company: { id: 'co1' },
      leads: [{ id: 'l1' }],
    });

    const repo = new PrismaContactRepository();
    await repo.findById('org-1', 'c1');

    expect(prismaMock.contact.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.contact.findFirst).toHaveBeenCalledWith({
      where: { id: 'c1', organizationId: 'org-1' },
      include: { company: true, leads: true },
    });
  });

  it('PrismaActivityRepository.findAllPaginated e findRange: carregam lead + company + contact em 1 findMany', async () => {
    prismaMock.activity.findMany.mockResolvedValue([
      {
        id: 'a1',
        type: 'Ligacao',
        status: 'Pendente',
        lead: { status: 'Lead_Recebido', company: { status: 'Ativo' }, contact: { id: 'c1' } },
      },
      {
        id: 'a2',
        type: 'Reuniao',
        status: 'Concluida',
        lead: { status: 'Proposta_Enviada', company: null, contact: null },
      },
    ]);
    prismaMock.activity.count.mockResolvedValue(2);

    const repo = new PrismaActivityRepository();
    const page = await repo.findAllPaginated('org-1');

    expect(prismaMock.activity.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
        include: { lead: { include: { company: true, contact: true } } },
      }),
    );
    expect(page.data).toHaveLength(2);

    prismaMock.activity.findMany.mockClear();
    const from = new Date('2026-11-01T00:00:00Z');
    const to = new Date('2026-11-30T23:59:59Z');
    await repo.findRange('org-1', from, to);

    expect(prismaMock.activity.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', date: { gte: from, lt: to } },
        include: { lead: { include: { company: true, contact: true } } },
      }),
    );
  });
});

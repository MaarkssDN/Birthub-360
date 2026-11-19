import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DealClosureEvent } from '../../../../shared/domain/dealClosure.js';

/**
 * Tenancy (handoff 01A→04, onda-paralela-8): `leadId` chega do body/rota e era gravado em
 * `Note`/`DealClosureEvent` sem verificar se o lead pertence ao `organizationId` — evidência
 * órfã cross-tenant. O port é o ponto único de TODOS os gates de fechamento, então a validação
 * mora aqui: lead estrangeiro → 404 antes de qualquer escrita.
 */
const prismaMock = {
  lead: { findFirst: vi.fn() },
  note: { create: vi.fn() },
  dealClosureEvent: { create: vi.fn() },
};

vi.mock('../../../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { prismaDealClosureGate } = await import('../PrismaDealClosureGate.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('PrismaDealClosureGate — validação de tenant do leadId', () => {
  it('createConfirmationNote: lead de outro tenant → 404, sem criar Note', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);

    await expect(
      prismaDealClosureGate.createConfirmationNote({
        organizationId: 'org-1',
        leadId: 'lead-de-outro-tenant',
        authorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(prismaMock.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-de-outro-tenant', organizationId: 'org-1' },
      }),
    );
    expect(prismaMock.note.create).not.toHaveBeenCalled();
  });

  it('createConfirmationNote: lead do tenant → cria a Note normalmente', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.note.create.mockResolvedValue({ id: 'note-1' });

    const result = await prismaDealClosureGate.createConfirmationNote({
      organizationId: 'org-1',
      leadId: 'lead-1',
      authorUserId: 'user-1',
    });

    expect(result).toEqual({ id: 'note-1' });
    expect(prismaMock.note.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ leadId: 'lead-1' }) }),
    );
  });

  it('saveDealClosureEvent: lead de outro tenant → 404, sem gravar DealClosureEvent', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);

    const foreignEvent: DealClosureEvent = {
      id: 'evt-1',
      organizationId: 'org-1',
      leadId: 'lead-de-outro-tenant',
      type: 'payment_confirmed',
      evidenceRef: 'doc-1',
      triggeredBy: 'user-1',
      occurredAt: new Date(),
    };
    await expect(prismaDealClosureGate.saveDealClosureEvent(foreignEvent)).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(prismaMock.dealClosureEvent.create).not.toHaveBeenCalled();
  });

  it('saveDealClosureEvent: lead do tenant → grava o evento', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.dealClosureEvent.create.mockResolvedValue({});

    const event: DealClosureEvent = {
      id: 'evt-1',
      organizationId: 'org-1',
      leadId: 'lead-1',
      type: 'payment_confirmed',
      evidenceRef: 'doc-1',
      triggeredBy: 'user-1',
      occurredAt: new Date(),
    };
    await prismaDealClosureGate.saveDealClosureEvent(event);

    expect(prismaMock.dealClosureEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leadId: 'lead-1', organizationId: 'org-1' }),
      }),
    );
  });
});

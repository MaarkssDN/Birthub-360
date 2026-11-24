import { describe, expect, it, vi } from 'vitest';

const prismaMock: any = {
  contact: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  lead: {
    findMany: vi.fn(),
  },
  optOutRecord: {
    create: vi.fn(),
  },
  whatsAppMessage: {
    updateMany: vi.fn(),
  },
  copilotoConversation: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  copilotoTranscriptSegment: {
    updateMany: vi.fn(),
  },
  copilotoInsight: {
    updateMany: vi.fn(),
  },
  copilotoCrmFieldSuggestion: {
    updateMany: vi.fn(),
  },
  copilotoCoachingEvaluation: {
    updateMany: vi.fn(),
  },
  conversationSignal: {
    updateMany: vi.fn(),
  },
  timelineEvent: {
    updateMany: vi.fn(),
  },
  voiceCallLog: {
    updateMany: vi.fn(),
  },
  agentMemory: {
    updateMany: vi.fn(),
  },
  auditLog: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('../../../../src/lib/prisma.js', () => ({
  prisma: prismaMock,
  runInTransaction: vi.fn(async (fn: any) => fn(prismaMock)),
}));

vi.mock('../../../../src/lib/storage/index.js', () => ({
  deleteObject: vi.fn(),
}));

const { eraseDataSubject } = await import(
  '../../../../src/shared/services/dataSubjectErasure.service.js'
);

describe('Agente 08 (Dora) - Expurgo Físico LGPD em Cascata para Logs e Telemetria', () => {
  it('deve realizar expurgo de dados do titular e conservar logs de auditoria imutáveis (Art. 16, I)', async () => {
    const contactMock = {
      id: 'contact-dora-1',
      name: 'João da Silva',
      email: 'joao@example.com',
      phone: '11999998888',
      organizationId: 'org-lgpd-test',
    };

    prismaMock.contact.findFirst.mockResolvedValue(contactMock);
    prismaMock.lead.findMany.mockResolvedValue([]);
    prismaMock.optOutRecord.create.mockResolvedValue({});
    prismaMock.contact.update.mockResolvedValue({});
    prismaMock.whatsAppMessage.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.copilotoConversation.findMany.mockResolvedValue([]);
    prismaMock.agentMemory.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.auditLog.create.mockResolvedValue({});

    const result = await eraseDataSubject({
      organizationId: 'org-lgpd-test',
      contactId: 'contact-dora-1',
      actorUserId: 'admin-dora',
    });

    expect(result.contactId).toBe('contact-dora-1');
    expect(result.whatsAppMessagesMasked).toBe(2);
    expect(result.priorAuditLogsPurged).toBe(0);

    // AuditLog é append-only/imutável (gatilho auditlog_no_mutation): nenhum deleteMany é permitido.
    // A comprovação do direito é feita pelo append do evento ERASURE_LGPD_ART_18 sem PII direta.
    expect(prismaMock.auditLog.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ERASURE_LGPD_ART_18',
        entity: 'Contact',
        entityId: 'contact-dora-1',
        tenantId: 'org-lgpd-test',
      }),
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  deleteObjectMock,
  delRedisMock,
  contactFindFirstMock,
  contactUpdateMock,
  leadFindManyMock,
  optOutCreateMock,
  whatsAppUpdateManyMock,
  copilotoConversationFindManyMock,
  copilotoConversationUpdateManyMock,
  copilotoTranscriptUpdateManyMock,
  copilotoInsightUpdateManyMock,
  copilotoCrmSuggestionUpdateManyMock,
  copilotoCoachingUpdateManyMock,
  signalUpdateManyMock,
  timelineUpdateManyMock,
  voiceCallLogUpdateManyMock,
  agentMemoryUpdateManyMock,
  auditLogCreateMock,
  transactionMock,
} = vi.hoisted(() => {
  const deleteObjectMock = vi.fn();
  const delRedisMock = vi.fn();
  const contactFindFirstMock = vi.fn();
  const contactUpdateMock = vi.fn();
  const leadFindManyMock = vi.fn();
  const optOutCreateMock = vi.fn();
  const whatsAppUpdateManyMock = vi.fn();
  const copilotoConversationFindManyMock = vi.fn();
  const copilotoConversationUpdateManyMock = vi.fn();
  const copilotoTranscriptUpdateManyMock = vi.fn();
  const copilotoInsightUpdateManyMock = vi.fn();
  const copilotoCrmSuggestionUpdateManyMock = vi.fn();
  const copilotoCoachingUpdateManyMock = vi.fn();
  const signalUpdateManyMock = vi.fn();
  const timelineUpdateManyMock = vi.fn();
  const voiceCallLogUpdateManyMock = vi.fn();
  const agentMemoryUpdateManyMock = vi.fn();
  const auditLogCreateMock = vi.fn();

  const mockTx = {
    contact: {
      findFirst: (...args: unknown[]) => contactFindFirstMock(...args),
      update: (...args: unknown[]) => contactUpdateMock(...args),
    },
    lead: {
      findMany: (...args: unknown[]) => leadFindManyMock(...args),
    },
    optOutRecord: {
      create: (...args: unknown[]) => optOutCreateMock(...args),
    },
    whatsAppMessage: {
      updateMany: (...args: unknown[]) => whatsAppUpdateManyMock(...args),
    },
    copilotoConversation: {
      findMany: (...args: unknown[]) => copilotoConversationFindManyMock(...args),
      updateMany: (...args: unknown[]) => copilotoConversationUpdateManyMock(...args),
    },
    copilotoTranscriptSegment: {
      updateMany: (...args: unknown[]) => copilotoTranscriptUpdateManyMock(...args),
    },
    copilotoInsight: {
      updateMany: (...args: unknown[]) => copilotoInsightUpdateManyMock(...args),
    },
    copilotoCrmFieldSuggestion: {
      updateMany: (...args: unknown[]) => copilotoCrmSuggestionUpdateManyMock(...args),
    },
    copilotoCoachingEvaluation: {
      updateMany: (...args: unknown[]) => copilotoCoachingUpdateManyMock(...args),
    },
    conversationSignal: {
      updateMany: (...args: unknown[]) => signalUpdateManyMock(...args),
    },
    timelineEvent: {
      updateMany: (...args: unknown[]) => timelineUpdateManyMock(...args),
    },
    voiceCallLog: {
      updateMany: (...args: unknown[]) => voiceCallLogUpdateManyMock(...args),
    },
    agentMemory: {
      updateMany: (...args: unknown[]) => agentMemoryUpdateManyMock(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => auditLogCreateMock(...args),
    },
  };

  const transactionMock = vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));

  return {
    deleteObjectMock,
    delRedisMock,
    contactFindFirstMock,
    contactUpdateMock,
    leadFindManyMock,
    optOutCreateMock,
    whatsAppUpdateManyMock,
    copilotoConversationFindManyMock,
    copilotoConversationUpdateManyMock,
    copilotoTranscriptUpdateManyMock,
    copilotoInsightUpdateManyMock,
    copilotoCrmSuggestionUpdateManyMock,
    copilotoCoachingUpdateManyMock,
    signalUpdateManyMock,
    timelineUpdateManyMock,
    voiceCallLogUpdateManyMock,
    agentMemoryUpdateManyMock,
    auditLogCreateMock,
    transactionMock,
  };
});

vi.mock('@/lib/storage', () => ({
  deleteObject: (...args: unknown[]) => deleteObjectMock(...args),
}));

vi.mock('@/lib/redis/client.js', () => ({
  getRedisClient: () => ({
    del: (...args: unknown[]) => delRedisMock(...args),
  }),
  isRedisConfigured: () => true,
}));

vi.mock('@/lib/prisma', () => ({
  runInTransaction: (cb: any) => transactionMock(cb),
  prisma: {
    $transaction: (cb: any) => transactionMock(cb),
    contact: { findFirst: contactFindFirstMock, update: contactUpdateMock },
    lead: { findMany: leadFindManyMock },
    optOutRecord: { create: optOutCreateMock },
    whatsAppMessage: { updateMany: whatsAppUpdateManyMock },
    copilotoConversation: {
      findMany: copilotoConversationFindManyMock,
      updateMany: copilotoConversationUpdateManyMock,
    },
    copilotoTranscriptSegment: { updateMany: copilotoTranscriptUpdateManyMock },
    copilotoInsight: { updateMany: copilotoInsightUpdateManyMock },
    copilotoCrmFieldSuggestion: { updateMany: copilotoCrmSuggestionUpdateManyMock },
    copilotoCoachingEvaluation: { updateMany: copilotoCoachingUpdateManyMock },
    conversationSignal: { updateMany: signalUpdateManyMock },
    timelineEvent: { updateMany: timelineUpdateManyMock },
    voiceCallLog: { updateMany: voiceCallLogUpdateManyMock },
    agentMemory: { updateMany: agentMemoryUpdateManyMock },
    auditLog: { create: auditLogCreateMock },
  },
}));

import { eraseDataSubject } from '@/shared/services/dataSubjectErasure.service.js';

const ORG_ID = 'org-tenant-lgpd';
const CONTACT_ID = 'contact-titular-999';

beforeEach(() => {
  vi.clearAllMocks();
  deleteObjectMock.mockResolvedValue(true);
  delRedisMock.mockResolvedValue(1);

  contactFindFirstMock.mockResolvedValue({
    id: CONTACT_ID,
    organizationId: ORG_ID,
    name: 'Carlos Titular',
    phone: '+5511999991111',
    email: 'carlos@titular.com.br',
  });
  leadFindManyMock.mockResolvedValue([{ id: 'lead-100' }]);
  optOutCreateMock.mockResolvedValue({ id: 'opt-100' });
  contactUpdateMock.mockResolvedValue({ id: CONTACT_ID });
  whatsAppUpdateManyMock.mockResolvedValue({ count: 2 });
  copilotoConversationFindManyMock.mockResolvedValue([
    { id: 'conv-100', audioObjectKey: `copiloto-ia/${ORG_ID}/audio-100.webm` },
  ]);
  copilotoConversationUpdateManyMock.mockResolvedValue({ count: 1 });
  copilotoTranscriptUpdateManyMock.mockResolvedValue({ count: 5 });
  copilotoInsightUpdateManyMock.mockResolvedValue({ count: 2 });
  copilotoCrmSuggestionUpdateManyMock.mockResolvedValue({ count: 1 });
  copilotoCoachingUpdateManyMock.mockResolvedValue({ count: 1 });
  signalUpdateManyMock.mockResolvedValue({ count: 3 });
  timelineUpdateManyMock.mockResolvedValue({ count: 4 });
  voiceCallLogUpdateManyMock.mockResolvedValue({ count: 2 });
  agentMemoryUpdateManyMock.mockResolvedValue({ count: 1 });
  auditLogCreateMock.mockResolvedValue({ id: 'audit-log-100' });
});

describe('LGPD Data Subject Erasure — Transactional Rollback & Immutability (B-13 / DIV-AGENTE-21-001)', () => {
  it('executa 100% das mutações sob prisma.$transaction e grava log de auditoria imutável', async () => {
    const result = await eraseDataSubject({
      organizationId: ORG_ID,
      contactId: CONTACT_ID,
      actorUserId: 'admin-dpo-1',
    });

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(result.contactId).toBe(CONTACT_ID);
    expect(result.whatsAppMessagesMasked).toBe(2);
    expect(result.copilotoAudiosDeleted).toBe(1);

    // Auditoria imutável gravada no banco com hash sem PII
    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ERASURE_LGPD_ART_18',
          entity: 'Contact',
          entityId: CONTACT_ID,
          actorId: 'admin-dpo-1',
          tenantId: ORG_ID,
          details: expect.stringContaining('subjectHash'),
        }),
      }),
    );

    // Storage e Cache acionados somente após transação de banco confirmada
    expect(deleteObjectMock).toHaveBeenCalledWith(`copiloto-ia/${ORG_ID}/audio-100.webm`);
    expect(delRedisMock).toHaveBeenCalled();
  });

  it('sofre rollback atômico e NÃO remove storage nem cache se ocorrer falha no banco', async () => {
    // Simula falha em uma tabela intermediária dentro da transação
    copilotoTranscriptUpdateManyMock.mockRejectedValueOnce(
      new Error('Deadlock detectado no PostgreSQL durante anonimização de transcrição'),
    );

    await expect(
      eraseDataSubject({
        organizationId: ORG_ID,
        contactId: CONTACT_ID,
        actorUserId: 'admin-dpo-1',
      }),
    ).rejects.toThrow('Deadlock detectado no PostgreSQL');

    // Comprova que áudio no storage NÃO foi excluído fisicamente
    expect(deleteObjectMock).not.toHaveBeenCalled();

    // Comprova que cache Redis NÃO foi invalidado prematuramente
    expect(delRedisMock).not.toHaveBeenCalled();
  });
});

import { createDecipheriv, scryptSync } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  contactFindFirstMock,
  leadFindManyMock,
  whatsAppFindManyMock,
  voiceCallFindManyMock,
  copilotoFindManyMock,
  timelineFindManyMock,
  auditLogCreateMock,
} = vi.hoisted(() => ({
  contactFindFirstMock: vi.fn(),
  leadFindManyMock: vi.fn(),
  whatsAppFindManyMock: vi.fn(),
  voiceCallFindManyMock: vi.fn(),
  copilotoFindManyMock: vi.fn(),
  timelineFindManyMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: { findFirst: contactFindFirstMock },
    lead: { findMany: leadFindManyMock },
    whatsAppMessage: { findMany: whatsAppFindManyMock },
    voiceCallLog: { findMany: voiceCallFindManyMock },
    copilotoConversation: { findMany: copilotoFindManyMock },
    timelineEvent: { findMany: timelineFindManyMock },
    auditLog: { create: auditLogCreateMock },
  },
}));

import { exportDataSubjectDossier } from '@/shared/services/dataSubjectPortability.service.js';

const ORG_ID = 'org-portability-test';
const CONTACT_ID = 'contact-alice-123';

beforeEach(() => {
  vi.clearAllMocks();

  contactFindFirstMock.mockResolvedValue({
    id: CONTACT_ID,
    organizationId: ORG_ID,
    name: 'Alice da Silva',
    email: 'alice@silva.com.br',
    phone: '+5511999998888',
    whatsapp: '+5511999998888',
    birthDate: new Date('1990-05-15'),
    observations: 'Cliente preferencial',
    customFields: { segmento: 'Varejo' },
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-06-01T10:00:00Z'),
  });

  leadFindManyMock.mockResolvedValue([
    {
      id: 'lead-alice-1',
      title: 'Oportunidade Plano Enterprise',
      status: 'EM_ANDAMENTO',
      createdAt: new Date('2026-02-01T10:00:00Z'),
    },
  ]);

  whatsAppFindManyMock.mockResolvedValue([
    {
      id: 'wa-1',
      direction: 'inbound',
      body: 'Olá, gostaria de saber mais sobre o software.',
      receivedAt: new Date('2026-02-02T10:00:00Z'),
    },
  ]);

  voiceCallFindManyMock.mockResolvedValue([
    {
      id: 'call-1',
      createdAt: new Date('2026-02-03T14:00:00Z'),
      durationSeconds: 120,
      outcome: 'COMPLETED',
      transcript: 'Alice: Quero agendar a demonstração.',
      summary: 'Cliente demonstrou interesse.',
    },
  ]);

  copilotoFindManyMock.mockResolvedValue([
    {
      id: 'copiloto-conv-1',
      createdAt: new Date('2026-02-03T14:00:00Z'),
      transcriptSegments: [
        {
          speakerLabel: 'Cliente',
          text: 'Quero agendar a demonstração.',
          startMs: 1000,
          endMs: 3000,
        },
      ],
      insights: [
        {
          type: 'INTENT_PURCHASE',
          valueJson: { confidence: 0.95 },
        },
      ],
    },
  ]);

  timelineFindManyMock.mockResolvedValue([
    {
      id: 'tl-1',
      type: 'STAGE_CHANGED',
      description: 'Lead avançou para Demonstração',
      createdAt: new Date('2026-02-04T10:00:00Z'),
    },
  ]);

  auditLogCreateMock.mockResolvedValue({ id: 'audit-1' });
});

describe('LGPD Data Subject Portability Service (Art. 18, V / DIV-AGENTE-21-002)', () => {
  it('lança erro se o titular não for encontrado na organização', async () => {
    contactFindFirstMock.mockResolvedValueOnce(null);

    await expect(
      exportDataSubjectDossier({
        organizationId: ORG_ID,
        contactId: 'inexistente',
      }),
    ).rejects.toThrow(/não encontrado na organização/);
  });

  it('compila dossiê completo de dados agregando todas as entidades sem dados de terceiros', async () => {
    const result = await exportDataSubjectDossier({
      organizationId: ORG_ID,
      contactId: CONTACT_ID,
      requestedByUserId: 'dpo-user-1',
    });

    const { dossier, jsonPackage } = result;

    expect(dossier.metadata.contactId).toBe(CONTACT_ID);
    expect(dossier.metadata.organizationId).toBe(ORG_ID);
    expect(dossier.metadata.legalBasis).toContain('Artigo 18, Inciso V');
    expect(dossier.metadata.dataSubjectHash).toBeDefined();

    expect(dossier.contact.name).toBe('Alice da Silva');
    expect(dossier.leads).toHaveLength(1);
    expect(dossier.whatsAppMessages).toHaveLength(1);
    expect(dossier.voiceCalls).toHaveLength(1);
    expect(dossier.voiceCalls[0]?.transcript).toContain('Alice: Quero agendar');
    expect(dossier.copilotoConversations).toHaveLength(1);
    expect(dossier.copilotoConversations[0]?.transcriptSegments).toHaveLength(1);
    expect(dossier.timelineEvents).toHaveLength(1);

    expect(jsonPackage).toContain('Alice da Silva');
    expect(auditLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'PORTABILITY_EXPORT_LGPD_ART_18',
          entity: 'Contact',
          entityId: CONTACT_ID,
          tenantId: ORG_ID,
        }),
      }),
    );
  });

  it('gera pacote criptografado com AES-256-GCM decifrável quando senha for providenciada', async () => {
    const password = 'MinhaSenhaSegura123!';
    const result = await exportDataSubjectDossier({
      organizationId: ORG_ID,
      contactId: CONTACT_ID,
      encryptionPassword: password,
    });

    expect(result.encryptedPackage).toBeDefined();
    const { ciphertext, iv, tag, salt, algorithm } = result.encryptedPackage!;
    expect(algorithm).toBe('aes-256-gcm');

    // Decifra para provar integridade reversível pelo titular com a senha
    const saltBuf = Buffer.from(salt, 'base64');
    const ivBuf = Buffer.from(iv, 'base64');
    const tagBuf = Buffer.from(tag, 'base64');
    const cipherBuf = Buffer.from(ciphertext, 'base64');

    const key = scryptSync(password, saltBuf, 32);
    const decipher = createDecipheriv('aes-256-gcm', key, ivBuf);
    decipher.setAuthTag(tagBuf);

    const decryptedText = Buffer.concat([decipher.update(cipherBuf), decipher.final()]).toString('utf8');
    const parsedDecrypted = JSON.parse(decryptedText);

    expect(parsedDecrypted.contact.name).toBe('Alice da Silva');
    expect(parsedDecrypted.metadata.contactId).toBe(CONTACT_ID);
  });
});

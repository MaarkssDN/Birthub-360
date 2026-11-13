import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  contactFindFirstMock,
  eraseDataSubjectMock,
  exportDataSubjectDossierMock,
  revokeConsentMock,
} = vi.hoisted(() => ({
  contactFindFirstMock: vi.fn(),
  eraseDataSubjectMock: vi.fn(),
  exportDataSubjectDossierMock: vi.fn(),
  revokeConsentMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: { findFirst: contactFindFirstMock },
  },
}));

vi.mock('@/shared/services/dataSubjectErasure.service.js', () => ({
  eraseDataSubject: eraseDataSubjectMock,
  ANONYMIZED_CONTACT_NAME: '[titular anonimizado — LGPD]',
}));

vi.mock('@/shared/services/dataSubjectPortability.service.js', () => ({
  exportDataSubjectDossier: exportDataSubjectDossierMock,
}));

vi.mock('@/lib/security/consentChainFactory.js', () => ({
  consentAuditChain: {
    revokeConsent: revokeConsentMock,
  },
}));

import { lgpdService } from '../lgpd.service.js';

const ORG_ID = 'org-lgpd-test';
const CONTACT_ID = 'contact-titular-1';
const ACTOR_ID = 'user-admin-1';

describe('LgpdService — direitos do titular (MEL-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeConsentMock.mockResolvedValue({ id: 'rev-1' });
    eraseDataSubjectMock.mockResolvedValue({
      contactId: CONTACT_ID,
      whatsAppMessagesMasked: 3,
      conversationSignalsRedacted: 1,
      timelineEventsRedacted: 2,
      voiceCallLogsRedacted: 1,
      copilotoTranscriptSegmentsRedacted: 4,
      copilotoInsightsRedacted: 2,
      copilotoAudiosDeleted: 1,
      alreadyAnonymized: false,
    });
  });

  describe('eraseContact — exclusão/anonimização + revogação na cadeia', () => {
    it('anonimiza via eraseDataSubject e revoga o consentimento com o e-mail do titular', async () => {
      contactFindFirstMock.mockResolvedValue({ email: '  Titular@Example.COM ' });

      const result = await lgpdService.eraseContact(ORG_ID, CONTACT_ID, ACTOR_ID);

      expect(eraseDataSubjectMock).toHaveBeenCalledWith({
        organizationId: ORG_ID,
        contactId: CONTACT_ID,
        actorUserId: ACTOR_ID,
      });
      // subjectRef da cadeia = e-mail normalizado (mesma chave usada em publicLead.service).
      expect(revokeConsentMock).toHaveBeenCalledWith(
        ORG_ID,
        'titular@example.com',
        'ERASURE_REQUEST',
        ACTOR_ID,
      );
      expect(result.contactId).toBe(CONTACT_ID);
    });

    it('não quebra a exclusão se a revogação na cadeia falhar (best-effort)', async () => {
      contactFindFirstMock.mockResolvedValue({ email: 'titular@example.com' });
      revokeConsentMock.mockRejectedValue(new Error('chain unavailable'));

      const result = await lgpdService.eraseContact(ORG_ID, CONTACT_ID, ACTOR_ID);

      expect(eraseDataSubjectMock).toHaveBeenCalled();
      expect(result.contactId).toBe(CONTACT_ID);
    });

    it('titular sem e-mail: anonimiza mas não tenta revogar (subjectRef indisponível)', async () => {
      contactFindFirstMock.mockResolvedValue({ email: null });

      await lgpdService.eraseContact(ORG_ID, CONTACT_ID, ACTOR_ID);

      expect(eraseDataSubjectMock).toHaveBeenCalled();
      expect(revokeConsentMock).not.toHaveBeenCalled();
    });

    it('propaga o erro de eraseDataSubject sem tentar revogar', async () => {
      contactFindFirstMock.mockResolvedValue({ email: 'titular@example.com' });
      eraseDataSubjectMock.mockRejectedValue(new Error('Contato não encontrado.'));

      await expect(lgpdService.eraseContact(ORG_ID, CONTACT_ID, ACTOR_ID)).rejects.toThrow(
        'Contato não encontrado.',
      );
      expect(revokeConsentMock).not.toHaveBeenCalled();
    });
  });

  describe('exportContactData — portabilidade completa (Art. 18, V)', () => {
    it('delega ao dossiê completo e repassa solicitante/senha de transporte', async () => {
      const dossierResult = {
        dossier: {
          metadata: { exportId: 'portability-abc123', legalBasis: 'LGPD' },
          contact: { id: CONTACT_ID, name: 'Titular' },
          leads: [],
          whatsAppMessages: [],
          voiceCalls: [],
          copilotoConversations: [],
          timelineEvents: [],
        },
        jsonPackage: '{"metadata":{}}',
        encryptedPackage: { ciphertext: 'x', iv: 'y', tag: 'z', salt: 's', algorithm: 'aes-256-gcm' },
      };
      exportDataSubjectDossierMock.mockResolvedValue(dossierResult);

      const result = await lgpdService.exportContactData(ORG_ID, CONTACT_ID, {
        requestedByUserId: ACTOR_ID,
        encryptionPassword: 'senha-forte-123',
      });

      expect(exportDataSubjectDossierMock).toHaveBeenCalledWith({
        organizationId: ORG_ID,
        contactId: CONTACT_ID,
        requestedByUserId: ACTOR_ID,
        encryptionPassword: 'senha-forte-123',
      });
      // O pacote cobre todas as categorias obrigatórias do titular.
      expect(result.dossier).toHaveProperty('contact');
      expect(result.dossier).toHaveProperty('leads');
      expect(result.dossier).toHaveProperty('whatsAppMessages');
      expect(result.dossier).toHaveProperty('voiceCalls');
      expect(result.dossier).toHaveProperty('copilotoConversations');
      expect(result.dossier).toHaveProperty('timelineEvents');
      expect(result.encryptedPackage?.algorithm).toBe('aes-256-gcm');
    });

    it('sem senha de transporte, exporta apenas o pacote em claro', async () => {
      exportDataSubjectDossierMock.mockResolvedValue({
        dossier: { metadata: { exportId: 'p1' } },
        jsonPackage: '{}',
        encryptedPackage: undefined,
      });

      const result = await lgpdService.exportContactData(ORG_ID, CONTACT_ID);

      expect(exportDataSubjectDossierMock).toHaveBeenCalledWith({
        organizationId: ORG_ID,
        contactId: CONTACT_ID,
        requestedByUserId: undefined,
        encryptionPassword: undefined,
      });
      expect(result.encryptedPackage).toBeUndefined();
    });
  });
});

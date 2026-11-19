import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockContactFindFirst = vi.fn();
const mockDsrCreate = vi.fn();
const mockDsrFindUnique = vi.fn();
const mockDsrFindFirst = vi.fn();
const mockDsrUpdate = vi.fn();
const mockAuditCreate = vi.fn();
const mockSendEmail = vi.fn();
const mockExportContactData = vi.fn();
const mockEraseContact = vi.fn();
const mockRevokeConsent = vi.fn();

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    contact: {
      findFirst: (...args: unknown[]) => mockContactFindFirst(...args),
    },
    dataSubjectRequest: {
      create: (...args: unknown[]) => mockDsrCreate(...args),
      findUnique: (...args: unknown[]) => mockDsrFindUnique(...args),
      findFirst: (...args: unknown[]) => mockDsrFindFirst(...args),
      update: (...args: unknown[]) => mockDsrUpdate(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
    },
  },
}));

vi.mock('@/lib/email/mailer.js', () => ({
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/features/lgpd/lgpd.service.js', () => ({
  lgpdService: {
    exportContactData: (...args: unknown[]) => mockExportContactData(...args),
    eraseContact: (...args: unknown[]) => mockEraseContact(...args),
  },
}));

vi.mock('@/lib/security/consentChainFactory.js', () => ({
  consentAuditChain: {
    revokeConsent: (...args: unknown[]) => mockRevokeConsent(...args),
  },
}));

const {
  DsrInvalidTokenError,
  DsrSubjectNotFoundError,
  DsrUnavailableError,
  createDataSubjectRequest,
  getDataSubjectRequestStatus,
  verifyDataSubjectRequest,
} = await import('@/features/lgpd/dsrRequest.service.js');
const { encryptField } = await import('@/lib/crypto/secretFields.js');
const { MailerNotConfiguredError } = await import('@/lib/email/mailer.js');
const { createHash } = await import('node:crypto');

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex');
}

describe('dsrRequest.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LANDING_LEAD_ORGANIZATION_ID = 'org-dsr-1';
    process.env.PUBLIC_BASE_URL = 'https://birthhub360.test/';
    mockAuditCreate.mockResolvedValue({});
    mockSendEmail.mockResolvedValue({});
  });

  it('lança DsrUnavailableError quando LANDING_LEAD_ORGANIZATION_ID está ausente', async () => {
    delete process.env.LANDING_LEAD_ORGANIZATION_ID;
    await expect(
      createDataSubjectRequest({ email: 'user@example.com', rightType: 'ACCESS' }),
    ).rejects.toBeInstanceOf(DsrUnavailableError);
  });

  it('retorna no_subject quando nenhum contato corresponde ao e-mail', async () => {
    mockContactFindFirst.mockResolvedValue(null);
    const res = await createDataSubjectRequest({
      email: 'inexistente@example.com',
      rightType: 'ACCESS',
    });
    expect(res).toBe('no_subject');
    expect(mockDsrCreate).not.toHaveBeenCalled();
  });

  it('cria DataSubjectRequest, grava auditoria e envia e-mail de verificação (tolerando erro de SMTP e auditoria)', async () => {
    mockContactFindFirst.mockResolvedValue({ id: 'contact-1' });
    mockDsrCreate.mockResolvedValue({ id: 'dsr-1' });
    mockAuditCreate.mockRejectedValueOnce(new Error('db audit error'));
    mockSendEmail.mockRejectedValueOnce(new MailerNotConfiguredError('smtp off'));

    const res = await createDataSubjectRequest({
      email: 'titular@example.com',
      rightType: 'CORRECTION',
      preferredChannel: 'whatsapp',
      details: 'Corrigir telefone',
    });

    expect(res).toBe('created');
    expect(mockDsrCreate).toHaveBeenCalledTimes(1);

    mockSendEmail.mockRejectedValueOnce(new Error('smtp network failure'));
    const res2 = await createDataSubjectRequest({
      email: 'titular@example.com',
      rightType: 'ACCESS',
    });
    expect(res2).toBe('created');
  });

  it('verifyDataSubjectRequest executa ACCESS/PORTABILITY, ERASURE, CONSENT_REVOCATION e CORRECTION/SHARING_INFO', async () => {
    const rawToken = 'valid-secret-token-12345';
    const baseRequest = {
      id: 'dsr-1',
      protocol: 'DSR-1111-2222-3333',
      status: 'PENDING_VERIFICATION',
      emailIndex: 'idx-1',
      emailEncrypted: encryptField('titular@example.com'),
      verificationTokenHash: sha256(rawToken),
      verificationExpiresAt: new Date(Date.now() + 60_000),
    };

    mockContactFindFirst.mockResolvedValue({ id: 'contact-1' });
    mockDsrUpdate.mockResolvedValue({});
    mockExportContactData.mockResolvedValue({
      jsonPackage: '{"ok":true}',
      dossier: { metadata: { exportId: 'exp-1' } },
    });

    mockDsrFindUnique.mockResolvedValueOnce({ ...baseRequest, rightType: 'PORTABILITY' });
    const portRes = await verifyDataSubjectRequest({
      protocol: baseRequest.protocol,
      token: rawToken,
    });
    expect(portRes).toEqual({ status: 'COMPLETED', package: '{"ok":true}' });

    mockDsrFindUnique.mockResolvedValueOnce({ ...baseRequest, rightType: 'ERASURE' });
    const eraseRes = await verifyDataSubjectRequest({
      protocol: baseRequest.protocol,
      token: rawToken,
    });
    expect(eraseRes).toEqual({ status: 'COMPLETED' });
    expect(mockEraseContact).toHaveBeenCalledWith('org-dsr-1', 'contact-1');

    mockDsrFindUnique.mockResolvedValueOnce({ ...baseRequest, rightType: 'CONSENT_REVOCATION' });
    mockSendEmail.mockRejectedValueOnce(new MailerNotConfiguredError('smtp off'));
    const revRes = await verifyDataSubjectRequest({
      protocol: baseRequest.protocol,
      token: rawToken,
    });
    expect(revRes).toEqual({ status: 'COMPLETED' });
    expect(mockRevokeConsent).toHaveBeenCalled();

    mockDsrFindUnique.mockResolvedValueOnce({ ...baseRequest, rightType: 'SHARING_INFO' });
    mockSendEmail.mockRejectedValueOnce(new Error('smtp fail'));
    const manRes = await verifyDataSubjectRequest({
      protocol: baseRequest.protocol,
      token: rawToken,
    });
    expect(manRes).toEqual({ status: 'IN_PROGRESS' });
  });

  it('verifyDataSubjectRequest rejeita token inválido/expirado e titular ausente (404)', async () => {
    mockDsrFindUnique.mockResolvedValueOnce(null);
    await expect(
      verifyDataSubjectRequest({ protocol: 'DSR-0000', token: 'invalid-token-123' }),
    ).rejects.toBeInstanceOf(DsrInvalidTokenError);

    const rawToken = 'valid-token-abc-12345';
    mockDsrFindUnique.mockResolvedValueOnce({
      id: 'dsr-2',
      protocol: 'DSR-2222',
      rightType: 'ERASURE',
      status: 'PENDING_VERIFICATION',
      emailIndex: 'idx-missing',
      emailEncrypted: encryptField('gone@example.com'),
      verificationTokenHash: sha256(rawToken),
      verificationExpiresAt: new Date(Date.now() + 60_000),
    });
    mockContactFindFirst.mockResolvedValueOnce(null);

    await expect(
      verifyDataSubjectRequest({ protocol: 'DSR-2222', token: rawToken }),
    ).rejects.toBeInstanceOf(DsrSubjectNotFoundError);
  });

  it('getDataSubjectRequestStatus retorna metadados ou lança DsrInvalidTokenError', async () => {
    const now = new Date();
    mockDsrFindFirst.mockResolvedValueOnce({
      protocol: 'DSR-3333',
      rightType: 'ACCESS',
      status: 'COMPLETED',
      createdAt: now,
      verifiedAt: now,
    });

    const status = await getDataSubjectRequestStatus('status-token-123');
    expect(status.protocol).toBe('DSR-3333');

    mockDsrFindFirst.mockResolvedValueOnce(null);
    await expect(getDataSubjectRequestStatus('unknown-token')).rejects.toBeInstanceOf(
      DsrInvalidTokenError,
    );
  });
});

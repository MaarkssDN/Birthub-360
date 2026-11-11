import { beforeEach, describe, expect, it, vi } from 'vitest';

const organizationFindUnique = vi.fn();
const contactFindFirst = vi.fn();
const companyCreate = vi.fn();
const contactCreate = vi.fn();
const leadCreate = vi.fn();
const consentCreate = vi.fn();
const transaction = vi.fn();

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    organization: { findUnique: (...args: unknown[]) => organizationFindUnique(...args) },
    contact: { findFirst: (...args: unknown[]) => contactFindFirst(...args) },
  },
  runInTransaction: (fn: (tx: unknown) => unknown) => transaction(fn),
}));

vi.mock('../../../lib/async-context.js', () => ({
  requestContext: {
    run: (_ctx: unknown, fn: () => unknown) => fn(),
  },
}));

vi.mock('../../../config/env.js', () => ({
  env: { LANDING_LEAD_ORGANIZATION_ID: 'org-landing' },
}));

vi.mock('../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../../lib/crypto/piiIndex.js', () => ({
  contactEmailIndex: (email: string) => `idx:${email}`,
}));

import { logger } from '../../../lib/logger.js';
import { LANDING_DEMO_CONSENT_VERSION, LANDING_LEAD_SOURCE } from '../publicLead.constants.js';
import { capturePublicLead, PublicLeadUnavailableError } from '../publicLead.service.js';

const input = {
  nome: 'Mariana Albuquerque',
  email: 'voce@suaempresa.com.br',
  whatsapp: '5511999999999',
  equipe: '6 a 15' as const,
  consent: true as const,
  consentTextVersion: LANDING_DEMO_CONSENT_VERSION,
};

describe('capturePublicLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizationFindUnique.mockResolvedValue({ id: 'org-landing' });
    contactFindFirst.mockResolvedValue(null);
    companyCreate.mockResolvedValue({ id: 'company-1' });
    contactCreate.mockResolvedValue({ id: 'contact-1' });
    leadCreate.mockResolvedValue({ id: 'lead-1' });
    consentCreate.mockResolvedValue({ id: 'consent-1' });
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        company: { create: companyCreate },
        contact: { create: contactCreate },
        lead: { create: leadCreate },
        publicLeadConsent: { create: consentCreate },
      }),
    );
  });

  it('cria company, contact, lead e prova de consentimento no tenant do servidor', async () => {
    await expect(capturePublicLead(input)).resolves.toBe('created');
    expect(organizationFindUnique).toHaveBeenCalledWith({
      where: { id: 'org-landing' },
      select: { id: true },
    });
    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-landing',
          source: LANDING_LEAD_SOURCE,
          status: 'Lead_Recebido',
          contactId: 'contact-1',
          companyId: 'company-1',
        }),
      }),
    );
    expect(consentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-landing',
          leadId: 'lead-1',
          termsVersion: LANDING_DEMO_CONSENT_VERSION,
          purpose: 'agendamento_demonstracao',
        }),
      }),
    );
    const logPayloads = vi.mocked(logger.info).mock.calls.flatMap((call) => JSON.stringify(call));
    expect(logPayloads.join(' ')).not.toContain('voce@suaempresa.com.br');
    expect(logPayloads.join(' ')).not.toContain('5511999999999');
    expect(logPayloads.join(' ')).not.toContain('Mariana');
  });

  it('é idempotente: e-mail já capturado na landing não cria outro lead nem altera dados', async () => {
    contactFindFirst.mockResolvedValue({
      id: 'contact-1',
      companyId: 'company-1',
      leads: [{ id: 'lead-1' }],
    });
    await expect(capturePublicLead(input)).resolves.toBe('duplicate');
    expect(transaction).not.toHaveBeenCalled();
    expect(leadCreate).not.toHaveBeenCalled();
  });

  it('falha fechado quando a organização configurada não existe', async () => {
    organizationFindUnique.mockResolvedValue(null);
    await expect(capturePublicLead(input)).rejects.toBeInstanceOf(PublicLeadUnavailableError);
    expect(leadCreate).not.toHaveBeenCalled();
  });
});

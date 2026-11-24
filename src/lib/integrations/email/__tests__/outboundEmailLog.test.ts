import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const create = vi.fn();
const leadFindFirst = vi.fn();

vi.mock('../../../prisma.js', () => ({
  prisma: {
    emailMessage: { findUnique: (...a: unknown[]) => findUnique(...a), create: (...a: unknown[]) => create(...a) },
    lead: { findFirst: (...a: unknown[]) => leadFindFirst(...a) },
  },
}));

vi.mock('../../../async-context.js', () => ({
  requestContext: { run: async (_s: unknown, fn: () => unknown) => fn() },
}));

vi.mock('../../../logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../leadByEmail.js', () => ({
  findOpenLeadByEmail: vi.fn(),
}));

import { findOpenLeadByEmail } from '../leadByEmail.js';
import { recordOutboundEmailMessage } from '../outboundEmailLog.js';

const findOpenLeadMock = vi.mocked(findOpenLeadByEmail);

const BASE = {
  organizationId: 'org-1',
  providerMessageId: 'smtp-msg-1',
  fromEmail: 'vendas@empresa.com',
  toEmail: 'lead@exemplo.com',
  subject: 'Proposta comercial',
  body: 'Segue a proposta em anexo.',
};

describe('recordOutboundEmailMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOpenLeadMock.mockResolvedValue(null);
  });

  it('grava EmailMessage outbound com dados normalizados', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: 'em-1' });
    leadFindFirst.mockResolvedValue({ id: 'lead-1' });

    const outcome = await recordOutboundEmailMessage({ ...BASE, leadId: 'lead-1' });
    expect(outcome).toBe('recorded');
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        providerMessageId: 'smtp-msg-1',
        direction: 'outbound',
        fromEmail: 'vendas@empresa.com',
        toEmail: 'lead@exemplo.com',
        subject: 'Proposta comercial',
        leadId: 'lead-1',
      }),
    });
  });

  it('retorna duplicate sem regravar quando providerMessageId já existe', async () => {
    findUnique.mockResolvedValue({ id: 'em-existing' });
    const outcome = await recordOutboundEmailMessage(BASE);
    expect(outcome).toBe('duplicate');
    expect(create).not.toHaveBeenCalled();
  });

  it('trata P2002 na corrida check→insert como duplicate', async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue({ code: 'P2002' });
    const outcome = await recordOutboundEmailMessage(BASE);
    expect(outcome).toBe('duplicate');
  });

  it('resolve lead por e-mail do destinatário quando leadId ausente', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: 'em-2' });
    findOpenLeadMock.mockResolvedValue({ id: 'lead-by-email' });

    const outcome = await recordOutboundEmailMessage(BASE);
    expect(outcome).toBe('recorded');
    expect(findOpenLeadMock).toHaveBeenCalledWith('org-1', 'lead@exemplo.com');
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leadId: 'lead-by-email' }),
    });
  });

  it('leadId de outra org não é aceito (defesa em profundidade)', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: 'em-3' });
    leadFindFirst.mockResolvedValue(null); // lead não pertence à org

    const outcome = await recordOutboundEmailMessage({ ...BASE, leadId: 'lead-de-outra-org' });
    expect(outcome).toBe('recorded');
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leadId: null }),
    });
  });

  it('rejeita entrada inválida sem tocar no banco', async () => {
    expect(await recordOutboundEmailMessage({ ...BASE, providerMessageId: ' ' })).toBe('invalid');
    expect(await recordOutboundEmailMessage({ ...BASE, toEmail: '' })).toBe('invalid');
    expect(findUnique).not.toHaveBeenCalled();
  });
});

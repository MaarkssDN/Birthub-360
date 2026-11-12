import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ColdEmailCampaign } from '../cold-email.service.js';

/**
 * Regressão de um bug P1 real: sendColdEmail nunca checava a entregabilidade do e-mail antes de
 * disparar — um e-mail sintaticamente válido mas sem domínio/MX real ainda recebia o envio,
 * gerando bounce e custo de reputação de domínio. resolveEmailStatus (mesma verificação já usada
 * em enrichment.service.ts/enrichmentCascade.service.ts) agora bloqueia o disparo quando o status
 * é 'invalid'.
 */
vi.mock('../../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const sendEmailMock = vi.fn();
vi.mock('../../../../lib/email/mailer.js', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
}));

const isOptedOutMock = vi.fn();
vi.mock('../../../cadence/application/optOutService.js', () => ({
  isOptedOut: (...args: unknown[]) => isOptedOutMock(...args),
}));

vi.mock('../../../cadence/infra/PrismaOptOutRepository.js', () => ({
  prismaOptOutRepository: {},
}));

const resolveEmailStatusMock = vi.fn();
vi.mock('../enrichment/domainGuess.js', () => ({
  resolveEmailStatus: (...args: unknown[]) => resolveEmailStatusMock(...args),
}));

const { sendColdEmail, sendColdEmailBatch } = await import('../cold-email.service');

afterEach(() => {
  vi.clearAllMocks();
});

const baseCampaign: ColdEmailCampaign = {
  id: 'camp-1',
  targetEmail: 'contato@dominio-inexistente-xyz.example',
  subject: 'Assunto',
  body: 'Corpo',
  status: 'draft',
  legalBasis: 'legitimate_interest',
  dataSource: 'apollo',
  organizationId: 'org-1',
};

describe('sendColdEmail — gate de entregabilidade de e-mail', () => {
  it('bloqueia o envio quando resolveEmailStatus diz "invalid" (sem domínio/MX real)', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('invalid');

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('envia normalmente quando o e-mail é "verified"', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockResolvedValue(undefined);

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: baseCampaign.targetEmail,
      subject: baseCampaign.subject,
      text: baseCampaign.body,
    });
  });

  it('envia normalmente quando o status é "guessed" (só bloqueia "invalid" confirmado, não falta de certeza)', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('guessed');
    sendEmailMock.mockResolvedValue(undefined);

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(true);
    expect(sendEmailMock).toHaveBeenCalled();
  });

  it('opt-out continua com prioridade e bloqueia antes mesmo de checar o e-mail', async () => {
    isOptedOutMock.mockResolvedValue(true);

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(false);
    expect(resolveEmailStatusMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

/**
 * BT360-DT-0028 / TAREFA-SANEAMENTO-020: opt-out como filtro sanitizador na ENTRADA do funil de
 * listas, não só como etapa de borda no envio. sendColdEmailBatch consulta a supressão para a
 * lista inteira antes de qualquer disparo e devolve contagens de elegíveis/suprimidos.
 */
describe('sendColdEmailBatch — filtro de opt-out na entrada do funil', () => {
  const optedOutEmail = 'suprimido@empresa.com';
  const eligibleEmail = 'elegivel@empresa.com';

  function campaignWithEmail(id: string, email: string): ColdEmailCampaign {
    return { ...baseCampaign, id, targetEmail: email };
  }

  /** isOptedOut é chamado 2x por campanha elegível (filtro de entrada + borda do sendColdEmail). */
  function mockOptOutByEmail() {
    isOptedOutMock.mockImplementation(
      async (_repo: unknown, _org: string, subject: { email?: string | null }) =>
        subject.email === optedOutEmail,
    );
  }

  it('lista mista: suprimido é filtrado na entrada e só o elegível é enviado', async () => {
    mockOptOutByEmail();
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockResolvedValue(undefined);

    const result = await sendColdEmailBatch([
      campaignWithEmail('camp-optout', optedOutEmail),
      campaignWithEmail('camp-ok', eligibleEmail),
    ]);

    expect(result.total).toBe(2);
    expect(result.suppressedCount).toBe(1);
    expect(result.eligibleCount).toBe(1);
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.results).toEqual(
      expect.arrayContaining([
        { campaignId: 'camp-optout', outcome: 'opt-out-suppressed' },
        { campaignId: 'camp-ok', outcome: 'sent' },
      ]),
    );
    // O supressor bloqueado NUNCA chega ao transporte — sendEmail só vê o elegível.
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: eligibleEmail }));
  });

  it('lista vazia: retorna contagens zeradas sem consultar supressor nem enviar', async () => {
    const result = await sendColdEmailBatch([]);

    expect(result).toEqual({
      total: 0,
      eligibleCount: 0,
      suppressedCount: 0,
      sentCount: 0,
      failedCount: 0,
      results: [],
    });
    expect(isOptedOutMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('falha na consulta ao supressor propaga erro explícito — nada é enviado (fail-closed)', async () => {
    isOptedOutMock.mockRejectedValue(new Error('optOutRecord indisponível'));

    await expect(sendColdEmailBatch([campaignWithEmail('camp-1', eligibleEmail)])).rejects.toThrow(
      'optOutRecord indisponível',
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('campanha sem organizationId é fail-closed (invalid) e nunca é enviada', async () => {
    mockOptOutByEmail();
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockResolvedValue(undefined);

    const semTenant = { ...campaignWithEmail('camp-sem-org', eligibleEmail), organizationId: '' };
    const result = await sendColdEmailBatch([
      semTenant,
      campaignWithEmail('camp-ok', eligibleEmail),
    ]);

    expect(result.results).toEqual(
      expect.arrayContaining([
        { campaignId: 'camp-sem-org', outcome: 'invalid' },
        { campaignId: 'camp-ok', outcome: 'sent' },
      ]),
    );
    // Sem tenant não há como consultar a supressão — isOptedOut não deve nem ser chamado para ela.
    expect(isOptedOutMock).toHaveBeenCalledTimes(2); // filtro de entrada + borda do sendColdEmail do elegível
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: eligibleEmail }));
  });

  it('lista 100% suprimida: nenhum envio tentado, elegíveis = 0', async () => {
    isOptedOutMock.mockResolvedValue(true);

    const result = await sendColdEmailBatch([
      campaignWithEmail('camp-1', optedOutEmail),
      campaignWithEmail('camp-2', 'outro@empresa.com'),
    ]);

    expect(result.eligibleCount).toBe(0);
    expect(result.suppressedCount).toBe(2);
    expect(result.sentCount).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(resolveEmailStatusMock).not.toHaveBeenCalled();
  });
});

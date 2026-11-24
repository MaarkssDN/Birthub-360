import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

// DEBT-0011: persistência do disparo (EmailMessage/Activity/TimelineEvent) e dedupe durável.
const emailMessageFindUniqueMock = vi.fn();
const emailMessageCreateMock = vi.fn();
const activityCreateMock = vi.fn();
const timelineEventCreateMock = vi.fn();
vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    emailMessage: {
      findUnique: (...args: unknown[]) => emailMessageFindUniqueMock(...args),
      create: (...args: unknown[]) => emailMessageCreateMock(...args),
    },
    activity: { create: (...args: unknown[]) => activityCreateMock(...args) },
    timelineEvent: { create: (...args: unknown[]) => timelineEventCreateMock(...args) },
  },
}));

const { sendColdEmail, sendColdEmailBatch } = await import('../cold-email.service');

beforeEach(() => {
  // Defaults: nenhuma linha de dedupe existente e persistência bem-sucedida.
  emailMessageFindUniqueMock.mockResolvedValue(null);
  emailMessageCreateMock.mockResolvedValue({ id: 'em-1' });
  activityCreateMock.mockResolvedValue({ id: 'act-1' });
  timelineEventCreateMock.mockResolvedValue({ id: 'tl-1' });
});

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

  it('persiste EmailMessage outbound + Activity/TimelineEvent com legalBasis/dataSource quando há leadId', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockResolvedValue({ messageId: '<smtp-msg-1@mailer>' });

    const result = await sendColdEmail({ ...baseCampaign, leadId: 'lead-1' });

    expect(result).toBe(true);
    // Trava de dedupe: providerMessageId carrega a chave campaignId+target (UNIQUE por org).
    expect(emailMessageCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        providerMessageId: `cold-email:${baseCampaign.id}:${baseCampaign.targetEmail}`,
        direction: 'outbound',
        toEmail: baseCampaign.targetEmail,
        subject: baseCampaign.subject,
        body: baseCampaign.body,
        leadId: 'lead-1',
      }),
    });
    // Trilha LGPD: base legal e fonte dos dados ficam gravadas na Activity do CRM.
    expect(activityCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        leadId: 'lead-1',
        type: 'Email',
        observations: expect.stringContaining('legitimate_interest'),
      }),
    });
    expect(activityCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        observations: expect.stringContaining('apollo'),
      }),
    });
    expect(timelineEventCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'email',
        leadId: 'lead-1',
        description: expect.stringContaining('legitimate_interest'),
      }),
    });
  });

  it('sem leadId: persiste EmailMessage (dedupe/trilha mínima) mas não Activity/TimelineEvent', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockResolvedValue({ messageId: null });

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(true);
    expect(emailMessageCreateMock).toHaveBeenCalledTimes(1);
    expect(activityCreateMock).not.toHaveBeenCalled();
    expect(timelineEventCreateMock).not.toHaveBeenCalled();
  });

  it('dedupe: disparo idêntico (campaignId+target) já persistido bloqueia reenvio antes do SMTP', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('verified');
    emailMessageFindUniqueMock.mockResolvedValue({ id: 'em-previo' });

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(emailMessageCreateMock).not.toHaveBeenCalled();
    expect(activityCreateMock).not.toHaveBeenCalled();
    // A consulta de dedupe usa a chave composta organizationId + providerMessageId.
    expect(emailMessageFindUniqueMock).toHaveBeenCalledWith({
      where: {
        organizationId_providerMessageId: {
          organizationId: 'org-1',
          providerMessageId: `cold-email:${baseCampaign.id}:${baseCampaign.targetEmail}`,
        },
      },
      select: { id: true },
    });
  });

  it('falha no envio não persiste nada — nem EmailMessage, nem Activity', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockRejectedValue(new Error('SMTP 550'));

    const result = await sendColdEmail({ ...baseCampaign, leadId: 'lead-1' });

    expect(result).toBe(false);
    expect(emailMessageCreateMock).not.toHaveBeenCalled();
    expect(activityCreateMock).not.toHaveBeenCalled();
    expect(timelineEventCreateMock).not.toHaveBeenCalled();
  });

  it('bloqueio por opt-out/entregabilidade não persiste nem consulta dedupe como envio', async () => {
    isOptedOutMock.mockResolvedValue(true);

    const result = await sendColdEmail(baseCampaign);

    expect(result).toBe(false);
    expect(emailMessageFindUniqueMock).not.toHaveBeenCalled();
    expect(emailMessageCreateMock).not.toHaveBeenCalled();
  });

  it('envio confirmado com falha na persistência ainda retorna true (e-mail saiu de verdade), mas loga erro', async () => {
    isOptedOutMock.mockResolvedValue(false);
    resolveEmailStatusMock.mockResolvedValue('verified');
    sendEmailMock.mockResolvedValue({ messageId: '<x@y>' });
    emailMessageCreateMock.mockRejectedValue(new Error('db down'));

    const result = await sendColdEmail(baseCampaign);

    // Honestidade: o e-mail FOI entregue ao SMTP — retornar false diria "falhou" e induziria
    // reenvio manual sem a trava de dedupe. A falha de trilha fica no log de erro.
    expect(result).toBe(true);
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

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendEmailMock, MailerNotConfiguredError, logger } = vi.hoisted(() => {
  class MailerNotConfiguredError extends Error {}
  return {
    sendEmailMock: vi.fn(),
    MailerNotConfiguredError,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

vi.mock('../../../lib/email/mailer.js', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  MailerNotConfiguredError,
}));

vi.mock('../../../config/env.js', () => ({
  env: {
    LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED: false,
    PUBLIC_BASE_URL: '',
  },
}));

vi.mock('../../../lib/logger.js', () => ({ logger }));

import { sendLandingLeadConfirmationEmail } from '../publicLead.confirmationEmail.js';

describe('sendLandingLeadConfirmationEmail', () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    logger.info.mockReset();
    logger.warn.mockReset();
    logger.error.mockReset();
    delete process.env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED;
    delete process.env.PUBLIC_BASE_URL;
  });

  it('não envia quando a flag está desligada', async () => {
    await sendLandingLeadConfirmationEmail('titular@empresa.com.br');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('envia confirmação com link de DSR quando a flag está ligada', async () => {
    process.env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED = 'true';
    process.env.PUBLIC_BASE_URL = 'https://birthhub.example/';
    sendEmailMock.mockResolvedValue(undefined);

    await sendLandingLeadConfirmationEmail('titular@empresa.com.br');

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0]?.[0] as {
      to: string;
      subject: string;
      text: string;
    };
    expect(payload.to).toBe('titular@empresa.com.br');
    expect(payload.subject).toBe('Recebemos seu pedido de demonstração');
    expect(payload.text).toContain('https://birthhub.example/privacy');
    expect(payload.text).not.toContain('https://birthhub.example//privacy');
    expect(logger.info).toHaveBeenCalled();
  });

  it('usa /privacy relativo quando PUBLIC_BASE_URL está vazio', async () => {
    process.env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED = 'true';
    sendEmailMock.mockResolvedValue(undefined);

    await sendLandingLeadConfirmationEmail('titular@empresa.com.br');

    const payload = sendEmailMock.mock.calls[0]?.[0] as { text: string };
    expect(payload.text).toContain('/privacy');
  });

  it('não propaga MailerNotConfiguredError', async () => {
    process.env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED = 'true';
    sendEmailMock.mockRejectedValue(new MailerNotConfiguredError('SMTP_HOST ausente'));

    await expect(
      sendLandingLeadConfirmationEmail('titular@empresa.com.br'),
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('não propaga falha genérica de SMTP', async () => {
    process.env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED = 'true';
    sendEmailMock.mockRejectedValue(new Error('SMTP indisponível'));

    await expect(
      sendLandingLeadConfirmationEmail('titular@empresa.com.br'),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

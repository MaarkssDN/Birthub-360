import { env } from '../../config/env.js';
import { MailerNotConfiguredError, sendEmail } from '../../lib/email/mailer.js';
import { logger } from '../../lib/logger.js';

/**
 * E-mail transacional de confirmação da demo, atrás de flag desligada por padrão
 * (`LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED`). Não inventa token de opt-out de 1 clique
 * (canal ainda não existe). Aponta o titular para /privacy para exercer DSR.
 * Falha de SMTP não derruba a captura (melhor esforço, sem PII no log).
 */
export async function sendLandingLeadConfirmationEmail(to: string): Promise<void> {
  const enabled =
    process.env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED === 'true' ||
    env.LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED === true;
  if (!enabled) return;

  const base = (process.env.PUBLIC_BASE_URL ?? env.PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  const privacyUrl = base ? `${base}/privacy` : '/privacy';

  try {
    await sendEmail({
      to,
      subject: 'Recebemos seu pedido de demonstração',
      text: [
        'Recebemos seu pedido de demonstração do Birth Hub 360°.',
        'Entraremos em contato pelo e-mail informado apenas para agendar e confirmar a demonstração.',
        '',
        `Para acessar, corrigir ou excluir seus dados, ou para deixar de receber contato, consulte a Política de Privacidade: ${privacyUrl}`,
      ].join('\n'),
    });
    logger.info({ event: 'public_lead_confirmation_email_sent' }, 'Confirmation email accepted');
  } catch (err: unknown) {
    if (err instanceof MailerNotConfiguredError) {
      logger.warn(
        { event: 'public_lead_confirmation_email_skipped' },
        'Confirmation email skipped: mailer not configured',
      );
      return;
    }
    logger.error(
      { err, event: 'public_lead_confirmation_email_failed' },
      'Confirmation email failed',
    );
  }
}

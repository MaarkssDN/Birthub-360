import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { env } from '../../../config/env.js';
import { MailerNotConfiguredError, sendEmail } from '../../../lib/email/mailer.js';
import { logger } from '../../../lib/logger.js';

const router = Router();

/**
 * Captura pública de lead da landing page (formulário "Reserve sua Demonstração").
 *
 * Rota pública de propósito — o lead ainda não tem conta/tenant. Não persiste nada em
 * banco (nenhuma tabela de lead público existe; criar uma é decisão de schema do Agente
 * 01 — ver handoff 02→01): o envio real é por e-mail via SMTP para a caixa comercial
 * configurada em LEAD_CAPTURE_EMAIL (fallback: SMTP_FROM/SMTP_USER). Sem SMTP ou sem
 * destinatário configurado, a rota responde 503 — nunca finge sucesso.
 *
 * LGPD: `consent` é obrigatório (literal true) — o formulário só envia com a caixa de
 * consentimento marcada, e o e-mail gerado registra o consentimento dado. O campo
 * `website` é honeypot: bots que o preenchem recebem sucesso silencioso sem gerar e-mail.
 */
const leadCaptureSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{8,20}$/)
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().min(10).max(13)),
  equipe: z.enum(['1 a 5', '6 a 15', '16 a 50', '50+']),
  consent: z.literal(true),
  website: z.string().optional(),
});

function leadCaptureRecipient(): string | null {
  return env.LEAD_CAPTURE_EMAIL || env.SMTP_FROM || env.SMTP_USER || null;
}

router.post(
  '/lead-capture',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = leadCaptureSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Dados inválidos. Verifique nome, e-mail corporativo e WhatsApp.',
        });
        return;
      }

      const lead = parsed.data;

      // Honeypot: sucesso silencioso, nenhum e-mail gerado.
      if (lead.website) {
        res.json({ success: true });
        return;
      }

      const recipient = leadCaptureRecipient();
      if (!recipient) {
        logger.error('Lead capture sem destinatário configurado (LEAD_CAPTURE_EMAIL/SMTP_FROM/SMTP_USER).');
        res.status(503).json({
          success: false,
          error: 'Canal de contato temporariamente indisponível. Tente novamente mais tarde.',
        });
        return;
      }

      try {
        await sendEmail({
          to: recipient,
          subject: `[Landing 360] Nova solicitação de demonstração — ${lead.nome}`,
          text: [
            'Nova solicitação de demonstração recebida pela landing page.',
            '',
            `Nome: ${lead.nome}`,
            `E-mail corporativo: ${lead.email}`,
            `WhatsApp: ${lead.whatsapp}`,
            `Tamanho da equipe: ${lead.equipe}`,
            `Consentimento LGPD: marcado em ${new Date().toISOString()}`,
            `Origem: ${req.get('origin') || req.get('referer') || 'desconhecida'}`,
          ].join('\n'),
        });
      } catch (error) {
        if (error instanceof MailerNotConfiguredError) {
          logger.warn('Lead capture rejeitado — SMTP_HOST não configurado.');
          res.status(503).json({
            success: false,
            error: 'Canal de contato temporariamente indisponível. Tente novamente mais tarde.',
          });
          return;
        }
        throw error;
      }

      logger.info({ email: lead.email, equipe: lead.equipe }, 'Lead capture da landing enviado por e-mail.');
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

export const publicLeadCaptureRouter = router;

import { requestContext } from '../../async-context.js';
import { logger } from '../../logger.js';
import { prisma } from '../../prisma.js';
import { findOpenLeadByEmail } from './leadByEmail.js';

/**
 * Registro de e-mail OUTBOUND no histórico (`EmailMessage`, `direction: 'outbound'`).
 *
 * Lacuna real encontrada na auditoria do conector (DEM-20261123-001): `sendEmail`
 * (`src/lib/email/mailer.ts`, legado fora do ownership do 55) envia via SMTP mas NADA persiste o
 * envio — `GET /integrations/email/messages` e a classificação de resposta
 * (`priorMessages` em `emailReply.webhook.ts`) só enxergavam mensagens inbound. Este módulo é a
 * porta de escrita idempotente que o caller de envio deve invocar após `sendEmail` resolver
 * (handoff formal emitido — ver `.agents/handoffs/squad-50/`).
 *
 * Idempotência: `@@unique([organizationId, providerMessageId])` no schema + checagem prévia;
 * `providerMessageId` deve ser o `Message-ID` devolvido pelo transporte SMTP (já retornado por
 * `sendEmail` como `SendEmailResult.messageId`). Reentrega/dupla chamada não duplica linha.
 */

export interface RecordOutboundEmailInput {
  organizationId: string;
  /** Message-ID devolvido pelo transporte SMTP — chave de idempotência junto da org. */
  providerMessageId: string;
  /** Header In-Reply-To, quando o envio responde um e-mail recebido (threading). */
  inReplyTo?: string | null;
  fromEmail: string;
  toEmail: string;
  subject?: string | null;
  /** Corpo texto simples — mesmo formato armazenado para inbound. */
  body: string;
  /** Lead conhecido pelo caller; quando ausente, resolve por e-mail do destinatário. */
  leadId?: string | null;
  /** Defaults para `now()` — caller pode fixar o instante real do envio. */
  sentAt?: Date;
}

export type RecordOutboundEmailOutcome = 'recorded' | 'duplicate' | 'invalid';

export async function recordOutboundEmailMessage(
  input: RecordOutboundEmailInput,
): Promise<RecordOutboundEmailOutcome> {
  const organizationId = input.organizationId?.trim();
  const providerMessageId = input.providerMessageId?.trim();
  const toEmail = input.toEmail?.trim();
  const fromEmail = input.fromEmail?.trim();
  if (!organizationId || !providerMessageId || !toEmail || !fromEmail) return 'invalid';

  return requestContext.run({ tenantId: organizationId }, async () => {
    const existing = await prisma.emailMessage.findUnique({
      where: {
        organizationId_providerMessageId: { organizationId, providerMessageId },
      },
      select: { id: true },
    });
    if (existing) return 'duplicate';

    let leadId: string | null = null;
    if (input.leadId) {
      // Defesa em profundidade: leadId informado precisa pertencer à mesma org.
      const lead = await prisma.lead.findFirst({
        where: { id: input.leadId, organizationId },
        select: { id: true },
      });
      leadId = lead?.id ?? null;
    } else {
      const lead = await findOpenLeadByEmail(organizationId, toEmail);
      leadId = lead?.id ?? null;
    }

    try {
      await prisma.emailMessage.create({
        data: {
          organizationId,
          providerMessageId,
          inReplyTo: input.inReplyTo ?? null,
          direction: 'outbound',
          fromEmail,
          toEmail,
          subject: input.subject ?? null,
          body: input.body,
          leadId,
          receivedAt: input.sentAt ?? new Date(),
        },
      });
    } catch (error: any) {
      // Corrida entre a checagem acima e o insert: a unique constraint resolve — reentrega
      // do mesmo Message-ID vira 'duplicate', não erro 500 para o caller.
      if (error?.code === 'P2002') return 'duplicate';
      throw error;
    }

    if (!leadId) {
      logger.info(
        { organizationId, providerMessageId },
        'E-mail outbound registrado sem lead associado (destinatário não casa com contato aberto).',
      );
    }
    return 'recorded';
  });
}

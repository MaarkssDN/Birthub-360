import { createHash } from 'node:crypto';
import type { InboundEmailReply } from '../../../shared/domain/replyTracking.js';
import type { ParsedInboundEmail, SenderAuthResults } from './rawEmailParser.js';

/**
 * Adaptador entre o parser MIME (`rawEmailParser.ts`) e o contrato de entrada do webhook de
 * resposta (`emailReply.webhook.ts` → `InboundEmailReply` + campos do payload HTTP).
 *
 * É a peça que permite a um futuro sync IMAP (worker da Squad 20 + credenciais de mailbox por
 * tenant da Squad 10) alimentar o MESMO pipeline de reply-tracking já auditado — sem passar por
 * HTTP nem por um provedor de inbound-parse. O webhook continua existindo para provedores
 * externos (SendGrid/Postmark/Mailgun) que entregam JSON pronto.
 */

/** Payload normalizado aceito por `ingestInboundEmailReply` / pelo endpoint HTTP do webhook. */
export interface InboundEmailPayload {
  organizationId: string;
  providerMessageId: string;
  inReplyTo: string | null;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  body: string;
  autoSubmittedHeader: string | null;
  receivedAt: Date;
  /** Vereditos SPF/DKIM/DMARC extraídos de Authentication-Results — sinal de defesa em
   * profundidade, nunca critério de rejeição (o transporte já foi autenticado antes daqui). */
  senderAuth?: SenderAuthResults;
}

export interface BuildInboundPayloadOptions {
  organizationId: string;
  /** Caixa/alias de destino da mensagem (o "para" da organização), usado como `toEmail`. */
  toEmail: string;
  /** Dica de lead quando o transporte já souber (ex.: tag no endereço de resposta). */
  leadIdHint?: string | null;
  /**
   * Sobrescreve o providerMessageId derivado da mensagem. Útil quando o transporte tem
   * identidade própria mais estável que o Message-ID (ex.: `${mailboxUid}:${uidValidity}`).
   */
  providerMessageId?: string;
}

/**
 * Mensagens sem `Message-ID` (raros, mas existem em listas mal configuradas) precisam de uma
 * chave de idempotência determinística: hash do conteúdo estável da mensagem. Não é
 * criptograficamente relevante — é só dedup.
 */
function fallbackMessageId(parsed: ParsedInboundEmail): string {
  const material = [
    parsed.from?.email ?? '',
    parsed.subject,
    parsed.date?.toISOString() ?? '',
    parsed.inReplyTo ?? '',
    parsed.bodyText.slice(0, 4096),
  ].join('|');
  return `mime-${createHash('sha256').update(material, 'utf8').digest('hex').slice(0, 32)}`;
}

/**
 * Converte uma mensagem RFC822 já parseada no payload que o webhook de resposta consome.
 * Devolve `null` quando faltam os campos obrigatórios do contrato (fromEmail sem endereço
 * válido, organização ou destinatário ausentes) — o caller decide descartar ou logar.
 */
export function buildInboundEmailPayload(
  parsed: ParsedInboundEmail,
  options: BuildInboundPayloadOptions,
): InboundEmailPayload | null {
  const fromEmail = parsed.from?.email?.trim();
  const organizationId = options.organizationId?.trim();
  const toEmail = options.toEmail?.trim();
  if (!organizationId || !toEmail || !fromEmail) return null;

  return {
    organizationId,
    providerMessageId:
      options.providerMessageId?.trim() || parsed.messageId || fallbackMessageId(parsed),
    inReplyTo: parsed.inReplyTo,
    fromEmail,
    toEmail,
    subject: parsed.subject || null,
    // O webhook sanitiza de novo na entrada — aqui o corpo já vem como texto (sem HTML), então
    // sanitizeInboundEmailBody é no-op na prática, mas a dupla camada é intencional e barata.
    body: parsed.bodyText,
    autoSubmittedHeader: parsed.autoSubmitted,
    receivedAt: parsed.date ?? new Date(),
    senderAuth: parsed.senderAuth,
  };
}

/** Monta o `InboundEmailReply` de domínio a partir do payload — usado pelo caminho programático. */
export function toInboundEmailReply(payload: InboundEmailPayload, leadId = ''): InboundEmailReply {
  return {
    organizationId: payload.organizationId,
    leadId,
    providerMessageId: payload.providerMessageId,
    inReplyTo: payload.inReplyTo,
    fromEmail: payload.fromEmail,
    subject: payload.subject,
    body: payload.body,
    autoSubmittedHeader: payload.autoSubmittedHeader,
    receivedAt: payload.receivedAt,
  };
}

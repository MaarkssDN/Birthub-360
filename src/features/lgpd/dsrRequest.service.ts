import type { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { requestContext } from '../../lib/async-context.js';
import { contactEmailIndex } from '../../lib/crypto/piiIndex.js';
import { decryptField, encryptField } from '../../lib/crypto/secretFields.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { consentAuditChain } from '../../lib/security/consentChainFactory.js';
import { MailerNotConfiguredError, sendEmail } from '../../lib/email/mailer.js';
import { lgpdService } from './lgpd.service.js';
import type { DsrRequestInput, DsrVerifyInput } from './dsrRequest.schema.js';

/**
 * Canal público de solicitação DSR (LGPD art. 18) — implementação do handoff
 * `.agents/handoffs/21-para-01-dsr-canal-publico-lgpd.md` (especificação decidida
 * pelo Agente 21).
 *
 * Tenant: resolvido no servidor via `LANDING_LEAD_ORGANIZATION_ID` (mesma config
 * da captura pública de lead) — NUNCA pelo cliente. Todos os endpoints rodam
 * dentro de `requestContext.run({ tenantId })`, então a RLS de
 * `DataSubjectRequest`/`Contact`/`Lead` vale normalmente; não há bypass.
 *
 * Anti-enumeração: `createDataSubjectRequest` devolve o mesmo resultado
 * ('created'/'no_subject' colapsado na rota para 202 idêntico) exista ou não o
 * titular; a verificação por e-mail é a única prova de identidade.
 */

export class DsrUnavailableError extends Error {
  readonly statusCode = 503;
  readonly code = 'unavailable';
  constructor() {
    super('unavailable');
    this.name = 'DsrUnavailableError';
  }
}

/** Token inválido, expirado, já usado ou protocolo inexistente — resposta única. */
export class DsrInvalidTokenError extends Error {
  readonly statusCode = 400;
  readonly code = 'invalid_or_expired_token';
  constructor() {
    super('invalid_or_expired_token');
    this.name = 'DsrInvalidTokenError';
  }
}

/** Titular não encontrado no tenant no momento da verificação. */
export class DsrSubjectNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'subject_not_found';
  constructor() {
    super('subject_not_found');
    this.name = 'DsrSubjectNotFoundError';
  }
}

const VERIFICATION_TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72h (spec do 21: 24–72h)
const RESPONSE_DEADLINE_DAYS = 15; // LGPD art. 19

function resolveDsrOrganizationId(): string {
  const organizationId = (
    process.env.LANDING_LEAD_ORGANIZATION_ID ??
    env.LANDING_LEAD_ORGANIZATION_ID ??
    ''
  ).trim();
  if (!organizationId) throw new DsrUnavailableError();
  return organizationId;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

function newProtocol(): string {
  // Protocolo opaco legível (DSR-XXXX-XXXX-XXXX) — sem nenhum identificador interno.
  const block = () => randomBytes(2).toString('hex').toUpperCase();
  return `DSR-${block()}-${block()}-${block()}`;
}

/** Hash do titular para AuditLog — mesmo padrão de dataSubjectErasure (sem PII). */
function subjectHash(organizationId: string, contactId: string): string {
  return sha256Hex(`${organizationId}:${contactId}`);
}

function publicBaseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? env.PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
}

async function auditDsr(
  organizationId: string,
  action: string,
  protocol: string,
  rightType: string,
  hash?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity: 'DataSubjectRequest',
        entityId: protocol,
        tenantId: organizationId,
        details: JSON.stringify({ rightType, ...(hash ? { subjectHash: hash } : {}) }),
      },
    });
  } catch (err) {
    // Auditoria é best-effort fora de transação — mesmo comportamento de
    // AuditService.log (não derruba o fluxo do titular), mas fica visível no log.
    logger.error({ err, event: 'dsr_audit_failed' }, 'Falha ao gravar AuditLog do DSR');
  }
}

// ─── E-mails transacionais (melhor esforço — falha de SMTP nunca derruba o fluxo) ───

async function sendVerificationEmail(params: {
  to: string;
  protocol: string;
  verifyUrl: string;
  statusUrl: string;
}): Promise<void> {
  try {
    await sendEmail({
      to: params.to,
      subject: `[Birth Hub 360] Confirme sua solicitação de direitos — ${params.protocol}`,
      text: [
        'Recebemos uma solicitação de exercício de direitos do titular (LGPD, art. 18) associada a este e-mail.',
        '',
        `Protocolo: ${params.protocol}`,
        `Prazo de resposta: até ${RESPONSE_DEADLINE_DAYS} dias (LGPD, art. 19).`,
        '',
        'Para sua segurança, confirme que é você antes de qualquer dado ser exportado ou excluído:',
        params.verifyUrl,
        '',
        'O link é de uso único e expira em 72 horas.',
        '',
        'Acompanhe o andamento pelo link abaixo (não compartilhe):',
        params.statusUrl,
        '',
        'Se você não fez esta solicitação, ignore este e-mail — nenhum dado será alterado sem a confirmação acima.',
      ].join('\n'),
    });
    logger.info({ event: 'dsr_verification_email_sent' }, 'DSR verification email accepted');
  } catch (err: unknown) {
    if (err instanceof MailerNotConfiguredError) {
      logger.warn({ event: 'dsr_verification_email_skipped' }, 'DSR email skipped: SMTP off');
      return;
    }
    logger.error({ err, event: 'dsr_verification_email_failed' }, 'DSR verification email failed');
  }
}

async function sendCompletionEmail(params: {
  to: string;
  protocol: string;
  rightType: string;
  status: string;
}): Promise<void> {
  try {
    await sendEmail({
      to: params.to,
      subject: `[Birth Hub 360] Atualização da sua solicitação — ${params.protocol}`,
      text: [
        `Sua solicitação de direitos (protocolo ${params.protocol}) foi atualizada.`,
        `Tipo: ${params.rightType}`,
        `Status: ${params.status}`,
        '',
        'Use o link de acompanhamento recebido no e-mail de confirmação para consultar o andamento.',
      ].join('\n'),
    });
    logger.info({ event: 'dsr_completion_email_sent' }, 'DSR completion email accepted');
  } catch (err: unknown) {
    if (err instanceof MailerNotConfiguredError) return;
    logger.error({ err, event: 'dsr_completion_email_failed' }, 'DSR completion email failed');
  }
}

// ─── Fluxo ───

export type CreateDsrResult = 'created' | 'no_subject';

/**
 * Registra a solicitação. Sempre resolve o tenant no servidor e responde de
 * forma idêntica exista ou não o titular — a única diferença é o e-mail de
 * verificação, que só sai quando o contato é encontrado (o submit em si não
 * vaza existência: a resposta HTTP é a mesma).
 */
export async function createDataSubjectRequest(input: DsrRequestInput): Promise<CreateDsrResult> {
  const organizationId = resolveDsrOrganizationId();
  const emailIndex = contactEmailIndex(input.email);
  if (!emailIndex) throw new DsrUnavailableError();

  return requestContext.run({ tenantId: organizationId }, async () => {
    const contact = await prisma.contact.findFirst({
      where: { organizationId, emailIndex, deletedAt: null },
      select: { id: true },
    });

    if (!contact) {
      // Sem PII no log/auditoria — só o fato de que nenhum titular casou.
      logger.info({ event: 'dsr_request_no_subject' }, 'DSR submit sem titular correspondente');
      return 'no_subject';
    }

    const protocol = newProtocol();
    const verificationToken = newToken();
    const statusToken = newToken();

    await prisma.dataSubjectRequest.create({
      data: {
        organizationId,
        protocol,
        rightType: input.rightType,
        emailEncrypted: encryptField(input.email),
        emailIndex,
        statusTokenHash: sha256Hex(statusToken),
        verificationTokenHash: sha256Hex(verificationToken),
        verificationExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        preferredChannel: input.preferredChannel ?? null,
        detailsEncrypted: input.details ? encryptField(input.details) : null,
      },
    });

    await auditDsr(
      organizationId,
      'DSR_REQUEST_CREATED',
      protocol,
      input.rightType,
      subjectHash(organizationId, contact.id),
    );

    const base = publicBaseUrl();
    await sendVerificationEmail({
      to: input.email,
      protocol,
      verifyUrl: `${base}/privacidade/dsr/verificar?protocol=${encodeURIComponent(protocol)}&token=${encodeURIComponent(verificationToken)}`,
      statusUrl: `${base}/privacidade/dsr/acompanhamento?token=${encodeURIComponent(statusToken)}`,
    });

    return 'created';
  });
}

export interface DsrVerifyResult {
  status: string;
  /** Presente só para ACCESS/PORTABILITY — o pacote do dossiê (JSON serializado). */
  package?: string;
}

/**
 * Verifica o token de uso único e, se válido, EXECUTA o direito solicitado na
 * mesma chamada (o titular já provou posse do e-mail — não há motivo para um
 * segundo passo manual em direitos automatizáveis).
 */
export async function verifyDataSubjectRequest(input: DsrVerifyInput): Promise<DsrVerifyResult> {
  const organizationId = resolveDsrOrganizationId();

  return requestContext.run({ tenantId: organizationId }, async () => {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { protocol: input.protocol },
    });
    if (
      request?.status !== 'PENDING_VERIFICATION' ||
      !request.verificationTokenHash ||
      !request.verificationExpiresAt ||
      request.verificationExpiresAt.getTime() < Date.now() ||
      request.verificationTokenHash !== sha256Hex(input.token)
    ) {
      throw new DsrInvalidTokenError();
    }

    // Resolve o titular AGORA, pelo blind index do e-mail gravado — nunca por
    // contactId vindo do cliente.
    const contact = await prisma.contact.findFirst({
      where: { organizationId, emailIndex: request.emailIndex, deletedAt: null },
      select: { id: true },
    });
    if (!contact) {
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: { status: 'REJECTED', resultSummary: { reason: 'subject_not_found' } },
      });
      await auditDsr(organizationId, 'DSR_REJECTED', request.protocol, request.rightType);
      throw new DsrSubjectNotFoundError();
    }

    const email = decryptField(request.emailEncrypted);
    const hash = subjectHash(organizationId, contact.id);
    let status: 'COMPLETED' | 'IN_PROGRESS' = 'COMPLETED';
    let resultSummary: Prisma.InputJsonValue = {};
    let portabilityPackage: string | undefined;

    switch (request.rightType) {
      case 'ACCESS':
      case 'PORTABILITY': {
        const dossier = await lgpdService.exportContactData(organizationId, contact.id);
        portabilityPackage = dossier.jsonPackage;
        resultSummary = { exportId: dossier.dossier.metadata.exportId };
        break;
      }
      case 'ERASURE': {
        // eraseContact já encadeia consentAuditChain.revokeConsent (mesmo caminho
        // das rotas autenticadas /api/lgpd) — revogação + crypto-shredding.
        await lgpdService.eraseContact(organizationId, contact.id);
        resultSummary = { erased: true };
        break;
      }
      case 'CONSENT_REVOCATION': {
        await consentAuditChain.revokeConsent(organizationId, email, 'TITULAR_REQUEST', undefined, {
          detail: `dsr:${request.protocol}`,
        });
        resultSummary = { revoked: true };
        break;
      }
      case 'CORRECTION':
      case 'SHARING_INFO': {
        // Não há aplicação automática segura de correção/detalhe de
        // compartilhamento — vai para tratamento manual do DPO. Os detalhes do
        // titular ficam em detailsEncrypted para o operador.
        status = 'IN_PROGRESS';
        break;
      }
    }

    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status,
        contactId: contact.id,
        verifiedAt: new Date(),
        resultSummary,
      },
    });

    await auditDsr(
      organizationId,
      status === 'COMPLETED' ? 'DSR_COMPLETED' : 'DSR_IN_PROGRESS',
      request.protocol,
      request.rightType,
      hash,
    );

    // O token de status em claro não é recuperável (só o hash é persistido) — o
    // link de acompanhamento já foi entregue no e-mail de verificação; aqui vai
    // só o protocolo para o titular reconhecer o pedido.
    await sendCompletionEmail({
      to: email,
      protocol: request.protocol,
      rightType: request.rightType,
      status,
    });

    return { status, ...(portabilityPackage ? { package: portabilityPackage } : {}) };
  });
}

export interface DsrStatusView {
  protocol: string;
  rightType: string;
  status: string;
  createdAt: Date;
  verifiedAt: Date | null;
}

/**
 * Acompanhamento pelo token opaco de status. Devolve apenas metadados do
 * pedido — nenhum dado do titular, nenhum e-mail, nenhum contactId.
 */
export async function getDataSubjectRequestStatus(statusToken: string): Promise<DsrStatusView> {
  const organizationId = resolveDsrOrganizationId();
  const tokenHash = sha256Hex(statusToken);

  return requestContext.run({ tenantId: organizationId }, async () => {
    const request = await prisma.dataSubjectRequest.findFirst({
      where: { statusTokenHash: tokenHash },
      select: {
        protocol: true,
        rightType: true,
        status: true,
        createdAt: true,
        verifiedAt: true,
      },
    });
    if (!request) throw new DsrInvalidTokenError();
    return request;
  });
}

import { env } from '../../config/env.js';
import { requestContext } from '../../lib/async-context.js';
import { contactEmailIndex } from '../../lib/crypto/piiIndex.js';
import { logger } from '../../lib/logger.js';
import { prisma, runInTransaction } from '../../lib/prisma.js';
import {
  LANDING_DEMO_CONSENT_PURPOSE,
  LANDING_DEMO_CONSENT_TEXT,
  LANDING_DEMO_CONSENT_VERSION,
  LANDING_LEAD_SOURCE,
} from './publicLead.constants.js';
import type { PublicLeadInput } from './publicLead.schema.js';

export class PublicLeadUnavailableError extends Error {
  readonly statusCode = 503;
  readonly code = 'unavailable';

  constructor() {
    super('unavailable');
    this.name = 'PublicLeadUnavailableError';
  }
}

export type PublicLeadCaptureResult = 'created' | 'duplicate';

function resolveLandingOrganizationId(): string {
  // process.env vive (testes podem ajustar o tenant sem reparse de env.ts);
  // env cobre o caminho de produção já validado pelo schema Zod.
  const organizationId = (
    process.env.LANDING_LEAD_ORGANIZATION_ID ??
    env.LANDING_LEAD_ORGANIZATION_ID ??
    ''
  ).trim();
  if (!organizationId) {
    throw new PublicLeadUnavailableError();
  }
  return organizationId;
}

function companyLabelFor(input: PublicLeadInput): string {
  const domain = input.email.split('@')[1];
  if (domain) return domain;
  return `Contato via landing — ${input.nome}`;
}

/**
 * Persiste o lead da landing no tenant configurado no servidor.
 * Idempotente por (organização + e-mail + origem landing_360): reenvio do mesmo
 * titular devolve 'duplicate' sem criar outro Lead e sem alterar dados já gravados
 * (um terceiro não consegue trocar o WhatsApp de um e-mail alheio).
 */
export async function capturePublicLead(input: PublicLeadInput): Promise<PublicLeadCaptureResult> {
  const organizationId = resolveLandingOrganizationId();
  const emailIndex = contactEmailIndex(input.email);
  if (!emailIndex) {
    // contactEmailIndex só retorna null para e-mail vazio — o schema já bloqueia isso.
    throw new PublicLeadUnavailableError();
  }

  return requestContext.run({ tenantId: organizationId }, async () => {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      logger.error(
        { event: 'public_lead_org_missing' },
        'Landing lead organization is not configured',
      );
      throw new PublicLeadUnavailableError();
    }

    const existingContact = await prisma.contact.findFirst({
      where: { organizationId, emailIndex, deletedAt: null },
      select: {
        id: true,
        companyId: true,
        leads: {
          where: { source: LANDING_LEAD_SOURCE, deletedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (existingContact?.leads[0]) {
      logger.info(
        { event: 'public_lead_duplicate' },
        'Public lead already registered for this email',
      );
      return 'duplicate';
    }

    const result = await runInTransaction(
      async (tx) => {
        let companyId = existingContact?.companyId;
        let contactId = existingContact?.id;

        if (!companyId) {
          const label = companyLabelFor(input);
          const company = await tx.company.create({
            data: {
              legalName: label,
              tradeName: label,
              organizationId,
              status: 'Ativo',
              size: input.equipe,
              phones: [input.whatsapp],
              emails: [input.email],
              tags: ['Landing 360'],
            },
          });
          companyId = company.id;
        }

        if (!contactId) {
          const contact = await tx.contact.create({
            data: {
              name: input.nome,
              email: input.email,
              whatsapp: input.whatsapp,
              organizationId,
              companyId,
              status: 'Ativo',
              source: LANDING_LEAD_SOURCE,
            },
          });
          contactId = contact.id;
        }

        const lead = await tx.lead.create({
          data: {
            organizationId,
            status: 'Lead_Recebido',
            source: LANDING_LEAD_SOURCE,
            channel: 'landing',
            title: `Demo landing: ${input.nome}`,
            companyId,
            contactId,
            tags: ['Landing 360', 'Demonstração'],
            customFields: {
              equipe: input.equipe,
              origem: 'landing_form_objective',
              finalidade: LANDING_DEMO_CONSENT_PURPOSE,
            },
          },
        });

        await tx.publicLeadConsent.create({
          data: {
            organizationId,
            leadId: lead.id,
            purpose: LANDING_DEMO_CONSENT_PURPOSE,
            termsVersion: LANDING_DEMO_CONSENT_VERSION,
            termsText: LANDING_DEMO_CONSENT_TEXT,
            grantedAt: new Date(),
            source: LANDING_LEAD_SOURCE,
          },
        });

        return 'created' as const;
      },
      { organizationId },
    );

    logger.info({ event: 'public_lead_created' }, 'Public landing lead persisted');
    return result;
  });
}

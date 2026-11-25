import { toE164BR } from '../../../lib/phone.js';
import { prisma } from '../../../lib/prisma.js';
import { resolveBusinessTimeZone } from '../domain/businessWindow.js';
import type { LeadSubjectResolver } from '../application/cadenceService.js';

/**
 * Resolve o sujeito de opt-out (e-mail/telefone) a partir do `Lead.contact` — o único lugar onde
 * esses dados vivem hoje (`Lead` não tem e-mail/telefone próprio, só via `Contact`). Usado pelo
 * worker de cadência (CYC-008, onda-19) antes de checar `isOptedOut` para o canal do próximo toque.
 *
 * POS4-17-CADENCE-TZ: a mesma consulta também resolve o fuso do destinatário para a janela
 * comercial por lead (`domain/businessWindow.ts`). Não existe coluna `timezone` em Lead/Org —
 * a cadeia documentada é: `Lead.customFields.timezone` (IANA explícito, escape hatch sem
 * migration) → UF de `Company.state` → fallback `America/Sao_Paulo`. O custo é zero: `customFields`
 * e `company.state` entram no mesmo `select` que já buscava o contato.
 */
export const prismaLeadSubjectResolver: LeadSubjectResolver = {
  async resolve(organizationId, leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId },
      select: {
        customFields: true,
        contact: { select: { email: true, whatsapp: true, phone: true } },
        company: { select: { state: true } },
      },
    });

    const customFields =
      lead?.customFields &&
      typeof lead.customFields === 'object' &&
      !Array.isArray(lead.customFields)
        ? (lead.customFields as Record<string, unknown>)
        : null;
    const explicitTimeZone =
      typeof customFields?.timezone === 'string' ? customFields.timezone : null;

    return {
      leadId,
      email: lead?.contact?.email ?? null,
      phoneE164: toE164BR(lead?.contact?.whatsapp ?? lead?.contact?.phone ?? undefined),
      timeZone: resolveBusinessTimeZone({
        explicitTimeZone,
        state: lead?.company?.state ?? null,
      }),
    };
  },
};

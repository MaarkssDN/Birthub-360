import { contactEmailIndex } from '../../crypto/piiIndex.js';
import { prisma } from '../../prisma.js';

/**
 * Resolve o lead em aberto cujo contato tem este e-mail, dentro da organização — mesmo
 * raciocínio usado pelo webhook de resposta inbound (`emailReply.webhook.ts`) e agora também
 * pelo registro de e-mail outbound (`outboundEmailLog.ts`).
 *
 * `Contact.email` é cifrado em repouso (ver `src/lib/crypto/piiFields.ts`) — a busca usa o
 * índice cego determinístico `emailIndex` (`src/lib/crypto/piiIndex.ts`) em vez do campo
 * cifrado direto. `contactEmailIndex` devolve null para e-mail vazio/ausente — sem esse guard,
 * `{ emailIndex: null }` casaria com QUALQUER contato sem e-mail cadastrado.
 */
export async function findOpenLeadByEmail(
  organizationId: string,
  email: string,
): Promise<{ id: string } | null> {
  const emailIndex = contactEmailIndex(email);
  if (!emailIndex) return null;
  const lead = await prisma.lead.findFirst({
    where: {
      organizationId,
      status: { notIn: ['Negocios_Ganhos', 'Negocios_Perdidos', 'Lead_Desqualificado'] },
      contact: { emailIndex },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return lead;
}

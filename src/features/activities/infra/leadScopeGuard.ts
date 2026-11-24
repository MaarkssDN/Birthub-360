import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';

/**
 * Garante que `leadId` referencia um Lead do MESMO tenant e não soft-deletado antes de
 * gravar Activity/TimelineEvent.
 *
 * Sem esta checagem, a Activity passava na RLS (`organizationId` próprio) mas o
 * `TimelineEvent` criado com `leadId` estrangeiro violava a policy de tenant do
 * TimelineEvent — no caminho do repositório a `$transaction` inteira falhava com 500; no
 * caminho legado (`activity.service.ts`) a Activity ficava gravada e o TimelineEvent
 * falhava depois, deixando estado inconsistente e uma atividade órfã de lead visível
 * (o `include: { lead }` retorna null pela RLS de Lead). Achado do handoff
 * `.agents/handoffs/onda-3/45-para-04-atividades-agenda-bugs.md` (item 2).
 *
 * 404 (e não 403/422): não revelar a existência de um Lead de outro tenant.
 */
export async function assertLeadInOrganization(
  organizationId: string,
  leadId: string,
): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!lead) {
    throw new AppError('Lead não encontrado nesta organização.', 404);
  }
}

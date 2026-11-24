import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';

/**
 * Tenancy defense-in-depth para `Activity.leadId` (handoff 45-para-04-atividades-agenda-bugs.md,
 * item 2): o schema exige `leadId`, mas nada verificava que o Lead pertence ao
 * `organizationId` da sessão. A Activity gravava `organizationId` da própria org com `leadId`
 * estrangeiro — a FK não impede (bypassa RLS) e o `TimelineEvent` criado junto violava a policy
 * de tenant (leadId IN leads do tenant), derrubando o `$transaction` inteiro (500) ou deixando a
 * atividade órfã no caminho legado. Mesmo padrão de `assertLeadRelationsInTenant` em
 * `PrismaLeadRepository.ts` (handoff 01A→04): id estrangeiro vira 404, sem escrita órfã.
 * Lead soft-deletado também é rejeitado — atividade apontando para lead invisível é órfã.
 */
export async function assertActivityLeadInTenant(
  organizationId: string,
  leadId: string,
): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!lead) {
    throw new AppError('Lead vinculado não encontrado nesta organização.', 404);
  }
}

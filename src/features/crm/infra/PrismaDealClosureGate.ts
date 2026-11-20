import { prisma } from '../../../lib/prisma.js';
import type { DealClosureEventType } from '../../../shared/domain/dealClosure.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import type { DealClosureEvidencePort } from '../application/dealClosureGate.js';

/**
 * Implementação real de `DealClosureEvidencePort` (CYC-007, onda 24) — mesmo padrão de
 * `prismaCadenceRunRepository`: enum Postgres (PascalCase) mapeado aqui, nunca propagado cru para
 * o domínio. `DealClosureEvent` era uma das "tabelas mortas confirmadas" listadas em
 * `docs/CADENCE-CYCLE-AUDIT.md` (schema existia, zero leitura/escrita em código) até esta rodada.
 *
 * Tenancy (handoff 01A→04, onda-paralela-8): `leadId` chega do body/rota do chamador e era
 * gravado em `Note`/`DealClosureEvent` sem verificar se o lead pertence ao `organizationId` —
 * evidência órfã cross-tenant (e vazamento de PII se a RLS estivesse inativa). Como este port é
 * o ponto único por onde passam TODOS os gates de fechamento (`ensureManualDealClosureAllowed` e
 * `ensureDealClosureAllowed`, nos 3+ call sites de LeadUseCases/PrismaCrm360Repository/
 * PrismaCrmDocumentRepository), a validação mora aqui: lead estrangeiro → 404 antes de qualquer
 * escrita, em qualquer caminho.
 */

const TYPE_TO_DB: Record<
  DealClosureEventType,
  'SignatureCompleted' | 'PaymentConfirmed' | 'ManualCrmConfirmation'
> = {
  signature_completed: 'SignatureCompleted',
  payment_confirmed: 'PaymentConfirmed',
  manual_crm_confirmation: 'ManualCrmConfirmation',
};

async function assertLeadInTenant(organizationId: string, leadId: string): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId },
    select: { id: true },
  });
  if (!lead) throw new AppError('Lead não encontrado.', 404);
}

export const prismaDealClosureGate: DealClosureEvidencePort = {
  async createConfirmationNote({ organizationId, leadId, authorUserId }) {
    await assertLeadInTenant(organizationId, leadId);
    const note = await prisma.note.create({
      data: {
        leadId,
        author: authorUserId,
        content:
          'Negócio movido para "Negócios Ganhos" — confirmação manual registrada automaticamente ao fechar.',
      },
      select: { id: true },
    });
    return { id: note.id };
  },

  async saveDealClosureEvent(event) {
    // Cobre também `ensureDealClosureAllowed` (evidência já existente fora deste gate — ex.:
    // documento pago / assinatura), que não passa por createConfirmationNote.
    await assertLeadInTenant(event.organizationId, event.leadId);
    await prisma.dealClosureEvent.create({
      data: {
        id: event.id,
        organizationId: event.organizationId,
        leadId: event.leadId,
        type: TYPE_TO_DB[event.type],
        evidenceRef: event.evidenceRef,
        triggeredBy: event.triggeredBy,
        occurredAt: event.occurredAt,
      },
    });
  },
};

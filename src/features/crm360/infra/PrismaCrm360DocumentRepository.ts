import { CrmDocumentStatus, CrmDocumentType, Prisma } from '@prisma/client';
import { requestContext } from '../../../lib/async-context.js';
import { AuditService } from '../../../lib/audit/audit.service.js';
import { prisma } from '../../../lib/prisma.js';
import type { StripeChargePort } from '../../../shared/contracts/stripeCharge.contract.js';
import {
  draftNextProposalVersion,
  type ProposalSnapshot,
  type ProposalVersion,
} from '../../../shared/domain/proposal.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import { requestDocumentSignature as requestDocumentSignatureUseCase } from '../../cadence/application/documentSignature.js';
import { govBrSignatureProviderPort } from '../../cadence/infra/GovBrSignatureProviderPort.js';
import { prismaSignatureRequestRepository } from '../../cadence/infra/PrismaSignatureRequestRepository.js';
import { ensureDealClosureAllowed } from '../../crm/application/dealClosureGate.js';
import { prismaDealClosureGate } from '../../crm/infra/PrismaDealClosureGate.js';
import type {
  CrmDocumentInput,
  CrmDocumentSignatureRequestInput,
  CrmDocumentUpdateInput,
} from '../crm360.schema.js';
import type {
  CrmCommercialDocument,
  CrmCommercialDocumentVersionDTO,
  CrmPublicDocumentView,
} from '../crm360.types.js';

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateItem<
  T extends { quantity: number; unitPrice: number; discountPercent: number; taxPercent: number },
>(input: T) {
  const discounted = input.quantity * input.unitPrice * (1 - input.discountPercent / 100);
  return { ...input, total: roundMoney(discounted * (1 + input.taxPercent / 100)) };
}

export function computeDocumentTotals(lineItems: ReturnType<typeof calculateItem>[]) {
  const subtotal = roundMoney(lineItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0));
  const discount = roundMoney(
    lineItems.reduce((acc, i) => acc + i.quantity * i.unitPrice * (i.discountPercent / 100), 0),
  );
  const tax = roundMoney(
    lineItems.reduce(
      (acc, i) =>
        acc +
        (i.quantity * i.unitPrice - i.quantity * i.unitPrice * (i.discountPercent / 100)) *
          (i.taxPercent / 100),
      0,
    ),
  );
  const total = roundMoney(subtotal - discount + tax);
  return { subtotal, discount, tax, total };
}

/** Mesma serialização de datas repetida nos 3 métodos de escrita — CYC-005 (onda 25) acrescentou `sentAt`/`firstViewedAt`/`lastViewedAt` à lista de campos Date que precisam virar ISO string antes de sair do repositório. */
export function serializeDocument(doc: Record<string, unknown>): CrmCommercialDocument {
  const d = doc as Record<string, unknown> & {
    lineItems: unknown;
    issueDate: Date;
    validUntil: Date | null;
    dueDate: Date | null;
    sentAt: Date | null;
    firstViewedAt: Date | null;
    lastViewedAt: Date | null;
    paymentReconciledAt: Date | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
  return {
    ...d,
    lineItems: d.lineItems as unknown as CrmCommercialDocument['lineItems'],
    issueDate: d.issueDate.toISOString(),
    validUntil: d.validUntil?.toISOString() ?? null,
    dueDate: d.dueDate?.toISOString() ?? null,
    sentAt: d.sentAt?.toISOString() ?? null,
    firstViewedAt: d.firstViewedAt?.toISOString() ?? null,
    lastViewedAt: d.lastViewedAt?.toISOString() ?? null,
    paymentReconciledAt: d.paymentReconciledAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  } as unknown as CrmCommercialDocument;
}

/**
 * TAREFA-SANEAMENTO-018 (BT360-DT-0024): métodos de documentos comerciais/propostas
 * extraídos de `PrismaCrm360Repository` — o repositório principal ficava acima do teto
 * de hotspot por concentrar queries de pipeline E de documentos no mesmo arquivo.
 * Comportamento preservado verbatim; `PrismaCrm360Repository` delega para esta classe.
 */
export class PrismaCrm360DocumentRepository {
  constructor(private stripeChargePort: StripeChargePort) {}

  async listDocuments(organizationId: string, leadId?: string): Promise<CrmCommercialDocument[]> {
    const docs = await prisma.crmCommercialDocument.findMany({
      where: { organizationId, ...(leadId ? { leadId } : {}) },
      include: { lead: true, company: true, contact: true },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => serializeDocument(d));
  }

  async createDocument(
    organizationId: string,
    input: CrmDocumentInput,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    const lineItems = input.lineItems.map(calculateItem);
    const { subtotal, discount, tax, total } = computeDocumentTotals(lineItems);

    const doc = await prisma.crmCommercialDocument.create({
      data: {
        ...input,
        number: input.number ?? `DOC-${Date.now()}`,
        subtotal,
        discount,
        tax,
        total,
        lineItems: lineItems as unknown as Prisma.InputJsonValue,
        organizationId,
        issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
      include: { lead: true, company: true, contact: true },
    });

    // CYC-005 (onda 25): versão 1 é gravada na própria criação — antes desta correção,
    // `CrmCommercialDocumentVersion` era uma tabela morta confirmada (schema existia, zero
    // linha escrita em código). `draftNextProposalVersion([], ...)` sempre resolve para
    // versionNumber=1 aqui (histórico vazio).
    const version1 = draftNextProposalVersion([], {
      documentId: doc.id,
      snapshot: {
        title: doc.title,
        currency: doc.currency,
        lineItems: lineItems as unknown as ProposalSnapshot['lineItems'],
        subtotal,
        discount,
        tax,
        total,
        notes: doc.notes,
        terms: doc.terms,
      },
      changedBy: actorUserId ?? null,
      changeReason: 'Criação do documento',
    });
    await prisma.crmCommercialDocumentVersion.create({
      data: {
        organizationId,
        documentId: version1.documentId,
        versionNumber: version1.versionNumber,
        snapshot: version1.snapshot as unknown as Prisma.InputJsonValue,
        changedBy: version1.changedBy,
        changeReason: version1.changeReason,
      },
    });

    return serializeDocument(doc);
  }

  async updateDocumentContent(
    organizationId: string,
    documentId: string,
    input: CrmDocumentUpdateInput,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    const existingRows = await prisma.crmCommercialDocumentVersion.findMany({
      where: { organizationId, documentId },
      orderBy: { versionNumber: 'asc' },
    });
    const existingVersions: ProposalVersion[] = existingRows.map((v) => ({
      id: v.id,
      documentId: v.documentId,
      versionNumber: v.versionNumber,
      snapshot: v.snapshot as unknown as ProposalSnapshot,
      changedBy: v.changedBy,
      changeReason: v.changeReason,
      createdAt: v.createdAt,
    }));

    const lineItems = input.lineItems.map(calculateItem);
    const { subtotal, discount, tax, total } = computeDocumentTotals(lineItems);

    const nextVersion = draftNextProposalVersion(existingVersions, {
      documentId,
      snapshot: {
        title: input.title,
        currency: input.currency,
        lineItems: lineItems as unknown as ProposalSnapshot['lineItems'],
        subtotal,
        discount,
        tax,
        total,
        notes: input.notes ?? null,
        terms: input.terms ?? null,
      },
      changedBy: actorUserId ?? null,
      changeReason: input.changeReason ?? null,
    });

    // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
    const [, doc] = await prisma.$transaction([
      prisma.crmCommercialDocumentVersion.create({
        data: {
          organizationId,
          documentId: nextVersion.documentId,
          versionNumber: nextVersion.versionNumber,
          snapshot: nextVersion.snapshot as unknown as Prisma.InputJsonValue,
          changedBy: nextVersion.changedBy,
          changeReason: nextVersion.changeReason,
        },
      }),
      prisma.crmCommercialDocument.update({
        where: { id: documentId, organizationId },
        data: {
          title: input.title,
          currency: input.currency,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          subtotal,
          discount,
          tax,
          total,
          lineItems: lineItems as unknown as Prisma.InputJsonValue,
          notes: input.notes ?? null,
          terms: input.terms ?? null,
        },
        include: { lead: true, company: true, contact: true },
      }),
    ]);

    return serializeDocument(doc);
  }

  async listDocumentVersions(
    organizationId: string,
    documentId: string,
  ): Promise<CrmCommercialDocumentVersionDTO[]> {
    const rows = await prisma.crmCommercialDocumentVersion.findMany({
      where: { organizationId, documentId },
      orderBy: { versionNumber: 'desc' },
    });
    return rows.map((v) => ({
      id: v.id,
      documentId: v.documentId,
      versionNumber: v.versionNumber,
      snapshot: v.snapshot as unknown as CrmCommercialDocumentVersionDTO['snapshot'],
      changedBy: v.changedBy,
      changeReason: v.changeReason,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async updateDocumentStatus(
    organizationId: string,
    documentId: string,
    status: string,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    const nextStatus = status as CrmDocumentStatus;
    const current = await prisma.crmCommercialDocument.findFirst({
      where: { id: documentId, organizationId },
      select: { sentAt: true, status: true, leadId: true, type: true },
    });

    // BILLING-003 (onda 5, auditoria de débito técnico — risco financeiro real): "Pago" numa
    // Fatura era uma transição manual livre, sem NENHUM vínculo com Stripe/Omie/qualquer fonte
    // financeira real — um status voltado ao cliente que não podia ser confiado para decisão
    // financeira nenhuma. Esta rota genérica de status NUNCA mais aceita marcar uma Fatura como
    // Pago diretamente; só `reconcileFaturaStripePayment` pode, e só depois de confirmar AO VIVO
    // contra a API do Stripe que existe uma cobrança `succeeded` com valor/moeda batendo. Outros
    // tipos de documento (Orçamento/Proposta/Contrato) não são o alvo financeiro desta correção —
    // seu "Pago" (se algum dia usado) continua passando por aqui, sem mudança de comportamento.
    if (
      nextStatus === CrmDocumentStatus.Pago &&
      current?.type === CrmDocumentType.Fatura &&
      current.status !== CrmDocumentStatus.Pago
    ) {
      throw new AppError(
        'Fatura só pode ser marcada como Pago através da reconciliação com uma cobrança Stripe real — use POST /api/crm/documents/:id/reconcile-stripe-payment.',
        400,
      );
    }

    // ACH-17-08: marcar uma proposta como "Pago" era a mesma falha já corrigida em ACH-17-01 para
    // assinatura — nenhum DealClosureEvent era criado, nenhum ator era exigido, e nada impedia um
    // CLOSER de confirmar pagamento sem deixar rastro de fechamento. Só dispara numa transição REAL
    // para Pago (`current?.status !== Pago`); um segundo clique que já está em Pago é tratado como
    // no-op, o mesmo papel que `isValidSignatureTransition` cumpre para o webhook de assinatura
    // (estado terminal repetido não gera um segundo evento). Documento sem `leadId` associado não
    // tem negócio a fechar — nem o gate roda, nem `actorUserId` é exigido nesse caso.
    if (
      nextStatus === CrmDocumentStatus.Pago &&
      current?.status !== CrmDocumentStatus.Pago &&
      current?.leadId
    ) {
      if (!actorUserId) {
        throw new AppError(
          'Confirmar pagamento de uma proposta vinculada a um negócio exige um usuário autenticado identificado.',
          401,
        );
      }
      // Escopo desta correção (ACH-17-08): só registra o `DealClosureEvent` como evidência
      // determinística — mover `Lead.status` para "Negócios Ganhos" a partir daqui é decisão de
      // produto separada, fora do escopo pedido para esta rodada.
      await ensureDealClosureAllowed(prismaDealClosureGate, {
        organizationId,
        leadId: current.leadId,
        type: 'payment_confirmed',
        evidenceRef: documentId,
        triggeredBy: actorUserId,
      });
    }

    const doc = await prisma.crmCommercialDocument.update({
      where: { id: documentId, organizationId },
      data: {
        status: nextStatus,
        // Grava sentAt na primeira vez que o documento sai de rascunho — nunca sobrescrito
        // em transições seguintes (motivo real de envio é o primeiro, não o mais recente).
        ...(nextStatus === CrmDocumentStatus.Enviado && !current?.sentAt
          ? { sentAt: new Date() }
          : {}),
      },
      include: { lead: true, company: true, contact: true },
    });
    return serializeDocument(doc);
  }

  /**
   * BILLING-003 (onda 5) — único caminho que pode marcar uma Fatura como Pago: confirma AO VIVO
   * contra a API do Stripe (`getStripeCharge`, nunca confiando num status/valor só informado pelo
   * chamador) que o PaymentIntent existe, está `succeeded` e bate em valor/moeda com o total do
   * documento, antes de gravar qualquer coisa. Idempotente para a MESMA cobrança já reconciliada
   * (segundo clique/reenvio não falha); rejeita reconciliar com uma cobrança diferente da já
   * gravada, e rejeita reusar uma cobrança que já reconciliou outro documento (unique constraint
   * em (organizationId, stripePaymentIntentId), ver schema.prisma).
   */
  async reconcileFaturaStripePayment(
    organizationId: string,
    documentId: string,
    connectionId: string,
    paymentIntentId: string,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    const current = await prisma.crmCommercialDocument.findFirst({
      where: { id: documentId, organizationId },
      select: {
        type: true,
        status: true,
        leadId: true,
        total: true,
        currency: true,
        stripePaymentIntentId: true,
      },
    });
    if (!current) throw new AppError('Documento não encontrado.', 404);
    if (current.type !== CrmDocumentType.Fatura) {
      throw new AppError(
        'Só documentos do tipo Fatura podem ser reconciliados com um pagamento.',
        400,
      );
    }

    // Mesma cobrança já reconciliada com ESTE documento — no-op honesto (não é um erro real).
    if (
      current.status === CrmDocumentStatus.Pago &&
      current.stripePaymentIntentId === paymentIntentId
    ) {
      const doc = await prisma.crmCommercialDocument.findFirstOrThrow({
        where: { id: documentId, organizationId },
        include: { lead: true, company: true, contact: true },
      });
      return serializeDocument(doc);
    }

    const charge = await this.stripeChargePort.getStripeCharge(
      organizationId,
      connectionId,
      paymentIntentId,
    );
    if (!charge) {
      throw new AppError('Cobrança não encontrada no Stripe para esta conexão.', 404);
    }
    if (charge.status !== 'succeeded') {
      throw new AppError(
        `Pagamento ainda não confirmado pela Stripe (status atual: "${charge.status}") — a Fatura só é marcada como Pago depois de um PaymentIntent "succeeded".`,
        409,
      );
    }

    const expectedAmountCents = Math.round(current.total * 100);
    // Tolerância de 1 centavo para arredondamento de ponto flutuante entre Float (schema) e
    // inteiro de centavos (Stripe) — qualquer diferença maior é um mismatch real, nunca ignorado.
    if (Math.abs(charge.amountCents - expectedAmountCents) > 1) {
      throw new AppError(
        `Valor da cobrança Stripe (${charge.amountCents} centavos) não bate com o total da Fatura (${expectedAmountCents} centavos) — reconciliação recusada.`,
        409,
      );
    }
    if (charge.currency.toUpperCase() !== current.currency.toUpperCase()) {
      throw new AppError(
        `Moeda da cobrança Stripe (${charge.currency}) não bate com a moeda da Fatura (${current.currency}) — reconciliação recusada.`,
        409,
      );
    }

    if (current.leadId) {
      if (!actorUserId) {
        throw new AppError(
          'Confirmar pagamento de uma Fatura vinculada a um negócio exige um usuário autenticado identificado.',
          401,
        );
      }
      await ensureDealClosureAllowed(prismaDealClosureGate, {
        organizationId,
        leadId: current.leadId,
        type: 'payment_confirmed',
        evidenceRef: documentId,
        triggeredBy: actorUserId,
      });
    }

    let doc: Record<string, unknown>;
    try {
      doc = await prisma.crmCommercialDocument.update({
        where: { id: documentId, organizationId },
        data: {
          status: CrmDocumentStatus.Pago,
          stripeConnectionId: connectionId,
          stripePaymentIntentId: paymentIntentId,
          paymentReconciledAt: new Date(),
        },
        include: { lead: true, company: true, contact: true },
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Esta cobrança Stripe já foi usada para reconciliar outra Fatura.', 409);
      }
      throw err;
    }

    await AuditService.log({
      action: 'UPDATE',
      entity: 'CrmCommercialDocument',
      entityId: documentId,
      tenantId: organizationId,
      afterState: { paymentReconciled: true, stripePaymentIntentId: paymentIntentId },
    });

    return serializeDocument(doc);
  }

  /**
   * Rota pública (`GET /api/public/proposals/:token/view`, sem `authenticateToken`) — o
   * `publicToken` (uuid, não adivinhável) É a credencial, mesmo modelo de confiança de
   * `BitrixConnection` (ver comentário em `src/lib/prisma.ts`). O bypass de RLS cobre só este
   * `findUnique`; a escrita do contador/timestamps roda escopada por tenant normalmente.
   */
  async recordDocumentView(publicToken: string): Promise<CrmPublicDocumentView | null> {
    const doc = await requestContext.run({ bypassRls: true }, () =>
      prisma.crmCommercialDocument.findUnique({ where: { publicToken } }),
    );
    if (!doc || doc.deletedAt) return null;

    return requestContext.run({ tenantId: doc.organizationId }, async () => {
      const now = new Date();
      // Só a primeira visualização avança o status (Enviado -> Visualizado) — reabrir o link
      // depois de Aceito/Recusado/Pago/etc. não deve regredir o status real do negócio.
      const nextStatus =
        doc.status === CrmDocumentStatus.Enviado ? CrmDocumentStatus.Visualizado : doc.status;
      const updated = await prisma.crmCommercialDocument.update({
        where: { id: doc.id },
        data: {
          viewCount: { increment: 1 },
          firstViewedAt: doc.firstViewedAt ?? now,
          lastViewedAt: now,
          status: nextStatus,
        },
      });

      return {
        number: updated.number,
        type: updated.type,
        status: updated.status,
        title: updated.title,
        currency: updated.currency,
        issueDate: updated.issueDate.toISOString(),
        validUntil: updated.validUntil?.toISOString() ?? null,
        subtotal: updated.subtotal,
        discount: updated.discount,
        tax: updated.tax,
        total: updated.total,
        lineItems: updated.lineItems as unknown as CrmPublicDocumentView['lineItems'],
        notes: updated.notes,
        terms: updated.terms,
      } as unknown as CrmPublicDocumentView;
    });
  }

  async requestDocumentSignature(
    organizationId: string,
    documentId: string,
    actorUserId: string | undefined,
    input: CrmDocumentSignatureRequestInput,
  ): Promise<{ id: string; providerRequestId: string }> {
    const doc = await prisma.crmCommercialDocument.findFirst({
      where: { id: documentId, organizationId },
      include: { contact: true },
    });
    if (!doc) throw new AppError('Documento não encontrado nesta organização.', 404);

    const signerEmail = input.signerEmail ?? doc.contact?.email ?? undefined;
    if (!signerEmail) {
      throw new AppError(
        'Documento sem e-mail de assinante — informe signerEmail ou vincule um contato com e-mail ao documento.',
        422,
      );
    }

    return requestDocumentSignatureUseCase(
      { repository: prismaSignatureRequestRepository, provider: govBrSignatureProviderPort },
      {
        organizationId,
        documentId,
        provider: 'govbr',
        signerEmail,
        signerName: input.signerName ?? doc.contact?.name ?? null,
        requestedBy: actorUserId ?? null,
      },
    );
  }
}

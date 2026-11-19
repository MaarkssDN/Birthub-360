import { Prisma } from '@prisma/client';
import { prisma, runInTransaction } from '../../../lib/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import type { CrmDealItemInput, CrmProductInput } from '../crm360.schema.js';
import type { CrmDealItem, CrmProduct } from '../crm360.types.js';
import { calculateItem, roundMoney } from './crm360Calculations.js';
import { assertDiscountAuthorityWithinTransaction } from './PrismaDiscountAuthorityGuard.js';

/**
 * Sub-repositório de catálogo e itens de negócio do CRM360, extraído de
 * `PrismaCrm360Repository.ts` na refatoração de hotspot (Onda 3, handoff 00→04).
 * Agrupa `listProducts`/`createProduct` (catálogo `CrmProduct`) e
 * `getDealItems`/`addDealItem`/`removeDealItem` (itens `CrmDealItem` + recomposição de
 * `Lead.amount`), incluindo a trava transacional de alçada de desconto (RN-CRM-02).
 * `PrismaCrm360Repository` delega para cá — nenhum comportamento foi alterado.
 */
export class PrismaCrmDealItemsRepository {
  async listProducts(organizationId: string, search?: string): Promise<CrmProduct[]> {
    const products = await prisma.crmProduct.findMany({
      where: {
        organizationId,
        active: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })) as unknown as CrmProduct[];
  }

  async createProduct(organizationId: string, data: CrmProductInput): Promise<CrmProduct> {
    const { customFields, currency, ...restData } = data;
    const product = await prisma.crmProduct.create({
      data: {
        ...restData,
        currency: currency.toUpperCase(),
        organizationId,
        customFields: customFields ? (customFields as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
    return {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    } as unknown as CrmProduct;
  }

  async getDealItems(organizationId: string, leadId: string): Promise<CrmDealItem[]> {
    const items = await prisma.crmDealItem.findMany({
      where: { organizationId, leadId },
      include: { product: true },
      orderBy: { sortOrder: 'asc' },
    });
    return items as unknown as CrmDealItem[];
  }

  async addDealItem(
    organizationId: string,
    leadId: string,
    input: CrmDealItemInput,
    actorUserId?: string,
  ): Promise<CrmDealItem> {
    const calculated = calculateItem(input);

    // RN-CRM-02 (trava transacional da alçada de desconto — continuação do handoff
    // `.agents/handoffs/onda-00/04-para-00-alcada-desconto-deal-items.md`): `CrmDealItem` tem
    // `discountPercent` por item e persiste o valor que alimenta `Lead.amount`, então um CLOSER
    // podia conceder desconto arbitrário fora da alçada. A mesma guarda dos documentos comerciais
    // é reutilizada aqui, avaliando o item isolado: como cada item só pode ser criado (não há
    // update de item) e o desconto efetivo do negócio é a média ponderada dos itens, um teto por
    // item já impede que adições sucessivas produzam desconto agregado acima da alçada — itens
    // acima dela só podem nascer de papéis com alçada maior (GESTOR/ADMIN). Tudo dentro de UM
    // `runInTransaction`: ou a trava reprova (403, nada persiste) ou item + soma de `Lead.amount`
    // comitam juntos.
    return runInTransaction(
      async (tx) => {
        // Tenancy (handoff 01A→04, onda-paralela-8): `productId` vinha do body sem checar se o
        // CrmProduct pertence ao tenant — o item gravava um vínculo cross-tenant e o
        // `include: { product: true }` devolvia o produto estrangeiro na resposta. O `leadId` já
        // é coberto pelo `tx.lead.update({ where: { id, organizationId } })` abaixo (P2025
        // reverte a transação inteira), mas o produto não tinha nenhuma checagem.
        if (calculated.productId) {
          const product = await tx.crmProduct.findFirst({
            where: { id: calculated.productId, organizationId },
            select: { id: true },
          });
          if (!product) throw new AppError('Produto vinculado não encontrado.', 404);
        }

        await assertDiscountAuthorityWithinTransaction(tx, {
          organizationId,
          actorUserId,
          lineItems: [calculated],
        });

        const item = await tx.crmDealItem.create({
          data: { ...calculated, organizationId, leadId },
          include: { product: true },
        });

        const aggregate = await tx.crmDealItem.aggregate({
          where: { organizationId, leadId },
          _sum: { total: true },
        });
        await tx.lead.update({
          where: { id: leadId, organizationId },
          data: { amount: roundMoney(aggregate._sum.total ?? 0) },
        });

        return item as unknown as CrmDealItem;
      },
      { organizationId },
    );
  }

  async removeDealItem(organizationId: string, leadId: string, itemId: string): Promise<void> {
    await prisma.crmDealItem.deleteMany({ where: { id: itemId, leadId, organizationId } });

    const aggregate = await prisma.crmDealItem.aggregate({
      where: { organizationId, leadId },
      _sum: { total: true },
    });
    await prisma.lead.update({
      where: { id: leadId, organizationId },
      data: { amount: roundMoney(aggregate._sum.total ?? 0) },
    });
  }
}

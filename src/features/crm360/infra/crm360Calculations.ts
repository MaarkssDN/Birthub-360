/**
 * Cálculos monetários puros compartilhados pelo repositório CRM360 e pelos sub-repositórios
 * extraídos na refatoração de hotspot (Onda 3, handoff 00→04): `PrismaCrmDocumentRepository`
 * (documentos comerciais) e `PrismaCrmDealItemsRepository` (produtos/itens de negócio).
 * Extraído de `PrismaCrm360Repository.ts` sem nenhuma mudança de comportamento.
 */

export function roundMoney(value: number): number {
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

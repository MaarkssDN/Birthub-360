/**
 * Alçada de desconto em propostas/documentos comerciais (RN-CRM-02, MOD-01 Hub Comercial —
 * JOR-08): desconto > 10% exige Gestor; > 20% exige Diretoria/Admin.
 *
 * Regra documentada em `docs/master-v4/ENTREGA-02-INVENTARIO-FUNCIONAL.md` ("Descontos acima de
 * 15%/10% exigem aprovação sênior") e `docs/master-v4/02-MATRIZ-RASTREAMENTO-RECONCILIADA.md`
 * (RN-CRM-02), mas até aqui nenhum caminho de escrita real (`PrismaCrm360Repository.
 * createDocument`/`updateDocumentContent`) aplicava a trava — achado da auditoria de supervisor
 * (BIRTHUB360_RELATORIO_SUPERVISOR_ONDA_00.html, MOD-01: "trava de desconto requer middleware
 * transacional"). A trava agora roda DENTRO de `runInTransaction` via
 * `infra/PrismaDiscountAuthorityGuard.ts`, com `SELECT ... FOR UPDATE` na linha do documento na
 * edição — ver os métodos do repositório. `addDealItem` (itens de negócio) também é coberto pela
 * mesma guarda — o item é avaliado isoladamente dentro do `runInTransaction` que o grava (ver
 * `PrismaCrm360Repository.addDealItem`); a justificativa de avaliar o item isolado (e não o
 * conjunto do negócio) está no comentário do método.
 *
 * Módulo puro (zero I/O): quem chama decide ONDE a verificação acontece; a implementação Prisma
 * (`infra/PrismaDiscountAuthorityGuard.ts`) executa a avaliação dentro de `$transaction`
 * interativa, com re-leitura da linha do documento via `SELECT ... FOR UPDATE`.
 *
 * Os percentuais são variáveis de governança parametrizáveis por organização
 * (`Setting.key = 'approval_thresholds'`, ver `docs/master-v4/01-RELATORIO-AUDITORIA-INDEPENDENTE.md`
 * §3) — os defaults abaixo são o padrão homologado out-of-the-box (Closer/SDR até 10%, Gestor
 * até 20%, ADMIN irrestrito).
 */

export interface DiscountAuthorityThresholds {
  /** Maior desconto (%) que CLOSER/SDR (e qualquer papel abaixo de GESTOR) pode aplicar sem aprovação. */
  closerMaxPercent: number;
  /** Maior desconto (%) que GESTOR pode aplicar; acima disso só ADMIN/Diretoria. */
  managerMaxPercent: number;
}

/** RN-CRM-02 default homologado: Closer até 10%, Gestor até 20%, Diretoria acima disso. */
export const DEFAULT_DISCOUNT_AUTHORITY_THRESHOLDS: DiscountAuthorityThresholds = {
  closerMaxPercent: 10,
  managerMaxPercent: 20,
};

/**
 * Percentual máximo de desconto que o papel pode conceder sozinho.
 * Fail-closed: papel ausente ou desconhecido recebe a MENOR alçada (a de Closer), nunca a maior.
 * ADMIN é a "Diretoria" da hierarquia (`ROLE_HIERARCHY` em `src/lib/auth/authorization.ts`) —
 * sem teto de desconto.
 */
export function resolveActorDiscountLimitPercent(
  actorRole: string | undefined,
  thresholds: DiscountAuthorityThresholds = DEFAULT_DISCOUNT_AUTHORITY_THRESHOLDS,
): number {
  if (actorRole === 'ADMIN') return Number.POSITIVE_INFINITY;
  if (actorRole === 'GESTOR') return thresholds.managerMaxPercent;
  return thresholds.closerMaxPercent;
}

export interface DiscountableLineItem {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Desconto efetivo do documento inteiro — MESMA fórmula de `computeDocumentTotals` em
 * `PrismaCrm360Repository.ts` (Σ qty×price×discount% / Σ qty×price), para que a trava avalie
 * exatamente o número que será persistido em `CrmCommercialDocument.discount`.
 */
export function computeEffectiveDiscountPercent(
  lineItems: readonly DiscountableLineItem[],
): number {
  const gross = lineItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  if (gross <= 0) return 0;
  const discount = lineItems.reduce(
    (acc, i) => acc + i.quantity * i.unitPrice * ((i.discountPercent ?? 0) / 100),
    0,
  );
  return round2((discount / gross) * 100);
}

/** Maior `discountPercent` declarado em um único item — um item isolado acima da alçada também é concessão de desconto. */
export function computeMaxItemDiscountPercent(lineItems: readonly DiscountableLineItem[]): number {
  return lineItems.reduce((acc, i) => Math.max(acc, i.discountPercent ?? 0), 0);
}

export interface DiscountAuthorityVerdict {
  allowed: boolean;
  /** Percentual efetivo do documento (ponderado por valor bruto). */
  effectiveDiscountPercent: number;
  /** Maior percentual em um único item. */
  maxItemDiscountPercent: number;
  /** Percentual que o ator pode conceder sozinho, dados seu papel e os thresholds da org. */
  limitPercent: number;
}

/**
 * Avaliação pura da alçada. Rejeita quando o desconto efetivo do documento OU qualquer item
 * isolado ultrapassa o limite do papel — cobre tanto o caso "desconto diluído em vários itens"
 * quanto "um item com 50% de desconto escondido entre itens sem desconto".
 */
export function evaluateDiscountAuthority(input: {
  actorRole: string | undefined;
  lineItems: readonly DiscountableLineItem[];
  thresholds?: DiscountAuthorityThresholds;
}): DiscountAuthorityVerdict {
  const thresholds = input.thresholds ?? DEFAULT_DISCOUNT_AUTHORITY_THRESHOLDS;
  const limitPercent = resolveActorDiscountLimitPercent(input.actorRole, thresholds);
  const effectiveDiscountPercent = computeEffectiveDiscountPercent(input.lineItems);
  const maxItemDiscountPercent = computeMaxItemDiscountPercent(input.lineItems);
  const governing = Math.max(effectiveDiscountPercent, maxItemDiscountPercent);

  return {
    allowed: governing <= limitPercent,
    effectiveDiscountPercent,
    maxItemDiscountPercent,
    limitPercent,
  };
}

/** Extrai thresholds de governança de `Setting.value` (Json) — aceita `{closerMaxPercent, managerMaxPercent}` parcial; campos inválidos caem no default. */
export function parseDiscountAuthorityThresholds(value: unknown): DiscountAuthorityThresholds {
  const defaults = DEFAULT_DISCOUNT_AUTHORITY_THRESHOLDS;
  if (typeof value !== 'object' || value === null) return defaults;
  const raw = value as Record<string, unknown>;
  const pct = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : fallback;
  return {
    closerMaxPercent: pct(raw.closerMaxPercent, defaults.closerMaxPercent),
    managerMaxPercent: pct(raw.managerMaxPercent, defaults.managerMaxPercent),
  };
}

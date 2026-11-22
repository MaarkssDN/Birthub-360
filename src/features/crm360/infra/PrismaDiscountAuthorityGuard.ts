/**
 * Trava transacional da alçada de desconto (RN-CRM-02 / MOD-01 Hub Comercial — JOR-08).
 *
 * Executa a avaliação de `domain/discountAuthority.ts` DENTRO da transação que vai gravar o
 * documento — nunca antes, fora dela. É isso que fecha a janela de race condition apontada pela
 * auditoria: sem a avaliação dentro do tx (e, na edição, com a linha do documento travada por
 * `SELECT ... FOR UPDATE`), duas requisições concorrentes podiam intercalar leitura-validação-
 * escrita e gravar descontos acima da alçada do papel.
 *
 * Fontes lidas dentro do próprio tx (mesma conexão, mesmo snapshot de leitura do Postgres):
 * - papel do ator: `User.role` do `actorUserId` (nunca do body — o cliente não escolhe a própria
 *   alçada). Ator ausente/desconhecido cai na MENOR alçada (fail-closed, ver
 *   `resolveActorDiscountLimitPercent`).
 * - thresholds da organização: `Setting.key = 'approval_thresholds'` (ver
 *   `docs/master-v4/01-RELATORIO-AUDITORIA-INDEPENDENTE.md` §3); sem setting, usa o default
 *   homologado (Closer 10% / Gestor 20%).
 */
import type { TransactionalClient } from '../../../lib/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import {
  type DiscountAuthorityThresholds,
  type DiscountableLineItem,
  evaluateDiscountAuthority,
  parseDiscountAuthorityThresholds,
} from '../domain/discountAuthority.js';

const APPROVAL_THRESHOLDS_SETTING_KEY = 'approval_thresholds';

async function loadActorRole(
  tx: TransactionalClient,
  organizationId: string,
  actorUserId: string | undefined,
): Promise<string | undefined> {
  if (!actorUserId) return undefined;
  const user = await tx.user.findFirst({
    where: { id: actorUserId, organizationId },
    select: { role: true },
  });
  return user?.role;
}

async function loadOrganizationThresholds(
  tx: TransactionalClient,
  organizationId: string,
): Promise<DiscountAuthorityThresholds> {
  const settings = await tx.setting.findMany({
    where: { organizationId, key: APPROVAL_THRESHOLDS_SETTING_KEY },
    select: { userId: true, value: true },
  });
  // A linha organizacional (userId null) é a que vale; uma linha por usuário, se existir, só
  // entra como fallback — a governança de alçada é da organização, não do indivíduo.
  const orgWide = settings.find((s) => s.userId === null) ?? settings[0];
  return parseDiscountAuthorityThresholds(orgWide?.value);
}

/**
 * Lança `AppError` 403 quando o desconto efetivo (ou o maior item isolado) excede a alçada do
 * papel do ator. Deve ser chamada DENTRO de `runInTransaction`, antes de qualquer escrita —
 * ver `PrismaCrm360Repository.createDocument`/`updateDocumentContent`.
 */
export async function assertDiscountAuthorityWithinTransaction(
  tx: TransactionalClient,
  input: {
    organizationId: string;
    actorUserId?: string;
    lineItems: readonly DiscountableLineItem[];
  },
): Promise<void> {
  const actorRole = await loadActorRole(tx, input.organizationId, input.actorUserId);
  const thresholds = await loadOrganizationThresholds(tx, input.organizationId);
  const verdict = evaluateDiscountAuthority({
    actorRole,
    lineItems: input.lineItems,
    thresholds,
  });

  if (!verdict.allowed) {
    throw new AppError(
      `Desconto de ${verdict.effectiveDiscountPercent}% (maior item: ${verdict.maxItemDiscountPercent}%) excede a alçada do papel "${actorRole ?? 'desconhecido'}" (limite: ${verdict.limitPercent}%).`,
      403,
      {
        effectiveDiscountPercent: verdict.effectiveDiscountPercent,
        maxItemDiscountPercent: verdict.maxItemDiscountPercent,
        limitPercent: verdict.limitPercent,
      },
    );
  }
}

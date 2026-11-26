import { hasRequiredRole } from '../../../../lib/auth/authorization.js';
import { prisma } from '../../../../lib/prisma.js';
import { AppError } from '../../../../shared/middlewares/errorHandler.js';
import type { DailyPlanItemOrigin } from '../../../../shared/contracts/dailyPlan.contract.js';
import { callBitrix } from './client.js';
import { getBitrixUsers } from './deals.js';
import { resolveOwnBitrixUserId } from './userMapping.js';

/**
 * Autorização do Plano Diário (IDOR intra-portal — porte para `main` da entrega
 * `a08e841a0c`, branch `agente/50-dailyplan-idor-s50`, adaptação da missão
 * MAIN-50-DAILYPLAN-NOTES-IDOR). Complementa o fix POS4 de `completeDailyPlanItem`
 * (`assertBitrixItemBelongsToPlanUser` em dailyPlan.service.ts), que já valida a posse do
 * item contra o usuário Bitrix do plano — aqui cobrimos o que main ainda não cobria:
 * `POST /daily-plan/note`, `GET /daily-plan/notes` (leitura de comentários também é IDOR)
 * e o `leadId` de `POST /daily-plan/activity`.
 *
 * Os `itemId` do plano são IDs enumeráveis do Bitrix24 (`bitrix_task_501`, `bitrix_act_88`,
 * `bitrix_lead_44`) — sem checagem de vínculo, qualquer usuário autenticado da organização
 * anotava/lia comentários de itens de qualquer colega do portal.
 *
 * Regra (mesma do fix de `hubTasks.service.ts` → `toggleHubTask`):
 * - ADMIN/GESTOR podem operar qualquer item do portal da organização (gestor enxerga o time
 *   inteiro — mesma premissa de `resolveScopedAssignedById` em bitrix.routes.ts);
 * - demais papéis só operam item cujo responsável/criador no Bitrix bate com o SEU
 *   `bitrixUserId` (vínculo explícito `User.bitrixUserId`, depois e-mail, depois nome único —
 *   mesma ordem de `resolvePlanBitrixUser`);
 * - o portal consultado é sempre o da conexão DA organização autenticada, então IDs de outro
 *   tenant simplesmente "não existem" aqui (404), nunca vazam existência.
 * - `LOCAL_ACTIVITY` é resolvido na camada Prisma pelos próprios services (checam
 *   `Activity.owner` — mesmo critério estrito de `completeDailyPlanItem` no POS4: o item só
 *   existe no plano de quem é `owner`, então admin operando plano de colega via Bitrix não
 *   tem bypass em atividade local).
 */

/** Contexto mínimo do usuário autenticado necessário para autorizar mutações do plano. */
export interface DailyPlanUserContext {
  id: string;
  email: string;
  role?: string;
}

/** Papéis que podem mutar/ler item alheio no portal — espelha `HUB_TASK_MANAGER_ROLES`. */
const DAILY_PLAN_MANAGER_ROLES = ['ADMIN', 'GESTOR'] as const;

export function isDailyPlanManager(role?: string): boolean {
  return hasRequiredRole(role ?? '', DAILY_PLAN_MANAGER_ROLES);
}

/**
 * Resolve o ID do usuário no Bitrix24 do portal desta organização. O usuário é buscado com
 * `organizationId` no filtro (nunca confia em id solto) — `bitrixUserId`/`name` vêm do banco,
 * `email` vem do token/sessão.
 */
export async function resolveDailyPlanBitrixUserId(
  organizationId: string,
  connectionId: string,
  user: DailyPlanUserContext,
): Promise<string> {
  const dbUser = await prisma.user.findFirst({
    where: { id: user.id, organizationId },
    select: { name: true, bitrixUserId: true },
  });
  if (!dbUser) {
    // Sessão válida mas usuário sumiu da org — fail-closed, nunca autoriza por omissão.
    throw new AppError('Usuário não encontrado nesta organização.', 403);
  }

  const bitrixUsers = await getBitrixUsers(organizationId, connectionId);
  const id =
    (dbUser.bitrixUserId != null ? String(dbUser.bitrixUserId) : null) ??
    resolveOwnBitrixUserId(bitrixUsers, user.email, dbUser.name);
  if (!id) {
    throw new AppError(
      'Seu login não tem um usuário correspondente no Bitrix24 desta organização — peça para vincular seu e-mail/nome ao usuário certo.',
      400,
    );
  }
  return id;
}

interface BitrixTaskAuthzRaw {
  ID?: string | number;
  CREATED_BY?: string | number;
  RESPONSIBLE_ID?: string | number;
}

interface BitrixActivityAuthzRaw {
  ID?: string | number;
  RESPONSIBLE_ID?: string | number;
  CREATED_BY?: string | number;
}

interface BitrixLeadAuthzRaw {
  ID?: string | number;
  ASSIGNED_BY_ID?: string | number;
}

function sameBitrixUser(value: string | number | undefined | null, ownId: string): boolean {
  return value != null && String(value) === ownId;
}

/**
 * Busca a entidade no portal para autorizar a operação. `tasks.task.get`/`crm.*.get` só enxergam
 * registros do portal da conexão desta organização — tenancy entre organizações já está garantida
 * pelo webhook; aqui tratamos do IDOR intra-portal (mesmo padrão de `assertBitrixItemBelongsToPlanUser`).
 */
async function assertBitrixItemOwnership(
  webhookUrl: string,
  itemType: DailyPlanItemOrigin,
  rawId: string,
  ownBitrixUserId: string,
): Promise<void> {
  if (itemType === 'BITRIX_TASK') {
    const payload = await callBitrix<{ result?: { task?: BitrixTaskAuthzRaw } }>(
      webhookUrl,
      'tasks.task.get',
      { taskId: rawId, select: ['ID', 'CREATED_BY', 'RESPONSIBLE_ID'] },
    );
    const task = payload.result?.task;
    if (!task || task.ID == null) {
      throw new AppError('Item não encontrado no Bitrix24 desta organização.', 404);
    }
    if (
      !sameBitrixUser(task.CREATED_BY, ownBitrixUserId) &&
      !sameBitrixUser(task.RESPONSIBLE_ID, ownBitrixUserId)
    ) {
      throw new AppError('Você não tem permissão para alterar este item do plano diário.', 403);
    }
    return;
  }

  if (itemType === 'BITRIX_ACTIVITY') {
    const payload = await callBitrix<{ result?: BitrixActivityAuthzRaw | null }>(
      webhookUrl,
      'crm.activity.get',
      { id: rawId },
    );
    const activity = payload.result;
    if (!activity || activity.ID == null) {
      throw new AppError('Item não encontrado no Bitrix24 desta organização.', 404);
    }
    if (
      !sameBitrixUser(activity.RESPONSIBLE_ID, ownBitrixUserId) &&
      !sameBitrixUser(activity.CREATED_BY, ownBitrixUserId)
    ) {
      throw new AppError('Você não tem permissão para alterar este item do plano diário.', 403);
    }
    return;
  }

  if (itemType === 'BITRIX_LEAD') {
    const payload = await callBitrix<{ result?: BitrixLeadAuthzRaw | null }>(
      webhookUrl,
      'crm.lead.get',
      { id: rawId },
    );
    const lead = payload.result;
    if (!lead || lead.ID == null) {
      throw new AppError('Item não encontrado no Bitrix24 desta organização.', 404);
    }
    if (!sameBitrixUser(lead.ASSIGNED_BY_ID, ownBitrixUserId)) {
      throw new AppError('Você não tem permissão para alterar este item do plano diário.', 403);
    }
    return;
  }

  // Fail-closed: `itemType` chega como string do body/query da rota — um tipo desconhecido não
  // pode passar batido (antes caía aqui sem checagem e o caller seguia para crm.timeline.*).
  throw new AppError('Tipo de item do plano diário não suportado.', 400);
}

/**
 * Gate de autorização para QUALQUER operação sobre um item `bitrix_*` do plano (note, leitura
 * de comentários). `LOCAL_ACTIVITY` é resolvido na camada Prisma pelos próprios services
 * (checam `Activity.owner`), então aqui só os tipos Bitrix chegam — chamar com LOCAL_ACTIVITY
 * é no-op proposital.
 *
 * Ordem: ADMIN/GESTOR passa direto (não precisa nem resolver o próprio bitrixUserId); demais
 * papéis resolvem o próprio ID e comparam com o dono do item. 404 antes de 403 quando o item não
 * existe — não vaza existência de recurso.
 */
export async function assertDailyPlanItemAccess(
  organizationId: string,
  connectionId: string,
  webhookUrl: string,
  user: DailyPlanUserContext,
  itemType: DailyPlanItemOrigin,
  rawId: string,
): Promise<void> {
  if (itemType === 'LOCAL_ACTIVITY') return;
  if (isDailyPlanManager(user.role)) return;

  const ownBitrixUserId = await resolveDailyPlanBitrixUserId(
    organizationId,
    connectionId,
    user,
  );
  await assertBitrixItemOwnership(webhookUrl, itemType, rawId, ownBitrixUserId);
}

/**
 * `entityType`/`entityId` do POST /daily-plan/note e GET /daily-plan/notes vêm do cliente e são
 * repassados direto para `crm.timeline.comment.*` — sem allowlist, dava para postar/ler comentário
 * em QUALQUER entidade do portal (deal, contato, empresa, tipos dinâmicos) contornando a
 * autorização do item. Restringe aos tipos padrão de entidade CRM do Bitrix24.
 */
const ALLOWED_TIMELINE_ENTITY_TYPES = new Set(['lead', 'deal', 'contact', 'company']);

export function assertTimelineEntityType(entityType?: string): void {
  if (entityType && !ALLOWED_TIMELINE_ENTITY_TYPES.has(entityType)) {
    throw new AppError('Tipo de entidade não suportado para observação do plano diário.', 400);
  }
}

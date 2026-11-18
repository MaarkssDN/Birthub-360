// Prisma access for the notification domain (Agente 12 — Growth, Billing e Monetização de Uso).
//
// Adaptado ao model canônico `Notification` (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1):
// o schema canônico NÃO tem `message`/`isRead` nem `organizationId` opcional — os campos reais são
// `body` (texto), `readAt` (timestamp de leitura; `null` = não lida) e `organizationId`
// OBRIGATÓRIO com `userId` anulável ("toda a organização" quando null). Toda query abaixo filtra
// por `organizationId` + `userId` juntos: o par é o escopo de tenant efetivo, e nenhum caller pode
// alcançar notificação de outra organização nem de outro usuário.
//
// Kept intentionally thin: every function here is a direct Prisma query/mutation with no business
// rules (ownership checks, DTO mapping) — that logic lives in `src/services/notificationService.ts`,
// which is the only caller of this file (Clean Architecture, AGENTS.md §2: Controller → Service →
// Repository, no Prisma access outside `src/repositories/**`).
import type { Notification, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';

export interface NotificationScope {
  organizationId: string;
  userId: string;
}

export function createNotification(
  scope: NotificationScope,
  input: { title: string; message: string },
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      organizationId: scope.organizationId,
      userId: scope.userId,
      title: input.title,
      body: input.message,
    },
  });
}

export function findNotificationsForUser(
  scope: NotificationScope,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<[Notification[], number]> {
  const skip = (page - 1) * pageSize;
  const where = { organizationId: scope.organizationId, userId: scope.userId };
  return Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);
}

export function countUnreadForUser(scope: NotificationScope): Promise<number> {
  return prisma.notification.count({
    where: { organizationId: scope.organizationId, userId: scope.userId, readAt: null },
  });
}

export function findNotificationByIdForUser(
  id: string,
  scope: NotificationScope,
): Promise<Notification | null> {
  // `organizationId`+`userId` are part of the where-clause itself (not checked after the fact) so a
  // notification belonging to another tenant/user resolves to `null` here — the same 404-not-403
  // fallback the tenant-isolation convention elsewhere in the codebase uses, so a caller can never
  // learn a notification with that id merely exists for someone else (AGENTS.md §15).
  return prisma.notification.findFirst({
    where: { id, organizationId: scope.organizationId, userId: scope.userId },
  });
}

// `Notification`'s only unique field is `id`, so a Prisma `update` where-clause cannot also carry
// the scope (no compound unique constraint exists for that per the schema) — ownership must be
// verified with a separate read first, same shape as findNotificationByIdForUser above. This is
// two round-trips instead of one atomic statement, but each is a single-row primary-key lookup and
// the alternative (encoding ownership into a raw query) would bypass Prisma's typed API for no
// real benefit here.
export async function markNotificationAsRead(
  id: string,
  scope: NotificationScope,
): Promise<Notification | null> {
  const existing = await prisma.notification.findFirst({
    where: { id, organizationId: scope.organizationId, userId: scope.userId },
  });
  if (!existing) return null;
  return prisma.notification.update({ where: { id: existing.id }, data: { readAt: new Date() } });
}

export function markAllAsReadForUser(scope: NotificationScope): Promise<Prisma.BatchPayload> {
  return prisma.notification.updateMany({
    where: { organizationId: scope.organizationId, userId: scope.userId, readAt: null },
    data: { readAt: new Date() },
  });
}

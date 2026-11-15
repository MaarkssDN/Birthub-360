// Notification domain service (Agente 12 — Growth, Billing e Monetização de Uso).
//
// Resolves .agents/handoffs/onda-2/02-para-00-notificacoes-backend.md: replaces the 5 hardcoded,
// "Exemplo"-labeled notifications in components/Sidebar.tsx with a real, persisted, per-user
// notification feed.
//
// Adaptado ao model canônico `Notification` (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md): o schema real tem
// `organizationId` OBRIGATÓRIO, `body` (não `message`) e `readAt` (não `isRead`). Toda função
// abaixo recebe o escopo `{ organizationId, userId }` — o `organizationId` vem SEMPRE da sessão
// autenticada (requireTenant), nunca de input do cliente, e o `userId` da mesma sessão; o par é
// aplicado no WHERE da query (AGENTS.md §15), então uma notificação de outro tenant é
// indistinguível de uma inexistente.
//
// SCOPE OF THIS FIRST VERSION (deliberate, pragmatic choice — see the model comment directly
// above `model Notification` in prisma/schema.prisma and this agent's report):
//   - in-app only. `Notification` has no channel field (email/webhook) — every notification
//     created here is an in-app item. Email/webhook delivery is future work, gated on a schema
//     extension (see the handoff to Agente 01 this agent filed alongside this service).
//   - scoped by `userId` within `organizationId` (per-user feed). O model também suporta
//     `userId: null` = "toda a organização", mas este serviço só escreve/lê o feed pessoal —
//     notificações broadcast ficam para um fluxo dedicado, não para este entry point.
//
// GENERIC ENGINE, NOT A BILLING-ONLY ONE (this agent's own prompt, "Sistema de notificações"):
// `createNotification` below is the single entry point any domain can call to raise a
// notification for a user — it takes no billing-specific shape. billing.controller.ts calling it
// after a successful plan change is the *first* caller, not the *only* one: a future call site in
// 05 (incidente de chamada), 10 (alerta de infra) or 11 (alerta de supervisão) is a matter of
// importing this function and calling it with that user's id — no parallel notification system to
// build, per this agent's explicit instruction not to construct "uma versão só para billing e
// outra pro resto".
import type { Notification } from '@prisma/client';
import {
  countUnreadForUser,
  createNotification as createNotificationRow,
  findNotificationsForUser,
  markAllAsReadForUser,
  markNotificationAsRead as markNotificationAsReadRow,
  type NotificationScope,
} from '../repositories/notificationRepository.js';

export interface NotificationSummary {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO 8601
}

export interface NotificationsPage {
  items: NotificationSummary[];
  total: number;
  unreadCount: number;
}

export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`notificationService: notificação ${id} não existe para este usuário.`);
    this.name = 'NotificationNotFoundError';
  }
}

function mapNotification(notification: Notification): NotificationSummary {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.body ?? '',
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
  };
}

// Generic creation entry point — see module doc above. O escopo deve vir da sessão
// (`req.organizationId` + `req.voiceHubUser.id` no call site), nunca de input não validado.
export async function createNotification(
  scope: NotificationScope,
  input: { title: string; message: string },
): Promise<NotificationSummary> {
  const created = await createNotificationRow(scope, input);
  return mapNotification(created);
}

// Paginated list for the NotificationCenter panel, plus the unread count the bell badge needs —
// scoped strictly to `{ organizationId, userId }` da sessão (AGENTS.md §15/§16 item 12: filter
// applied here in the service/repository layer, never merely "remembered" in the controller or UI).
export async function listNotifications(
  scope: NotificationScope,
  pagination: { page: number; pageSize: number },
): Promise<NotificationsPage> {
  const [[items, total], unreadCount] = await Promise.all([
    findNotificationsForUser(scope, pagination),
    countUnreadForUser(scope),
  ]);
  return { items: items.map(mapNotification), total, unreadCount };
}

// Marks one notification read, verifying ownership by scope first (repository returns null for a
// notification that does not exist OR belongs to a different tenant/user — same fallback,
// deliberately indistinguishable from the caller's point of view per AGENTS.md §15 "comportamento
// de fallback seguro, sem vazar se o recurso existe em outro tenant").
export async function markAsRead(id: string, scope: NotificationScope): Promise<NotificationSummary> {
  const updated = await markNotificationAsReadRow(id, scope);
  if (!updated) throw new NotificationNotFoundError(id);
  return mapNotification(updated);
}

export async function markAllAsRead(scope: NotificationScope): Promise<{ updatedCount: number }> {
  const result = await markAllAsReadForUser(scope);
  return { updatedCount: result.count };
}

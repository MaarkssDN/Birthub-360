import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/notificationRepository.js', () => ({
  createNotification: vi.fn(),
  findNotificationsForUser: vi.fn(),
  countUnreadForUser: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllAsReadForUser: vi.fn(),
}));

import {
  createNotification as createNotificationRow,
  findNotificationsForUser,
  countUnreadForUser,
  markNotificationAsRead as markNotificationAsReadRow,
  markAllAsReadForUser,
} from '../repositories/notificationRepository.js';
import {
  createNotification,
  listNotifications,
  markAllAsRead,
  markAsRead,
  NotificationNotFoundError,
} from './notificationService.js';

beforeEach(() => vi.clearAllMocks());

const NOW = new Date('2026-09-07T12:00:00.000Z');
// Escopo canônico { organizationId, userId } — ver notificationService.ts.
const SCOPE = { organizationId: 'org-1', userId: 'user-1' };

describe('notificationService.createNotification', () => {
  it('creates via the repository and maps the canonical row (body/readAt) to a DTO', async () => {
    vi.mocked(createNotificationRow).mockResolvedValue({
      id: 'notif-1',
      organizationId: 'org-1',
      userId: 'user-1',
      title: 'Plano atualizado',
      body: 'Seu plano foi alterado.',
      readAt: null,
      createdAt: NOW,
    } as any);

    const result = await createNotification(SCOPE, {
      title: 'Plano atualizado',
      message: 'Seu plano foi alterado.',
    });

    expect(createNotificationRow).toHaveBeenCalledWith(SCOPE, {
      title: 'Plano atualizado',
      message: 'Seu plano foi alterado.',
    });
    expect(result).toEqual({
      id: 'notif-1',
      title: 'Plano atualizado',
      message: 'Seu plano foi alterado.',
      isRead: false,
      createdAt: '2026-09-07T12:00:00.000Z',
    });
  });
});

describe('notificationService.listNotifications', () => {
  it('combines paginated items and unread count, both scoped to organizationId+userId', async () => {
    vi.mocked(findNotificationsForUser).mockResolvedValue([
      [
        {
          id: 'notif-1',
          organizationId: 'org-1',
          userId: 'user-1',
          title: 'A',
          body: 'B',
          readAt: null,
          createdAt: NOW,
        },
      ],
      1,
    ] as any);
    vi.mocked(countUnreadForUser).mockResolvedValue(1);

    const result = await listNotifications(SCOPE, { page: 1, pageSize: 20 });

    expect(findNotificationsForUser).toHaveBeenCalledWith(SCOPE, { page: 1, pageSize: 20 });
    expect(countUnreadForUser).toHaveBeenCalledWith(SCOPE);
    expect(result).toEqual({
      items: [
        {
          id: 'notif-1',
          title: 'A',
          message: 'B',
          isRead: false,
          createdAt: '2026-09-07T12:00:00.000Z',
        },
      ],
      total: 1,
      unreadCount: 1,
    });
  });

  it('returns an explicit empty page (not fabricated data) when the user has no notifications', async () => {
    vi.mocked(findNotificationsForUser).mockResolvedValue([[], 0] as any);
    vi.mocked(countUnreadForUser).mockResolvedValue(0);

    const result = await listNotifications(SCOPE, { page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [], total: 0, unreadCount: 0 });
  });
});

describe('notificationService.markAsRead', () => {
  it('returns the mapped notification when the repository confirms ownership', async () => {
    vi.mocked(markNotificationAsReadRow).mockResolvedValue({
      id: 'notif-1',
      organizationId: 'org-1',
      userId: 'user-1',
      title: 'A',
      body: 'B',
      readAt: NOW,
      createdAt: NOW,
    } as any);

    const result = await markAsRead('notif-1', SCOPE);

    expect(markNotificationAsReadRow).toHaveBeenCalledWith('notif-1', SCOPE);
    expect(result.isRead).toBe(true);
  });

  it('throws NotificationNotFoundError when the repository returns null (missing or belongs to another tenant/user — same fallback, AGENTS.md §15)', async () => {
    vi.mocked(markNotificationAsReadRow).mockResolvedValue(null);

    await expect(markAsRead('notif-1', SCOPE)).rejects.toBeInstanceOf(
      NotificationNotFoundError,
    );
  });
});

describe('notificationService.markAllAsRead', () => {
  it('returns the number of rows updated within the scope', async () => {
    vi.mocked(markAllAsReadForUser).mockResolvedValue({ count: 5 });

    const result = await markAllAsRead(SCOPE);

    expect(markAllAsReadForUser).toHaveBeenCalledWith(SCOPE);
    expect(result).toEqual({ updatedCount: 5 });
  });
});

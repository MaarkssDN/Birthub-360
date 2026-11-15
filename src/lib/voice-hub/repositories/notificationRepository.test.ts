import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma.js';
import {
  createNotification,
  findNotificationByIdForUser,
  findNotificationsForUser,
  countUnreadForUser,
  markAllAsReadForUser,
  markNotificationAsRead,
} from './notificationRepository.js';

beforeEach(() => vi.clearAllMocks());

// Escopo canônico { organizationId, userId } — ver notificationRepository.ts: o model
// Notification real exige organizationId e usa body/readAt (não message/isRead).
const SCOPE = { organizationId: 'org-1', userId: 'user-1' };

describe('notificationRepository.createNotification', () => {
  it('creates a row scoped to organizationId+userId, mapping message→body', async () => {
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-1' } as any);

    await createNotification(SCOPE, { title: 'Título', message: 'Mensagem' });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        userId: 'user-1',
        title: 'Título',
        body: 'Mensagem',
      },
    });
  });
});

describe('notificationRepository.findNotificationsForUser', () => {
  it('filters by organizationId+userId, orders newest first, and paginates', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([{ id: 'notif-1' }] as any);
    vi.mocked(prisma.notification.count).mockResolvedValue(1);

    const [items, total] = await findNotificationsForUser(SCOPE, { page: 2, pageSize: 10 });

    const where = { organizationId: 'org-1', userId: 'user-1' };
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(prisma.notification.count).toHaveBeenCalledWith({ where });
    expect(items).toEqual([{ id: 'notif-1' }]);
    expect(total).toBe(1);
  });
});

describe('notificationRepository.countUnreadForUser', () => {
  it('counts only readAt:null rows within the scope', async () => {
    vi.mocked(prisma.notification.count).mockResolvedValue(3);

    const result = await countUnreadForUser(SCOPE);

    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', userId: 'user-1', readAt: null },
    });
    expect(result).toBe(3);
  });
});

describe('notificationRepository.findNotificationByIdForUser', () => {
  it('scopes the lookup by id+organizationId+userId (cross-tenant resolve a null)', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

    const result = await findNotificationByIdForUser('notif-x', SCOPE);

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'notif-x', organizationId: 'org-1', userId: 'user-1' },
    });
    expect(result).toBeNull();
  });
});

describe('notificationRepository.markNotificationAsRead', () => {
  it('returns null without writing when the notification is outside the scope', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

    const result = await markNotificationAsRead('notif-x', SCOPE);

    expect(result).toBeNull();
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('sets readAt when the notification belongs to the scope', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValue({ id: 'notif-1' } as any);
    vi.mocked(prisma.notification.update).mockResolvedValue({ id: 'notif-1' } as any);

    await markNotificationAsRead('notif-1', SCOPE);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { readAt: expect.any(Date) },
    });
  });
});

describe('notificationRepository.markAllAsReadForUser', () => {
  it('updates only readAt:null rows within the scope', async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 } as any);

    await markAllAsReadForUser(SCOPE);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', userId: 'user-1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});

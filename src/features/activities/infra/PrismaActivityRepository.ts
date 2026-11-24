import type { Prisma } from '@prisma/client';
import {
  fromPrismaActivityStatus,
  fromPrismaActivityType,
  fromPrismaCompanyStatus,
  fromPrismaLeadStatus,
  toPrismaActivityStatus,
  toPrismaActivityType,
} from '../../../lib/enumMap.js';
import { prisma } from '../../../lib/prisma.js';
import type { ActivityStatus, ActivityType } from '../../../lib/zod.js';
import { civilDayRangeUtc, parseActivityDate } from '../domain/activityDate.js';
import type {
  Activity,
  ActivityListFilters,
  ActivityPage,
  ActivityRepository,
} from '../domain/Activity.js';
import { assertActivityLeadInTenant } from './leadOwnership.js';

function serializeActivity<
  T extends {
    type: string;
    status: string;
    lead?: { status: string; company?: { status: string } | null } | null;
  },
>(activity: T): T & { type: ActivityType; status: ActivityStatus } {
  return {
    ...activity,
    type: fromPrismaActivityType(activity.type),
    status: fromPrismaActivityStatus(activity.status),
    ...(activity.lead
      ? {
          lead: {
            ...activity.lead,
            status: fromPrismaLeadStatus(activity.lead.status),
            ...(activity.lead.company
              ? {
                  company: {
                    ...activity.lead.company,
                    status: fromPrismaCompanyStatus(activity.lead.company.status),
                  },
                }
              : {}),
          },
        }
      : {}),
  };
}

export class PrismaActivityRepository implements ActivityRepository {
  async findAllPaginated(
    organizationId: string,
    dateStr?: string,
    page = 1,
    limit = 50,
    filters: ActivityListFilters = {},
  ): Promise<ActivityPage> {
    const where: Prisma.ActivityWhereInput = { organizationId, deletedAt: null };
    if (dateStr) {
      // `?date=YYYY-MM-DD` é dia civil no fuso do produto — o setHours anterior usava o fuso do
      // SERVIDOR (UTC em produção), janela desalinhada do dia que o usuário enxerga.
      const civilRange = civilDayRangeUtc(dateStr);
      if (civilRange) {
        where.date = civilRange;
      } else {
        const searchDate = new Date(dateStr);
        where.date = {
          gte: new Date(new Date(searchDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(searchDate).setHours(23, 59, 59, 999)),
        };
      }
    }
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.status)
      where.status = filters.status as unknown as Prisma.ActivityWhereInput['status'];
    if (filters.type) where.type = filters.type as unknown as Prisma.ActivityWhereInput['type'];

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 50;
    const skip = (safePage - 1) * safeLimit;

    // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        include: { lead: { include: { company: true, contact: true } } },
        orderBy: { date: 'asc' },
        skip,
        take: safeLimit,
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      data: activities.map(serializeActivity) as unknown as Activity[],
      meta: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async findRange(organizationId: string, from: Date, to: Date): Promise<Activity[]> {
    const activities = await prisma.activity.findMany({
      where: { organizationId, deletedAt: null, date: { gte: from, lt: to } },
      include: { lead: { include: { company: true, contact: true } } },
      orderBy: { date: 'asc' },
    });
    return activities.map(serializeActivity) as unknown as Activity[];
  }

  async findAllWithFilters(organizationId: string, dateStr?: string): Promise<Activity[]> {
    const where: Prisma.ActivityWhereInput = { organizationId, deletedAt: null };
    if (dateStr) {
      const civilRange = civilDayRangeUtc(dateStr);
      if (civilRange) {
        where.date = civilRange;
      } else {
        const searchDate = new Date(dateStr);
        where.date = {
          gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          lt: new Date(searchDate.setHours(23, 59, 59, 999)),
        };
      }
    }
    const activities = await prisma.activity.findMany({
      where,
      include: { lead: { include: { company: true, contact: true } } },
      orderBy: { date: 'asc' },
    });
    return activities.map(serializeActivity) as unknown as Activity[];
  }

  async createWithTimeline(
    organizationId: string,
    data: Partial<Activity> & {
      type: ActivityType;
      status: ActivityStatus;
      leadId: string;
      date: string | Date;
    },
  ): Promise<Activity> {
    // leadId nunca era validado contra organizationId — Activity cross-tenant derrubava o
    // $transaction no TimelineEvent (policy de tenant) ou ficava órfã. Ver leadOwnership.ts.
    await assertActivityLeadInTenant(organizationId, data.leadId);
    const activityDate = parseActivityDate(data.date);
    // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
    const [activity] = await prisma.$transaction([
      prisma.activity.create({
        data: {
          ...data,
          type: toPrismaActivityType(data.type) as unknown as Prisma.ActivityCreateInput['type'],
          status: toPrismaActivityStatus(
            data.status,
          ) as unknown as Prisma.ActivityCreateInput['status'],
          organizationId,
          date: activityDate,
          lead: undefined,
        } as unknown as Prisma.ActivityCreateInput,
      }),
      prisma.timelineEvent.create({
        data: {
          type: 'activity',
          description: `Atividade '${data.type}' agendada para ${activityDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
          leadId: data.leadId,
        },
      }),
    ]);

    return serializeActivity(activity) as unknown as Activity;
  }

  async updateWithTimeline(
    organizationId: string,
    id: string,
    data: Partial<Activity> & {
      type?: ActivityType;
      status?: ActivityStatus;
      date?: string | Date;
    },
  ): Promise<Activity> {
    // deletedAt no pre-check: sem isso um PUT podia "ressuscitar"/editar atividade
    // soft-deletada (o update por `id` não filtrava exclusão).
    const currentActivity = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!currentActivity) throw new Error('Activity not found');
    // PUT aceita leadId via activitySchema.partial() — mesma validação de tenant do create.
    if (data.leadId) await assertActivityLeadInTenant(organizationId, data.leadId);

    const updateData: Prisma.ActivityUpdateInput = { ...data } as Prisma.ActivityUpdateInput;
    if (data.date) updateData.date = parseActivityDate(data.date);
    if (data.type)
      updateData.type = toPrismaActivityType(
        data.type,
      ) as unknown as Prisma.ActivityUpdateInput['type'];
    if (data.status)
      updateData.status = toPrismaActivityStatus(
        data.status,
      ) as unknown as Prisma.ActivityUpdateInput['status'];

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
    });

    if (data.status && updateData.status !== currentActivity.status) {
      await prisma.timelineEvent.create({
        data: {
          type: 'activity',
          description: `Status da atividade '${fromPrismaActivityType(currentActivity.type)}' alterado para '${data.status}'`,
          leadId: currentActivity.leadId,
        },
      });
    }
    return serializeActivity(activity) as unknown as Activity;
  }

  async delete(organizationId: string, id: string): Promise<Activity> {
    const existing = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new Error('Activity not found');

    const deleted = await prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return serializeActivity(deleted) as unknown as Activity;
  }
}

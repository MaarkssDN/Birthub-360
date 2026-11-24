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
import {
  civilDayRangeInZoneToUtcIso,
  normalizeActivityDateToUtcIso,
} from '../../crm/tasks/calendar.utils.js';
import type {
  Activity,
  ActivityListFilters,
  ActivityPage,
  ActivityRepository,
} from '../domain/Activity.js';
import { assertLeadInOrganization } from './leadScopeGuard.js';

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

/**
 * Filtro `?date=`: date-only (`YYYY-MM-DD`) cobre o dia civil inteiro no fuso do usuário
 * (America/Sao_Paulo) — antes usava `setHours` no fuso do SERVIDOR, que em produção (UTC)
 * deslocava a janela em -3h e podia excluir/incluir atividades da borda do dia. Formatos
 * com hora/offset mantêm o comportamento anterior (dia do servidor).
 */
function activityDateFilter(dateStr: string): Prisma.ActivityWhereInput['date'] {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const { start, end } = civilDayRangeInZoneToUtcIso(trimmed);
    return { gte: new Date(start), lt: new Date(end) };
  }
  const searchDate = new Date(trimmed);
  return {
    gte: new Date(new Date(searchDate).setHours(0, 0, 0, 0)),
    lt: new Date(new Date(searchDate).setHours(23, 59, 59, 999)),
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
      where.date = activityDateFilter(dateStr);
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
      where.date = activityDateFilter(dateStr);
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
    // leadId precisa ser do mesmo tenant e não soft-deletado — sem isso a Activity gravava
    // com organizationId próprio mas o TimelineEvent (policy por lead do tenant) falhava,
    // derrubando a $transaction inteira com 500 ou deixando estado inconsistente.
    await assertLeadInOrganization(organizationId, data.leadId);
    // date-only (YYYY-MM-DD) é interpretada como dia civil no fuso do usuário, não UTC —
    // senão a atividade criada pela Agenda caía no dia anterior (off-by-one de fuso).
    const activityDate = new Date(normalizeActivityDateToUtcIso(data.date));
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
          description: `Atividade '${data.type}' agendada para ${activityDate.toLocaleDateString()}`,
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
    // deletedAt: null impede "ressuscitar"/atualizar atividade soft-deletada (ex.: snooze).
    const currentActivity = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!currentActivity) throw new Error('Activity not found');
    // Trocar o lead também exige lead do mesmo tenant (mesma brecha do create).
    if (data.leadId) await assertLeadInOrganization(organizationId, data.leadId);

    const updateData: Prisma.ActivityUpdateInput = { ...data } as Prisma.ActivityUpdateInput;
    if (data.date) updateData.date = new Date(normalizeActivityDateToUtcIso(data.date));
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

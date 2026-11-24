import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import {
  fromPrismaActivityStatus,
  fromPrismaActivityType,
  fromPrismaCompanyStatus,
  fromPrismaLeadStatus,
  toPrismaActivityStatus,
  toPrismaActivityType,
} from '../../../lib/enumMap.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import { type ActivityStatus, type ActivityType, activitySchema } from '../../../lib/zod.js';
import { automationEngine } from '../../automations/automation.engine.js';
import {
  civilDayRangeInZoneToUtcIso,
  normalizeActivityDateToUtcIso,
} from '../../crm/tasks/calendar.utils.js';
import type { ActivityListFilters } from '../domain/Activity.js';
import { assertRealOwner } from '../domain/ownerGuard.js';
import { assertLeadInOrganization } from '../infra/leadScopeGuard.js';

/**
 * Filtro `?date=`: date-only (`YYYY-MM-DD`) cobre o dia civil inteiro no fuso do usuário
 * (America/Sao_Paulo) — mesmo critério do PrismaActivityRepository (serviço legado precisa
 * se comportar igual, senão ferramentas de IA e a rota veem conjuntos diferentes).
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

export type { ActivityListFilters };

export class ActivityService {
  async findAll(
    organizationId: string,
    dateStr?: string,
    page: number = 1,
    limit: number = 50,
    filters: ActivityListFilters = {},
  ) {
    // deletedAt: null — alinhado ao PrismaActivityRepository: atividades soft-deletadas
    // não podem continuar aparecendo para os agentes de IA que usam este serviço legado.
    const where: Prisma.ActivityWhereInput = { organizationId, deletedAt: null };
    if (dateStr) {
      where.date = activityDateFilter(dateStr);
    }
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.status)
      where.status = toPrismaActivityStatus(
        filters.status,
      ) as unknown as Prisma.ActivityWhereInput['status'];
    if (filters.type)
      where.type = toPrismaActivityType(
        filters.type,
      ) as unknown as Prisma.ActivityWhereInput['type'];

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
      data: activities.map(serializeActivity),
      meta: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  /**
   * Atividades num intervalo fechado-aberto [from, to). O calendário carrega o mês inteiro de
   * uma vez — buscar dia a dia seriam ~35 requisições para montar uma grade.
   *
   * As datas chegam como ISO do frontend; `to` é exclusivo para o chamador poder passar o
   * primeiro instante do dia seguinte sem se preocupar com milissegundos de borda.
   */
  async findRange(organizationId: string, fromStr: string, toStr: string) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new Error('Intervalo de datas inválido.');
    }
    if (from >= to) throw new Error('A data inicial deve ser anterior à final.');

    const activities = await prisma.activity.findMany({
      where: { organizationId, deletedAt: null, date: { gte: from, lt: to } },
      include: { lead: { include: { company: true, contact: true } } },
      orderBy: { date: 'asc' },
    });
    return activities.map(serializeActivity);
  }

  async create(organizationId: string, data: z.infer<typeof activitySchema>) {
    const validated = activitySchema.parse(data);
    assertRealOwner(validated.owner);
    // Mesma regra do PrismaActivityRepository: lead precisa ser do tenant e não
    // soft-deletado, senão o TimelineEvent viola a policy de tenant (ou a Activity fica
    // gravada órfã quando o timeline falha depois — estado inconsistente).
    await assertLeadInOrganization(organizationId, validated.leadId);
    const activityDate = new Date(normalizeActivityDateToUtcIso(validated.date));
    // Activity + TimelineEvent na mesma transação (padrão do repositório) — antes eram dois
    // awaits soltos: se o timelineEvent falhasse, a Activity já estava gravada.
    // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
    const [activity] = await prisma.$transaction([
      prisma.activity.create({
        data: {
          ...validated,
          type: toPrismaActivityType(
            validated.type,
          ) as unknown as Prisma.ActivityCreateInput['type'],
          status: toPrismaActivityStatus(
            validated.status,
          ) as unknown as Prisma.ActivityCreateInput['status'],
          organizationId,
          date: activityDate,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          type: 'activity',
          description: `Atividade '${validated.type}' agendada para ${activityDate.toLocaleDateString()}`,
          leadId: validated.leadId,
        },
      }),
    ]);
    return serializeActivity(activity);
  }

  async update(organizationId: string, id: string, data: Partial<z.infer<typeof activitySchema>>) {
    // deletedAt: null — impede atualizar/"ressuscitar" atividade soft-deletada (mesmo
    // critério do PrismaActivityRepository.updateWithTimeline).
    const currentActivity = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!currentActivity) throw new Error('Activity not found');
    if (data.owner) assertRealOwner(data.owner);
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

    // organizationId também no `where` do update em si (mesmo padrão de PrismaLeadRepository)
    // — hardening, não corrige falha explorável (pré-check acima + RLS já bloqueiam).
    const statusChanged = !!data.status && updateData.status !== currentActivity.status;
    const activityUpdate = prisma.activity.update({
      where: { id, organizationId },
      data: updateData,
    });
    // Update + TimelineEvent na mesma transação (padrão do repositório) — antes o update
    // já estava gravado quando o timeline falhava, deixando status novo sem evento.
    let activity: Awaited<ReturnType<typeof prisma.activity.update>>;
    if (statusChanged) {
      // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
      const [updated] = await prisma.$transaction([
        activityUpdate,
        prisma.timelineEvent.create({
          data: {
            type: 'activity',
            description: `Status da atividade '${fromPrismaActivityType(currentActivity.type)}' alterado para '${data.status}'`,
            leadId: currentActivity.leadId,
          },
        }),
      ]);
      activity = updated;
    } else {
      // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
      [activity] = await prisma.$transaction([activityUpdate]);
    }

    if (statusChanged) {
      // Gatilho de automação. Sem await: automação é efeito colateral e não pode atrasar nem
      // derrubar a conclusão da atividade em si. Achado real (auditoria de release-readiness,
      // error-resilience): o catch engolia qualquer falha real do motor de automação (ex.: regra
      // mal configurada, erro de banco) sem log algum — logar aqui não atrasa a resposta (a
      // Promise já roda em paralelo, sem await) nem muda o comportamento best-effort.
      if (data.status === 'Concluída') {
        void automationEngine
          .handle({
            organizationId,
            trigger: 'Atividade concluída',
            entity: 'Activity',
            entityId: id,
            data: {
              type: fromPrismaActivityType(currentActivity.type),
              owner: currentActivity.owner,
              leadId: currentActivity.leadId,
            },
          })
          .catch((err) => {
            logger.error(
              { err, organizationId, activityId: id },
              'Falha ao disparar automação de "Atividade concluída" (best-effort, atividade já foi salva).',
            );
          });
      }
    }
    return serializeActivity(activity);
  }

  async delete(organizationId: string, id: string) {
    // Soft delete — mesmo padrão do PrismaActivityRepository.delete e da policy de
    // retenção/LGPD: a linha permanece para auditoria e some de todas as leituras
    // (findAll/findRange agora filtram deletedAt: null). Antes era hard delete, o que
    // divergia do repositório e apagava a trilha.
    const existing = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new Error('Activity not found');
    return prisma.activity.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }
}
export const activityService = new ActivityService();

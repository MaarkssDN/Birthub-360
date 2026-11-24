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
import { civilDayRangeUtc, parseActivityDate } from '../domain/activityDate.js';
import type { ActivityListFilters } from '../domain/Activity.js';
import { assertRealOwner } from '../domain/ownerGuard.js';
import { assertActivityLeadInTenant } from '../infra/leadOwnership.js';

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
    // deletedAt: null — este serviço alimenta tools de IA (opsTools/aiPendingAction) e antes
    // devolvia atividades soft-deletadas pelo repositório (handoff 45 item 3).
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
    // Mesmo guard do repositório: leadId cross-tenant/soft-deletado não pode ser gravado.
    await assertActivityLeadInTenant(organizationId, validated.leadId);
    const activityDate = parseActivityDate(validated.date);
    const activity = await prisma.activity.create({
      data: {
        ...validated,
        type: toPrismaActivityType(validated.type) as unknown as Prisma.ActivityCreateInput['type'],
        status: toPrismaActivityStatus(
          validated.status,
        ) as unknown as Prisma.ActivityCreateInput['status'],
        organizationId,
        date: activityDate,
      },
    });
    await prisma.timelineEvent.create({
      data: {
        type: 'activity',
        description: `Atividade '${validated.type}' agendada para ${activityDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        leadId: validated.leadId,
      },
    });
    return serializeActivity(activity);
  }

  async update(organizationId: string, id: string, data: Partial<z.infer<typeof activitySchema>>) {
    // deletedAt no pre-check: PUT não pode mais editar/"ressuscitar" atividade soft-deletada.
    const currentActivity = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!currentActivity) throw new Error('Activity not found');
    if (data.owner) assertRealOwner(data.owner);
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

    // organizationId também no `where` do update em si (mesmo padrão de PrismaLeadRepository)
    // — hardening, não corrige falha explorável (pré-check acima + RLS já bloqueiam).
    const activity = await prisma.activity.update({
      where: { id, organizationId },
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
    // Soft delete — mesmo comportamento do PrismaActivityRepository. O hard delete anterior
    // divergía do repositório e apagava a trilha que o soft delete (Onda 2, Agente 11) preserva.
    const existing = await prisma.activity.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new Error('Activity not found');
    return prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
export const activityService = new ActivityService();

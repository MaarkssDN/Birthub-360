import { prisma } from '../../../lib/prisma.js';
import type {
  ActivityHeatmapRawRow,
  AnalyticsRepository,
  ClosedLead,
  CohortLeadRow,
  FunnelStageData,
  GroupCount,
  RealtimeCockpitRawData,
  WonLeadHeatmapRawRow,
  UnifiedTimelineEntityType,
  UnifiedTimelineEvent,
  UnifiedTimelineOutcome,
  UnifiedTimelineQuery,
  UnifiedTimelineResult,
} from '../domain/Analytics.js';
import { CLOSED_STATUSES } from '../domain/Analytics.js';

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async countCompanies(organizationId: string): Promise<number> {
    return prisma.company.count({ where: { organizationId, deletedAt: null } });
  }

  async countContacts(organizationId: string): Promise<number> {
    return prisma.contact.count({ where: { organizationId, deletedAt: null } });
  }

  async countOpenLeads(organizationId: string): Promise<number> {
    return prisma.lead.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: CLOSED_STATUSES as unknown as never[] },
      },
    });
  }

  async countAllLeads(organizationId: string): Promise<number> {
    return prisma.lead.count({ where: { organizationId, deletedAt: null } });
  }

  async countActivities(organizationId: string): Promise<number> {
    return prisma.activity.count({ where: { organizationId, deletedAt: null } });
  }

  async countPendingActivities(organizationId: string): Promise<number> {
    return prisma.activity.count({
      where: { organizationId, deletedAt: null, status: 'Pendente' },
    });
  }

  async countOverdueActivities(organizationId: string, now: Date): Promise<number> {
    return prisma.activity.count({
      where: { organizationId, deletedAt: null, status: 'Pendente', date: { lt: now } },
    });
  }

  async countLeadsByStatusSince(
    organizationId: string,
    status: string,
    since: Date,
  ): Promise<number> {
    return prisma.lead.count({
      where: { organizationId, deletedAt: null, status: status as never, closedAt: { gte: since } },
    });
  }

  async countLeadsByStatus(organizationId: string, status: string): Promise<number> {
    return prisma.lead.count({
      where: { organizationId, deletedAt: null, status: status as never },
    });
  }

  async averageOpenLeadScore(organizationId: string): Promise<number | null> {
    const result = await prisma.lead.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: CLOSED_STATUSES as unknown as never[] },
        score: { not: null },
      },
      _avg: { score: true },
    });
    return result._avg?.score ?? null;
  }

  async sumOpenPipelineValue(organizationId: string): Promise<{ total: number; count: number }> {
    const where = {
      organizationId,
      deletedAt: null,
      status: { notIn: CLOSED_STATUSES as unknown as never[] },
      amount: { not: null },
    } as const;
    const [aggregate, count] = await Promise.all([
      prisma.lead.aggregate({ where, _sum: { amount: true } }),
      prisma.lead.count({ where }),
    ]);
    return { total: aggregate._sum?.amount ?? 0, count };
  }

  async sumWonRevenueSince(
    organizationId: string,
    since: Date,
  ): Promise<{ total: number; count: number }> {
    const where = {
      organizationId,
      deletedAt: null,
      status: 'Negocios_Ganhos' as never,
      closedAt: { gte: since },
      amount: { not: null },
    } as const;
    const [aggregate, count] = await Promise.all([
      prisma.lead.aggregate({ where, _sum: { amount: true } }),
      prisma.lead.count({ where }),
    ]);
    return { total: aggregate._sum?.amount ?? 0, count };
  }

  async sumAllWonRevenue(organizationId: string): Promise<{ total: number; count: number }> {
    const where = {
      organizationId,
      deletedAt: null,
      status: 'Negocios_Ganhos' as never,
      amount: { not: null },
    } as const;
    const [aggregate, count] = await Promise.all([
      prisma.lead.aggregate({ where, _sum: { amount: true } }),
      prisma.lead.count({ where }),
    ]);
    return { total: aggregate._sum?.amount ?? 0, count };
  }

  async groupLeadsByStatus(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.status, count: row._count._all }));
  }

  async groupFunnelWithAmounts(organizationId: string): Promise<FunnelStageData[]> {
    const rows = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: row._sum?.amount ?? 0,
    }));
  }

  async findLeadsCreatedSince(
    organizationId: string,
    since: Date,
  ): Promise<Array<{ createdAt: Date }>> {
    return prisma.lead.findMany({
      where: { organizationId, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    });
  }

  async findLeadsClosedSince(organizationId: string, since: Date): Promise<ClosedLead[]> {
    const rows = await prisma.lead.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['Negocios_Ganhos', 'Negocios_Perdidos'] },
        closedAt: { gte: since },
      },
      select: { closedAt: true, status: true },
    });
    return rows.map((row) => ({ closedAt: row.closedAt as Date, status: row.status }));
  }

  async groupLeadsByTemperature(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['temperature'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.temperature, count: row._count._all }));
  }

  async groupLeadsBySource(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.source, count: row._count._all }));
  }

  async groupLeadsByOwner(organizationId: string, status?: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['owner'],
      where: { organizationId, deletedAt: null, ...(status ? { status: status as never } : {}) },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.owner, count: row._count._all }));
  }

  async groupWonAmountByOwner(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['owner'],
      where: {
        organizationId,
        deletedAt: null,
        status: 'Negocios_Ganhos' as never,
        amount: { not: null },
      },
      _sum: { amount: true },
    });
    return rows.map((row) => ({ value: row.owner, count: row._sum?.amount ?? 0 }));
  }

  async groupActivitiesByType(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.activity.groupBy({
      by: ['type'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.type, count: row._count._all }));
  }

  async groupActivitiesByStatus(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.activity.groupBy({
      by: ['status'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.status, count: row._count._all }));
  }

  async groupQualifiedLeadsByOwner(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['owner'],
      where: {
        organizationId,
        deletedAt: null,
        status: {
          notIn: [
            'Lead_Recebido',
            'Cadencia_Iniciada',
            'Lead_Desqualificado',
          ] as unknown as never[],
        },
      },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.owner, count: row._count._all }));
  }

  async groupLostLeadsByReason(organizationId: string): Promise<GroupCount[]> {
    const rows = await prisma.lead.groupBy({
      by: ['lossReason'],
      where: {
        organizationId,
        deletedAt: null,
        status: {
          in: [
            'Negocios_Perdidos',
            'Lead_Desqualificado',
            'Piloto_Birthub360_Profile_Cancelado',
            'Piloto_Logistico_Cancelado',
          ] as unknown as never[],
        },
      },
      _count: { _all: true },
    });
    return rows.map((row) => ({ value: row.lossReason, count: row._count._all }));
  }

  async findCallActivityTimestamps(organizationId: string): Promise<Date[]> {
    const rows = await prisma.activity.findMany({
      where: { organizationId, deletedAt: null, type: 'Ligacao' },
      select: { createdAt: true },
    });
    return rows.map((row) => row.createdAt);
  }

  async findLeadsForCohort(organizationId: string, since: Date): Promise<CohortLeadRow[]> {
    const rows = await prisma.lead.findMany({
      where: { organizationId, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true, closedAt: true, status: true },
    });
    return rows.map((row) => ({
      createdAt: row.createdAt,
      closedAt: row.closedAt,
      status: row.status,
    }));
  }

  async calculateRealTmq(organizationId: string): Promise<number | null> {
    try {
      const historyRows = await prisma.leadStageHistory.findMany({
        where: {
          organizationId,
          stageName: { in: ['Qualificacao_SDR', 'Reuniao_Agendada', 'Nova_Oportunidade'] },
        },
        select: { leadId: true, enteredAt: true },
        orderBy: { enteredAt: 'asc' },
        take: 200,
      });

      if (historyRows.length === 0) return null;

      const leadIds = [...new Set(historyRows.map((h) => h.leadId))];
      const leads = await prisma.lead.findMany({
        where: { organizationId, id: { in: leadIds }, deletedAt: null },
        select: { id: true, createdAt: true },
      });
      const leadMap = new Map(leads.map((l) => [l.id, l.createdAt]));

      const DAY_MS = 24 * 60 * 60 * 1000;
      const durations: number[] = [];
      for (const h of historyRows) {
        const createdAt = leadMap.get(h.leadId);
        if (createdAt) {
          const diff = (h.enteredAt.getTime() - createdAt.getTime()) / DAY_MS;
          if (diff >= 0 && diff <= 180) durations.push(diff);
        }
      }

      if (durations.length === 0) return null;
      return Math.round((durations.reduce((sum, d) => sum + d, 0) / durations.length) * 100) / 100;
    } catch {
      return null;
    }
  }

  async findActivitiesForHeatmap(
    organizationId: string,
    since: Date,
  ): Promise<ActivityHeatmapRawRow[]> {
    const rows = await prisma.activity.findMany({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: since },
      },
      select: {
        type: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({
      type: r.type,
      createdAt: r.createdAt,
    }));
  }

  async findWonLeadsForHeatmap(
    organizationId: string,
    since: Date,
  ): Promise<WonLeadHeatmapRawRow[]> {
    const rows = await prisma.lead.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'Negocios_Ganhos' as never,
        closedAt: { gte: since },
      },
      select: {
        closedAt: true,
        amount: true,
      },
    });
    return rows.map((r) => ({
      closedAt: r.closedAt,
      amount: r.amount,
    }));
  }

  async getRealtimeCockpitData(
    organizationId: string,
    todayStart: Date,
    baselineStart: Date,
  ): Promise<RealtimeCockpitRawData> {
    const baselineDays = Math.max(
      1,
      Math.round((todayStart.getTime() - baselineStart.getTime()) / (24 * 60 * 60 * 1000)),
    );

    const [
      leadsToday,
      dealsWonToday,
      wonRevenueTodayAgg,
      activitiesToday,
      leadsBaseline,
      dealsWonBaseline,
      activitiesBaseline,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.lead.count({
        where: {
          organizationId,
          deletedAt: null,
          status: 'Negocios_Ganhos' as never,
          closedAt: { gte: todayStart },
        },
      }),
      prisma.lead.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: 'Negocios_Ganhos' as never,
          closedAt: { gte: todayStart },
        },
        _sum: { amount: true },
      }),
      prisma.activity.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.lead.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: baselineStart, lt: todayStart },
        },
      }),
      prisma.lead.count({
        where: {
          organizationId,
          deletedAt: null,
          status: 'Negocios_Ganhos' as never,
          closedAt: { gte: baselineStart, lt: todayStart },
        },
      }),
      prisma.activity.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: baselineStart, lt: todayStart },
        },
      }),
    ]);

    return {
      leadsToday,
      dealsWonToday,
      wonRevenueToday: wonRevenueTodayAgg._sum?.amount ?? 0,
      activitiesToday,
      leadsBaseline,
      dealsWonBaseline,
      activitiesBaseline,
      baselineDays,
    };
  }

  async getUnifiedTimeline(
    organizationId: string,
    query: UnifiedTimelineQuery = {},
  ): Promise<UnifiedTimelineResult> {
    const {
      period = '30d',
      entityType = 'all',
      outcome = 'all',
      search,
      page = 1,
      limit = 50,
    } = query;

    const now = new Date();
    let since: Date | undefined;
    if (period === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7d') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const fetchLimit = Math.min(Math.max(limit * 2, 100), 500);

    const shouldFetchActivities =
      entityType === 'all' ||
      entityType === 'call' ||
      entityType === 'email' ||
      entityType === 'whatsapp' ||
      entityType === 'lead';
    const shouldFetchVoice = entityType === 'all' || entityType === 'call';
    const shouldFetchWhatsApp = entityType === 'all' || entityType === 'whatsapp';
    const shouldFetchLeads = entityType === 'all' || entityType === 'lead' || entityType === 'deal';
    const shouldFetchCadence = entityType === 'all' || entityType === 'automation';

    const [activities, voiceCalls, whatsAppMsgs, leads, cadenceRuns] = await Promise.all([
      shouldFetchActivities
        ? prisma.activity.findMany({
            where: {
              organizationId,
              deletedAt: null,
              ...(since ? { date: { gte: since } } : {}),
            },
            include: {
              lead: {
                include: {
                  company: { select: { tradeName: true, legalName: true } },
                  contact: { select: { name: true } },
                },
              },
            },
            orderBy: { date: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchVoice
        ? prisma.voiceCallLog.findMany({
            where: {
              organizationId,
              ...(since ? { createdAt: { gte: since } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchWhatsApp
        ? prisma.whatsAppMessage.findMany({
            where: {
              organizationId,
              ...(since ? { receivedAt: { gte: since } } : {}),
            },
            include: {
              lead: { select: { id: true, title: true } },
              contact: { select: { id: true, name: true } },
            },
            orderBy: { receivedAt: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchLeads
        ? prisma.lead.findMany({
            where: {
              organizationId,
              deletedAt: null,
              ...(since ? { createdAt: { gte: since } } : {}),
            },
            include: {
              company: { select: { tradeName: true, legalName: true } },
              contact: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchCadence
        ? prisma.cadenceRun.findMany({
            where: {
              organizationId,
              ...(since ? { startedAt: { gte: since } } : {}),
            },
            include: {
              lead: {
                include: {
                  company: { select: { tradeName: true, legalName: true } },
                  contact: { select: { name: true } },
                },
              },
              sequence: { select: { name: true } },
            },
            orderBy: { startedAt: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
    ]);

    const events: UnifiedTimelineEvent[] = [];

    // Map activities
    for (const a of activities) {
      let resolvedType: UnifiedTimelineEntityType = 'lead';
      if (a.type === 'Ligacao') resolvedType = 'call';
      else if (a.type === 'WhatsApp') resolvedType = 'whatsapp';
      else if (a.type === 'Email') resolvedType = 'email';

      const resolvedOutcome: UnifiedTimelineOutcome =
        a.status === 'Concluida' ? 'success' : a.status === 'Cancelada' ? 'failed' : 'pending';

      const targetName =
        a.lead?.company?.tradeName ||
        a.lead?.company?.legalName ||
        a.lead?.contact?.name ||
        a.lead?.title ||
        'Lead';

      events.push({
        id: `act_${a.id}`,
        timestamp: a.date.toISOString(),
        entityType: resolvedType,
        title: `${a.type}: ${a.observations?.slice(0, 80) || targetName || 'Registro de atividade'}`,
        description: a.observations || undefined,
        actor: a.owner || 'Comercial',
        targetName,
        targetId: a.leadId,
        outcome: resolvedOutcome,
        metadata: { status: a.status, time: a.time },
      });
    }

    // Map voiceCallLog
    for (const v of voiceCalls) {
      const isSuccess =
        v.outcome?.toLowerCase().includes('sucesso') ||
        v.outcome?.toLowerCase().includes('completed');
      const isFailed =
        v.outcome?.toLowerCase().includes('falha') ||
        v.outcome?.toLowerCase().includes('busy') ||
        v.outcome?.toLowerCase().includes('no-answer');
      events.push({
        id: `voice_${v.id}`,
        timestamp: v.createdAt.toISOString(),
        entityType: 'call',
        title: `Ligação de Voz IA (${v.durationSeconds}s)`,
        description: v.summary || 'Síntese de inteligência de voz',
        actor: 'Copiloto de Voz IA',
        targetId: v.leadId || undefined,
        outcome: isSuccess ? 'success' : isFailed ? 'failed' : 'pending',
        metadata: { duration: v.durationSeconds, outcome: v.outcome },
      });
    }

    // Map WhatsApp
    for (const w of whatsAppMsgs) {
      const targetName = w.contact?.name || w.lead?.title || w.phoneE164;
      events.push({
        id: `wa_${w.id}`,
        timestamp: w.receivedAt.toISOString(),
        entityType: 'whatsapp',
        title: `WhatsApp ${w.direction?.toLowerCase() === 'outbound' ? 'Enviado' : 'Recebido'}`,
        description: w.body
          ? w.body.length > 100
            ? `${w.body.slice(0, 100)}...`
            : w.body
          : undefined,
        actor:
          w.direction?.toLowerCase() === 'outbound'
            ? 'Atendente / IA'
            : w.contact?.name || 'Cliente',
        targetName,
        targetId: w.leadId || w.contactId || undefined,
        outcome: 'success',
        metadata: { direction: w.direction },
      });
    }

    // Map Leads
    for (const l of leads) {
      const leadName =
        l.company?.tradeName || l.company?.legalName || l.contact?.name || l.title || 'Lead';

      events.push({
        id: `lead_created_${l.id}`,
        timestamp: l.createdAt.toISOString(),
        entityType: 'lead',
        title: `Lead Criado: ${leadName}`,
        description: l.company?.tradeName ? `Empresa: ${l.company.tradeName}` : undefined,
        actor: l.owner || 'Sistema',
        targetName: leadName,
        targetId: l.id,
        outcome: 'success',
      });

      if (l.status === 'Negocios_Ganhos' || l.status === 'Negocios_Perdidos') {
        const isWon = l.status === 'Negocios_Ganhos';
        events.push({
          id: `deal_closed_${l.id}`,
          timestamp: (l.closedAt || l.updatedAt || l.createdAt).toISOString(),
          entityType: 'deal',
          title: isWon ? `Negócio Ganho: ${leadName}` : `Negócio Fechado Perdido: ${leadName}`,
          description: l.amount
            ? `Valor R$ ${Number(l.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : undefined,
          actor: l.owner || 'Closer',
          targetName: leadName,
          targetId: l.id,
          outcome: isWon ? 'success' : 'failed',
          metadata: { amount: l.amount, status: l.status },
        });
      }
    }

    // Map Cadence Runs
    for (const c of cadenceRuns) {
      const targetName = c.lead
        ? c.lead.company?.tradeName ||
          c.lead.company?.legalName ||
          c.lead.contact?.name ||
          c.lead.title ||
          'Lead'
        : undefined;

      const outcomeVal: UnifiedTimelineOutcome =
        c.status === 'Completed' ? 'success' : c.status === 'Stopped' ? 'failed' : 'pending';

      events.push({
        id: `cad_${c.id}`,
        timestamp: c.startedAt.toISOString(),
        entityType: 'automation',
        title: `Automação de Cadência: ${c.sequence?.name || 'Fluxo SDR'}`,
        description: c.stopReason
          ? `Parada: ${c.stopReason}`
          : `Toque atual: ${c.currentTouchOrder}º contato`,
        actor: 'Motor de Cadência',
        targetName,
        targetId: c.leadId,
        outcome: outcomeVal,
        metadata: { currentTouch: c.currentTouchOrder, status: c.status },
      });
    }

    // In-memory filters
    let filtered = events;
    if (entityType !== 'all') {
      filtered = filtered.filter((e) => e.entityType === entityType);
    }
    if (outcome !== 'all') {
      filtered = filtered.filter((e) => e.outcome === outcome);
    }
    if (search && search.trim().length > 0) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.targetName?.toLowerCase().includes(term) ||
          e.actor.toLowerCase().includes(term),
      );
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const skip = (safePage - 1) * safeLimit;
    const pagedEvents = filtered.slice(skip, skip + safeLimit);

    return {
      events: pagedEvents,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }
}

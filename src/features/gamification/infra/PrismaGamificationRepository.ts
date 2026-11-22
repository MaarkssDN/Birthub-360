import { prisma } from '../../../lib/prisma.js';
import {
  calculateSellerLevel,
  calculateSellerPoints,
  evaluateBadges,
  type GamificationRepository,
  type SellerScore,
} from '../domain/Gamification.js';

const QUALIFIED_EXCLUDED = ['Lead_Recebido', 'Cadencia_Iniciada', 'Lead_Desqualificado'];

export class PrismaGamificationRepository implements GamificationRepository {
  async getLeaderboard(organizationId: string, since?: Date): Promise<SellerScore[]> {
    const activityDateFilter = since ? { date: { gte: since } } : {};
    const leadDateFilter = since ? { closedAt: { gte: since } } : {};

    const [callsByOwner, meetingsByOwner, qualifiedByOwner, wonByOwner] = await Promise.all([
      prisma.activity.groupBy({
        by: ['owner'],
        where: { organizationId, deletedAt: null, type: 'Ligacao', ...activityDateFilter },
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ['owner'],
        where: { organizationId, deletedAt: null, type: 'Reuniao', ...activityDateFilter },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['owner'],
        where: {
          organizationId,
          deletedAt: null,
          status: { notIn: QUALIFIED_EXCLUDED as unknown as never[] },
        },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['owner'],
        where: {
          organizationId,
          deletedAt: null,
          status: 'Negocios_Ganhos' as never,
          ...leadDateFilter,
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const owners = new Set<string>();
    for (const r of callsByOwner) if (r.owner) owners.add(r.owner);
    for (const r of meetingsByOwner) if (r.owner) owners.add(r.owner);
    for (const r of qualifiedByOwner) if (r.owner) owners.add(r.owner);
    for (const r of wonByOwner) if (r.owner) owners.add(r.owner);

    const callsMap = new Map(callsByOwner.map((r) => [r.owner ?? '', r._count._all]));
    const meetingsMap = new Map(meetingsByOwner.map((r) => [r.owner ?? '', r._count._all]));
    const qualifiedMap = new Map(qualifiedByOwner.map((r) => [r.owner ?? '', r._count._all]));
    const wonCountMap = new Map(wonByOwner.map((r) => [r.owner ?? '', r._count._all]));
    const wonAmountMap = new Map(wonByOwner.map((r) => [r.owner ?? '', r._sum?.amount ?? 0]));

    const scores: SellerScore[] = [];

    for (const owner of owners) {
      const callsCount = callsMap.get(owner) ?? 0;
      const meetingsCount = meetingsMap.get(owner) ?? 0;
      const qualifiedCount = qualifiedMap.get(owner) ?? 0;
      const dealsClosed = wonCountMap.get(owner) ?? 0;
      const wonRevenue = wonAmountMap.get(owner) ?? 0;

      const totalPoints = calculateSellerPoints({
        callsCount,
        meetingsCount,
        qualifiedCount,
        dealsClosed,
        wonRevenue,
      });

      const { level, title } = calculateSellerLevel(totalPoints);
      const badges = evaluateBadges({
        callsCount,
        meetingsCount,
        qualifiedCount,
        dealsClosed,
        wonRevenue,
      });

      scores.push({
        sellerName: owner,
        totalPoints,
        level,
        levelTitle: title,
        callsCount,
        meetingsCount,
        qualifiedCount,
        dealsClosed,
        wonRevenue,
        badges,
        streakDays: Math.min(Math.floor((callsCount + meetingsCount) / 3), 30),
      });
    }

    return scores.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async getSellerScore(
    organizationId: string,
    owner: string,
    since?: Date,
  ): Promise<SellerScore | null> {
    const leaderboard = await this.getLeaderboard(organizationId, since);
    return leaderboard.find((s) => s.sellerName.toLowerCase() === owner.toLowerCase()) ?? null;
  }
}

export const prismaGamificationRepository = new PrismaGamificationRepository();

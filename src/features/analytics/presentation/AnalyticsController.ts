import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';
import {
  type AnalyticsUseCases,
  buildCohortCsv,
  buildUnifiedTimelineCsv,
} from '../application/AnalyticsUseCases.js';

const MIN_MONTHS = 1;
const MAX_MONTHS = 24;
const DEFAULT_MONTHS = 6;

function parseMonths(raw: unknown): number {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (Number.isNaN(parsed)) return DEFAULT_MONTHS;
  return Math.min(Math.max(parsed, MIN_MONTHS), MAX_MONTHS);
}

function parseDays(raw: unknown, defaultDays = 30): number {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return defaultDays;
  return Math.min(parsed, 180);
}

export class AnalyticsController {
  constructor(private analyticsUseCases: AnalyticsUseCases) {}

  /**
   * GET /api/analytics
   * Consulta vazia bem-sucedida continua 200 com listas vazias.
   * Falha de agregação segue para o middleware de erro e não vira sucesso zerado.
   */
  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as AuthRequest).user?.organizationId;
      if (!orgId) {
        res
          .status(200)
          .json({ success: true, metrics: [], total: 0, data: { metrics: [], total: 0 } });
        return;
      }
      const result = await this.analyticsUseCases.getMetrics(orgId);
      res.status(200).json({
        success: true,
        metrics: result?.metrics ?? [],
        total: result?.total ?? 0,
        data: {
          metrics: result?.metrics ?? [],
          total: result?.total ?? 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const overview = await this.analyticsUseCases.overview(organizationId);
      res.json({ success: true, data: overview, metrics: [], total: 0 });
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const months = parseMonths(req.query.months);
      const dashboard = await this.analyticsUseCases.dashboard(organizationId, months);
      res.json({ success: true, data: dashboard, metrics: [], total: 0 });
    } catch (error) {
      next(error);
    }
  };

  getCohort = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const cohorts = await this.analyticsUseCases.cohortAnalysis(organizationId);
      res.json({ success: true, data: { cohorts } });
    } catch (error) {
      next(error);
    }
  };

  exportCohortCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const cohorts = await this.analyticsUseCases.cohortAnalysis(organizationId);
      const csv = buildCohortCsv(cohorts);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-cohort.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };

  getSalesSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const overview = await this.analyticsUseCases.overview(organizationId);
      res.json({
        success: true,
        data: {
          closedThisMonth: overview.closedThisMonth,
          wonRevenueThisMonth: overview.wonRevenueThisMonth,
          averageTicketThisMonth: overview.averageTicketThisMonth,
          totalWonRevenueEver: overview.totalWonRevenueEver,
          conversionRate: overview.conversionRate,
          pipelineValue: overview.pipelineValue,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/productivity-heatmap?days=30
   */
  getProductivityHeatmap = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const days = parseDays(req.query.days, 30);
      const heatmap = await this.analyticsUseCases.productivityHeatmap(organizationId, days);
      res.json({ success: true, data: heatmap });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/realtime-cockpit
   */
  getRealtimeCockpit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const metrics = await this.analyticsUseCases.realtimeCockpit(organizationId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/unified-timeline
   */
  getUnifiedTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const { period, entityType, outcome, search, page, limit } = req.query;

      const pageNum = page ? Number.parseInt(String(page), 10) : 1;
      const limitNum = limit ? Number.parseInt(String(limit), 10) : 50;

      const result = await this.analyticsUseCases.unifiedTimeline(organizationId, {
        period: (period as any) || '30d',
        entityType: (entityType as any) || 'all',
        outcome: (outcome as any) || 'all',
        search: search ? String(search) : undefined,
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 200) : 50,
      });

      res.json({
        success: true,
        data: result.events,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/unified-timeline/export
   */
  exportUnifiedTimeline = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const { period, entityType, outcome, search } = req.query;

      const result = await this.analyticsUseCases.unifiedTimeline(organizationId, {
        period: (period as any) || '30d',
        entityType: (entityType as any) || 'all',
        outcome: (outcome as any) || 'all',
        search: search ? String(search) : undefined,
        page: 1,
        limit: 1000,
      });

      const csv = buildUnifiedTimelineCsv(result.events);
      const dateStr = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="timeline-auditoria-${dateStr}.csv"`,
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };
}

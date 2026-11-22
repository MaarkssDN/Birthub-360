import { Router } from 'express';
import { auditAccessMiddleware } from '../../../lib/security/auditLog.middleware.js';
import { container } from '../../../shared/di/container.js';
import type { AnalyticsController } from '../presentation/AnalyticsController.js';

const router = Router();

function resolve(): AnalyticsController {
  return container.resolve<AnalyticsController>('AnalyticsController');
}

router.get('/', (req, res, next) => resolve().getMetrics(req, res, next));
router.get('/overview', (req, res, next) => resolve().getOverview(req, res, next));
router.get('/dashboard', (req, res, next) => resolve().getDashboard(req, res, next));
router.get('/sales-summary', (req, res, next) => resolve().getSalesSummary(req, res, next));
router.get('/cohort', (req, res, next) => resolve().getCohort(req, res, next));
// DEM-20261114-003 (follow-up Onda 2): exports de analytics são dump de métricas do tenant —
// mesma trilha de auditoria do export de leads (auditAccessMiddleware grava AuditLog/EXPORT).
router.get('/export/csv', auditAccessMiddleware('Analytics'), (req, res, next) =>
  resolve().exportCohortCsv(req, res, next),
);
router.get('/productivity-heatmap', (req, res, next) =>
  resolve().getProductivityHeatmap(req, res, next),
);
router.get('/realtime-cockpit', (req, res, next) => resolve().getRealtimeCockpit(req, res, next));
router.get('/unified-timeline', (req, res, next) => resolve().getUnifiedTimeline(req, res, next));
router.get('/unified-timeline/export', auditAccessMiddleware('Analytics'), (req, res, next) =>
  resolve().exportUnifiedTimeline(req, res, next),
);

export const analyticsRoutes = router;

/**
 * Settings por pilar — rotas HTTP.
 * Montado em /api/settings/pillars (authenticateToken + requireTenant em
 * bootstrap/routes.ts). GET: qualquer usuário autenticado do tenant.
 * PUT: ADMIN (mesmo padrão de organization-modules e settings.routes.ts).
 */

import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { routeParam } from '../../../shared/http/routeParams.js';
import {
  isPillarSlug,
  PillarSettingsValidationError,
} from '../domain/pillarSettings.js';
import {
  PillarSettingsServiceError,
  pillarSettingsService,
} from '../services/pillarSettings.service.js';

const router = Router();

function resolveSlug(req: Request): string {
  return routeParam(req.params.pillar, 'pillar');
}

function handle(fn: (authReq: AuthRequest, req: Request) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await fn(req as AuthRequest, req);
      res.json({ success: true, data });
    } catch (error: unknown) {
      if (
        error instanceof PillarSettingsServiceError ||
        error instanceof PillarSettingsValidationError
      ) {
        res.status(error instanceof PillarSettingsServiceError ? error.statusCode : 400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  };
}

function assertSlug(raw: string) {
  if (!isPillarSlug(raw)) {
    throw new PillarSettingsServiceError(`Pilar de settings desconhecido: ${raw}`, 404);
  }
  return raw;
}

router.get(
  '/:pillar',
  handle((authReq, req) =>
    pillarSettingsService.get(authReq.user.organizationId, assertSlug(resolveSlug(req))),
  ),
);

router.put(
  '/:pillar',
  requireRole(['ADMIN']),
  handle((authReq, req) =>
    pillarSettingsService.update(
      authReq.user.organizationId,
      authReq.user.id,
      assertSlug(resolveSlug(req)),
      (req.body as { values?: unknown } | undefined)?.values,
    ),
  ),
);

export const pillarSettingsRoutes = router;

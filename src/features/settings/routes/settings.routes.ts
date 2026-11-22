/**
 * Settings & Organization Preferences Routes — BirthHub 360
 * Clean Architecture Route Handler using DI Container
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { container } from '../../../shared/di/container.js';
import type { SettingsController } from '../presentation/SettingsController.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';

const router = Router();

function resolve(): SettingsController {
  return container.resolve<SettingsController>('SettingsController');
}

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  resolve().getSettings(req, res, next),
);

router.put('/', requireRole(['ADMIN']), (req: Request, res: Response, next: NextFunction) =>
  resolve().updateSettings(req, res, next),
);

export const settingsRoutes = router;

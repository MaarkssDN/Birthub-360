import { Router } from 'express';
import { container } from '../../../shared/di/container.js';
import { enforceAdminOnly } from '../../../lib/auth/rbac/enforcer.js';
import type { FeatureFlagsController } from '../presentation/FeatureFlagsController.js';

export const featureFlagsRouter = Router();

featureFlagsRouter.get('/', (req, res, next) =>
  container.resolve<FeatureFlagsController>('FeatureFlagsController').listResolved(req, res, next),
);

featureFlagsRouter.put('/:key', enforceAdminOnly(), (req, res, next) =>
  container.resolve<FeatureFlagsController>('FeatureFlagsController').setOverride(req, res, next),
);

featureFlagsRouter.delete('/:key', enforceAdminOnly(), (req, res, next) =>
  container.resolve<FeatureFlagsController>('FeatureFlagsController').clearOverride(req, res, next),
);

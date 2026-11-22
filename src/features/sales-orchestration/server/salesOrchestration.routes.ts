import { Router } from 'express';
import { SalesOrchestrationController } from './SalesOrchestrationController.js';

const router = Router();

router.get('/overview', SalesOrchestrationController.getOverview);

export const salesOrchestrationRoutes = router;

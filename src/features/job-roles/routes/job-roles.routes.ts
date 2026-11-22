import { Router } from 'express';
import { JobRoleController } from '../presentation/JobRoleController.js';

const router = Router();
const controller = new JobRoleController();

router.get('/catalog', (req, res, next) => controller.getCatalog(req, res, next));
router.post('/authorize', (req, res, next) => controller.authorize(req, res, next));

export const jobRolesRoutes = router;

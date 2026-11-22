import { Router } from 'express';
import { RoleplayController } from '../presentation/RoleplayController.js';

const router = Router();
const controller = new RoleplayController();

router.get('/personas', (req, res, next) => controller.getPersonas(req, res, next));
router.post('/sessions', (req, res, next) => controller.startSession(req, res, next));
router.post('/sessions/:id/messages', (req, res, next) => controller.sendTurn(req, res, next));
router.post('/sessions/:id/evaluate', (req, res, next) =>
  controller.evaluateSession(req, res, next),
);
router.get('/history', (req, res, next) => controller.getUserHistory(req, res, next));

export const roleplayRoutes = router;

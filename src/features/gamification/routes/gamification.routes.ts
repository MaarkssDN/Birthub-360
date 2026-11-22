import { Router } from 'express';
import { GamificationController } from '../presentation/GamificationController.js';

const router = Router();
const controller = new GamificationController();

router.get('/leaderboard', (req, res, next) => controller.getLeaderboard(req, res, next));
router.get('/profile', (req, res, next) => controller.getProfile(req, res, next));
router.get('/coaching', (req, res, next) => controller.getCoaching(req, res, next));
router.post('/coaching/weekly', (req, res, next) => controller.getWeeklyCoaching(req, res, next));

export const gamificationRoutes = router;

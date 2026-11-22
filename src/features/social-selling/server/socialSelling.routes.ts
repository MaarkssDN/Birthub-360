import { Router } from 'express';
import { SocialSellingController } from './SocialSellingController.js';

const router = Router();

router.post('/approach/generate', SocialSellingController.generateApproach);
// RN-SOC-02: vínculo de 1 clique da interação social à timeline do Lead no CRM.
router.post('/interactions', SocialSellingController.logInteraction);

export const socialSellingRoutes = router;

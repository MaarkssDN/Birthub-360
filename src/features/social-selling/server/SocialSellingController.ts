import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';
import type { LogSocialInteractionInput } from '../domain/socialSelling.types.js';
import { socialInteractionService } from './socialInteraction.service.js';
import { socialSellingApproachService } from './socialSellingApproach.service.js';

export class SocialSellingController {
  static async generateApproach(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const { organizationId, id: userId } = authReq.user;
      const { targetCompany, targetRole, segment, triggerEvent, channel, tone } = req.body || {};

      const result = await socialSellingApproachService.generateApproach(organizationId, userId, {
        targetCompany,
        targetRole,
        segment,
        triggerEvent,
        channel,
        tone,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * RN-SOC-02: registro de abordagem/interação social executada manualmente, gravando
   * TimelineEvent no Lead (vínculo com 1 clique). Rate limit anti-rajada por organização.
   */
  static async logInteraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const { organizationId } = authReq.user;
      const { leadId, kind, channel, summary } = (req.body || {}) as LogSocialInteractionInput;

      const result = await socialInteractionService.recordInteraction(organizationId, {
        leadId,
        kind,
        channel,
        summary,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

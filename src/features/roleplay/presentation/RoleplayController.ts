import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';
import { RoleplayUseCases } from '../application/RoleplayUseCases.js';

export class RoleplayController {
  constructor(private useCases = new RoleplayUseCases()) {}

  getPersonas = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const personas = await this.useCases.listPersonas();
      res.json({ success: true, data: personas });
    } catch (error) {
      next(error);
    }
  };

  startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, id: userId } = (req as AuthRequest).user;
      const { personaId } = req.body;
      if (!personaId) {
        res.status(400).json({ success: false, error: 'personaId é obrigatório' });
        return;
      }
      const data = await this.useCases.startSession(organizationId, userId, personaId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  sendTurn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const { id } = req.params;
      const { message } = req.body;
      if (!message) {
        res.status(400).json({ success: false, error: 'message é obrigatória' });
        return;
      }
      const data = await this.useCases.sendTurn(organizationId, id as string, message);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  evaluateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = (req as AuthRequest).user;
      const { id } = req.params;
      const data = await this.useCases.evaluateSession(organizationId, id as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getUserHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, id: userId } = (req as AuthRequest).user;
      const history = await this.useCases.getUserHistory(organizationId, userId);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };
}

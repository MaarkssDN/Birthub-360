// src/features/api-keys/apiKey.routes.ts
//
// CRUD de API keys do tenant (DEM-20261113-002 / MEL-07).
// Montado com authenticateToken + requireTenant + requireRole(['ADMIN']).
// A chave bruta só é retornada na resposta do POST — depois disso, irrecuperável.

import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../../shared/middlewares/authenticateToken.js';
import { createApiKey, listApiKeys, revokeApiKey } from './apiKey.service.js';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  expiresInDays: z.number().int().positive().max(3650).nullish(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const keys = await listApiKeys(user.organizationId);
    res.json({ success: true, keys });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Payload inválido.', issues: parsed.error.issues });
      return;
    }
    const { key, rawKey } = await createApiKey({
      organizationId: user.organizationId,
      createdByUserId: user.id,
      name: parsed.data.name,
      scopes: parsed.data.scopes,
      expiresInDays: parsed.data.expiresInDays ?? null,
    });
    res.status(201).json({ success: true, key, rawKey });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const revoked = await revokeApiKey(user.organizationId, String(req.params.id));
    if (!revoked) {
      res.status(404).json({ success: false, error: 'API key não encontrada ou já revogada.' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export const apiKeyRoutes = router;

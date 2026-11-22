// src/features/api-keys/apiKey.middleware.ts
//
// Autenticação por API key (DEM-20261113-002 / MEL-07).
// Aceita `Authorization: Bearer bhk_...` ou `x-api-key: bhk_...`.
// Em sucesso, popula req.user com um principal sintético do tenant para que
// requireTenant/getTenantPrisma funcionem sem mudança — role 'API' não passa
// em requireRole, então chaves só alcançam rotas que não exigem papel humano.
// Compor: app.use('/api/x', apiKeyAuth('escopo:opcional'), requireTenant, router)

import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../lib/logger.js';
import { requestContext } from '../../lib/async-context.js';
import type { AuthRequest } from '../../shared/middlewares/authenticateToken.js';
import { apiKeyMatchesScope, verifyApiKey } from './apiKey.service.js';

function extractRawKey(req: Request): string | null {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer bhk_')) return auth.slice('Bearer '.length).trim();
  return null;
}

export function apiKeyAuth(requiredScope?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = extractRawKey(req);
    if (!rawKey) {
      res.status(401).json({ success: false, error: 'API key ausente.' });
      return;
    }
    const key = await requestContext.run({ bypassRls: true }, () => verifyApiKey(rawKey));
    if (!key) {
      res.status(401).json({ success: false, error: 'API key inválida, revogada ou expirada.' });
      return;
    }
    if (requiredScope && !apiKeyMatchesScope(key, requiredScope)) {
      logger.warn({ apiKeyId: key.id, scope: requiredScope }, 'API key sem escopo suficiente');
      res.status(403).json({ success: false, error: 'API key sem permissão para este recurso.' });
      return;
    }
    const authReq = req as unknown as AuthRequest;
    authReq.user = {
      id: `apikey:${key.id}`,
      email: '',
      role: 'API',
      organizationId: key.organizationId,
    };
    next();
  };
}

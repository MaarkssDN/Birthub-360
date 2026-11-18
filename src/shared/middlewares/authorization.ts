import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../lib/logger.js';
import { getTenantPrisma } from '../../lib/tenant-prisma.js';
import type { AuthRequest } from './authenticateToken.js';
import { sendApiError } from './errorHandler.js';
// Nota de RBAC: este arquivo já teve `requirePermission`/`requireAnyPermission`, baseados num
// sistema de permissões (SUPER_ADMIN/TENANT_OWNER/.../GUEST) que nunca esteve conectado a nenhuma
// rota e divergia do papel realmente gravado no banco (User.role, ADMIN/GESTOR/CLOSER/SDR/
// VISUALIZADOR). Removidos na unificação de RBAC - usar `requireRole` (`./requireRole.js`), que é
// o middleware de autorização por papel efetivamente usado em todas as rotas, com fonte canônica
// em `src/lib/auth/authorization.ts`.

export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as unknown as AuthRequest;
  if (!authReq.user?.organizationId) {
    logger.warn({ userId: authReq.user?.id }, 'Access denied: Tenant ID missing');
    sendApiError(req, res, 403, 'User is not associated with any tenant/organization.');
    return;
  }
  try {
    authReq.db = getTenantPrisma(authReq.user.organizationId);
    next();
  } catch (err: any) {
    logger.error({ err }, 'Failed to set db instance');
    sendApiError(req, res, 500, 'Internal Server Error.');
  }
};

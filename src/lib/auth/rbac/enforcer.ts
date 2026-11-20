/**
 * Enforcer central de RBAC do Birth Hub 360° (Bloqueadores B-01 e B-02).
 *
 * Garante autorização hierárquica fail-closed única baseada na hierarquia canônica
 * definida em `src/lib/auth/authorization.ts` (ADMIN > GESTOR > CLOSER > SDR > VISUALIZADOR).
 *
 * Toda violação gera 403 Forbidden padronizado com envelope RFC-compatível.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  COMMERCIAL_INTELLIGENCE_ROLES,
  COPILOTO_IA_ROLES,
  hasRequiredRole,
  type Role,
} from '../authorization.js';

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ForbiddenErrorResponse {
  success: false;
  code: 'FORBIDDEN';
  error: string;
  requiredRoles: readonly string[];
  userRole?: string;
}

/**
 * Cria resposta 403 padronizada para tentativas de acesso não autorizadas.
 */
export function sendForbiddenResponse(
  res: Response,
  requiredRoles: readonly string[],
  userRole?: string,
): void {
  const payload: ForbiddenErrorResponse = {
    success: false,
    code: 'FORBIDDEN',
    error: `Acesso negado. Nível de permissão insuficiente. Necessário: [${requiredRoles.join(', ')}]. Seu cargo: ${userRole || 'ANÔNIMO'}.`,
    requiredRoles,
    userRole,
  };
  res.status(403).json(payload);
}

/**
 * Middleware central que valida se o usuário autenticado possui o papel requerido.
 * Fail-closed: se req.user estiver ausente ou role for desconhecido/menor, bloqueia.
 */
export function enforceRole(allowedRoles: readonly Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user || !authReq.user.role) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        error: 'Autenticação necessária para acessar este recurso.',
      });
      return;
    }

    if (!hasRequiredRole(authReq.user.role, allowedRoles)) {
      sendForbiddenResponse(res, allowedRoles, authReq.user.role);
      return;
    }

    next();
  };
}

/**
 * Middleware exclusivo para rotas administrativas críticas (B-01/B-02).
 * Exige papel ADMIN estrito.
 */
export const enforceAdminOnly = () => enforceRole(['ADMIN']);

/**
 * Middleware para rotas executivas / liderança comercial.
 * Exige GESTOR ou ADMIN.
 */
export const enforceGestorOrAbove = () => enforceRole(['ADMIN', 'GESTOR']);

/**
 * Middleware para Revenue Intelligence / Cockpit Executivo.
 */
export const enforceCommercialIntelligence = () =>
  enforceRole(COMMERCIAL_INTELLIGENCE_ROLES as readonly Role[]);

/**
 * Middleware para recursos avançados do Copiloto IA.
 */
export const enforceCopilotoIa = () =>
  enforceRole(COPILOTO_IA_ROLES as readonly Role[]);

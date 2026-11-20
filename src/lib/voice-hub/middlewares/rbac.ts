import type { Request, Response, NextFunction } from 'express';
import type { TokenPayload } from '../lib/auth-tokens.js';
import { voiceRoleForCanonicalRole } from '../repositories/roleRepository.js';
import { getPermissionsForRoleName } from '../repositories/roleRepository.js';

// Resolve a sessão efetiva do voice-hub a partir de QUALQUER uma das duas fontes legítimas:
//   1. `req.voiceHubUser`/`req.organizationId` — populados por attachAuthIfPresent
//      (src/lib/voice-hub/middlewares/index.ts) para sessão Better Auth ou API key;
//   2. `req.user` canônico — populado por `authenticateToken` (src/shared/middlewares/
//      authenticateToken.ts) quando o router é montado atrás dele, o padrão dos demais módulos.
// O `role` canônico (UserRole: ADMIN/GESTOR/...) é traduzido para o voice-role legado via
// voiceRoleForCanonicalRole — o restante do voice-hub continua falando 'admin'/'user'/
// 'supervisor' sem que isso seja persistido em lugar nenhum.
export function voiceHubSessionOf(req: Request): TokenPayload | null {
  if (req.voiceHubUser?.id && req.organizationId) {
    return req.voiceHubUser;
  }
  const canonical = (
    req as { user?: { id?: string; email?: string; role?: string; organizationId?: string } }
  ).user;
  if (canonical?.id && canonical.organizationId) {
    return {
      id: canonical.id,
      email: canonical.email ?? '',
      role: voiceRoleForCanonicalRole(canonical.role),
      organizationId: canonical.organizationId,
    };
  }
  return null;
}

// Normaliza req.voiceHubUser/req.organizationId a partir da sessão resolvida — idempotente,
// permite que requireTenant sirva de adaptador único para os controllers downstream.
function ensureVoiceHubSession(req: Request): TokenPayload | null {
  const session = voiceHubSessionOf(req);
  if (session) {
    req.voiceHubUser = session;
    req.organizationId = session.organizationId;
  }
  return session;
}

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  const session = ensureVoiceHubSession(req);
  if (!session || !req.organizationId || session.organizationId !== req.organizationId) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  return next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = ensureVoiceHubSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    if (!allowedRoles.includes(session.role)) {
      return res
        .status(403)
        .json({ error: `Acesso proibido. Requer nível: ${allowedRoles.join(' ou ')}.` });
    }

    return next();
  };
};

// Permission-based gate: checks whether the caller's role (resolved live, never trusted from a
// client-supplied claim) grants a named capability, instead of hardcoding a list of role names at
// every call site. See roleRepository.getPermissionsForRoleName for the resolution rule (voice-role
// defaults + JobRole capability grants), and
// .agents/handoffs/onda-4/11-para-01-supervisor-role-rbac.md for why this replaces role-name
// allowlists such as the old `ROLES_ALLOWED_TO_INTERVENE`.
export async function hasPermission(
  user: { id?: string; role: string; organizationId: string } | null | undefined,
  permission: string,
): Promise<boolean> {
  if (!user?.role || !user.organizationId) return false;
  const permissions = await getPermissionsForRoleName(user.role, user.organizationId, user.id);
  return permissions.includes(permission);
}

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = ensureVoiceHubSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    // Returning the promise is harmless for Express (the return value is ignored) and lets
    // callers/tests await this middleware deterministically instead of racing the async check.
    return hasPermission(session, permission)
      .then((allowed) => {
        if (!allowed) {
          return res
            .status(403)
            .json({ error: `Acesso proibido. Requer a permissão: ${permission}.` });
        }
        return next();
      })
      .catch(next);
  };
};

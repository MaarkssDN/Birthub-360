import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../../lib/auth.js';
import { requestContext } from '../../../lib/async-context.js';
import { logger } from '../../../lib/logger.js';
import { getPermissionsForRoleName } from '../repositories/roleRepository.js';
import { voiceHubSessionOf } from '../middlewares/rbac.js';

// Auth do voice-hub — ADAPTADA ao Better Auth canônico (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1).
//
// REMOVIDOS: register/login/refresh com JWT próprio (cookies access_token/refresh_token,
// registerSchema/loginSchema, AuthError). Cadastro e login agora são exclusivamente do Better
// Auth (/api/auth/*) — o hook de criação de Organization/User vive em src/lib/auth.ts e o
// voice-hub NUNCA cria tenants.
//
// Mantidos: /auth/me (introspecção da sessão + permissões de voz resolvidas live) e
// /auth/logout (signOut do Better Auth).

// GET /auth/me — sessão introspection endpoint. Resolves the httpOnly session cookie (or bearer
// token) via voiceHubSessionOf (req.voiceHubUser populado por attachAuthIfPresent/requireTenant,
// ou req.user canônico do authenticateToken). Also resolves the caller's effective permission set
// live (never trusted from a client claim) so the frontend can decide what to show (e.g. the
// LiveSupervisor "intervene" control) without a hardcoded role-name allowlist — UX-only; every
// permission-gated action is still enforced server-side (requirePermission/hasPermission).
export async function meHandler(req: Request, res: Response) {
  const session = voiceHubSessionOf(req);
  if (!session) return res.json({ user: null });
  const permissions = await getPermissionsForRoleName(
    session.role,
    session.organizationId,
    session.id,
  );
  return res.json({ user: { ...session, permissions } });
}

// POST /auth/logout — encerra a sessão Better Auth (remove o registro Session e expira o cookie
// de sessão no client). signOut toca a tabela Session que tem FORCE RLS — roda sob bypassRls,
// mesmo padrão de authenticateToken para operações de identidade pré-tenant.
export async function logoutHandler(req: Request, res: Response) {
  try {
    await requestContext.run({ bypassRls: true }, () =>
      auth.api.signOut({ headers: fromNodeHeaders(req.headers) }),
    );
  } catch (err) {
    // Logout é best-effort: mesmo que a sessão já tenha expirado ou o signOut falhe, o client
    // deve poder limpar o estado local — logado para observabilidade, nunca bloqueia a resposta.
    logger.warn({ err }, 'voice-hub logout: signOut falhou');
  }
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('logged_in');
  return res.json({ success: true, message: 'Logout realizado com sucesso' });
}

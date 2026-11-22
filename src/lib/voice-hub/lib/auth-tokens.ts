// Voice-hub session identity — CANONICAL adaptation (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1).
//
// O JWT próprio do voice-hub (access/refresh tokens HS256, bcrypt próprio, cookies
// access_token/refresh_token) foi REMOVIDO: a autenticação canônica é o Better Auth
// (src/lib/auth.ts + src/shared/middlewares/authenticateToken.ts), que emite sessão por cookie
// assinado e já popula `requestContext` com o tenantId da sessão. Este arquivo resta apenas como
// o TIPO da sessão resolvida que os middlewares/controllers do voice-hub consomem
// (req.voiceHubUser) — `role` aqui é o VOICE-ROLE ('admin'|'user'|'supervisor'), derivado do
// UserRole canônico via roleRepository.voiceRoleForCanonicalRole, nunca persistido.

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

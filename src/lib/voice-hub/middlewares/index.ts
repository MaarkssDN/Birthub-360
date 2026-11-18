import type express from 'express';
import { Redis } from 'ioredis';
import { fromNodeHeaders } from 'better-auth/node';
import type { TokenPayload } from '../lib/auth-tokens.js';
import { requestContext } from '../../../lib/async-context.js';
import { auth } from '../../../lib/auth.js';
import { authenticateApiKey, isApiKeyFormat } from '../services/apiKeyService.js';
import { voiceRoleForCanonicalRole } from '../repositories/roleRepository.js';
import { getRedisUrl, getRedisRetryStrategy } from '../lib/env.js';
import { logger } from '../../../lib/logger.js';

// Autenticação do voice-hub — ADAPTADA ao modelo canônico (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1):
//
// O JWT próprio do voice-hub (cookies access_token/refresh_token, verifyToken/refreshSession,
// registro de tenants via POST /auth/register) foi REMOVIDO. A autenticação agora é:
//   1. `authenticateToken` canônico (src/shared/middlewares) quando o router é montado atrás
//      dele — ele já popula req.user e requestContext.run({ tenantId, userId, role });
//   2. sessão Better Auth resolvida aqui via auth.api.getSession (mount standalone / rotas que
//      não passam pelo authenticateToken) — SEMPRE sob requestContext.run({ bypassRls: true })
//      na busca da sessão (mesmo padrão de authenticateToken: Session/User têm FORCE RLS);
//   3. API key do tenant (Bearer bvhk_live_*) — inalterado, canonical APIKey model.
//
// requestContext.run({ tenantId }) é populado em volta do handler sempre que ESTA middleware
// estabelecer a autenticação — sem isso as policies tenant_isolation das tabelas de voz
// (migration 20260925000000_voice_hub_rls) ficam em fail-closed e bloqueiam tudo.

export const csrfProtection = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // Requests authenticated via a Bearer token in the Authorization header — rather than the
    // ambient session cookie — are not exploitable via CSRF: a malicious page cannot attach an
    // arbitrary Authorization header to a cross-site request, and cors() already restricts which
    // origins may read the response of a JS-initiated cross-origin request. This unblocks
    // legitimate server-to-server callers authenticated this way (e.g. the Birth Hub 360 CRM calling
    // POST /api/voice/outbound with its own bearer token, which never sends an Origin header)
    // without weakening protection for the cookie-authenticated browser path below.
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const origin = req.headers.origin;
    const host = req.headers.host;

    if (!origin) {
      // Same-site requests without credentials (e.g. plain HTML form posts) legitimately omit
      // Origin in some browsers, but in production we require it for mutation requests since
      // this is our only CSRF signal — outside production, tooling (tests, curl, etc.) may not send it.
      if (isProduction) {
        return res.status(403).json({ error: 'Validação de origem de segurança (CSRF) falhou.' });
      }
      return next();
    }

    if (host) {
      try {
        const parsedOrigin = new URL(origin).host;
        if (parsedOrigin !== host) {
          return res.status(403).json({ error: 'Validação de origem de segurança (CSRF) falhou.' });
        }
      } catch {
        return res.status(403).json({ error: 'Validação de origem de segurança (CSRF) falhou.' });
      }
    }
  }
  return next();
};

// Redis-backed per-API-key rate limiter, applied to every request authenticated via an API key
// (see the `req.apiKeyId` check in attachAuthIfPresent below). Reuses the same increment+expire
// sliding-window pattern already used for the IP-based limiters in server.ts (Agente 00's file,
// not importable here — its limiter factory is a local closure, not exported), rather than
// inventing a different rate-limiting mechanism for this one call site. A Redis outage fails open
// (never blocks an otherwise-valid authenticated request) — same tradeoff server.ts's limiters make.
const API_KEY_RATE_LIMIT = 120;
const API_KEY_RATE_WINDOW_SECONDS = 60;
const rateLimitRedis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  commandTimeout: 2000,
  retryStrategy: getRedisRetryStrategy(),
});
rateLimitRedis.on('error', (err) => logger.error({ err }, 'API key rate limiter Redis error'));

async function isApiKeyRateLimited(apiKeyId: string): Promise<boolean> {
  const key = `ratelimit:apikey:${apiKeyId}`;
  try {
    const current = await rateLimitRedis.incr(key);
    if (current === 1) {
      await rateLimitRedis.expire(key, API_KEY_RATE_WINDOW_SECONDS);
    }
    return current > API_KEY_RATE_LIMIT;
  } catch {
    return false;
  }
}

interface CanonicalSessionUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

// Normaliza qualquer usuário canônico (req.user do authenticateToken ou session.user do Better
// Auth) para o TokenPayload do voice-hub — `role` vira voice-role via voiceRoleForCanonicalRole.
function toVoiceHubSession(user: CanonicalSessionUser): TokenPayload {
  return {
    id: user.id,
    email: user.email,
    role: voiceRoleForCanonicalRole(user.role),
    organizationId: user.organizationId,
  };
}

export async function getAuthUser(
  req: express.Request,
  res?: express.Response,
): Promise<TokenPayload | null> {
  void res; // assinatura preservada para compatibilidade — não há mais refresh de token próprio
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : undefined;

  // Alternative authentication path: a Bearer token shaped like a tenant API key is resolved
  // against APIKey.keyHash instead of the session flow below — canonical APIKey model, live DB
  // read on every request (revogação imediata). Nunca cai no fluxo de sessão com a mesma string.
  if (bearerToken && isApiKeyFormat(bearerToken)) {
    const result = await authenticateApiKey(bearerToken);
    if (!result) return null;
    req.apiKeyId = result.apiKeyId;
    return result.session;
  }

  // Caminho canônico primário: authenticateToken já rodou upstream e populou req.user.
  const canonicalUser = (req as { user?: CanonicalSessionUser }).user;
  if (canonicalUser?.id && canonicalUser.organizationId) {
    return toVoiceHubSession(canonicalUser);
  }

  // Fallback: mount standalone (sem authenticateToken) — resolve a sessão Better Auth
  // diretamente. bypassRls é obrigatório aqui: getSession localiza Session/User antes de
  // qualquer tenantId ser conhecido e essas tabelas têm FORCE ROW LEVEL SECURITY (mesmo
  // padrão documentado em src/shared/middlewares/authenticateToken.ts).
  try {
    const session = await requestContext.run({ bypassRls: true }, () =>
      auth.api.getSession({ headers: fromNodeHeaders(req.headers) }),
    );
    const user = session?.user as CanonicalSessionUser | undefined;
    if (user?.id && user.organizationId) {
      return toVoiceHubSession(user);
    }
  } catch (err) {
    logger.error({ err }, 'voice-hub getAuthUser: falha ao resolver sessão Better Auth');
  }

  return null;
}

export const attachAuthIfPresent = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const session = await getAuthUser(req, res);
  if (session) {
    // req.user canônico (AuthUser) e req.voiceHubUser (TokenPayload) coexistem: quando
    // authenticateToken rodou upstream, req.user já é o usuário canônico e NÃO é sobrescrito —
    // voiceHubUser é a visão normalizada que os controllers do voice-hub consomem (handoff
    // .agents/handoffs/onda-2/24-para-12-voicehub-attachauth-sobrescreve-req-user.md — Agente 24:
    // sobrescrever req.user com o TokenPayload de voice-role violava o contrato canônico e
    // quebrava qualquer consumidor downstream que esperasse AuthUser).
    req.voiceHubUser = session;
    req.organizationId = session.organizationId;

    // requestContext.run({ tenantId }) em volta do handler — exigência do handoff do Agente 01:
    // sem tenantId no contexto, as policies tenant_isolation das tabelas de voz ficam
    // fail-closed. Se authenticateToken já populou o contexto upstream (tenantId presente),
    // next() direto preserva a store existente — enterWith/run aqui só cobre o caso em que a
    // autenticação foi estabelecida por ESTA middleware (API key ou getSession direto).
    const store = requestContext.getStore();
    if (!store?.tenantId || store.tenantId !== session.organizationId) {
      // requestContext.run devolve o retorno do callback — a promise de
      // isApiKeyRateLimitedIfNeeded é retornada (não `void`) para que o await do caller e o
      // contexto AsyncLocalStorage cubram todo o downstream, incluindo o next().
      return requestContext.run(
        { tenantId: session.organizationId, userId: session.id, role: session.role },
        () => isApiKeyRateLimitedIfNeeded(req, res, next),
      );
    }
  }

  return isApiKeyRateLimitedIfNeeded(req, res, next);
};

// Rate limit por API key — extraído para poder rodar dentro do requestContext.run quando
// necessário. Só se aplica a requests autenticadas via API key (req.apiKeyId setado em
// getAuthUser); requests JWT/sessão não são afetadas e seguem sob os limiters por IP do server.ts.
async function isApiKeyRateLimitedIfNeeded(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (req.apiKeyId) {
    const limited = await isApiKeyRateLimited(req.apiKeyId);
    if (limited) {
      return res.status(429).json({
        error: 'Limite de requisições excedido para esta chave de API. Tente novamente em breve.',
      });
    }
  }

  return next();
}

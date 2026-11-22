import { TokenPayload } from '../lib/auth-tokens.js';

declare global {
  namespace Express {
    interface Request {
      voiceHubUser?: TokenPayload;
      // Não-opcional no tipo porque todo router do voice-hub passa por requireTenant
      // (src/lib/voice-hub/middlewares/rbac.ts), que rejeita 401 sem sessão — ou seja, todo
      // handler que lê req.organizationId já tem a garantia em runtime. Antes era `?: string`
      // e cada call site precisava de `!`/guard redundante.
      organizationId: string;
      // Set only when this request was authenticated via an API key (as opposed to the JWT
      // cookie/Bearer flow) — see src/middlewares/index.ts#getAuthUser and
      // src/services/apiKeyService.ts#authenticateApiKey. Drives the per-key rate limit in
      // attachAuthIfPresent; absent (undefined) for JWT-authenticated requests.
      apiKeyId?: string;
    }
  }
}

/**
 * POS3-96-SESSIONS-COOKIES (Onda 4, Agente 96 — Nera): decisão única do atributo `Secure`
 * dos cookies de sessão do Better Auth.
 *
 * Antes desta extração, `src/lib/auth.ts` calculava a mesma condição duas vezes
 * (`advanced.useSecureCookies` e `advanced.defaultCookieAttributes.secure`) a partir de
 * `SECURE_COOKIES === 'true' || BETTER_AUTH_URL?.startsWith('https://')` — fail-OPEN: em
 * produção sem essas duas variáveis, o cookie de sessão saía sem `Secure` e sem o prefixo
 * `__Secure-` (ver handoff onda-3 `96-para-00-cookie-secure-producao.md`).
 *
 * Regra agora (fail-closed):
 *  - `NODE_ENV=production` → `Secure` OBRIGATÓRIO, não configurável para baixo. Uma sessão
 *    transmitida sem `Secure` pode ser lida por qualquer hop HTTP no caminho; se o deploy
 *    for realmente servido em HTTP puro, o correto é terminar TLS na borda (o browser sempre
 *    vê HTTPS) — não emitir cookie de sessão em claro.
 *  - Fora de produção → `Secure` quando `SECURE_COOKIES=true` ou `BETTER_AUTH_URL` é https
 *    (dev local em HTTP continua funcionando).
 */
export function resolveSecureCookiesEnabled(
  source: {
    NODE_ENV?: string;
    SECURE_COOKIES?: string;
    BETTER_AUTH_URL?: string;
  } = process.env,
): boolean {
  if (source.NODE_ENV === 'production') return true;
  return (
    source.SECURE_COOKIES === 'true' || source.BETTER_AUTH_URL?.startsWith('https://') === true
  );
}

import { assertSafeOutboundUrl } from './ssrfGuard.js';

/**
 * Validador SSRF para Webhooks e URLs de integração de saída.
 *
 * Delega para `assertSafeOutboundUrl` (src/lib/security/ssrfGuard.ts): esquema HTTPS
 * (HTTP tolerado apenas fora de produção), bloqueio de host literal interno/reservado e
 * resolução DNS validando TODOS os endereços do host. O antigo bypass de NODE_ENV
 * development/test foi removido — a política de IP privado/reservado vale em todo ambiente;
 * apenas o esquema `http:` continua tolerado fora de produção (convenção do projeto para
 * receptores de webhook locais, ver isSafePublicUrl em src/lib/voice-hub/validators).
 *
 * NOTA: esta função valida a URL no momento da chamada. Callers que fazem `fetch` cru logo
 * depois mantêm uma janela residual de DNS rebinding entre a validação e a conexão — para
 * esses casos o ideal é `safeFetch`/`assertSafeExternalUrl` de src/shared/security/urlGuard.ts
 * (fetch com pinning de DNS). Registrado como limitação conhecida no relatório MEL-13.
 */
export async function validateWebhookUrl(targetUrl: string): Promise<boolean> {
  await assertSafeOutboundUrl(targetUrl);
  return true;
}

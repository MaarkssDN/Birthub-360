import { createHmac } from 'node:crypto';

/**
 * Hash HMAC-SHA256 do IP do titular, com sal vindo de env (PUBLIC_LEAD_IP_HASH_SECRET).
 * Nunca devolve o IP em claro. Sem IP ou sem segredo, não há hash (nada é persistido).
 */
export function hashClientIp(ip: string | undefined, secret: string | undefined): string | null {
  const trimmedIp = ip?.trim() ?? '';
  const trimmedSecret = secret?.trim() ?? '';
  if (!trimmedIp || !trimmedSecret) return null;
  return createHmac('sha256', trimmedSecret).update(trimmedIp).digest('hex');
}

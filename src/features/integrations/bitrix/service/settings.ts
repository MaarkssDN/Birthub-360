import { prisma } from '../../../../lib/prisma.js';
import { env } from '../../../../config/env.js';

export interface BitrixSettings {
  webhookUrl: string | null;
  enabled: boolean;
}

/**
 * DEBT-0006: o webhook global via env só pode ser usado por organizações
 * explicitamente listadas em BITRIX24_WEBHOOK_URL_ORG_ALLOWLIST. Antes o fallback
 * valia para qualquer tenant sem BitrixConnection — uma org podia acabar
 * sincronizando contra o portal Bitrix de outra (ou do operador). Allowlist vazia
 * ou ausente = fallback desligado (fail-closed).
 */
export function resolveGlobalBitrixWebhookUrl(organizationId: string): string | null {
  const url = env.BITRIX24_WEBHOOK_URL;
  if (!url) return null;
  const allowlist = (env.BITRIX24_WEBHOOK_URL_ORG_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return allowlist.includes(organizationId) ? url : null;
}

export async function getBitrixSettings(organizationId: string): Promise<BitrixSettings> {
  const connection = await prisma.bitrixConnection.findFirst({
    where: { organizationId },
    select: { webhookUrl: true },
    orderBy: { createdAt: 'desc' },
  });

  const webhookUrl = connection?.webhookUrl || resolveGlobalBitrixWebhookUrl(organizationId);

  return {
    webhookUrl,
    enabled: Boolean(webhookUrl),
  };
}

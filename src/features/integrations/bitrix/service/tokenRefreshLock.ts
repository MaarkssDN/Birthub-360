import { logger } from '../../../../lib/logger.js';
import { acquireDistributedLock } from '../../../../lib/queue/distributedLock.js';
import { AppError } from '../../../../shared/middlewares/errorHandler.js';

export interface BitrixOAuthTokenState {
  accessToken: string;
  refreshToken: string;
  /** Epoch em ms quando o accessToken expira. */
  expiresAtMs: number;
}

export interface RefreshBitrixTokenOptions {
  organizationId: string;
  connectionId: string;
  /** TTL da trava distribuída no Redis em segundos. Padrão: 30s */
  lockTtlSeconds?: number;
  /** Margem de segurança antes do vencimento para considerar o token ainda válido. Padrão: 60_000 ms */
  skewMs?: number;
  /** Lê o estado atual dos tokens persistidos para a conexão do tenant. */
  loadTokens: () => Promise<BitrixOAuthTokenState>;
  /** Executa a chamada OAuth de refresh no portal Bitrix24 e persiste o novo par de tokens. */
  performRefresh: (currentRefreshToken: string) => Promise<BitrixOAuthTokenState>;
}

export interface RefreshBitrixTokenResult {
  tokens: BitrixOAuthTokenState;
  /** `true` quando este processo adquiriu o lock e renovou; `false` quando reaproveitou token já válido/renovado. */
  refreshed: boolean;
}

export function buildBitrixTokenRefreshLockKey(
  organizationId: string,
  connectionId: string,
): string {
  return `lock:bitrix:token-refresh:${organizationId}:${connectionId}`;
}

function isTokenStillFresh(state: BitrixOAuthTokenState, skewMs: number): boolean {
  return Boolean(state.accessToken) && state.expiresAtMs - Date.now() > skewMs;
}

/**
 * Coordena a renovação concorrente de tokens OAuth2 do Bitrix24 com lock atômico distribuído no
 * Redis (`acquireDistributedLock`, `SET key runId NX EX ttl` + liberação compare-and-delete via Lua).
 *
 * Sem este lock, dois workers/processos que detectem expiração simultaneamente disparam `oauth/token`
 * com o mesmo `refresh_token`: o primeiro invalida o `refresh_token` no Bitrix24 e o segundo recebe
 * `invalid_grant`, desautenticando a integração da organização (Agente 51 — Bela).
 */
export async function refreshBitrixTokenWithLock(
  options: RefreshBitrixTokenOptions,
): Promise<RefreshBitrixTokenResult> {
  const lockTtlSeconds = options.lockTtlSeconds ?? 30;
  const skewMs = options.skewMs ?? 60_000;
  const lockKey = buildBitrixTokenRefreshLockKey(options.organizationId, options.connectionId);

  const initial = await options.loadTokens();
  if (isTokenStillFresh(initial, skewMs)) {
    return { tokens: initial, refreshed: false };
  }

  const lock = await acquireDistributedLock(lockKey, lockTtlSeconds);

  if (!lock.acquired) {
    if (lock.reason === 'redis-unavailable') {
      throw new AppError(
        'Serviço de coordenação de credenciais temporariamente indisponível (fail-closed).',
        503,
      );
    }

    // Outra réplica detém a trava e está renovando agora — releitura verifica se já concluiu.
    const afterContention = await options.loadTokens();
    if (
      isTokenStillFresh(afterContention, skewMs) ||
      afterContention.accessToken !== initial.accessToken
    ) {
      logger.info(
        {
          organizationId: options.organizationId,
          connectionId: options.connectionId,
        },
        '[bitrix] Renovação concorrente concluída por outra réplica — reaproveitando token renovado',
      );
      return { tokens: afterContention, refreshed: false };
    }

    throw new AppError(
      'Renovação de credenciais Bitrix24 já está em andamento para esta conexão.',
      409,
    );
  }

  try {
    // Double-check após adquirir a trava: outra réplica pode ter acabado de renovar imediatamente
    // antes de liberar o lock.
    const latest = await options.loadTokens();
    if (isTokenStillFresh(latest, skewMs)) {
      return { tokens: latest, refreshed: false };
    }

    const updated = await options.performRefresh(latest.refreshToken);
    logger.info(
      {
        organizationId: options.organizationId,
        connectionId: options.connectionId,
        runId: lock.runId,
      },
      '[bitrix] Token Bitrix24 renovado sob lock distribuído',
    );
    return { tokens: updated, refreshed: true };
  } finally {
    await lock.release();
  }
}

/**
 * JWT Refresh Token Rotation (RTR) & Client Fingerprint Session Service
 * Bloqueador B-03: Rotação de Refresh Token e validação de impressão digital do cliente.
 * Squad 90 — Nera (Autenticação, Sessões e OAuth)
 *
 * Em caso de tentativa de reuso de um Refresh Token já consumido (indicativo de interceptação ou roubo),
 * toda a família de sessões do usuário é imediatamente revogada por segurança.
 *
 * ATENÇÃO (auditoria Onda 3, Agente 96): este serviço é IN-MEMORY (Map em processo) e, na baseline
 * auditada, NÃO está conectado a nenhuma rota de produção — o login/sessão real é o Better Auth
 * (src/lib/auth.ts, sessões persistidas em banco). Não use este serviço como store de sessão de
 * produção sem antes persistir tokens/famílias e compartilhar estado entre instâncias; em
 * multi-instância, rotação em uma instância é invisível para as demais.
 */

import { createHash, randomUUID } from 'node:crypto';
import { logger } from '../logger.js';

export interface RefreshTokenRecord {
  tokenId: string;
  familyId: string;
  userId: string;
  organizationId: string;
  clientFingerprint: string;
  used: boolean;
  revoked: boolean;
  expiresAt: number;
}

export class TokenReuseDetectedError extends Error {
  public readonly familyId: string;
  public readonly userId: string;

  constructor(familyId: string, userId: string) {
    super(
      `Segurança B-03: Tentativa de reuso de Refresh Token detectada. Toda a família de sessões '${familyId}' foi imediatamente revogada.`,
    );
    this.name = 'TokenReuseDetectedError';
    this.familyId = familyId;
    this.userId = userId;
  }
}

export class FingerprintMismatchError extends Error {
  constructor() {
    super('Segurança B-03: Impressão digital do cliente incompatível com a sessão original.');
    this.name = 'FingerprintMismatchError';
  }
}

export class SessionService {
  // Map de tokenId -> RefreshTokenRecord
  private tokens = new Map<string, RefreshTokenRecord>();
  // Map de familyId -> Set de tokenIds pertencentes à família
  private families = new Map<string, Set<string>>();
  // Set de famílias revogadas
  private revokedFamilies = new Set<string>();
  // Throttle da varredura de tokens expirados (ver sweepExpired) — evita O(n) a cada operação.
  private lastSweepAt = 0;
  private static readonly SWEEP_INTERVAL_MS = 60_000;

  public static generateFingerprint(userAgent: string, ipAddress: string): string {
    return createHash('sha256').update(`${userAgent}::${ipAddress}`).digest('hex');
  }

  /**
   * Cria uma nova sessão inicial com uma nova família de tokens.
   */
  public createSession(
    userId: string,
    organizationId: string,
    clientFingerprint: string,
    ttlSeconds: number = 7 * 24 * 3600, // 7 dias
  ): { accessToken: string; refreshToken: string; familyId: string } {
    if (!userId || !organizationId || !clientFingerprint) {
      throw new Error(
        'SessionService: userId, organizationId e clientFingerprint são obrigatórios.',
      );
    }
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('SessionService: ttlSeconds deve ser um número positivo.');
    }

    this.maybeSweepExpired();

    const familyId = randomUUID();
    const refreshToken = randomUUID();
    const accessToken = `act_${randomUUID()}`;

    const record: RefreshTokenRecord = {
      tokenId: refreshToken,
      familyId,
      userId,
      organizationId,
      clientFingerprint,
      used: false,
      revoked: false,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    this.tokens.set(refreshToken, record);
    this.families.set(familyId, new Set([refreshToken]));

    logger.info(
      { userId, organizationId, familyId },
      'SessionService: Nova sessão criada com família de tokens inicializada.',
    );

    return { accessToken, refreshToken, familyId };
  }

  /**
   * Executa a rotação de refresh token com detecção estrita de reuso.
   */
  public rotateRefreshToken(
    providedRefreshToken: string,
    currentFingerprint: string,
    ttlSeconds: number = 7 * 24 * 3600,
  ): { accessToken: string; refreshToken: string; familyId: string } {
    this.maybeSweepExpired();

    const record = this.tokens.get(providedRefreshToken);

    if (!record) {
      throw new Error('Refresh Token inválido ou não encontrado.');
    }

    // Se o token já expirou
    if (Date.now() > record.expiresAt) {
      throw new Error('Refresh Token expirado.');
    }

    // Se a família já foi revogada anteriormente
    if (this.revokedFamilies.has(record.familyId) || record.revoked) {
      throw new Error('Sessão revogada.');
    }

    // DETECÇÃO CRÍTICA DE REUSO (B-03): Token já havia sido consumido antes!
    if (record.used) {
      logger.error(
        { familyId: record.familyId, userId: record.userId, tokenId: record.tokenId },
        'ALERTA DE SEGURANÇA: Reuso de Refresh Token detectado! Revogando toda a família de sessões.',
      );
      this.revokeFamily(record.familyId);
      throw new TokenReuseDetectedError(record.familyId, record.userId);
    }

    // VALIDAÇÃO DE FINGERPRINT DO CLIENTE
    if (record.clientFingerprint !== currentFingerprint) {
      logger.warn(
        { familyId: record.familyId, userId: record.userId },
        'ALERTA: Fingerprint mismatch no refresh de token.',
      );
      throw new FingerprintMismatchError();
    }

    // Marca o token anterior como CONSUMIDO (used = true)
    record.used = true;

    // Emite o novo refresh token na mesma família
    const newRefreshToken = randomUUID();
    const newAccessToken = `act_${randomUUID()}`;

    const newRecord: RefreshTokenRecord = {
      tokenId: newRefreshToken,
      familyId: record.familyId,
      userId: record.userId,
      organizationId: record.organizationId,
      clientFingerprint: currentFingerprint,
      used: false,
      revoked: false,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    this.tokens.set(newRefreshToken, newRecord);
    this.families.get(record.familyId)?.add(newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      familyId: record.familyId,
    };
  }

  /**
   * Revoga imediatamente todos os tokens vinculados à família especificada.
   */
  public revokeFamily(familyId: string): void {
    this.revokedFamilies.add(familyId);
    const tokenIds = this.families.get(familyId);
    if (tokenIds) {
      for (const id of tokenIds) {
        const token = this.tokens.get(id);
        if (token) {
          token.revoked = true;
        }
      }
    }
  }

  public isFamilyRevoked(familyId: string): boolean {
    return this.revokedFamilies.has(familyId);
  }

  /**
   * Remove tokens expirados dos Maps em memória. Sem isto, `tokens`/`families`/
   * `revokedFamilies` cresciam sem limite em um processo longevo (cada refresh emite um token
   * novo e o antigo, já `used`, nunca era removido) — memory leak em serviço de longa duração.
   * Seguro: um token expirado já é rejeitado por `rotateRefreshToken` antes desta limpeza, e uma
   * família sem nenhum token restante não pode mais ser rotacionada, então a marca de revogação
   * dela pode sair junto.
   */
  public sweepExpired(): void {
    const now = Date.now();
    for (const [tokenId, record] of this.tokens) {
      if (record.expiresAt <= now) {
        this.tokens.delete(tokenId);
        this.families.get(record.familyId)?.delete(tokenId);
      }
    }
    for (const [familyId, tokenIds] of this.families) {
      if (tokenIds.size === 0) {
        this.families.delete(familyId);
        this.revokedFamilies.delete(familyId);
      }
    }
    this.lastSweepAt = now;
  }

  private maybeSweepExpired(): void {
    if (Date.now() - this.lastSweepAt >= SessionService.SWEEP_INTERVAL_MS) {
      this.sweepExpired();
    }
  }

  public reset(): void {
    this.tokens.clear();
    this.families.clear();
    this.revokedFamilies.clear();
    this.lastSweepAt = 0;
  }
}

export const sessionService = new SessionService();

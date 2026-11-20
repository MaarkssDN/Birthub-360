/**
 * JWT Refresh Token Rotation (RTR) & Client Fingerprint Session Service
 * Bloqueador B-03: Rotação de Refresh Token e validação de impressão digital do cliente.
 * Squad 90 — Nera (Autenticação, Sessões e OAuth)
 *
 * Em caso de tentativa de reuso de um Refresh Token já consumido (indicativo de interceptação ou roubo),
 * toda a família de sessões do usuário é imediatamente revogada por segurança.
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

  public reset(): void {
    this.tokens.clear();
    this.families.clear();
    this.revokedFamilies.clear();
  }
}

export const sessionService = new SessionService();

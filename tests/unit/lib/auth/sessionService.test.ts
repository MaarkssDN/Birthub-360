import { beforeEach, describe, expect, it } from 'vitest';
import {
  FingerprintMismatchError,
  SessionService,
  TokenReuseDetectedError,
} from '../../../../src/lib/auth/session.service.js';

describe('Session Service: Refresh Token Rotation (RTR) & Fingerprinting (B-03 Nera)', () => {
  let sessionService: SessionService;
  const fpOriginal = SessionService.generateFingerprint('Mozilla/5.0 (Windows NT 10.0)', '192.168.1.100');
  const fpAttacker = SessionService.generateFingerprint('curl/7.68.0', '10.0.0.50');

  beforeEach(() => {
    sessionService = new SessionService();
  });

  it('rotates refresh token normally when valid token and fingerprint are supplied', () => {
    const session = sessionService.createSession('user-1', 'org-1', fpOriginal);
    expect(session.refreshToken).toBeDefined();

    const rotated = sessionService.rotateRefreshToken(session.refreshToken, fpOriginal);
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(session.refreshToken);
    expect(rotated.familyId).toBe(session.familyId);
  });

  it('revokes entire token family when a consumed (used) refresh token is presented again (theft detection)', () => {
    const session = sessionService.createSession('user-1', 'org-1', fpOriginal);

    // Legitimate user rotates token: session.refreshToken becomes used, rotated1 is issued
    const rotated1 = sessionService.rotateRefreshToken(session.refreshToken, fpOriginal);

    // Attacker tries to reuse the old session.refreshToken (token reuse attack)
    expect(() => {
      sessionService.rotateRefreshToken(session.refreshToken, fpOriginal);
    }).toThrow(TokenReuseDetectedError);

    // Whole family is revoked: even the new legitimate token rotated1 is now invalid
    expect(() => {
      sessionService.rotateRefreshToken(rotated1.refreshToken, fpOriginal);
    }).toThrow('Sessão revogada.');

    expect(sessionService.isFamilyRevoked(session.familyId)).toBe(true);
  });

  it('rejects refresh when client fingerprint does not match original session', () => {
    const session = sessionService.createSession('user-2', 'org-1', fpOriginal);

    expect(() => {
      sessionService.rotateRefreshToken(session.refreshToken, fpAttacker);
    }).toThrow(FingerprintMismatchError);
  });
});

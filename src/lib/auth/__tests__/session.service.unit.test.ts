import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FingerprintMismatchError,
  SessionService,
  TokenReuseDetectedError,
} from '../session.service.js';

// Testes do Agente 96 (Nera) — Onda 3. Complementam tests/unit/lib/auth/sessionService.test.ts
// (que cobre RTR/reuso/fingerprint) com os casos de borda corrigidos nesta onda: expiração,
// validação de entrada, fingerprint que NÃO consome o token, e a varredura de expirados
// (memory leak em Maps in-memory).

describe('SessionService — casos de borda (Onda 3, Agente 96)', () => {
  let service: SessionService;
  const fp = SessionService.generateFingerprint('UA-Test', '10.0.0.1');
  const fpOther = SessionService.generateFingerprint('UA-Outro', '10.0.0.2');

  beforeEach(() => {
    service = new SessionService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejeita refresh token expirado', () => {
    const session = service.createSession('u1', 'org1', fp, 30); // 30s
    // Avanço < SWEEP_INTERVAL_MS (60s): o token expirou mas a varredura ainda não rodou,
    // então a rejeição vem da checagem de expiresAt ("expirado"), não do sweep ("inválido").
    vi.setSystemTime(Date.now() + 45_000);
    expect(() => service.rotateRefreshToken(session.refreshToken, fp)).toThrow(
      'Refresh Token expirado.',
    );
  });

  it('rejeita token de família já revogada mesmo com fingerprint correto', () => {
    const session = service.createSession('u1', 'org1', fp);
    service.revokeFamily(session.familyId);
    expect(() => service.rotateRefreshToken(session.refreshToken, fp)).toThrow(
      'Sessão revogada.',
    );
  });

  it('fingerprint divergente NÃO consome o token — dono legítimo ainda consegue rotacionar', () => {
    const session = service.createSession('u1', 'org1', fp);
    expect(() => service.rotateRefreshToken(session.refreshToken, fpOther)).toThrow(
      FingerprintMismatchError,
    );
    // O token continua válido para o fingerprint original (não foi marcado used).
    const rotated = service.rotateRefreshToken(session.refreshToken, fp);
    expect(rotated.familyId).toBe(session.familyId);
  });

  it('reuso de token consumido revoga a família inteira (detecção B-03)', () => {
    const session = service.createSession('u1', 'org1', fp);
    const rotated = service.rotateRefreshToken(session.refreshToken, fp);
    expect(() => service.rotateRefreshToken(session.refreshToken, fp)).toThrow(
      TokenReuseDetectedError,
    );
    expect(service.isFamilyRevoked(session.familyId)).toBe(true);
    expect(() => service.rotateRefreshToken(rotated.refreshToken, fp)).toThrow(
      'Sessão revogada.',
    );
  });

  it('createSession valida entradas obrigatórias e ttl', () => {
    expect(() => service.createSession('', 'org1', fp)).toThrow();
    expect(() => service.createSession('u1', '', fp)).toThrow();
    expect(() => service.createSession('u1', 'org1', '')).toThrow();
    expect(() => service.createSession('u1', 'org1', fp, 0)).toThrow();
    expect(() => service.createSession('u1', 'org1', fp, -5)).toThrow();
    expect(() => service.createSession('u1', 'org1', fp, Number.NaN)).toThrow();
  });

  it('sweepExpired remove tokens expirados e libera a família vazia', () => {
    const session = service.createSession('u1', 'org1', fp, 60);
    service.revokeFamily(session.familyId); // família revogada + token expirado depois
    vi.setSystemTime(Date.now() + 61_000);

    service.sweepExpired();

    // Token expirado some do store: agora é "inválido", não "expirado".
    expect(() => service.rotateRefreshToken(session.refreshToken, fp)).toThrow(
      'Refresh Token inválido ou não encontrado.',
    );
  });

  it('sweepExpired não remove tokens ainda válidos nem famílias ativas', () => {
    const session = service.createSession('u1', 'org1', fp, 3600);
    vi.setSystemTime(Date.now() + 30_000); // ainda dentro do ttl
    service.sweepExpired();
    const rotated = service.rotateRefreshToken(session.refreshToken, fp);
    expect(rotated.familyId).toBe(session.familyId);
    expect(service.isFamilyRevoked(session.familyId)).toBe(false);
  });
});

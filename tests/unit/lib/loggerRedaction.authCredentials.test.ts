// @vitest-environment node
/**
 * Agente 15 — Onda 0: Mascaramento estrito de tokens e credenciais em logs de autenticação.
 * Valida que credenciais, Bearer tokens, refresh tokens e headers aninhados de erro
 * são mascarados com [REDACTED] sem vazamento de dados sensíveis.
 */
import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { LOGGER_REDACT_PATHS } from '../../../src/lib/logger.js';

function captureLog() {
  let output = '';
  const dest = new Writable({
    write(chunk, _enc, cb) {
      output += chunk.toString();
      cb();
    },
  });
  const log = pino({ redact: { paths: LOGGER_REDACT_PATHS, censor: '[REDACTED]' } }, dest);
  return { log, read: () => JSON.parse(output) as Record<string, unknown>, raw: () => output };
}

describe('Agente 15: Logger Redaction — Autenticação e Tokens (Onda 0)', () => {
  it('garante que campos críticos de auth constam em LOGGER_REDACT_PATHS', () => {
    const required = [
      'token',
      'accessToken',
      'refreshToken',
      'credential',
      'credentials',
      'bearerToken',
      'idToken',
      'privateKey',
      'client_secret',
      'access_token',
      'refresh_token',
    ];

    for (const field of required) {
      expect(LOGGER_REDACT_PATHS, `Falta campo no topo: ${field}`).toContain(field);
      expect(LOGGER_REDACT_PATHS, `Falta campo aninhado: *.${field}`).toContain(`*.${field}`);
    }
  });

  it('redige tokens, senhas e headers authorization em caso de falha de login', () => {
    const { log, read, raw } = captureLog();

    log.error(
      {
        context: 'auth_failure',
        email: 'user@example.com',
        credential: 'raw-secret-credential-value',
        credentials: { secret: 'nested-secret-payload' },
        bearerToken: 'eyJh...super-secret-bearer-token',
        idToken: 'eyJh...raw-id-token',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvg...',
        err: {
          message: 'Invalid credentials provided',
          config: {
            headers: {
              authorization: 'Bearer jwt-token-in-error-config',
            },
          },
        },
      },
      'Tentativa de autenticação falhou',
    );

    const parsed = read();
    expect(parsed.context).toBe('auth_failure');
    expect(parsed.credential).toBe('[REDACTED]');
    expect(parsed.bearerToken).toBe('[REDACTED]');
    expect(parsed.idToken).toBe('[REDACTED]');
    expect(parsed.privateKey).toBe('[REDACTED]');

    // Garante que nenhuma string sensível permaneceu na saída crua
    const rawOutput = raw();
    expect(rawOutput).not.toContain('raw-secret-credential-value');
    expect(rawOutput).not.toContain('super-secret-bearer-token');
    expect(rawOutput).not.toContain('jwt-token-in-error-config');
  });
});

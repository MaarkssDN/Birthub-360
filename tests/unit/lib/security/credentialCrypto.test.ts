import { describe, it, expect, afterEach } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '@/config/env.js';
import {
  encryptCredential,
  decryptCredential,
  encryptCredentialSync,
  decryptCredentialSync,
  maskSecret,
  redactHeaders,
  sanitizeObjectForLogging,
} from '@/lib/security/credentialCrypto.js';

describe('credentialCrypto — Criptografia e Sanitização Padronizada', () => {
  const keyA = randomBytes(32).toString('base64');
  const keyB = randomBytes(32).toString('base64');
  const sampleSecret = 'dummy-secret-credential-sample-1234567890';

  const savedKey = env.CREDENTIALS_ENCRYPTION_KEY;
  const savedPreviousKey = env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS;

  afterEach(() => {
    env.CREDENTIALS_ENCRYPTION_KEY = savedKey;
    env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = savedPreviousKey;
  });

  function keyIdOf(rawKey: string): string {
    return createHash('sha256')
      .update(Buffer.from(rawKey, 'base64'))
      .digest('hex')
      .slice(0, 12);
  }

  it('criptografa e decriptografa com sucesso com chave AES-256-GCM', async () => {
    const cipher = await encryptCredential(sampleSecret, keyA);
    expect(cipher).toMatch(
      new RegExp(`^enc:v1:${keyIdOf(keyA)}:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$`),
    );

    const decrypted = await decryptCredential(cipher, keyA);
    expect(decrypted).toBe(sampleSecret);
  });

  it('envelope keyed embute o keyId da chave que cifrou (versionamento)', () => {
    const cipher = encryptCredentialSync(sampleSecret, keyA);
    const keyId = cipher.split(':')[2];
    expect(keyId).toBe(keyIdOf(keyA));
    expect(keyId).not.toBe(keyIdOf(keyB));
  });

  it('rotação com grace period: chave anterior em env decripta envelope v2 antigo', async () => {
    // Cenário pós-rotação: CREDENTIALS_ENCRYPTION_KEY = chave nova (keyB),
    // CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = chave antiga (keyA).
    env.CREDENTIALS_ENCRYPTION_KEY = keyB;
    env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = keyA;

    // Credencial gravada ANTES da rotação, cifrada com keyA.
    const cipherOld = encryptCredentialSync(sampleSecret, keyA);

    // Sem argumentos de chave: resolve via env — keyId do envelope seleciona keyA.
    expect(decryptCredentialSync(cipherOld)).toBe(sampleSecret);

    // Credencial gravada DEPOIS da rotação usa keyB e também decripta.
    const cipherNew = encryptCredentialSync(sampleSecret);
    expect(decryptCredentialSync(cipherNew)).toBe(sampleSecret);
  });

  it('após remoção da chave anterior, envelope cifrado com ela falha fail-closed', () => {
    env.CREDENTIALS_ENCRYPTION_KEY = keyB;
    env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = keyA;
    const cipherOld = encryptCredentialSync(sampleSecret, keyA);
    expect(decryptCredentialSync(cipherOld)).toBe(sampleSecret);

    // Grace period encerrado: chave antiga removida do env.
    env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = undefined;
    expect(() => decryptCredentialSync(cipherOld)).toThrow(
      'Falha na autenticação/decriptografia da credencial',
    );
  });

  it('envelope v1 legado (sem keyId) continua decriptável via chave anterior do env', () => {
    env.CREDENTIALS_ENCRYPTION_KEY = keyB;
    env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = keyA;

    // Simula ciphertext gravado antes do versionamento: remove o segmento keyId
    // do envelope keyed e mantém o prefixo enc:v1: com 3 segmentos (iv:tag:ct).
    const keyed = encryptCredentialSync(sampleSecret, keyA);
    const parts = keyed.split(':');
    const v1 = `enc:v1:${parts.slice(3).join(':')}`;
    expect(v1.split(':')).toHaveLength(5); // 'enc','v1',iv,tag,ct

    expect(decryptCredentialSync(v1)).toBe(sampleSecret);
  });

  it('suporta operações síncronas de criptografia e decriptografia', () => {
    const cipher = encryptCredentialSync(sampleSecret, keyA);
    const decrypted = decryptCredentialSync(cipher, keyA);
    expect(decrypted).toBe(sampleSecret);
  });

  it('rejeita decriptografia com chave errada e dispara erro fail-closed sem vazar segredo', async () => {
    const cipher = await encryptCredential(sampleSecret, keyA);
    await expect(decryptCredential(cipher, keyB)).rejects.toThrow(
      'Falha na autenticação/decriptografia da credencial. Chave incorreta ou dado adulterado.',
    );
  });

  it('suporta dual-key fallback na decriptografia para rotação transparente', async () => {
    // Gravado originalmente com chave antiga keyA
    const cipherOld = await encryptCredential(sampleSecret, keyA);

    // Decriptando em sistema onde a nova chave é keyB, mas keyA é fornecida como fallback
    const decrypted = await decryptCredential(cipherOld, keyB, keyA);
    expect(decrypted).toBe(sampleSecret);
  });

  it('preserva valores legados em texto puro para migração progressiva', async () => {
    const legacyPlain = 'legacy-unencrypted-webhook-token';
    const result = await decryptCredential(legacyPlain, keyA);
    expect(result).toBe(legacyPlain);
  });

  it('mascara segredos com maskSecret de forma segura', () => {
    expect(maskSecret('super-secret-hubspot-token', 4)).toBe('supe****oken');
    expect(maskSecret('curto', 4)).toBe('****');
    expect(maskSecret('')).toBe('[VAZIO]');
    expect(maskSecret(null)).toBe('[VAZIO]');
  });

  it('redige cabeçalhos confidenciais via redactHeaders', () => {
    const headers = {
      'content-type': 'application/json',
      authorization: 'Bearer super-secret-token',
      'x-api-key': 'key_12345',
      'x-custom-id': 'client-99',
    };

    const redacted = redactHeaders(headers);
    expect(redacted['content-type']).toBe('application/json');
    expect(redacted['authorization']).toBe('[REDACTED]');
    expect(redacted['x-api-key']).toBe('[REDACTED]');
    expect(redacted['x-custom-id']).toBe('client-99');
  });

  it('sanitiza objetos recursivos com sanitizeObjectForLogging', () => {
    const payload = {
      user: 'admin',
      credentials: {
        accessToken: 'hubspot-secret-token-xyz',
        refreshToken: 'refresh-secret-token-abc',
        expiresIn: 3600,
      },
      metadata: {
        apiUrl: 'https://api.hubapi.com',
      },
    };

    const sanitized = sanitizeObjectForLogging(payload);
    expect(sanitized.user).toBe('admin');
    expect(sanitized.credentials.accessToken).toBe('hubs****-xyz');
    expect(sanitized.credentials.refreshToken).toBe('refr****-abc');
    expect(sanitized.credentials.expiresIn).toBe(3600);
    expect(sanitized.metadata.apiUrl).toBe('https://api.hubapi.com');
  });
});

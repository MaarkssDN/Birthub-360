import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test' as string,
  CREDENTIALS_ENCRYPTION_KEY: undefined as string | undefined,
  CREDENTIALS_ENCRYPTION_KEY_PREVIOUS: undefined as string | undefined,
}));

vi.mock('@/config/env', () => ({ env: mockEnv }));

import {
  _resetKeyCacheForTests,
  DECRYPTION_FAILED_MARKER,
  decryptField,
  encryptField,
  tryDecryptField,
} from '@/lib/crypto/secretFields';

beforeEach(() => {
  mockEnv.NODE_ENV = 'test';
  mockEnv.CREDENTIALS_ENCRYPTION_KEY = undefined;
  mockEnv.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = undefined;
  _resetKeyCacheForTests();
});

describe('secretFields — criptografia de credenciais de integrações em repouso', () => {
  it('encrypt/decrypt roundtrip devolve o texto original', () => {
    const plaintext = 'https://example.bitrix24.com.br/rest/1/supersecrettoken/';
    const encrypted = encryptField(plaintext);

    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptField(encrypted)).toBe(plaintext);
  });

  it('duas cifragens do mesmo texto produzem ciphertexts diferentes (IV aleatório por valor)', () => {
    const a = encryptField('same-secret');
    const b = encryptField('same-secret');

    expect(a).not.toBe(b);
    expect(decryptField(a)).toBe('same-secret');
    expect(decryptField(b)).toBe('same-secret');
  });

  it('valor legado sem prefixo enc:v1: passa direto (compatibilidade com dados gravados antes desta cifra)', () => {
    expect(decryptField('https://legacy-plaintext.bitrix24.com.br/rest/1/token/')).toBe(
      'https://legacy-plaintext.bitrix24.com.br/rest/1/token/',
    );
  });

  it('ciphertext adulterado falha ao decifrar (fail-closed — nunca devolve lixo/vazio como se fosse válido)', () => {
    const encrypted = encryptField('secret-value');
    const tampered = `${encrypted.slice(0, -4)}XXXX`;

    expect(() => decryptField(tampered)).toThrow(/Falha ao decifrar/);
  });

  it('chave diferente entre cifrar e decifrar falha ao decifrar', () => {
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
    const encrypted = encryptField('secret-value');

    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString('base64');

    expect(() => decryptField(encrypted)).toThrow(/Falha ao decifrar/);
  });

  it('em produção, sem CREDENTIALS_ENCRYPTION_KEY, recusa cifrar em vez de usar um segredo padrão', () => {
    mockEnv.NODE_ENV = 'production';
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = undefined;

    expect(() => encryptField('x')).toThrow(/CREDENTIALS_ENCRYPTION_KEY ausente em produção/);
  });

  it('chave com tamanho inválido (diferente de 32 bytes) é rejeitada', () => {
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');

    expect(() => encryptField('x')).toThrow(/32 bytes/);
  });

  it('fora de produção, sem chave configurada, ainda funciona via chave fixa de desenvolvimento', () => {
    mockEnv.NODE_ENV = 'test';
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = undefined;

    const encrypted = encryptField('dev-secret');
    expect(decryptField(encrypted)).toBe('dev-secret');
  });

  it('envelope keyed embute keyId da chave (versionamento — BT360-DT-0073)', () => {
    const keyA = Buffer.alloc(32, 7).toString('base64');
    const keyB = Buffer.alloc(32, 9).toString('base64');
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = keyA;

    const encrypted = encryptField('segredo');
    // enc:v1:<keyId>:<iv>:<authTag>:<ciphertext> — 4 segmentos após o prefixo.
    const segments = encrypted.slice('enc:v1:'.length).split(':');
    expect(segments).toHaveLength(4);
    expect(segments[0]).toMatch(/^[0-9a-f]{12}$/);

    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = keyB;
    // keyId da cifra antiga não casa com a chave nova — falha fail-closed.
    expect(() => decryptField(encrypted)).toThrow(/Falha ao decifrar/);
  });

  it('rotação com grace period: chave anterior em CREDENTIALS_ENCRYPTION_KEY_PREVIOUS decifra envelope antigo', () => {
    const oldKey = Buffer.alloc(32, 1).toString('base64');
    const newKey = Buffer.alloc(32, 2).toString('base64');

    // Credencial gravada ANTES da rotação, cifrada com a chave antiga.
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = oldKey;
    const cipherOld = encryptField('token-bitrix-antigo');

    // Pós-rotação: chave nova é a atual, antiga vira PREVIOUS (grace period).
    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = newKey;
    mockEnv.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = oldKey;
    expect(decryptField(cipherOld)).toBe('token-bitrix-antigo');

    // Credencial gravada DEPOIS da rotação usa a chave nova e também decifra.
    const cipherNew = encryptField('token-bitrix-novo');
    expect(decryptField(cipherNew)).toBe('token-bitrix-novo');
  });

  it('após encerrar o grace period (remover PREVIOUS), envelope da chave antiga falha fail-closed', () => {
    const oldKey = Buffer.alloc(32, 1).toString('base64');
    const newKey = Buffer.alloc(32, 2).toString('base64');

    mockEnv.CREDENTIALS_ENCRYPTION_KEY = oldKey;
    const cipherOld = encryptField('segredo');

    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = newKey;
    mockEnv.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = oldKey;
    expect(decryptField(cipherOld)).toBe('segredo');

    // Grace period encerrado.
    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = undefined;
    expect(() => decryptField(cipherOld)).toThrow(/Falha ao decifrar/);
  });

  it('envelope legado de 3 segmentos (sem keyId) continua decifrável via chave anterior', () => {
    const oldKey = Buffer.alloc(32, 1).toString('base64');
    const newKey = Buffer.alloc(32, 2).toString('base64');

    mockEnv.CREDENTIALS_ENCRYPTION_KEY = oldKey;
    const keyed = encryptField('legado');
    // Remove o segmento keyId → formato legado "enc:v1:<iv>:<tag>:<ct>".
    const parts = keyed.split(':');
    const legacy = `enc:v1:${parts.slice(3).join(':')}`;
    expect(legacy.slice('enc:v1:'.length).split(':')).toHaveLength(3);

    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = newKey;
    mockEnv.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS = oldKey;
    expect(decryptField(legacy)).toBe('legado');
  });
});

// Regressão de incidente real de produção (01-03/09/2026): um Contact com PII indecifrável
// (chave diferente da que cifrou o registro, ou dado corrompido) derrubava a query INTEIRA de
// listagem de leads via a extensão do Prisma, porque decryptField lançava dentro de
// decryptSensitiveRecord/decryptNestedContactPii sem nenhum isolamento por registro. tryDecryptField
// resolve isso sem alterar o comportamento fail-closed de decryptField em si.
describe('tryDecryptField — isola falha de descriptografia por registro, sem virar fail-open', () => {
  it('roundtrip bem-sucedido continua devolvendo o texto original (comportamento idêntico a decryptField)', () => {
    const encrypted = encryptField('valor-real');
    expect(tryDecryptField(encrypted, { model: 'Contact', field: 'email', id: 'c1' })).toBe(
      'valor-real',
    );
  });

  it('ciphertext indecifrável (chave errada) NUNCA lança — devolve o marcador não-PII em vez de propagar a exceção', () => {
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
    const encrypted = encryptField('valor-real');

    _resetKeyCacheForTests();
    mockEnv.CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString('base64');

    expect(() =>
      tryDecryptField(encrypted, { model: 'Contact', field: 'email', id: 'c1' }),
    ).not.toThrow();
    expect(tryDecryptField(encrypted, { model: 'Contact', field: 'email', id: 'c1' })).toBe(
      DECRYPTION_FAILED_MARKER,
    );
  });

  it('o marcador de falha nunca é confundido com o texto original nem fica vazio (não é fail-open)', () => {
    expect(DECRYPTION_FAILED_MARKER).not.toBe('');
    expect(DECRYPTION_FAILED_MARKER).not.toMatch(/^enc:v1:/);
    // Nunca deve casar com o formato de um e-mail real, para nunca ser tratado como PII válida
    // a jusante (busca, dedup, envio).
    expect(DECRYPTION_FAILED_MARKER).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

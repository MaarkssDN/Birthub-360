import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

/**
 * Utilitário canônico de criptografia, decriptografia e sanitização de credenciais
 * para integrações externas (CRM, webhooks, gateways e tokens OAuth).
 *
 * Propriedade: Agente 15 (Segurança Aplicada e Rotação de Segredos)
 * Padrão: AES-256-GCM com IV aleatório (12 bytes) e authTag (16 bytes).
 * Formatos de envelope serializado (mesmo de src/lib/crypto/secretFields.ts):
 *  - keyed (atual): "enc:v1:<keyId>:<iv b64>:<authTag b64>:<ciphertext b64>" — keyId é o
 *    fingerprint SHA-256 (12 hex) da chave que cifrou, permitindo rotação com grace period:
 *    a chave anterior permanece em CREDENTIALS_ENCRYPTION_KEY_PREVIOUS e todo ciphertext
 *    keyed ou legado continua decriptável durante a janela de rotação (BT360-DT-0073).
 *  - legado: "enc:v1:<iv b64>:<authTag b64>:<ciphertext b64>" — sem keyId; a decriptação
 *    tenta todas as chaves configuradas (atual → anterior), mesmo comportamento do
 *    fallback manual anterior.
 */

const ALGORITHM = 'aes-256-gcm';
const VERSION_PREFIX = 'enc:v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_ID_LENGTH = 12;

/**
 * Converte chave bruta (base64 de 32 bytes) em Buffer ou deriva chave de teste.
 * Em produção, ausência ou formato incorreto é terminantemente fail-closed.
 */
function resolveBufferKey(rawKey?: string): Buffer {
  const candidate = rawKey?.trim() || env.CREDENTIALS_ENCRYPTION_KEY?.trim();

  if (!candidate) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'CREDENTIALS_ENCRYPTION_KEY ausente em produção. Obrigatória para criptografia de credenciais.',
      );
    }
    logger.warn(
      '[credentialCrypto] CREDENTIALS_ENCRYPTION_KEY não configurada — usando chave fixa de desenvolvimento.',
    );
    return createHash('sha256').update('insecure-dev-only-credentials-key').digest();
  }

  const buf = Buffer.from(candidate, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `Chave de criptografia inválida — esperado 32 bytes após decodificação base64, recebido ${buf.length}.`,
    );
  }
  return buf;
}

/**
 * Chave anterior (grace period de rotação). Opcional; quando presente precisa ter o
 * mesmo formato válido de CREDENTIALS_ENCRYPTION_KEY — valor malformado é erro
 * fail-closed, não fallback silencioso.
 */
function resolvePreviousKeyBuffer(): Buffer | null {
  const candidate = env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS?.trim();
  if (!candidate) return null;
  return resolveBufferKey(candidate);
}

/** Fingerprint público e estável da chave — identifica qual chave cifrou um envelope v2. */
function keyIdFor(key: Buffer): string {
  return createHash('sha256').update(key).digest('hex').slice(0, KEY_ID_LENGTH);
}

/**
 * Monta a lista ordenada de chaves candidatas para decriptação.
 * Ordem: argumentos explícitos (primaryKey/fallbackKey — compat com callers antigos),
 * chave atual do env, chave anterior do env (grace period). Dedup por fingerprint.
 * Para envelopes v2, a chave cujo fingerprint casa com o keyId do payload vem primeiro.
 */
function candidateKeys(
  primaryKey?: string,
  fallbackKey?: string,
  preferredKeyId?: string,
): Buffer[] {
  const seen = new Set<string>();
  const keys: Buffer[] = [];
  const push = (key: Buffer) => {
    const id = keyIdFor(key);
    if (!seen.has(id)) {
      seen.add(id);
      keys.push(key);
    }
  };

  const raws = [primaryKey, fallbackKey];
  for (const raw of raws) {
    if (!raw?.trim()) continue;
    try {
      push(resolveBufferKey(raw));
    } catch {
      // Argumento explícito malformado é ignorado se houver outras candidatas —
      // mesma tolerância que o fallbackKey já tinha no formato v1.
    }
  }
  try {
    push(resolveBufferKey());
  } catch (err) {
    if (keys.length === 0) throw err;
  }
  try {
    const previous = resolvePreviousKeyBuffer();
    if (previous) push(previous);
  } catch {
    // Chave anterior malformada não deve derrubar a decriptação se a atual funciona.
  }

  if (keys.length === 0) {
    throw new Error('Nenhuma chave de criptografia de credenciais configurada.');
  }

  if (preferredKeyId) {
    keys.sort((a, b) => {
      const aMatch = keyIdFor(a) === preferredKeyId ? 0 : 1;
      const bMatch = keyIdFor(b) === preferredKeyId ? 0 : 1;
      return aMatch - bMatch;
    });
  }
  return keys;
}

/**
 * Criptografa credencial em texto puro retornando string envelope "enc:v1:...".
 * Suporta chave customizada opcional para processos de rotação dual-key / migração.
 */
export function encryptCredentialSync(plainText: string, customKey?: string): string {
  if (typeof plainText !== 'string' || plainText.length === 0) {
    throw new Error('Impossível criptografar credencial vazia ou não textual.');
  }

  const key = resolveBufferKey(customKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${VERSION_PREFIX}${keyIdFor(key)}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export async function encryptCredential(plainText: string, customKey?: string): Promise<string> {
  return encryptCredentialSync(plainText, customKey);
}

/**
 * Decriptografa credencial armazenada em formato envelope "enc:v1:...".
 * Suporta fallbackKey para rotação de chaves sem downtime (tenta chave principal, falha para a anterior se configurada).
 * Se o valor armazenado não possuir o prefixo "enc:v1:", trata como legado em texto puro (migração suave).
 */
export function decryptCredentialSync(
  cipherText: string,
  primaryKey?: string,
  fallbackKey?: string,
): string {
  if (typeof cipherText !== 'string' || cipherText.length === 0) {
    throw new Error('Impossível decriptografar credencial vazia ou inválida.');
  }

  if (!cipherText.startsWith(VERSION_PREFIX)) {
    // Valor legado sem envelope (texto puro)
    return cipherText;
  }

  const parts = cipherText.slice(VERSION_PREFIX.length).split(':');
  let preferredKeyId: string | undefined;
  let ivB64: string;
  let authTagB64: string;
  let ciphertextB64: string;
  if (parts.length === 4) {
    // Envelope keyed: keyId + iv + authTag + ciphertext.
    [preferredKeyId, ivB64, authTagB64, ciphertextB64] = parts;
  } else if (parts.length === 3) {
    // Envelope legado sem keyId.
    [ivB64, authTagB64, ciphertextB64] = parts;
  } else {
    throw new Error('Envelope de credencial corrompido ou com formato inválido.');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encryptedBuf = Buffer.from(ciphertextB64, 'base64');

  const keysToTry = candidateKeys(primaryKey, fallbackKey, preferredKeyId);

  for (const key of keysToTry) {
    try {
      const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
      return plaintext.toString('utf8');
    } catch {
      // Tenta próxima chave disponível
    }
  }

  throw new Error(
    'Falha na autenticação/decriptografia da credencial. Chave incorreta ou dado adulterado.',
  );
}

export async function decryptCredential(
  cipherText: string,
  primaryKey?: string,
  fallbackKey?: string,
): Promise<string> {
  return decryptCredentialSync(cipherText, primaryKey, fallbackKey);
}

/**
 * Sanitiza segredos para apresentação visual e auditoria (ex.: `sk_live_...` -> `sk_li****3a9f`).
 */
export function maskSecret(secret?: string | null, visibleChars = 4): string {
  if (!secret) return '[VAZIO]';
  const clean = String(secret).trim();
  if (clean.length <= visibleChars * 2) {
    return '****';
  }
  const start = clean.slice(0, visibleChars);
  const end = clean.slice(-visibleChars);
  return `${start}****${end}`;
}

/**
 * Lista de cabeçalhos HTTP estritamente confidenciais.
 */
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-birthhub360-webhook-secret',
  'x-hub-signature',
  'x-signature',
  'webhook-secret',
]);

/**
 * Redige cabeçalhos confidenciais em logs de requisição/resposta HTTP.
 */
export function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Padrões de chaves de objetos que contêm segredos ou credenciais.
 */
const SENSITIVE_KEY_REGEX =
  /(token|secret|password|passwd|apiKey|api_key|clientSecret|client_secret|privateKey|private_key|auth)/i;

/**
 * Percorre recursivamente um payload/objeto mascarando quaisquer campos confidenciais
 * antes de envio para loggers ou mensagens de erro.
 */
export function sanitizeObjectForLogging<T>(target: T, depth = 0): T {
  if (!target || typeof target !== 'object' || depth > 5) {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeObjectForLogging(item, depth + 1)) as unknown as T;
  }

  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(target as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(k) && typeof v === 'string') {
      copy[k] = maskSecret(v);
    } else if (v && typeof v === 'object') {
      copy[k] = sanitizeObjectForLogging(v, depth + 1);
    } else {
      copy[k] = v;
    }
  }

  return copy as T;
}

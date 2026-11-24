import { randomBytes, timingSafeEqual } from 'node:crypto';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import { verifyPassword as verifyBetterAuthScryptPassword } from 'better-auth/crypto';

/**
 * Parâmetros Argon2id (RFC 9106 / OWASP Password Storage Cheat Sheet):
 * - v = 19 (0x13)
 * - m = 19456 KiB (~19 MiB — recomendação OWASP para Argon2id com t=2, p=1)
 * - t = 2 iterações
 * - p = 1 paralelismo
 * - dkLen = 32 bytes (256 bits)
 *
 * Formato PHC persistido em Account.password:
 *   $argon2id$v=19$m=19456,t=2,p=1$<salt_base64url_nopad>$<hash_base64url_nopad>
 *
 * Mantém compatibilidade retroativa transparente na verificação (`verifyPasswordHash`) com
 * hashes legados `scrypt` gerados pelo default do Better Auth (`<salt_hex>:<key_hex>`), evitando
 * invalidar contas existentes ou scripts de seed/reset.
 */
const ARGON2ID_PREFIX = '$argon2id$';
const ARGON2_VERSION = 19;
const DEFAULT_MEMORY_KIB = 19456;
const DEFAULT_TIME_COST = 2;
const DEFAULT_PARALLELISM = 1;
const DEFAULT_KEY_LEN = 32;
const SALT_BYTES = 16;

// Limites superiores dos parâmetros Argon2 aceitos na VERIFICAÇÃO. Os parâmetros vêm do próprio
// hash persistido (Account.password), então um hash corrompido/adulterado no banco poderia pedir
// m=TBs de memória e derrubar o processo por OOM durante um simples login — defense-in-depth:
// mesmo que a escrita no banco esteja comprometida, a verificação nunca aloca além do razoável.
// Os pisos (m>=8, t>=1, p>=1, salt>=8B, hash>=16B) já existiam; faltavam os tetos.
const MAX_ARGON2_MEMORY_KIB = 1_048_576; // 1 GiB — muito acima de qualquer configuração realista
const MAX_ARGON2_TIME_COST = 10;
const MAX_ARGON2_PARALLELISM = 8;
const MIN_ARGON2_VERSION = 16; // 0x10 — única outra versão histórica do Argon2
const MAX_ARGON2_VERSION = 19; // 0x13 — RFC 9106
const MAX_SALT_BYTES = 64;
const MAX_HASH_BYTES = 64;

function toBase64NoPad(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/=+$/, '');
}

function fromBase64NoPad(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

export async function hashPasswordArgon2id(password: string): Promise<string> {
  const normalized = password.normalize('NFKC');
  const salt = new Uint8Array(randomBytes(SALT_BYTES));
  const derived = await argon2idAsync(normalized, salt, {
    m: DEFAULT_MEMORY_KIB,
    t: DEFAULT_TIME_COST,
    p: DEFAULT_PARALLELISM,
    dkLen: DEFAULT_KEY_LEN,
    version: ARGON2_VERSION,
  });

  const saltB64 = toBase64NoPad(salt);
  const hashB64 = toBase64NoPad(derived);
  return `$argon2id$v=${ARGON2_VERSION}$m=${DEFAULT_MEMORY_KIB},t=${DEFAULT_TIME_COST},p=${DEFAULT_PARALLELISM}$${saltB64}$${hashB64}`;
}

export async function verifyPasswordHash(data: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const { hash, password } = data;
  if (!hash || typeof hash !== 'string' || typeof password !== 'string') {
    return false;
  }

  if (hash.startsWith(ARGON2ID_PREFIX)) {
    const parts = hash.split('$');
    // ['', 'argon2id', 'v=19', 'm=19456,t=2,p=1', '<salt>', '<hash>']
    if (parts.length !== 6 || parts[1] !== 'argon2id') {
      return false;
    }

    const versionMatch = /^v=(\d+)$/.exec(parts[2] ?? '');
    const paramsMatch = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(parts[3] ?? '');
    if (!versionMatch || !paramsMatch) {
      return false;
    }

    const version = Number.parseInt(versionMatch[1] ?? '19', 10);
    const m = Number.parseInt(paramsMatch[1] ?? '0', 10);
    const t = Number.parseInt(paramsMatch[2] ?? '0', 10);
    const p = Number.parseInt(paramsMatch[3] ?? '0', 10);
    const saltB64 = parts[4] ?? '';
    const expectedHashB64 = parts[5] ?? '';

    if (
      !saltB64 ||
      !expectedHashB64 ||
      m < 8 ||
      m > MAX_ARGON2_MEMORY_KIB ||
      t < 1 ||
      t > MAX_ARGON2_TIME_COST ||
      p < 1 ||
      p > MAX_ARGON2_PARALLELISM ||
      version < MIN_ARGON2_VERSION ||
      version > MAX_ARGON2_VERSION
    ) {
      return false;
    }

    const salt = fromBase64NoPad(saltB64);
    const expectedHash = fromBase64NoPad(expectedHashB64);
    if (
      salt.byteLength < 8 ||
      salt.byteLength > MAX_SALT_BYTES ||
      expectedHash.byteLength < 16 ||
      expectedHash.byteLength > MAX_HASH_BYTES
    ) {
      return false;
    }

    // Hash malformado/adulterado no banco não pode derrubar o login com exceção: qualquer erro
    // do Argon2 (parâmetros, alocação, base64 residual) vira simplesmente "senha não confere".
    let derived: Uint8Array;
    try {
      derived = await argon2idAsync(password.normalize('NFKC'), salt, {
        m,
        t,
        p,
        dkLen: expectedHash.byteLength,
        version,
      });
    } catch {
      return false;
    }

    if (derived.byteLength !== expectedHash.byteLength) {
      return false;
    }
    return timingSafeEqual(derived, expectedHash);
  }

  // Fallback transparente para hashes scrypt legados do Better Auth (<salt_hex>:<key_hex>)
  try {
    return await verifyBetterAuthScryptPassword({ hash, password });
  } catch {
    return false;
  }
}

export function isArgon2idHash(hash: string): boolean {
  return typeof hash === 'string' && hash.startsWith(ARGON2ID_PREFIX);
}

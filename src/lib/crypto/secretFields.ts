import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

// Criptografia em repouso de credenciais de integrações persistidas no banco (bloqueador do
// AGENTS.md: "Credenciais armazenadas sem proteção adequada" — GoogleWorkspaceConnection.
// accessToken/refreshToken e BitrixConnection.webhookUrl eram gravados em texto puro, protegidos
// só por RLS de tenant, nunca por criptografia de campo própria; ver comentário que existia em
// prisma/schema.prisma sobre BitrixConnection.webhookUrl).
//
// AES-256-GCM: autenticado (detecta adulteração via authTag, não só criptografa), IV aleatório
// por valor (nunca reaproveitado com a mesma chave). Formato de armazenamento:
// "enc:v1:<keyId>:<iv base64>:<authTag base64>:<ciphertext base64>" — o keyId é o fingerprint
// SHA-256 (12 hex) da chave que cifrou, versionando o envelope para rotação com grace period
// (BT360-DT-0073): durante a janela de rotação a chave antiga fica em
// CREDENTIALS_ENCRYPTION_KEY_PREVIOUS e todo ciphertext — keyed de 4 segmentos ou legado de 3 —
// continua decriptável. O prefixo "enc:v1:" é mantido de propósito: todos os detectores
// (`startsWith('enc:v1:')` em prisma-interceptors/prisma.ts/scripts) seguem reconhecendo o
// valor cifrado sem alteração, e parsers antigos falham fechado (parts.length!==3) em vez de
// tratá-lo como texto puro.
const ALGORITHM = 'aes-256-gcm';
const VERSION_PREFIX = 'enc:v1:';
const IV_LENGTH = 12; // tamanho de nonce recomendado para GCM
const KEY_ID_LENGTH = 12;

function resolveKey(raw?: string): Buffer {
  const candidate = raw?.trim() || env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!candidate) {
    if (env.NODE_ENV === 'production') {
      // Fail-closed: nunca inventa segredo padrão em produção (mesma regra que já vale para
      // BETTER_AUTH_SECRET — ver AGENTS.md "Autenticação").
      throw new Error(
        'CREDENTIALS_ENCRYPTION_KEY ausente em produção — obrigatória para cifrar credenciais de integrações (Bitrix/Google) em repouso. Gere uma com `openssl rand -base64 32`.',
      );
    }
    logger.warn(
      '[secretFields] CREDENTIALS_ENCRYPTION_KEY não configurada — usando chave fixa de desenvolvimento local. NUNCA use isso em produção (a trava acima impede a subida sem a variável real).',
    );
    // Chave fixa e conhecida, só para dev/test local — nunca alcançável em produção (guard acima).
    return createHash('sha256').update('insecure-dev-only-credentials-key').digest();
  }
  const key = Buffer.from(candidate, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `CREDENTIALS_ENCRYPTION_KEY inválida — esperado 32 bytes após decodificar base64, recebeu ${key.length}. Gere uma nova com \`openssl rand -base64 32\`.`,
    );
  }
  return key;
}

/** Fingerprint público e estável da chave — identifica qual chave cifrou um envelope keyed. */
function keyIdFor(key: Buffer): string {
  return createHash('sha256').update(key).digest('hex').slice(0, KEY_ID_LENGTH);
}

let cachedKey: Buffer | null = null;
let cachedPreviousKey: Buffer | null = null;
let previousKeyResolved = false;

function getKey(): Buffer {
  if (!cachedKey) cachedKey = resolveKey();
  return cachedKey;
}

/**
 * Chave anterior (grace period de rotação). `null` quando CREDENTIALS_ENCRYPTION_KEY_PREVIOUS
 * não está definida; valor malformado é erro fail-closed (mesma regra da chave atual).
 */
function getPreviousKey(): Buffer | null {
  if (!previousKeyResolved) {
    previousKeyResolved = true;
    const raw = env.CREDENTIALS_ENCRYPTION_KEY_PREVIOUS?.trim();
    if (raw) cachedPreviousKey = resolveKey(raw);
  }
  return cachedPreviousKey;
}

/** Exposto só para os testes poderem forçar a reavaliação da chave entre casos. */
export function _resetKeyCacheForTests(): void {
  cachedKey = null;
  cachedPreviousKey = null;
  previousKeyResolved = false;
}

/**
 * Chaves candidatas à decriptação, em ordem de tentativa: chave atual primeiro, depois a
 * anterior (grace period). Para envelopes keyed, a chave cujo fingerprint casa com o keyId
 * do payload é promovida ao início da fila.
 */
function candidateKeys(preferredKeyId?: string): Buffer[] {
  const keys: Buffer[] = [];
  const seen = new Set<string>();
  const push = (key: Buffer | null) => {
    if (!key) return;
    const id = keyIdFor(key);
    if (!seen.has(id)) {
      seen.add(id);
      keys.push(key);
    }
  };
  push(getKey());
  push(getPreviousKey());
  if (preferredKeyId) {
    keys.sort(
      (a, b) => Number(keyIdFor(a) !== preferredKeyId) - Number(keyIdFor(b) !== preferredKeyId),
    );
  }
  return keys;
}

export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${VERSION_PREFIX}${keyIdFor(key)}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptField(stored: string): string {
  if (!stored.startsWith(VERSION_PREFIX)) {
    // Valor legado, gravado antes desta criptografia existir (texto puro) — devolvido como
    // está. Não é o mesmo caso do catch abaixo: aqui o formato é reconhecidamente "sem
    // criptografia", não um "enc:v1:..." que falhou ao decifrar.
    return stored;
  }
  const parts = stored.slice(VERSION_PREFIX.length).split(':');
  // 3 segmentos = envelope legado sem keyId; 4 = keyed (keyId + iv + authTag + ciphertext).
  let keyId: string | undefined;
  let ivB64: string;
  let authTagB64: string;
  let ciphertextB64: string;
  if (parts.length === 4) {
    [keyId, ivB64, authTagB64, ciphertextB64] = parts;
  } else if (parts.length === 3) {
    [ivB64, authTagB64, ciphertextB64] = parts;
  } else {
    throw new Error(
      'Falha ao decifrar credencial — chave incorreta ou dado corrompido/adulterado.',
    );
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encryptedBuf = Buffer.from(ciphertextB64, 'base64');

  for (const key of candidateKeys(keyId)) {
    try {
      const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
      return plaintext.toString('utf8');
    } catch {
      // Tenta a próxima chave candidata (atual → anterior do grace period).
    }
  }
  // Fail-closed: nunca devolve a credencial corrompida/adulterada nem um valor vazio como se
  // fosse válido — quem chamar precisa tratar isso como conexão quebrada (ex.: pedir reconexão
  // da integração), nunca seguir adiante com um token errado.
  throw new Error('Falha ao decifrar credencial — chave incorreta ou dado corrompido/adulterado.');
}

/**
 * Marcador não-PII devolvido por `tryDecryptField` quando a descriptografia falha. Nunca é uma
 * string que passa por um regex de e-mail/telefone válido nem por igualdade com valor real —
 * intencional, para que o dado corrompido nunca seja confundido com PII legítima a jusante
 * (busca, dedup, envio de e-mail/WhatsApp).
 */
export const DECRYPTION_FAILED_MARKER = '⚠️ [dado ilegível — falha de descriptografia, ver logs]';

/**
 * Wrapper de `decryptField` que isola o dano por REGISTRO em vez de por QUERY inteira.
 * `decryptField` continua fail-closed sem nenhuma mudança (nunca aceita cifra inválida como
 * válida) — o problema real era o CHAMADOR: uma única linha com ciphertext indecifrável (chave
 * errada/dado corrompido) lançava e derrubava toda a extensão `$allOperations` do Prisma, o que
 * na prática apagava a listagem inteira de leads/contatos sempre que UM Contact relacionado
 * tivesse PII indecifrável (incidente real de produção, 01-03/09/2026 — decryptField chamado por
 * decryptNestedContactPii/decryptSensitiveResult, propagando para
 * PrismaLeadRepository.findAllWithFilters → LeadController.getLeads).
 *
 * Nunca loga o ciphertext nem a chave — só o contexto (model/campo/id) necessário para localizar
 * o registro afetado. Não é fail-open: o valor devolvido em falha é `DECRYPTION_FAILED_MARKER`,
 * nunca o ciphertext cru nem um texto vazio que pareça válido.
 */
export function tryDecryptField(
  stored: string,
  context: { model: string; field: string; id?: string },
): string {
  try {
    return decryptField(stored);
  } catch {
    logger.error(
      { model: context.model, field: context.field, recordId: context.id },
      '[secretFields] Falha ao decifrar campo — isolado a este registro, query não foi derrubada. Verifique CREDENTIALS_ENCRYPTION_KEY/rotação de chave.',
    );
    return DECRYPTION_FAILED_MARKER;
  }
}

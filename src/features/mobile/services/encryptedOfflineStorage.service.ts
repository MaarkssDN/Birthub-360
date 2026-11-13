/**
 * encryptedOfflineStorage.service.ts
 *
 * Camada de persistência criptografada para dados offline do app mobile/PWA
 * (Capacitor). Auditoria Onda 00 (Agente 09): a fila de sincronização offline
 * persistia notas de reunião de campo, áudio base64 e dados de leads em
 * localStorage em texto claro — risco de PII (LGPD) em caso de acesso físico
 * ao dispositivo ou extração de backup.
 *
 * Esta implementação usa WebCrypto AES-GCM-256:
 *  - A CryptoKey é **non-extractable** e persistida no IndexedDB do WebView,
 *    onde o SO/navegador protege o material da chave (no Android WebView o
 *    IndexedDB é criptografado em repouso pelo keystore da plataforma quando
 *    disponível).
 *  - Se o IndexedDB não existir (jsdom, SSR, WebView antigo), a chave fica
 *    apenas em memória da sessão: a fila continua funcional e os dados em
 *    repouso permanecem cifrados durante a sessão, mas não sobrevivem a um
 *    reload — degradação segura documentada, sem fallback para texto claro.
 *  - Se WebCrypto não existir, o factory retorna o adaptador em texto claro
 *    apenas como último recurso de compatibilidade (ambientes sem crypto
 *    não deveriam rodar o app de campo); loga warning explícito.
 *
 * Caminho para SQLite nativo (pendente — ver handoff onda-00):
 *  - Instalar `@capacitor-community/sqlite` (não adicionado nesta onda para
 *    não introduzir plugin nativo pesado sem necessidade).
 *  - Criar `NativeSqliteStorageAdapter` implementando a mesma interface
 *    `StorageAdapter` (ou uma variante KV), com `PRAGMA key`/cifra nativa ou
 *    AES-GCM via SQLCipher, e injetar em `OfflineSyncService` via `storage`.
 *  - RxDB (`src/lib/db/rxdb.ts`) existe no package.json mas é código morto —
 *    candidato a remoção ou adoção futura, decisão do Agente 00.
 */

import { LocalStorageAdapter, type StorageAdapter } from './offlineStorageAdapter.js';

const CIPHERTEXT_PREFIX = 'bh360enc:v1:';
const KEY_STORE_DB_NAME = 'birthhub360-secure-store';
const KEY_STORE_DB_VERSION = 1;
const KEY_STORE_NAME = 'keys';
const OFFLINE_QUEUE_KEY_ID = 'offline_queue_aes_gcm_v1';

export function isEncryptedValue(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(CIPHERTEXT_PREFIX);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    const copy = new Uint8Array(new ArrayBuffer(buf.length));
    copy.set(buf);
    return copy;
  }
  const binary = atob(base64);
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/**
 * Persistência mínima de CryptoKey via IndexedDB (structured clone nativo).
 * Retorna null quando IndexedDB não está disponível.
 */
async function loadKeyFromIndexedDb(): Promise<CryptoKey | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(KEY_STORE_DB_NAME, KEY_STORE_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
          db.createObjectStore(KEY_STORE_NAME);
        }
      };
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(KEY_STORE_NAME, 'readonly');
          const getReq = tx.objectStore(KEY_STORE_NAME).get(OFFLINE_QUEUE_KEY_ID);
          getReq.onsuccess = () => {
            const key = getReq.result as CryptoKey | undefined;
            db.close();
            resolve(key ?? null);
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

async function saveKeyToIndexedDb(key: CryptoKey): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await new Promise<void>((resolve) => {
    try {
      const request = indexedDB.open(KEY_STORE_DB_NAME, KEY_STORE_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
          db.createObjectStore(KEY_STORE_NAME);
        }
      };
      request.onerror = () => resolve();
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
          tx.objectStore(KEY_STORE_NAME).put(key, OFFLINE_QUEUE_KEY_ID);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            resolve();
          };
        } catch {
          db.close();
          resolve();
        }
      };
    } catch {
      resolve();
    }
  });
}

export interface EncryptedStorageOptions {
  /**
   * Chave AES-GCM pré-gerada (uso em testes). Quando omitida, a chave é
   * carregada/criada via IndexedDB ou memória de sessão.
   */
  cryptoKey?: CryptoKey;
  /** Adaptador base onde os valores cifrados são gravados. */
  baseStorage?: StorageAdapter;
}

/**
 * Adaptador StorageAdapter que cifra todos os valores com AES-GCM antes de
 * persistir no storage base (localStorage por padrão). Valores legados em
 * texto claro são lidos normalmente (migração transparente: a próxima escrita
 * já sai cifrada).
 */
export class EncryptedStorageAdapter implements StorageAdapter {
  private base: StorageAdapter;
  private injectedKey?: CryptoKey;
  private keyPromise: Promise<CryptoKey> | null = null;
  private warnedNoKeyPersistence = false;

  constructor(options: EncryptedStorageOptions = {}) {
    this.base = options.baseStorage ?? new LocalStorageAdapter();
    this.injectedKey = options.cryptoKey;
  }

  private async ensureKey(): Promise<CryptoKey> {
    if (this.injectedKey) return this.injectedKey;
    if (!this.keyPromise) {
      this.keyPromise = this.loadOrCreateKey().catch((err) => {
        this.keyPromise = null;
        throw err;
      });
    }
    return this.keyPromise;
  }

  private async loadOrCreateKey(): Promise<CryptoKey> {
    const existing = await loadKeyFromIndexedDb();
    if (existing) return existing;

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable: bytes da chave nunca ficam acessíveis ao JS
      ['encrypt', 'decrypt'],
    );

    if (typeof indexedDB === 'undefined' && !this.warnedNoKeyPersistence) {
      this.warnedNoKeyPersistence = true;
      console.warn(
        '[EncryptedStorage] IndexedDB indisponível: chave AES-GCM ficará apenas em memória ' +
          'da sessão. Dados offline cifrados não sobreviverão a reload do app.',
      );
    }
    await saveKeyToIndexedDb(key);
    return key;
  }

  /**
   * Cifra um valor string. Formato persistido:
   *   bh360enc:v1:<iv_base64>:<ciphertext_base64>
   */
  public async encryptString(plaintext: string): Promise<string> {
    const key = await this.ensureKey();
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return `${CIPHERTEXT_PREFIX}${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
  }

  /**
   * Decifra um valor persistido. Retorna null quando o valor está corrompido,
   * foi cifrado com outra chave (ex.: chave perdida) ou tem formato inválido —
   * o chamador deve tratar como "sem dados" em vez de propagar exceção.
   *
   * Valores legados em texto claro (sem prefixo) são devolvidos como estão,
   * permitindo leitura de filas gravadas antes desta camada existir.
   */
  public async decryptString(stored: string | null): Promise<string | null> {
    if (stored === null) return null;
    if (!isEncryptedValue(stored)) return stored;

    try {
      const key = await this.ensureKey();
      const payload = stored.slice(CIPHERTEXT_PREFIX.length);
      const separatorIndex = payload.indexOf(':');
      if (separatorIndex === -1) return null;

      const iv = base64ToBytes(payload.slice(0, separatorIndex));
      const ciphertext = base64ToBytes(payload.slice(separatorIndex + 1));
      const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
      return new TextDecoder().decode(plaintextBuffer);
    } catch {
      return null;
    }
  }

  public async getItem(key: string): Promise<string | null> {
    const raw = await this.base.getItem(key);
    if (raw === null) return null;
    return this.decryptString(raw);
  }

  public async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encryptString(value);
    await this.base.setItem(key, encrypted);
  }

  public async removeItem(key: string): Promise<void> {
    await this.base.removeItem(key);
  }
}

/**
 * Cria o adaptador de storage padrão para a fila offline.
 * Retorna EncryptedStorageAdapter quando WebCrypto está disponível;
 * caso contrário cai para o LocalStorageAdapter em texto claro com warning
 * (compatibilidade — ambientes modernos sempre têm crypto.subtle).
 */
export function createDefaultOfflineStorage(): StorageAdapter {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return new EncryptedStorageAdapter();
  }
  console.warn(
    '[OfflineSync] WebCrypto indisponível: fila offline será persistida SEM criptografia.',
  );
  return new LocalStorageAdapter();
}

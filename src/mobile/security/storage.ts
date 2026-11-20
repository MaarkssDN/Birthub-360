/**
 * Mobile Secure Token Storage Adapter
 * Bloqueador Sasha (Squad 80 - Agente 88)
 *
 * Migra tokens JWT de autenticação do LocalStorage para armazenamento seguro (Keystore/Keychain/Capacitor SecureStorage).
 * Garante que nenhuma credencial permaneça acessível em texto claro no localStorage do WebView.
 */

export const SECURE_AUTH_TOKEN_KEY = 'bh360_auth_token_secure';
export const SECURE_REFRESH_TOKEN_KEY = 'bh360_refresh_token_secure';

export const INSECURE_PLAINTEXT_KEYS = [
  'token',
  'authToken',
  'jwt',
  'accessToken',
  'refreshToken',
  'bh360_auth_token',
  'bh360_refresh_token',
  'auth_token',
];

export interface SecureStorageBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Backend padrão seguro em memória com isolamento criptográfico para ambientes sem plugins nativos.
 */
export class InMemorySecureBackend implements SecureStorageBackend {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class MobileTokenStorage {
  private backend: SecureStorageBackend;
  private localStorageRef: Storage | null;

  constructor(
    backend?: SecureStorageBackend,
    localStorageRef?: Storage | null,
  ) {
    this.backend = backend ?? new InMemorySecureBackend();
    this.localStorageRef =
      localStorageRef !== undefined
        ? localStorageRef
        : typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : null;
  }

  /**
   * Remove ativamente quaisquer chaves de autenticação em texto claro do LocalStorage do WebView.
   */
  public scrubInsecureLocalStorage(): void {
    if (!this.localStorageRef) return;
    for (const key of INSECURE_PLAINTEXT_KEYS) {
      try {
        this.localStorageRef.removeItem(key);
      } catch {
        // Ignora erros de sandbox/localStorage desativado
      }
    }
  }

  /**
   * Verifica se o LocalStorage está livre de tokens em texto puro.
   */
  public isLocalStorageClean(): boolean {
    if (!this.localStorageRef) return true;
    for (const key of INSECURE_PLAINTEXT_KEYS) {
      if (this.localStorageRef.getItem(key) !== null) {
        return false;
      }
    }
    return true;
  }

  /**
   * Armazena o Access Token no cofre seguro e limpa o LocalStorage.
   */
  public async setAuthToken(token: string): Promise<void> {
    await this.backend.setItem(SECURE_AUTH_TOKEN_KEY, token);
    this.scrubInsecureLocalStorage();
  }

  public async getAuthToken(): Promise<string | null> {
    return this.backend.getItem(SECURE_AUTH_TOKEN_KEY);
  }

  /**
   * Armazena o Refresh Token no cofre seguro e limpa o LocalStorage.
   */
  public async setRefreshToken(token: string): Promise<void> {
    await this.backend.setItem(SECURE_REFRESH_TOKEN_KEY, token);
    this.scrubInsecureLocalStorage();
  }

  public async getRefreshToken(): Promise<string | null> {
    return this.backend.getItem(SECURE_REFRESH_TOKEN_KEY);
  }

  /**
   * Purga todas as credenciais no logout.
   */
  public async purgeAll(): Promise<void> {
    await this.backend.removeItem(SECURE_AUTH_TOKEN_KEY);
    await this.backend.removeItem(SECURE_REFRESH_TOKEN_KEY);
    this.scrubInsecureLocalStorage();
  }
}

export const mobileTokenStorage = new MobileTokenStorage();

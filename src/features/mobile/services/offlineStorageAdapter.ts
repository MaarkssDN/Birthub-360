/**
 * Contrato de armazenamento do subsistema offline e adaptador padrão em
 * localStorage com fallback em memória. Extraído de `offlineSync.service.ts`
 * para quebrar dependência circular com `encryptedOfflineStorage.service.ts`
 * (que envolve qualquer StorageAdapter com cifra AES-GCM).
 */

export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * Adaptador de armazenamento com fallback seguro para memória quando localStorage não estiver disponível.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private inMemoryFallback = new Map<string, string>();

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Ignora SecurityError ou restrições de sandbox
    }
    return this.inMemoryFallback.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // QuotaExceededError ou restrições de sandbox
    }
    this.inMemoryFallback.set(key, value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Ignora
    }
    this.inMemoryFallback.delete(key);
  }
}

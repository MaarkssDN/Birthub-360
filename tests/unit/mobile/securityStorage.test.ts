import { beforeEach, describe, expect, it } from 'vitest';
import {
  InMemorySecureBackend,
  MobileTokenStorage,
  SECURE_AUTH_TOKEN_KEY,
} from '../../../src/mobile/security/storage.js';

describe('Mobile Secure Token Storage (Agente 88 Sasha)', () => {
  let mockLocalStorage: Record<string, string>;
  let mockStorageApi: Storage;
  let backend: InMemorySecureBackend;
  let storage: MobileTokenStorage;

  beforeEach(() => {
    mockLocalStorage = {};
    mockStorageApi = {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockLocalStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
      key: () => null,
      length: 0,
    };

    backend = new InMemorySecureBackend();
    storage = new MobileTokenStorage(backend, mockStorageApi);
  });

  it('stores JWT in secure store and scrubs any plaintext keys from localStorage', async () => {
    // Simulate legacy plaintext token in localStorage
    mockStorageApi.setItem('token', 'insecure-raw-token-123');
    mockStorageApi.setItem('jwt', 'legacy-jwt-token-456');

    expect(storage.isLocalStorageClean()).toBe(false);

    // Now set token through secure storage
    await storage.setAuthToken('secure-jwt-token-999');

    // Secure backend contains token
    const retrieved = await storage.getAuthToken();
    expect(retrieved).toBe('secure-jwt-token-999');

    // LocalStorage has been scrubbed
    expect(mockStorageApi.getItem('token')).toBeNull();
    expect(mockStorageApi.getItem('jwt')).toBeNull();
    expect(storage.isLocalStorageClean()).toBe(true);
  });

  it('purges all credentials on logout leaving zero credentials in localStorage or secure storage', async () => {
    await storage.setAuthToken('token-to-purge');
    await storage.setRefreshToken('refresh-to-purge');

    await storage.purgeAll();

    expect(await storage.getAuthToken()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
    expect(storage.isLocalStorageClean()).toBe(true);
  });
});

/**
 * Regressão EXP-03 (handoff onda-forense-20261020/00-para-09-forense):
 * prova que `OfflineSyncService.clearQueue()` — o método invocado pelo logout
 * em AuthContext — expurga de fato as chaves `birthhub_offline_sync_queue_v1`
 * e `birthhub_offline_id_mappings_v1` do storage criptografado, e que uma nova
 * instância (simulando reload/login de outro usuário) não enxerga resíduo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineSyncService } from '../offlineSync.service.js';
import {
  EncryptedStorageAdapter,
  isEncryptedValue,
} from '../services/encryptedOfflineStorage.service.js';
import { LocalStorageAdapter } from '../services/offlineStorageAdapter.js';

const QUEUE_KEY = 'birthhub_offline_sync_queue_v1';
const ID_MAP_KEY = 'birthhub_offline_id_mappings_v1';

async function flush(times = 10): Promise<void> {
  for (let i = 0; i < times; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function createKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function makeService(cryptoKey: CryptoKey) {
  return new OfflineSyncService({
    storage: new EncryptedStorageAdapter({
      cryptoKey,
      baseStorage: new LocalStorageAdapter(),
    }),
    apiClient: { request: async () => ({ id: 'real_lead_backend_1' }) },
    autoSync: false,
    // Chaves de produção — mesmo default usado pelo singleton offlineSyncService.
    storageKey: QUEUE_KEY,
    idMapKey: ID_MAP_KEY,
  });
}

describe('Expurgo da fila offline no logout (EXP-03)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('clearQueue remove fila e id_mappings cifrados do storage e zera pendingCount', async () => {
    const key = await createKey();
    const service = makeService(key);
    service.setOnlineState(false);

    // 1. Operação enfileirada offline → fila persistida CIFRADA em localStorage
    await service.enqueueCreateLead({ name: 'Lead PII de campo' });
    await flush();

    const rawQueue = window.localStorage.getItem(QUEUE_KEY);
    expect(rawQueue).not.toBeNull();
    expect(isEncryptedValue(rawQueue)).toBe(true);
    expect(rawQueue).not.toContain('Lead PII de campo');

    // 2. Rede volta e sincroniza → idMap temp->real é persistido (também cifrado)
    service.setOnlineState(true);
    const result = await service.syncQueue();
    expect(result.succeeded).toBe(1);
    await flush();

    const rawIdMap = window.localStorage.getItem(ID_MAP_KEY);
    expect(rawIdMap).not.toBeNull();
    expect(isEncryptedValue(rawIdMap)).toBe(true);

    // 3. Logout: clearQueue() deve expurgar tudo
    await service.clearQueue();
    await flush();

    expect(service.getPendingCount()).toBe(0);
    expect(service.getQueue()).toHaveLength(0);
    expect(service.getStats().total).toBe(0);
    expect(window.localStorage.getItem(QUEUE_KEY)).toBeNull();
    expect(window.localStorage.getItem(ID_MAP_KEY)).toBeNull();

    // 4. Reload/login de outro usuário: nova instância não herda resíduo
    const reloaded = makeService(key);
    await reloaded.ready;
    expect(reloaded.getPendingCount()).toBe(0);
    expect(reloaded.getQueue()).toHaveLength(0);

    await service.destroy();
    await reloaded.destroy();
  });
});

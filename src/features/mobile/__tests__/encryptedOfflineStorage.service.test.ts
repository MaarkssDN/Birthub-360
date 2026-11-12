import { beforeEach, describe, expect, it } from 'vitest';
import {
  type StorageAdapter,
  OfflineSyncService,
} from '../offlineSync.service.js';
import {
  createDefaultOfflineStorage,
  EncryptedStorageAdapter,
  isEncryptedValue,
} from '../services/encryptedOfflineStorage.service.js';

/** StorageAdapter em memória para isolar os testes de localStorage/IndexedDB. */
class MemoryStorageAdapter implements StorageAdapter {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  /** Exposto para inspeção: valor cru persistido (possivelmente cifrado). */
  rawGet(key: string): string | null {
    return this.map.get(key) ?? null;
  }
}

async function createTestKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

describe('EncryptedStorageAdapter (AES-GCM / WebCrypto)', () => {
  let key: CryptoKey;
  let base: MemoryStorageAdapter;
  let adapter: EncryptedStorageAdapter;

  beforeEach(async () => {
    key = await createTestKey();
    base = new MemoryStorageAdapter();
    adapter = new EncryptedStorageAdapter({ cryptoKey: key, baseStorage: base });
  });

  it('persiste valores cifrados e não em texto claro', async () => {
    const pii = '{"meetingNotes":"Cliente João Silva, CPF 123, orçamento R$ 50k"}';
    await adapter.setItem('queue', pii);

    const raw = base.rawGet('queue');
    expect(raw).not.toBeNull();
    expect(isEncryptedValue(raw)).toBe(true);
    expect(raw).not.toContain('João Silva');
    expect(raw).not.toContain('123');
  });

  it('faz roundtrip: getItem retorna o plaintext original', async () => {
    const payload = JSON.stringify([{ id: 'op_1', payload: { audioData: 'QUJD' } }]);
    await adapter.setItem('queue', payload);
    await expect(adapter.getItem('queue')).resolves.toBe(payload);
  });

  it('retorna null para valor ausente', async () => {
    await expect(adapter.getItem('inexistente')).resolves.toBeNull();
  });

  it('detecta adulteração do ciphertext (tag AES-GCM inválida)', async () => {
    await adapter.setItem('queue', 'segredo');
    const raw = base.rawGet('queue')!;
    const tampered = raw.slice(0, -2) + (raw.endsWith('AA') ? 'BB' : 'AA');
    base.setItem('queue', tampered);
    await expect(adapter.getItem('queue')).resolves.toBeNull();
  });

  it('não decifra com chave diferente (perda de chave = dados inacessíveis)', async () => {
    await adapter.setItem('queue', 'dado sensível');
    const outraChave = await createTestKey();
    const adapterErrado = new EncryptedStorageAdapter({
      cryptoKey: outraChave,
      baseStorage: base,
    });
    await expect(adapterErrado.getItem('queue')).resolves.toBeNull();
  });

  it('lê valores legados em texto claro (migração transparente)', async () => {
    const legado = '[{"id":"op_legado"}]';
    base.setItem('queue', legado);
    await expect(adapter.getItem('queue')).resolves.toBe(legado);
  });

  it('após escrita, valor legado é substituído por ciphertext', async () => {
    base.setItem('queue', 'legado');
    await adapter.setItem('queue', 'novo valor');
    expect(isEncryptedValue(base.rawGet('queue'))).toBe(true);
  });

  it('removeItem apaga a entrada', async () => {
    await adapter.setItem('queue', 'x');
    await adapter.removeItem('queue');
    await expect(adapter.getItem('queue')).resolves.toBeNull();
  });
});

describe('OfflineSyncService com storage criptografado', () => {
  let key: CryptoKey;
  let base: MemoryStorageAdapter;

  beforeEach(async () => {
    key = await createTestKey();
    base = new MemoryStorageAdapter();
  });

  function makeService(storageKey = 'test_enc_queue') {
    return new OfflineSyncService({
      storage: new EncryptedStorageAdapter({ cryptoKey: key, baseStorage: base }),
      apiClient: { request: async () => ({}) },
      autoSync: false,
      storageKey,
      idMapKey: `${storageKey}_ids`,
    });
  }

  it('fila de reunião de campo fica cifrada no storage e sobrevive a reload', async () => {
    const service = makeService();
    await service.ready;

    await service.enqueueFieldMeetingAudio({
      title: 'Visita - Dra. Maria',
      audioData: 'QUJDREVGRw==',
      audioMimeType: 'audio/webm',
      audioSizeBytes: 7,
      meetingNotes: 'PII: paciente João, plano Ouro',
      consentGranted: true,
    });
    // Aguarda persistência assíncrona
    await new Promise((r) => setTimeout(r, 0));

    const rawQueue = base.rawGet('test_enc_queue');
    expect(rawQueue).not.toBeNull();
    expect(isEncryptedValue(rawQueue)).toBe(true);
    expect(rawQueue).not.toContain('João');
    expect(rawQueue).not.toContain('Dra. Maria');

    // Simula reload: nova instância com mesmo storage+chave
    const reloaded = makeService();
    await reloaded.ready;
    const queue = reloaded.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('FIELD_MEETING_AUDIO');
    const payload = queue[0].payload as { meetingNotes?: string; title?: string };
    expect(payload.meetingNotes).toContain('João');
    expect(payload.title).toBe('Visita - Dra. Maria');

    await service.destroy();
    await reloaded.destroy();
  });

  it('storage default usa adaptador criptografado quando WebCrypto existe', () => {
    const storage = createDefaultOfflineStorage();
    expect(storage).toBeInstanceOf(EncryptedStorageAdapter);
  });
});

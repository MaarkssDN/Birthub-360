import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ApiClientAdapter,
  defaultApiClient,
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER_NAME,
  LocalStorageAdapter,
  OfflineSyncService,
} from '../offlineSync.service.js';

/**
 * MISSÃO POS4-85-IDEM — Idempotência de operações no outbox mobile (Agente 85 · Bóris).
 *
 * Cobre o achado ALTA da auditoria Onda 4: mutações do outbox HTTP eram enviadas SEM
 * `X-Idempotency-Key`, e um retry após falha ambígua (timeout após commit no servidor)
 * duplicava CREATE_LEAD/NOTE/áudio. Estes testes provam, no lado cliente:
 *  - chave estável gerada no enqueue e persistida;
 *  - mesma operação reenviada gera a MESMA key (retry, reconexão, retryFailed, restart);
 *  - operações distintas geram keys distintas;
 *  - header `X-Idempotency-Key` propagado em TODOS os tipos do outbox;
 *  - isolamento multi-tenant do storage da fila e opacidade da chave;
 *  - propagação real do header pelo `defaultApiClient` até o fetch.
 *
 * A prova do efeito no servidor (dedup de fato) é responsabilidade do Agente 22.
 * Dados 100% sintéticos.
 */

const HEADER = IDEMPOTENCY_HEADER_NAME; // 'X-Idempotency-Key'

describe('[85 · Bóris] Outbox idempotency — X-Idempotency-Key', () => {
  let mockApiClient: { request: ReturnType<typeof vi.fn> };
  let storageAdapter: LocalStorageAdapter;
  let service: OfflineSyncService;

  const makeService = (opts: Partial<ConstructorParameters<typeof OfflineSyncService>[0]> = {}) =>
    new OfflineSyncService({
      storage: storageAdapter,
      apiClient: mockApiClient as unknown as ApiClientAdapter,
      autoSync: false,
      maxRetries: 3,
      storageKey: 'idem_test_queue',
      idMapKey: 'idem_test_id_map',
      ...opts,
    });

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    mockApiClient = { request: vi.fn() };
    storageAdapter = new LocalStorageAdapter();
    service = makeService();
  });

  afterEach(async () => {
    await service.clearQueue();
    service.destroy();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Geração e persistência da chave', () => {
    it('enqueue atribui idempotencyKey estável no formato idem_<uuid> e persiste no storage', async () => {
      service.setOnlineState(false);
      const item = await service.enqueueCreateLead({ name: 'Transportadora Alfa' });

      expect(item.idempotencyKey).toMatch(/^idem_[0-9a-f-]{36}$/);
      expect(generateIdempotencyKey()).not.toBe(item.idempotencyKey);

      const saved = JSON.parse(storageAdapter.getItem('idem_test_queue')!);
      expect(saved[0].idempotencyKey).toBe(item.idempotencyKey);
    });

    it('operações distintas geram keys distintas', async () => {
      service.setOnlineState(false);
      const lead = await service.enqueueCreateLead({ name: 'Lead A' });
      const note = await service.enqueueCreateNote('lead-real-1', {
        content: 'nota',
        author: 'SDR',
      });
      const audio = await service.enqueueFieldMeetingAudio({
        title: 'Reunião de campo',
        audioData: 'QUJD',
        audioMimeType: 'audio/webm',
        audioSizeBytes: 3,
        consentGranted: true,
      });
      const generic = await service.enqueue({
        type: 'GENERIC_MUTATION',
        endpoint: '/api/custom',
        method: 'POST',
        payload: { a: 1 },
      });

      const keys = [lead, note, audio, generic].map((i) => i.idempotencyKey);
      expect(new Set(keys).size).toBe(4);
      for (const key of keys) expect(key).toMatch(/^idem_/);
    });

    it('item legado sem idempotencyKey recebe backfill estável no load', async () => {
      storageAdapter.setItem(
        'idem_test_queue',
        JSON.stringify([
          {
            id: 'op_legado',
            type: 'CREATE_LEAD',
            endpoint: '/api/leads',
            method: 'POST',
            payload: { name: 'Legado' },
            timestamp: 1,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
          },
        ]),
      );

      const legacyService = makeService();
      service.setOnlineState(true);
      mockApiClient.request.mockResolvedValueOnce({ id: 'lead_legado' });

      await legacyService.syncQueue();
      legacyService.destroy();

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { [HEADER]: expect.stringMatching(/^idem_/) },
        }),
      );
    });
  });

  describe('Header propagado em todos os tipos do outbox', () => {
    it.each([
      {
        name: 'CREATE_LEAD',
        setup: async (s: OfflineSyncService) =>
          s.enqueueCreateLead({ name: 'Lead X' }),
        mockResponse: { id: 'lead_real_1' },
      },
      {
        name: 'UPDATE_LEAD',
        setup: async (s: OfflineSyncService) =>
          s.enqueueUpdateLead('lead-real-9', { status: 'Qualificação' }),
        mockResponse: { id: 'lead-real-9' },
      },
      {
        name: 'CREATE_NOTE',
        setup: async (s: OfflineSyncService) =>
          s.enqueueCreateNote('lead-real-9', { content: 'nota', author: 'SDR' }),
        mockResponse: { id: 'note_1' },
      },
      {
        name: 'FIELD_MEETING_AUDIO',
        setup: async (s: OfflineSyncService) =>
          s.enqueueFieldMeetingAudio({
            title: 'Reunião',
            audioData: 'QUJD',
            audioMimeType: 'audio/webm',
            audioSizeBytes: 3,
            consentGranted: true,
          }),
        mockResponse: { id: 'meeting_1' },
      },
      {
        name: 'GENERIC_MUTATION',
        setup: async (s: OfflineSyncService) =>
          s.enqueue({
            type: 'GENERIC_MUTATION',
            endpoint: '/api/custom-thing',
            method: 'POST',
            payload: { v: 1 },
          }),
        mockResponse: { id: 'thing_1' },
      },
    ])('$name envia X-Idempotency-Key igual à chave persistida do item', async (tc) => {
      service.setOnlineState(false);
      const item = await tc.setup(service);
      service.setOnlineState(true);
      mockApiClient.request.mockResolvedValueOnce(tc.mockResponse);

      const result = await service.syncQueue();

      expect(result.succeeded).toBe(1);
      expect(mockApiClient.request).toHaveBeenCalledTimes(1);
      const callArg = mockApiClient.request.mock.calls[0][0];
      expect(callArg.headers).toEqual({ [HEADER]: item.idempotencyKey });
    });
  });

  describe('Estabilidade da chave em retries e reconexão', () => {
    it('retry após falha transitória reenvia a MESMA idempotencyKey', async () => {
      service.setOnlineState(true);
      const item = await service.enqueueCreateLead({ name: 'Lead Retry' });

      // 1ª tentativa: falha ambígua de rede (pode ter commitado no servidor)
      mockApiClient.request.mockRejectedValueOnce(
        new Error('Não foi possível conectar ao servidor.'),
      );
      await service.syncQueue();

      // 2ª tentativa (reconexão): sucesso
      mockApiClient.request.mockResolvedValueOnce({ id: 'lead_retry_ok' });
      await service.syncQueue();

      expect(mockApiClient.request).toHaveBeenCalledTimes(2);
      const key1 = mockApiClient.request.mock.calls[0][0].headers[HEADER];
      const key2 = mockApiClient.request.mock.calls[1][0].headers[HEADER];
      expect(key1).toBe(item.idempotencyKey);
      expect(key2).toBe(item.idempotencyKey);
      expect(key1).toBe(key2);
    });

    it('restart do app (novo service sobre o mesmo storage) preserva a key e reenvia igual', async () => {
      service.setOnlineState(false);
      const item = await service.enqueueCreateLead({ name: 'Lead Persistido' });
      const originalKey = item.idempotencyKey!;

      // Simula reinício: nova instância sobre o mesmo storage
      const restarted = makeService();
      restarted.setOnlineState(true);
      mockApiClient.request.mockResolvedValueOnce({ id: 'lead_after_restart' });

      await restarted.syncQueue();

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { [HEADER]: originalKey } }),
      );
      restarted.destroy();
    });

    it('retryFailed (reprocessamento manual) preserva a idempotencyKey', async () => {
      service.setOnlineState(true);
      const item = await service.enqueueCreateLead({ name: 'Lead Manual Retry' });

      mockApiClient.request.mockRejectedValueOnce(new Error('Falha de validação 400'));
      await service.syncQueue();
      expect(service.getFailedItems()).toHaveLength(1);

      mockApiClient.request.mockResolvedValueOnce({ id: 'lead_manual_ok' });
      await service.retryFailed();

      const callArg = mockApiClient.request.mock.calls[1][0];
      expect(callArg.headers[HEADER]).toBe(item.idempotencyKey);
    });

    it('item permanece com a mesma key após esgotar retries (fila failed)', async () => {
      service.setOnlineState(true);
      const item = await service.enqueueCreateLead({ name: 'Lead Esgotado' });
      mockApiClient.request.mockRejectedValue(
        new Error('Não foi possível conectar ao servidor.'),
      );

      await service.syncQueue();
      await service.syncQueue();
      await service.syncQueue();

      const failed = service.getFailedItems()[0];
      expect(failed.status).toBe('failed');
      expect(failed.idempotencyKey).toBe(item.idempotencyKey);
      for (const call of mockApiClient.request.mock.calls) {
        expect(call[0].headers[HEADER]).toBe(item.idempotencyKey);
      }
    });
  });

  describe('Isolamento multi-tenant', () => {
    it('services com tenantId distinto usam storage namespacado e filas independentes', async () => {
      // Services SEM storageKey explícito: o tenantId deve namespacar as chaves default.
      const svcA = new OfflineSyncService({
        storage: storageAdapter,
        apiClient: mockApiClient as unknown as ApiClientAdapter,
        autoSync: false,
        tenantId: 'org-alpha',
      });
      const svcB = new OfflineSyncService({
        storage: storageAdapter,
        apiClient: mockApiClient as unknown as ApiClientAdapter,
        autoSync: false,
        tenantId: 'org-beta',
      });

      svcA.setOnlineState(false);
      svcB.setOnlineState(false);

      const itemA = await svcA.enqueueCreateLead({ name: 'Lead Org A' });
      await svcB.enqueueCreateLead({ name: 'Lead Org B' });

      expect(svcA.getPendingCount()).toBe(1);
      expect(svcB.getPendingCount()).toBe(1);
      // Fila da org A não contém operação da org B e vice-versa
      expect(svcA.getQueue()[0].id).toBe(itemA.id);
      expect(svcB.getQueue()[0].id).not.toBe(itemA.id);

      // Keys distintas entre tenants (UUID aleatório — colisão desprezível)
      expect(svcA.getQueue()[0].idempotencyKey).not.toBe(svcB.getQueue()[0].idempotencyKey);

      // Chaves de storage namespacadas por tenant
      const rawA = storageAdapter.getItem('birthhub_offline_sync_queue_v1:org-alpha');
      const rawB = storageAdapter.getItem('birthhub_offline_sync_queue_v1:org-beta');
      const rawDefault = storageAdapter.getItem('birthhub_offline_sync_queue_v1');
      expect(JSON.parse(rawA!)).toHaveLength(1);
      expect(JSON.parse(rawB!)).toHaveLength(1);
      expect(JSON.parse(rawA!)[0].payload.name).toBe('Lead Org A');
      expect(JSON.parse(rawB!)[0].payload.name).toBe('Lead Org B');
      expect(rawDefault).toBeNull();

      svcA.destroy();
      svcB.destroy();
    });

    it('idempotencyKey é opaca — não carrega tenant, usuário ou PII', async () => {
      service.setOnlineState(false);
      const item = await service.enqueueCreateLead({
        name: 'Cliente Sigiloso',
        organizationId: 'org-secreta-123',
      });

      expect(item.idempotencyKey).toMatch(/^idem_[0-9a-f-]{36}$/);
      expect(item.idempotencyKey).not.toContain('org-secreta-123');
      expect(item.idempotencyKey).not.toContain('Cliente Sigiloso');
    });
  });

  describe('defaultApiClient — propagação real do header até o fetch', () => {
    it('repassa X-Idempotency-Key como header HTTP na requisição', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { id: 'lead_http_ok' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('token');
      }

      const result = await defaultApiClient.request<{ id: string }>({
        endpoint: '/api/leads',
        method: 'POST',
        body: { name: 'Lead HTTP' },
        headers: { [HEADER]: 'idem_11111111-2222-3333-4444-555555555555' },
      });

      expect(result).toEqual({ id: 'lead_http_ok' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const sentHeaders = init.headers as Record<string, string>;
      expect(sentHeaders[HEADER]).toBe('idem_11111111-2222-3333-4444-555555555555');
      expect(sentHeaders['Content-Type']).toBe('application/json');
    });

    it('funciona sem headers (retrocompatibilidade do adapter)', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await defaultApiClient.request({
        endpoint: '/api/leads',
        method: 'POST',
        body: { name: 'Sem header' },
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const sentHeaders = init.headers as Record<string, string>;
      expect(sentHeaders[HEADER]).toBeUndefined();
    });
  });
});

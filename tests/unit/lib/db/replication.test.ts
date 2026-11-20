import { describe, expect, it, vi } from 'vitest';
import {
  ReplicationConsistencyChecker,
  StaleReplicaReadError,
  type NodeDataSource,
} from '../../../../src/lib/db/replication.js';

describe('Database Replication Consistency & Read-After-Write (Agente 06 Gael)', () => {
  it('fails with StaleReplicaReadError if replica read returns stale/obsolete version', async () => {
    const checker = new ReplicationConsistencyChecker();

    const mockPrimary: NodeDataSource<{ id: string; name: string }> = {
      write: vi.fn().mockResolvedValue({
        data: { id: 'lead-1', name: 'Lead Atualizado' },
        version: 2,
        committedAt: Date.now(),
      }),
      read: vi.fn(),
    };

    // Replica still holds stale version 1
    const mockReplica: NodeDataSource<{ id: string; name: string }> = {
      write: vi.fn(),
      read: vi.fn().mockResolvedValue({
        data: { id: 'lead-1', name: 'Lead Antigo' },
        version: 1,
        committedAt: Date.now() - 150,
      }),
    };

    await expect(
      checker.verifyReadAfterWrite(mockPrimary, mockReplica, {
        id: 'lead-1',
        name: 'Lead Atualizado',
      }),
    ).rejects.toThrow(StaleReplicaReadError);
  });

  it('succeeds when replica has synchronized and reflects latest version', async () => {
    const checker = new ReplicationConsistencyChecker();
    const now = Date.now();

    const mockPrimary: NodeDataSource<{ id: string; name: string }> = {
      write: vi.fn().mockResolvedValue({
        data: { id: 'lead-2', name: 'Lead Sincronizado' },
        version: 5,
        committedAt: now,
      }),
      read: vi.fn(),
    };

    const mockReplica: NodeDataSource<{ id: string; name: string }> = {
      write: vi.fn(),
      read: vi.fn().mockResolvedValue({
        data: { id: 'lead-2', name: 'Lead Sincronizado' },
        version: 5,
        committedAt: now,
      }),
    };

    const result = await checker.verifyReadAfterWrite(mockPrimary, mockReplica, {
      id: 'lead-2',
      name: 'Lead Sincronizado',
    });

    expect(result.replicaRecord.version).toBe(5);
    expect(result.replicaRecord.data.name).toBe('Lead Sincronizado');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Handoff 16→00 (onda-3 / waveE): produtores do DomainEventMesh devem publicar com
// `opts.idempotencyKey` estável — identidade do fato de negócio, nunca randomUUID
// solto. Este teste cobre o call site de knowledge que ficou fora do grep inicial:
// AccountKnowledgeGraphService.addRelationship → GRAPH_RELATIONSHIP_UPDATED.

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
}));

vi.mock('../../../../lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: mocks.publish },
}));

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { InMemoryAccountGraphRepository } from '../../infra/accountGraphRepository.js';
import { AccountKnowledgeGraphService } from '../accountKnowledgeGraph.service.js';

function lastPublishCall() {
  const call = mocks.publish.mock.calls.at(-1);
  expect(call).toBeDefined();
  return { event: call![0], opts: call![1] };
}

describe('AccountKnowledgeGraphService — GRAPH_RELATIONSHIP_UPDATED com idempotencyKey estável', () => {
  const orgId = 'org-graph-idem-001';

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.publish.mockResolvedValue({ eventId: 'evt-1' });
  });

  async function seedEndpoints() {
    const service = new AccountKnowledgeGraphService(new InMemoryAccountGraphRepository());
    await service.upsertNode({
      id: 'acc-1',
      organizationId: orgId,
      type: 'account',
      label: 'Conta Alfa',
    });
    await service.upsertNode({
      id: 'cont-1',
      organizationId: orgId,
      type: 'contact',
      label: 'Contato Beta',
    });
    return service;
  }

  const edgeInput = {
    organizationId: orgId,
    sourceId: 'cont-1',
    targetId: 'acc-1',
    type: 'WORKS_AT' as const,
    confidence: 'confirmed' as const,
    source: 'crm',
  };

  it('publica com chave determinística derivada da tupla da relação (não do edge.id aleatório)', async () => {
    const service = await seedEndpoints();

    await service.addRelationship(edgeInput);
    const first = lastPublishCall();

    expect(first.event.eventType).toBe('GRAPH_RELATIONSHIP_UPDATED');
    // edge.id é `edge-${randomUUID()}` — a chave NÃO pode depender dele, senão retry nunca colide.
    expect(first.opts.idempotencyKey).toBe('graph-relationship:cont-1:acc-1:WORKS_AT');
    expect(first.opts.idempotencyKey).not.toContain('edge-');
  });

  it('mesma relação republicada gera a mesma chave (retry/replay deduplica na outbox)', async () => {
    const service = await seedEndpoints();

    await service.addRelationship(edgeInput);
    await service.addRelationship(edgeInput);

    const calls = mocks.publish.mock.calls;
    expect(calls).toHaveLength(2);
    // Arestas distintas (edge.id novo), mas a mesma chave de idempotência.
    const edgeIds = calls.map((c) => (c[0] as { payload: { edgeId: string } }).payload.edgeId);
    expect(new Set(edgeIds).size).toBe(2);
    expect(calls[0][1].idempotencyKey).toBe(calls[1][1].idempotencyKey);
  });

  it('relações distintas (tipo diferente) geram chaves distintas', async () => {
    const service = await seedEndpoints();

    await service.addRelationship(edgeInput);
    await service.addRelationship({ ...edgeInput, type: 'INFLUENCES' });

    const calls = mocks.publish.mock.calls;
    expect(calls[0][1].idempotencyKey).toBe('graph-relationship:cont-1:acc-1:WORKS_AT');
    expect(calls[1][1].idempotencyKey).toBe('graph-relationship:cont-1:acc-1:INFLUENCES');
  });
});

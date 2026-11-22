/**
 * Roteador semântico do Swarm: executa o grafo real do supervisor (checkpointer em memória e
 * dependências externas mockadas) para cobrir semanticRouterNode e os reducers de subSwarm,
 * catalogMatches e selectedCatalogAgent.
 */
import { MemorySaver } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../src/lib/ai/checkpointer.js', () => ({
  checkpointer: new MemorySaver(),
  ensureCheckpointerReady: vi.fn(async () => undefined),
}));
vi.mock('../../../../../src/lib/ai/gateway.js', () => ({
  getAiModel: vi.fn(() => ({ invoke: vi.fn(async () => ({ content: '' })) })),
  logAiUsage: vi.fn(async () => undefined),
}));
vi.mock('../../../../../src/lib/async-context.js', () => ({ getTenantId: () => 'org-test' }));
vi.mock('../../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../../../src/features/intelligence/services/guardrails.service.js', () => ({
  assertPiiExternalConsent: vi.fn(),
}));
vi.mock('../../../../../src/features/intelligence/agents/bdr.agent.js', () => ({ BDRAgent: class {} }));
vi.mock('../../../../../src/features/intelligence/agents/closer.agent.js', () => ({ CloserAgent: class {} }));
vi.mock('../../../../../src/features/intelligence/agents/crm.agent.js', () => ({ CRMAgent: class {} }));
vi.mock('../../../../../src/features/intelligence/agents/ops.agent.js', () => ({ OpsAgent: class {} }));
vi.mock('../../../../../src/features/intelligence/agents/sdrQualification.agent.js', () => ({
  SDRQualificationAgent: class {},
}));
vi.mock('../../../../../src/features/intelligence/agents/fallback.util.js', () => ({
  buildModelWithFallback: () => ({
    withStructuredOutput: () => ({
      invoke: async () => ({
        raw: {},
        parsed: {
          action: 'finish',
          subSwarm: 'marketing',
          catalogAgentCode: 'MKT-001',
          instruction: '',
          reasoning: 'missão atendida',
        },
      }),
    }),
  }),
}));

const { SwarmOrchestrator, supervisorNode, SWARM_MAX_STEPS } = await import('../../../../../src/features/intelligence/agents/supervisor.agent.js');

type Ev = { type: string; agent: string; content: string };

describe('SwarmOrchestrator — roteamento semântico', () => {
  it('emite evento de roteamento semântico antes do supervisor e finaliza', async () => {
    const events: Ev[] = [];
    await new SwarmOrchestrator().executeMissionStream(
      'Criar campanha de marketing de conteúdo para geração de leads no LinkedIn',
      'sess-1',
      (e) => events.push(e as unknown as Ev),
    );
    expect(events[0].type).toBe('routing');
    expect(events[0].content).toMatch(/^Roteamento semântico dinâmico: Sub-Swarm '/);
    expect(events.at(-1)?.type).toBe('final');
  });

  it('executeMission percorre o grafo e devolve as mensagens', async () => {
    const msgs = await new SwarmOrchestrator().executeMission('Missão genérica', 'sess-2');
    expect(msgs.length).toBeGreaterThan(1);
  });

  it('supervisorNode encerra deterministicamente ao exceder o limite de etapas', async () => {
    const out = await supervisorNode(
      { step: SWARM_MAX_STEPS } as Parameters<typeof supervisorNode>[0],
      { configurable: { thread_id: 'org-test:sess-3' } },
    );
    expect(out.next).toBe('finish');
    expect(out.step).toBe(SWARM_MAX_STEPS + 1);
  });
});

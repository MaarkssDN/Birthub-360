import { afterEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, unknown> = { AI_PII_EXTERNAL_CONSENT_ORGANIZATIONS: '*' };
vi.mock('../../../../config/env.js', () => ({ env: mockEnv }));
vi.mock('../../../../lib/ai/budget.js', () => ({
  assertAiBudgetNotExceeded: vi.fn(),
}));
vi.mock('../fallback.util.js', () => ({
  buildModelWithFallback: vi.fn(),
}));
// Onda 6 / MEL-44: sem este mock, o caminho de falha do gate de orçamento chama
// recordAgentFailure → saveAgentMemory → prisma.agentMemory.upsert contra o DATABASE_URL dummy
// do setup unitário (localhost:5432, nada escutando). O pool do pg fica ~25s em retries de
// conexão antes do ECONNREFUSED — o teste "passava" em ~27s e estourava timeout em ambientes
// mais lentos/ocupados (flake reportado). A persistência de memória não é o que este teste
// prova (é o bloqueio do orçamento antes de montar modelo), então mockamos a store inteira.
vi.mock('../agentMemory.store.js', () => ({
  saveAgentMemory: vi.fn().mockResolvedValue(undefined),
  recordAgentFailure: vi.fn().mockResolvedValue(undefined),
  loadAgentMemory: vi.fn().mockResolvedValue(null),
}));
// gateway.js e checkpointer.ts ficam DEPOIS do gate de orçamento no fluxo de AgentExecutor —
// o teste prova justamente que a execução para antes deles. Sem os mocks, o import estático
// avalia o grafo inteiro do gateway (semanticCache → Redis, providers LiteLLM, prisma) e do
// PostgresSaver a cada execução do arquivo, o que dominava o tempo do teste em máquinas
// carregadas e era a outra metade do flake de timeout.
vi.mock('../../../../lib/ai/gateway.js', () => ({
  getAiModel: vi.fn(),
  logAiUsage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../lib/ai/checkpointer.js', () => ({
  checkpointer: {},
  ensureCheckpointerReady: vi.fn().mockResolvedValue(undefined),
  closeCheckpointerPool: vi.fn().mockResolvedValue(undefined),
  __resetCheckpointerSetupForTests: vi.fn(),
}));

/**
 * AI-011: `BaseAgent.runWithTools` (base.agent.ts) fala direto com LangChain/Groq via
 * `buildModelWithFallback` (fallback.util.ts), sem passar pelo gateway central — precisa da própria
 * checagem de orçamento, não herda a de `getAiModel().invoke()` (coberta em
 * src/lib/ai/__tests__/gateway.test.ts). BDR é o agente mais simples que usa este caminho
 * (`run()` delega direto para `runWithTools` com uma única ferramenta).
 *
 * Mock de env acima com consentimento liberado ('*'): desde AI-007 (parte 2, onda 33),
 * `runWithTools` checa a trava de consentimento LGPD (guardrails.service.ts) ANTES da checagem de
 * orçamento — sem isto, este teste bloquearia no gate errado e nunca chegaria a exercitar o
 * circuit breaker de orçamento que ele existe para provar.
 */
describe('BaseAgent.runWithTools — AI-011 (orçamento mensal de IA)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bloqueia antes de montar qualquer modelo de IA quando o orçamento mensal foi excedido', async () => {
    const { assertAiBudgetNotExceeded } = await import('../../../../lib/ai/budget.js');
    const fallbackUtil = await import('../fallback.util.js');
    vi.mocked(assertAiBudgetNotExceeded).mockRejectedValueOnce(
      new Error('Orçamento mensal de IA excedido (teste)'),
    );
    const buildSpy = vi.spyOn(fallbackUtil, 'buildModelWithFallback');

    const { requestContext } = await import('../../../../lib/async-context.js');
    const { BDRAgent } = await import('../bdr.agent.js');
    const agent = new BDRAgent();

    const result = await requestContext.run({ tenantId: 'org-budget-test' }, () =>
      agent.run('Dados do lead de teste', 'session-budget-test'),
    );

    expect(result.error).toContain('Orçamento mensal de IA excedido (teste)');
    expect(buildSpy).not.toHaveBeenCalled();
  }, 90_000);
});

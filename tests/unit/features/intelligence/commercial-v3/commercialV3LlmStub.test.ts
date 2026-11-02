import { afterEach, describe, expect, it, vi } from 'vitest';

const { generateStructuredOutput } = vi.hoisted(() => ({ generateStructuredOutput: vi.fn() }));
vi.mock('../../../../../src/lib/ai/gateway.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, generateStructuredOutput };
});

const { commercialAgentV3Orchestrator, isCommercialV3LlmStubEnabled } = await import(
  '../../../../../src/features/intelligence/commercial-v3/services/commercialAgentV3Orchestrator.service.js'
);

describe('stub determinístico do LLM da Comercial V3.1', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    generateStructuredOutput.mockReset();
  });

  it('só liga com a flag e fora de produção', () => {
    expect(isCommercialV3LlmStubEnabled({ COMMERCIAL_V3_LLM_STUB: 'true', NODE_ENV: 'test' })).toBe(true);
    expect(isCommercialV3LlmStubEnabled({ COMMERCIAL_V3_LLM_STUB: 'true', NODE_ENV: 'production' })).toBe(false);
    expect(isCommercialV3LlmStubEnabled({ NODE_ENV: 'test' })).toBe(false);
    expect(isCommercialV3LlmStubEnabled({ COMMERCIAL_V3_LLM_STUB: 'false', NODE_ENV: 'test' })).toBe(false);
  });

  it('com o stub ativo não chama o gateway e devolve o envelope consultivo', async () => {
    vi.stubEnv('COMMERCIAL_V3_LLM_STUB', 'true');
    vi.stubEnv('NODE_ENV', 'test');
    const res = await commercialAgentV3Orchestrator.dispatchMission({
      agentId: 'sdr',
      mission: 'Qualificar lead ACME',
      organizationId: 'org-stub',
      userId: 'user-stub',
    });
    expect(generateStructuredOutput).not.toHaveBeenCalled();
    expect(res.mode).toBe('CONSULTIVO');
    expect(res.compliance.sendEligible).toBe(false);
    expect(res.execution.performed).toBe(false);
  });
});

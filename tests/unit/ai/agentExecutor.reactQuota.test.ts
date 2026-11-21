/**
 * DEBT-0012 — Governança FinOps / Quota / Telemetria por iteração no loop ReAct (`executeWithTools`).
 *
 * Verifica que:
 * 1. Em um loop ReAct com múltiplas chamadas ao LLM (tool calling -> resposta final),
 *    `tokenQuotaService.enforceTokenQuota`, `assertAiBudgetNotExceeded`, `logAiUsage`,
 *    `tokenQuotaService.recordUsage` e `recordAiUsageCost` são acionados a cada iteração do loop.
 * 2. Quando a quota estoura na 2ª iteração do loop, a execução aborta imediatamente antes da 2ª
 *    inferência do LLM com erro observável de quota, registrando falha (`recordAgentFailure`) e
 *    sem persistir resposta truncada/parcial como concluída (`saveAgentMemory`).
 */

import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { BaseChatModel, type BindToolsInput } from '@langchain/core/language_models/chat_models';
import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import type { ChatResult } from '@langchain/core/outputs';
import { tool } from '@langchain/core/tools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  type AgentExecutionConfig,
  type AgentExecutionContext,
  AgentExecutor,
} from '../../../src/features/intelligence/agents/execution/AgentExecutor.js';
import { AiTokenQuotaExceededError } from '../../../src/lib/ai/finops/tokenQuota.service.js';

const {
  enforceTokenQuotaMock,
  recordUsageMock,
  assertAiBudgetNotExceededMock,
  ensureCheckpointerReadyMock,
  assertPiiExternalConsentMock,
  recordAgentFailureMock,
  saveAgentMemoryMock,
  getLearningProfileMock,
  logAiUsageMock,
  recordAiUsageCostMock,
  buildModelWithFallbackMock,
} = vi.hoisted(() => ({
  enforceTokenQuotaMock: vi.fn(),
  recordUsageMock: vi.fn().mockResolvedValue(undefined),
  assertAiBudgetNotExceededMock: vi.fn().mockResolvedValue(undefined),
  ensureCheckpointerReadyMock: vi.fn().mockResolvedValue(undefined),
  assertPiiExternalConsentMock: vi.fn(),
  recordAgentFailureMock: vi.fn().mockResolvedValue(undefined),
  saveAgentMemoryMock: vi.fn().mockResolvedValue(undefined),
  getLearningProfileMock: vi.fn().mockResolvedValue(null),
  logAiUsageMock: vi.fn().mockResolvedValue(undefined),
  recordAiUsageCostMock: vi.fn(),
  buildModelWithFallbackMock: vi.fn(),
}));

vi.mock('../../../src/features/intelligence/services/guardrails.service.js', () => ({
  assertPiiExternalConsent: assertPiiExternalConsentMock,
}));

vi.mock('../../../src/lib/ai/budget.js', () => ({
  assertAiBudgetNotExceeded: assertAiBudgetNotExceededMock,
}));

vi.mock('../../../src/lib/ai/checkpointer.js', async () => {
  const { MemorySaver } = await import('@langchain/langgraph');
  return {
    checkpointer: new MemorySaver(),
    ensureCheckpointerReady: ensureCheckpointerReadyMock,
  };
});

vi.mock('../../../src/features/intelligence/agents/agentMemory.store.js', () => ({
  recordAgentFailure: recordAgentFailureMock,
  saveAgentMemory: saveAgentMemoryMock,
}));

vi.mock('../../../src/features/intelligence/agents/learning.agent.js', () => ({
  getLearningProfile: getLearningProfileMock,
}));

vi.mock('../../../src/lib/ai/finops/tokenQuota.service.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../src/lib/ai/finops/tokenQuota.service.js')>();
  return {
    ...actual,
    tokenQuotaService: {
      enforceTokenQuota: enforceTokenQuotaMock,
      recordUsage: recordUsageMock,
    },
  };
});

vi.mock('../../../src/lib/ai/gateway.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/ai/gateway.js')>();
  return {
    ...actual,
    logAiUsage: logAiUsageMock,
  };
});

vi.mock('../../../src/lib/ai/metrics.js', () => ({
  recordAiUsageCost: recordAiUsageCostMock,
  recordAiPricingFallback: vi.fn(),
}));

vi.mock('../../../src/features/intelligence/agents/fallback.util.js', () => ({
  buildModelWithFallback: buildModelWithFallbackMock,
}));

interface ScriptedTurn {
  message: AIMessage;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  modelName?: string;
}

class ScriptedReactChatModel extends BaseChatModel {
  private turnIndex = 0;
  public generateCallCount = 0;

  constructor(private readonly turns: ScriptedTurn[]) {
    super({});
  }

  _llmType(): string {
    return 'scripted-react-chat-model';
  }

  override bindTools(_tools: BindToolsInput[]): this {
    return this;
  }

  async _generate(
    _messages: BaseMessage[],
    _options: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    this.generateCallCount += 1;
    const turn = this.turns[this.turnIndex] ?? this.turns[this.turns.length - 1];
    this.turnIndex += 1;

    return {
      generations: [
        {
          text: typeof turn.message.content === 'string' ? turn.message.content : '',
          message: turn.message,
        },
      ],
      llmOutput: {
        modelName: turn.modelName ?? 'openai/gpt-oss-20b',
        tokenUsage: turn.tokenUsage,
      },
    };
  }
}

describe('AgentExecutor.executeWithTools — governança por iteração do loop ReAct (DEBT-0012)', () => {
  const lookupLeadTool = tool(
    async ({ leadId }: { leadId: string }) =>
      JSON.stringify({ leadId, company: 'ACME Health', stage: 'Qualificacao_SDR' }),
    {
      name: 'lookup_lead',
      description: 'Consulta dados do lead no CRM',
      schema: z.object({
        leadId: z.string(),
      }),
    },
  );

  const baseContext: AgentExecutionContext = {
    agentType: 'BDR',
    sessionId: 'react-quota-session-1',
    organizationId: 'org-react-123',
    userId: 'user-react-123',
    inputData: 'Qualifique o lead lead-42',
    toolsModelName: 'openai/gpt-oss-20b',
  };

  const baseConfig: AgentExecutionConfig = {
    useTools: true,
    tools: [lookupLeadTool],
    buildSystemPrompt: () => 'Você é o agente BDR do Birth Hub 360.',
    buildHumanMessage: (input) => `Missão: ${input}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    assertPiiExternalConsentMock.mockImplementation(() => undefined);
    assertAiBudgetNotExceededMock.mockResolvedValue(undefined);
    ensureCheckpointerReadyMock.mockResolvedValue(undefined);
    recordAgentFailureMock.mockResolvedValue(undefined);
    saveAgentMemoryMock.mockResolvedValue(undefined);
    getLearningProfileMock.mockResolvedValue(null);
    logAiUsageMock.mockResolvedValue(undefined);
    recordUsageMock.mockResolvedValue(undefined);
    enforceTokenQuotaMock.mockResolvedValue({
      allowed: true,
      status: 'ok',
      organizationId: 'org-react-123',
      tier: 'pro',
      consumedTokens: 1_000,
      quotaTokens: 3_000_000,
      percentageUsed: 0.03,
      usageRatio: 0.0003,
      action: 'allow',
      requestedModel: 'openai/gpt-oss-20b',
      effectiveModel: 'openai/gpt-oss-20b',
      warningAlertTriggered: false,
      exceededAlertTriggered: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aciona enforceTokenQuota, assertAiBudgetNotExceeded, logAiUsage e recordUsage a cada iteração do loop ReAct', async () => {
    const scriptedModel = new ScriptedReactChatModel([
      {
        message: new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_lead_1',
              name: 'lookup_lead',
              args: { leadId: 'lead-42' },
              type: 'tool_call',
            },
          ],
        }),
        tokenUsage: { promptTokens: 45, completionTokens: 15, totalTokens: 60 },
      },
      {
        message: new AIMessage({
          content: 'Lead ACME Health qualificado com sucesso no estágio Qualificacao_SDR.',
        }),
        tokenUsage: { promptTokens: 80, completionTokens: 25, totalTokens: 105 },
      },
    ]);

    buildModelWithFallbackMock.mockReturnValue(scriptedModel);

    const result = await AgentExecutor.executeWithTools(baseContext, baseConfig);

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(
      'Lead ACME Health qualificado com sucesso no estágio Qualificacao_SDR.',
    );
    expect(scriptedModel.generateCallCount).toBe(2);

    // enforceTokenQuota chamado 1x por iteração do LLM (2 iterações no total)
    expect(enforceTokenQuotaMock).toHaveBeenCalledTimes(2);
    expect(enforceTokenQuotaMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        organizationId: 'org-react-123',
        requestedModel: 'openai/gpt-oss-20b',
        estimatedTokens: expect.any(Number),
      }),
    );
    expect(enforceTokenQuotaMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        organizationId: 'org-react-123',
        requestedModel: 'openai/gpt-oss-20b',
        estimatedTokens: expect.any(Number),
      }),
    );

    // assertAiBudgetNotExceeded: 1x no Gate inicial + 1x por iteração do LLM (total 3)
    expect(assertAiBudgetNotExceededMock).toHaveBeenCalledTimes(3);

    // logAiUsage chamado ao final de cada iteração do LLM com os tokens reais daquela chamada
    expect(logAiUsageMock).toHaveBeenCalledTimes(2);
    expect(logAiUsageMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: 'openai/gpt-oss-20b',
        usage: { promptTokens: 45, completionTokens: 15, totalTokens: 60 },
        agentRole: 'BDR',
      }),
    );
    expect(logAiUsageMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: 'openai/gpt-oss-20b',
        usage: { promptTokens: 80, completionTokens: 25, totalTokens: 105 },
        agentRole: 'BDR',
      }),
    );

    // Consumo incremental registrado no TokenQuotaService e métricas de custo a cada iteração
    expect(recordUsageMock).toHaveBeenCalledTimes(2);
    expect(recordUsageMock).toHaveBeenNthCalledWith(1, {
      organizationId: 'org-react-123',
      model: 'openai/gpt-oss-20b',
      tokens: 60,
    });
    expect(recordUsageMock).toHaveBeenNthCalledWith(2, {
      organizationId: 'org-react-123',
      model: 'openai/gpt-oss-20b',
      tokens: 105,
    });
    expect(recordAiUsageCostMock).toHaveBeenCalledTimes(2);

    // Memória final persistida apenas após o loop completar com sucesso
    expect(saveAgentMemoryMock).toHaveBeenCalledTimes(1);
    expect(saveAgentMemoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'react-quota-session-1',
        agentType: 'BDR',
        organizationId: 'org-react-123',
        status: 'Completed',
      }),
    );
  });

  it('aborta imediatamente na 2ª iteração quando a quota estoura no meio do loop, sem persistir resposta parcial', async () => {
    const scriptedModel = new ScriptedReactChatModel([
      {
        message: new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_lead_1',
              name: 'lookup_lead',
              args: { leadId: 'lead-42' },
              type: 'tool_call',
            },
          ],
        }),
        tokenUsage: { promptTokens: 120, completionTokens: 40, totalTokens: 160 },
      },
      {
        message: new AIMessage({
          content: 'Esta resposta nunca deve ser gerada pois a quota estourou antes.',
        }),
        tokenUsage: { promptTokens: 200, completionTokens: 50, totalTokens: 250 },
      },
    ]);

    buildModelWithFallbackMock.mockReturnValue(scriptedModel);

    const quotaError = new AiTokenQuotaExceededError(
      'org-react-123',
      500_000,
      500_000,
      'starter',
    );

    // 1ª iteração passa; 2ª iteração estoura a quota
    enforceTokenQuotaMock
      .mockResolvedValueOnce({
        allowed: true,
        status: 'warning',
        organizationId: 'org-react-123',
        tier: 'starter',
        consumedTokens: 499_900,
        quotaTokens: 500_000,
        percentageUsed: 99.98,
        usageRatio: 0.9998,
        action: 'allow',
        requestedModel: 'openai/gpt-oss-20b',
        effectiveModel: 'openai/gpt-oss-20b',
        warningAlertTriggered: true,
        exceededAlertTriggered: false,
      })
      .mockRejectedValueOnce(quotaError);

    const result = await AgentExecutor.executeWithTools(baseContext, baseConfig);

    // Deve retornar o erro observável de quota estourada e nenhum output parcial
    expect(result.output).toBeUndefined();
    expect(result.error).toBe(quotaError.message);
    expect(result.error).toContain('Quota mensal de tokens de IA atingida');

    // enforceTokenQuota foi chamado na 1ª e na 2ª iteração
    expect(enforceTokenQuotaMock).toHaveBeenCalledTimes(2);

    // O LLM só executou a 1ª geração; a 2ª foi abortada no handleLLMStart antes de _generate
    expect(scriptedModel.generateCallCount).toBe(1);

    // logAiUsage e recordUsage foram registrados apenas para a 1ª iteração que de fato ocorreu
    expect(logAiUsageMock).toHaveBeenCalledTimes(1);
    expect(recordUsageMock).toHaveBeenCalledTimes(1);

    // Não deve persistir memória parcial como 'Completed', e deve registrar a falha do agente
    expect(saveAgentMemoryMock).not.toHaveBeenCalled();
    expect(recordAgentFailureMock).toHaveBeenCalledWith({
      sessionId: 'react-quota-session-1',
      agentType: 'BDR',
      organizationId: 'org-react-123',
      errorMessage: quotaError.message,
    });
  });
});

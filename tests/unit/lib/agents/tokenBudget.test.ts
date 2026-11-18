import { describe, expect, it } from 'vitest';
import {
  AgentTokenBudgetTracker,
  TokenBudgetExceededException,
} from '../../../../src/lib/agents/tokenBudget.js';

describe('AgentTokenBudgetTracker — Governança de Limites de Tokens', () => {
  it('registra consumo acumulado dentro do limite permitido', () => {
    const tracker = new AgentTokenBudgetTracker({
      agentRole: 'sdr',
      correlationId: 'test-corr-1',
      maxTokensPerMission: 10_000,
      maxTokensPerTurn: 4_000,
    });

    tracker.recordUsage({
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    });

    expect(tracker.getAccumulatedTokens()).toBe(1500);
    expect(tracker.canConsume(8000)).toBe(true);
    expect(tracker.canConsume(9000)).toBe(false);

    tracker.recordUsage({
      promptTokens: 2000,
      completionTokens: 1000,
      totalTokens: 3000,
    });

    expect(tracker.getAccumulatedTokens()).toBe(4500);
  });

  it('lança TokenBudgetExceededException quando o limite por turno é excedido', () => {
    const tracker = new AgentTokenBudgetTracker({
      agentRole: 'sdr',
      correlationId: 'test-corr-turn',
      maxTokensPerMission: 20_000,
      maxTokensPerTurn: 2_000,
    });

    expect(() => {
      tracker.recordUsage({
        promptTokens: 1500,
        completionTokens: 1000,
        totalTokens: 2500,
      });
    }).toThrow(TokenBudgetExceededException);
  });

  it('lança TokenBudgetExceededException quando o limite da missão é excedido', () => {
    const tracker = new AgentTokenBudgetTracker({
      agentRole: 'closer',
      correlationId: 'test-corr-mission',
      maxTokensPerMission: 5_000,
      maxTokensPerTurn: 4_000,
    });

    tracker.recordUsage({
      promptTokens: 2000,
      completionTokens: 1000,
      totalTokens: 3000,
    });

    expect(() => {
      tracker.recordUsage({
        promptTokens: 1500,
        completionTokens: 1000,
        totalTokens: 2500,
      });
    }).toThrow(TokenBudgetExceededException);
  });
});

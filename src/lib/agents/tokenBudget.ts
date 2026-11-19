/**
 * src/lib/agents/tokenBudget.ts
 * Governança e controle de limites de tokens em runtime para agentes autônomos.
 *
 * Responsável por:
 * - Controlar teto de tokens por missão, turno e sessão
 * - Bloquear execuções que excedam o limite estabelecido (fail-closed)
 * - Observabilidade estruturada de consumo com correlationId e métricas
 */

import { logger } from '../logger.js';

export class TokenBudgetExceededException extends Error {
  constructor(
    public readonly correlationId: string,
    public readonly agentRole: string,
    public readonly tokensUsed: number,
    public readonly maxTokens: number,
  ) {
    super(
      `Limite de tokens excedido pelo agente '${agentRole}'! ` +
        `Consumo atual: ${tokensUsed} tokens, Limite permitido: ${maxTokens} tokens (correlationId: ${correlationId}).`,
    );
    this.name = 'TokenBudgetExceededException';
  }
}

export interface TokenUsageRecord {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenBudgetOptions {
  maxTokensPerMission?: number;
  maxTokensPerTurn?: number;
  agentRole: string;
  correlationId: string;
  organizationId?: string;
}

export class AgentTokenBudgetTracker {
  public static readonly DEFAULT_MAX_TOKENS_PER_MISSION = 32_000;
  public static readonly DEFAULT_MAX_TOKENS_PER_TURN = 8_000;

  private accumulatedTokens = 0;
  private readonly maxTokensPerMission: number;
  private readonly maxTokensPerTurn: number;
  private readonly agentRole: string;
  private readonly correlationId: string;
  private readonly organizationId?: string;

  constructor(options: TokenBudgetOptions) {
    this.agentRole = options.agentRole;
    this.correlationId = options.correlationId;
    this.organizationId = options.organizationId;
    this.maxTokensPerMission =
      options.maxTokensPerMission ?? AgentTokenBudgetTracker.DEFAULT_MAX_TOKENS_PER_MISSION;
    this.maxTokensPerTurn =
      options.maxTokensPerTurn ?? AgentTokenBudgetTracker.DEFAULT_MAX_TOKENS_PER_TURN;
  }

  /**
   * Retorna os tokens acumulados até o momento na missão.
   */
  public getAccumulatedTokens(): number {
    return this.accumulatedTokens;
  }

  /**
   * Registra o consumo de uma execução/turno e valida contra os tetos de token.
   * Lança TokenBudgetExceededException se o limite for ultrapassado.
   */
  public recordUsage(usage: TokenUsageRecord): void {
    const turnTokens = usage.totalTokens;

    if (turnTokens > this.maxTokensPerTurn) {
      logger.error(
        {
          correlationId: this.correlationId,
          agentRole: this.agentRole,
          organizationId: this.organizationId,
          turnTokens,
          maxTokensPerTurn: this.maxTokensPerTurn,
        },
        '[TokenBudget] Alerta crítico: Limite de tokens por turno excedido pelo agente',
      );
      throw new TokenBudgetExceededException(
        this.correlationId,
        this.agentRole,
        turnTokens,
        this.maxTokensPerTurn,
      );
    }

    this.accumulatedTokens += turnTokens;

    if (this.accumulatedTokens > this.maxTokensPerMission) {
      logger.error(
        {
          correlationId: this.correlationId,
          agentRole: this.agentRole,
          organizationId: this.organizationId,
          accumulatedTokens: this.accumulatedTokens,
          maxTokensPerMission: this.maxTokensPerMission,
        },
        '[TokenBudget] Alerta crítico: Limite total de tokens da missão excedido pelo agente',
      );
      throw new TokenBudgetExceededException(
        this.correlationId,
        this.agentRole,
        this.accumulatedTokens,
        this.maxTokensPerMission,
      );
    }

    logger.debug(
      {
        correlationId: this.correlationId,
        agentRole: this.agentRole,
        organizationId: this.organizationId,
        turnTokens,
        accumulatedTokens: this.accumulatedTokens,
        remainingBudget: this.maxTokensPerMission - this.accumulatedTokens,
      },
      '[TokenBudget] Consumo de tokens registrado com sucesso',
    );
  }

  /**
   * Valida se uma quantidade projetada de tokens pode ser consumida sem exceder o orçamento.
   */
  public canConsume(projectedTokens: number): boolean {
    return this.accumulatedTokens + projectedTokens <= this.maxTokensPerMission;
  }
}

/**
 * src/lib/agents/concurrencyControl.ts
 * Controle de concorrência em tempo de execução para agentes autônomos.
 *
 * Responsável por:
 * - Evitar saturação de recursos e esgotamento de rate limits em chamadas LLM
 * - Garantir limite máximo de agentes concorrentes por tenant e por papel de agente
 * - Fornecer semáforos assíncronos e liberação segura de locks via try/finally
 */

import { logger } from '../logger.js';

export class ConcurrencyLimitExceededException extends Error {
  constructor(
    public readonly tenantId: string,
    public readonly agentRole: string,
    public readonly currentActive: number,
    public readonly maxAllowed: number,
  ) {
    super(
      `Limite de concorrência excedido para o agente '${agentRole}' na organização '${tenantId}'! ` +
        `Ativos: ${currentActive}, Máximo permitido: ${maxAllowed}.`,
    );
    this.name = 'ConcurrencyLimitExceededException';
  }
}

export interface ConcurrencyLimiterOptions {
  maxConcurrentPerTenant?: number;
  maxConcurrentPerRole?: number;
}

export class AgentConcurrencyLimiter {
  public static readonly DEFAULT_MAX_CONCURRENT_PER_TENANT = 10;
  public static readonly DEFAULT_MAX_CONCURRENT_PER_ROLE = 5;

  private readonly activePerTenant = new Map<string, number>();
  private readonly activePerTenantRole = new Map<string, number>();

  private readonly maxConcurrentPerTenant: number;
  private readonly maxConcurrentPerRole: number;

  constructor(options?: ConcurrencyLimiterOptions) {
    this.maxConcurrentPerTenant =
      options?.maxConcurrentPerTenant ?? AgentConcurrencyLimiter.DEFAULT_MAX_CONCURRENT_PER_TENANT;
    this.maxConcurrentPerRole =
      options?.maxConcurrentPerRole ?? AgentConcurrencyLimiter.DEFAULT_MAX_CONCURRENT_PER_ROLE;
  }

  private getRoleKey(tenantId: string, agentRole: string): string {
    return `${tenantId}:${agentRole}`;
  }

  /**
   * Retorna a contagem atual de agentes ativos na organização.
   */
  public getActiveTenantCount(tenantId: string): number {
    return this.activePerTenant.get(tenantId) ?? 0;
  }

  /**
   * Retorna a contagem atual de agentes ativos para um determinado cargo na organização.
   */
  public getActiveRoleCount(tenantId: string, agentRole: string): number {
    return this.activePerTenantRole.get(this.getRoleKey(tenantId, agentRole)) ?? 0;
  }

  /**
   * Tenta adquirir um slot de execução concorrente para o agente.
   * Lança ConcurrencyLimitExceededException se o limite for atingido.
   */
  public acquireSlot(tenantId: string, agentRole: string): () => void {
    const currentTenantActive = this.getActiveTenantCount(tenantId);
    if (currentTenantActive >= this.maxConcurrentPerTenant) {
      logger.warn(
        { tenantId, agentRole, currentTenantActive, max: this.maxConcurrentPerTenant },
        '[ConcurrencyControl] Limite de concorrência da organização atingido',
      );
      throw new ConcurrencyLimitExceededException(
        tenantId,
        agentRole,
        currentTenantActive,
        this.maxConcurrentPerTenant,
      );
    }

    const currentRoleActive = this.getActiveRoleCount(tenantId, agentRole);
    if (currentRoleActive >= this.maxConcurrentPerRole) {
      logger.warn(
        { tenantId, agentRole, currentRoleActive, max: this.maxConcurrentPerRole },
        '[ConcurrencyControl] Limite de concorrência do cargo atingido',
      );
      throw new ConcurrencyLimitExceededException(
        tenantId,
        agentRole,
        currentRoleActive,
        this.maxConcurrentPerRole,
      );
    }

    // Incrementa contadores
    this.activePerTenant.set(tenantId, currentTenantActive + 1);
    this.activePerTenantRole.set(this.getRoleKey(tenantId, agentRole), currentRoleActive + 1);

    logger.debug(
      {
        tenantId,
        agentRole,
        tenantActive: currentTenantActive + 1,
        roleActive: currentRoleActive + 1,
      },
      '[ConcurrencyControl] Slot de concorrência adquirido com sucesso',
    );

    let released = false;
    return () => {
      if (released) return;
      released = true;

      const tenantCount = (this.activePerTenant.get(tenantId) ?? 1) - 1;
      if (tenantCount <= 0) {
        this.activePerTenant.delete(tenantId);
      } else {
        this.activePerTenant.set(tenantId, tenantCount);
      }

      const roleKey = this.getRoleKey(tenantId, agentRole);
      const roleCount = (this.activePerTenantRole.get(roleKey) ?? 1) - 1;
      if (roleCount <= 0) {
        this.activePerTenantRole.delete(roleKey);
      } else {
        this.activePerTenantRole.set(roleKey, roleCount);
      }

      logger.debug(
        {
          tenantId,
          agentRole,
          tenantActive: Math.max(0, tenantCount),
          roleActive: Math.max(0, roleCount),
        },
        '[ConcurrencyControl] Slot de concorrência liberado com sucesso',
      );
    };
  }

  /**
   * Executa uma função assíncrona garantindo a liberação do slot via try/finally.
   */
  public async runWithLimit<T>(
    tenantId: string,
    agentRole: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const release = this.acquireSlot(tenantId, agentRole);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export const agentConcurrencyLimiter = new AgentConcurrencyLimiter();

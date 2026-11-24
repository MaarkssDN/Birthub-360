/**
 * AI Tool Execution Layer — Squad 70, Agente 72 (Ada).
 *
 * Camada fina sobre o `ToolExecutionEngine` de `src/lib/voice-runtime/ToolEngine.ts`
 * (timeout rígido 15s, allowlist por tenant, permissões, observabilidade). O que este
 * módulo adiciona, sem duplicar o engine:
 *
 *  - B-08: `isAvailable` — pre-flight de conectividade/disponibilidade. Uma tool cujo
 *    backend está fora NUNCA é anunciada à LLM (`listToolsForModel`) nem executada
 *    (`execute`) — fail-closed, sem sucesso falso.
 *  - `argsSchema` (zod): validação dos argumentos gerados pela LLM antes da execução.
 *    Argumento inválido → `ToolInputValidationError` e a tool NÃO roda.
 *  - `listToolsForModel`: listagem consciente de permissão (`requiredPermission` +
 *    `grantedPermissions`), coisa que `getAvailableTools` do engine não filtra.
 *
 * Isolamento de tenant é delegado ao engine (`ctx.allowedTools`/`ctx.grantedPermissions`);
 * esta camada nunca amplia permissões — só restringe exposição e valida entrada.
 */

import type { z } from 'zod';
import {
  type ToolDefinition,
  type ToolExecutionContext,
  type ToolExecutionEngine,
  toolEngine,
} from '../../voice-runtime/ToolEngine.js';

/** B-08: a tool está registrada mas seu backend/precondição não está disponível. */
export class ToolUnavailableError extends Error {
  readonly toolName: string;

  constructor(toolName: string, reason?: string) {
    super(
      reason
        ? `Tool '${toolName}' is currently unavailable: ${reason}`
        : `Tool '${toolName}' is currently unavailable`,
    );
    this.name = 'ToolUnavailableError';
    this.toolName = toolName;
  }
}

/** Argumentos produzidos pela LLM falharam na validação de schema da tool. */
export class ToolInputValidationError extends Error {
  readonly toolName: string;
  readonly issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>;

  constructor(toolName: string, issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
    super(`Tool '${toolName}' received invalid arguments: ${issues.map((i) => i.message).join('; ')}`);
    this.name = 'ToolInputValidationError';
    this.toolName = toolName;
    this.issues = issues;
  }
}

export interface AiToolDefinition extends ToolDefinition {
  /**
   * Schema zod dos argumentos gerados pela LLM. Quando presente, `execute` só roda
   * com `parsed.data` (saída já coercida/normalizada pelo schema).
   */
  argsSchema?: z.ZodType;
  /**
   * B-08 — verificação de conectividade/prontidão do backend da tool. Retornar
   * `false` (ou lançar) torna a tool indisponível: ela some de `listToolsForModel`
   * e `execute` rejeita com `ToolUnavailableError` antes de chamar `execute`.
   */
  isAvailable?: (ctx: ToolExecutionContext) => boolean | Promise<boolean>;
}

export interface AiToolDescriptor {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export class AiToolRegistry {
  private readonly meta = new Map<string, AiToolDefinition>();

  constructor(private readonly engine: ToolExecutionEngine = toolEngine) {}

  /** Registra a tool no engine compartilhado (mesma instância que o runtime executa). */
  public register(tool: AiToolDefinition): void {
    this.meta.set(tool.name, tool);
    this.engine.registerTool(tool);
  }

  public getDefinition(name: string): AiToolDefinition | undefined {
    return this.meta.get(name);
  }

  /**
   * Pre-flight B-08. Tools registradas fora desta camada (sem metadados) não têm
   * verificação de disponibilidade aqui — seguem o contrato do engine.
   */
  private async checkAvailability(
    tool: AiToolDefinition,
    ctx: ToolExecutionContext,
  ): Promise<void> {
    if (!tool.isAvailable) return;
    let ok = false;
    try {
      ok = await tool.isAvailable(ctx);
    } catch {
      ok = false; // fail-closed: health-check quebrado = indisponível
    }
    if (!ok) {
      throw new ToolUnavailableError(tool.name);
    }
  }

  /**
   * Lista SOMENTE tools que este tenant/agente pode de fato executar agora:
   * dentro de `allowedTools`, com `requiredPermission` concedida e backend
   * disponível. É o que deve ser entregue ao provider da LLM como catálogo de
   * function-calling — nunca anunciar o que `execute` recusaria.
   */
  public async listToolsForModel(ctx: ToolExecutionContext): Promise<AiToolDescriptor[]> {
    const out: AiToolDescriptor[] = [];
    for (const tool of this.meta.values()) {
      if (!ctx.allowedTools.includes(tool.name)) continue;
      if (
        tool.requiredPermission &&
        !ctx.grantedPermissions.includes(tool.requiredPermission)
      ) {
        continue;
      }
      try {
        await this.checkAvailability(tool, ctx);
      } catch {
        continue; // indisponível → não anunciar (B-08)
      }
      out.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
    }
    return out;
  }

  /**
   * Executa uma tool da camada de IA: disponibilidade → schema → engine
   * (que revalida allowedTools/permissão e aplica timeout/observabilidade).
   * Erros propagam — nunca converte falha em sucesso.
   */
  public async execute(
    sessionId: string,
    toolName: string,
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
    timeoutMs?: number,
  ): Promise<unknown> {
    const tool = this.meta.get(toolName);
    if (tool) {
      await this.checkAvailability(tool, ctx);
      if (tool.argsSchema) {
        const parsed = tool.argsSchema.safeParse(args);
        if (!parsed.success) {
          throw new ToolInputValidationError(
            toolName,
            parsed.error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          );
        }
        args = parsed.data as Record<string, unknown>;
      }
    }
    return this.engine.executeTool(sessionId, toolName, args, ctx, timeoutMs);
  }
}

/** Registry de conveniência ligado ao singleton compartilhado do runtime. */
export const aiToolRegistry = new AiToolRegistry();

/** Atalho para registrar uma tool de IA no registry singleton. */
export function registerAiTool(tool: AiToolDefinition): void {
  aiToolRegistry.register(tool);
}

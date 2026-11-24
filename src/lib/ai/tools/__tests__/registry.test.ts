import { describe, expect, it } from 'vitest';
import {
  MAX_RUNTIME_TOOL_TIMEOUT_MS,
  type ToolDefinition,
  type ToolExecutionContext,
  toolRegistry,
  ToolPermissionError,
  ToolTimeoutError,
} from '../registry.js';
import { toolEngine } from '../../../voice-runtime/ToolEngine.js';

/**
 * Regressão B-08 (Squad 70 — Agente 72 Ada):
 * prova que o entrypoint público `src/lib/ai/tools` executa tools de verdade —
 * registry único, allowlist por tenant, permissão elevada e timeout rígido.
 */
describe('B-08 tool calling via src/lib/ai/tools registry', () => {
  const baseCtx = (overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext => ({
    tenantId: 'tenant-b08',
    allowedTools: [],
    grantedPermissions: [],
    ...overrides,
  });

  it('usa o mesmo engine canônico do voice-runtime (registry único, sem split-brain)', () => {
    expect(toolRegistry).toBe(toolEngine);
  });

  it('executa tool registrada quando o tenant a habilitou em allowedTools', async () => {
    const toolName = 'b08EchoTool';
    const tool: ToolDefinition = {
      name: toolName,
      description: 'Echo para prova de execução real',
      parameters: { type: 'object' },
      execute: async (args) => ({ echoed: args.payload }),
    };
    toolRegistry.registerTool(tool);

    const ctx = baseCtx({ allowedTools: [toolName] });
    const result = await toolRegistry.executeTool(
      'session-b08-1',
      toolName,
      { payload: 'ok' },
      ctx,
    );

    expect(result).toEqual({ echoed: 'ok' });
    expect(
      toolRegistry.getAvailableTools(ctx).some((t) => t.name === toolName),
    ).toBe(true);
  });

  it('nega execução quando a tool não está em allowedTools do tenant', async () => {
    const toolName = 'b08DeniedTool';
    toolRegistry.registerTool({
      name: toolName,
      description: 'Nunca deve ser executada sem opt-in do tenant',
      parameters: {},
      execute: async () => 'should-not-run',
    });

    await expect(
      toolRegistry.executeTool('session-b08-2', toolName, {}, baseCtx()),
    ).rejects.toThrow(ToolPermissionError);
  });

  it('exige requiredPermission mesmo com a tool em allowedTools', async () => {
    const toolName = 'b08AdminTool';
    toolRegistry.registerTool({
      name: toolName,
      description: 'Tool administrativa que exige permissão elevada',
      parameters: {},
      requiredPermission: 'tools:admin',
      execute: async () => 'admin-result',
    });

    const ctxNoPerm = baseCtx({ allowedTools: [toolName] });
    await expect(
      toolRegistry.executeTool('session-b08-3', toolName, {}, ctxNoPerm),
    ).rejects.toThrow(ToolPermissionError);

    const ctxWithPerm = baseCtx({
      allowedTools: [toolName],
      grantedPermissions: ['tools:admin'],
    });
    await expect(
      toolRegistry.executeTool('session-b08-3', toolName, {}, ctxWithPerm),
    ).resolves.toBe('admin-result');
  });

  it('aborta tool travada com ToolTimeoutError dentro do teto de 15s', async () => {
    const toolName = 'b08StalledTool';
    toolRegistry.registerTool({
      name: toolName,
      description: 'Simula serviço externo travado',
      parameters: {},
      execute: () => new Promise((resolve) => setTimeout(resolve, 5_000)),
    });

    const ctx = baseCtx({ allowedTools: [toolName] });
    await expect(
      toolRegistry.executeTool('session-b08-4', toolName, {}, ctx, 50),
    ).rejects.toThrow(ToolTimeoutError);

    // Mesmo pedindo timeout maior que o teto, o engine nunca ultrapassa 15s.
    expect(MAX_RUNTIME_TOOL_TIMEOUT_MS).toBe(15000);
  });

  it('falha de forma explícita para tool inexistente', async () => {
    await expect(
      toolRegistry.executeTool('session-b08-5', 'b08DoesNotExist', {}, baseCtx()),
    ).rejects.toThrow('Tool b08DoesNotExist not found');
  });
});

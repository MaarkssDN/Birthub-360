import { describe, expect, it, vi } from 'vitest';
import {
  MAX_RUNTIME_TOOL_TIMEOUT_MS,
  type ToolDefinition,
  type ToolExecutionContext,
  ToolExecutionEngine,
  ToolTimeoutError,
} from '../../../../src/lib/voice-runtime/ToolEngine.js';

describe('ToolEngine Runtime Timeout & B-08 Compliance', () => {
  const defaultCtx: ToolExecutionContext = {
    tenantId: 'tenant-123',
    allowedTools: ['fastTool', 'stalledTool', 'dynamicTool'],
    grantedPermissions: [],
  };

  it('completes quickly when tool finishes well within timeout', async () => {
    const engine = new ToolExecutionEngine();
    const fastTool: ToolDefinition = {
      name: 'fastTool',
      description: 'Executes quickly',
      parameters: {},
      execute: async (args) => ({ status: 'success', value: args.input }),
    };

    engine.registerTool(fastTool);

    const result = await engine.executeTool('session-1', 'fastTool', { input: 'hello' }, defaultCtx);
    expect(result).toEqual({ status: 'success', value: 'hello' });
  });

  it('aborts with ToolTimeoutError when tool execution exceeds timeout limit', async () => {
    const engine = new ToolExecutionEngine();
    const stalledTool: ToolDefinition = {
      name: 'stalledTool',
      description: 'Hangs indefinitely simulating an unresponsive external service',
      parameters: {},
      execute: () => new Promise((resolve) => setTimeout(resolve, 500)),
    };

    engine.registerTool(stalledTool);

    // Call with a small timeout (50ms) to verify prompt abort
    await expect(
      engine.executeTool('session-2', 'stalledTool', {}, defaultCtx, 50),
    ).rejects.toThrow(ToolTimeoutError);

    try {
      await engine.executeTool('session-2', 'stalledTool', {}, defaultCtx, 50);
    } catch (error) {
      expect(error).toBeInstanceOf(ToolTimeoutError);
      const timeoutErr = error as ToolTimeoutError;
      expect(timeoutErr.toolName).toBe('stalledTool');
      expect(timeoutErr.timeoutMs).toBe(50);
      expect(timeoutErr.message).toContain("Tool 'stalledTool' execution timed out after 50ms");
    }
  });

  it('enforces maximum runtime timeout boundary of 15 seconds (MAX_RUNTIME_TOOL_TIMEOUT_MS)', () => {
    expect(MAX_RUNTIME_TOOL_TIMEOUT_MS).toBe(15000);
  });
});

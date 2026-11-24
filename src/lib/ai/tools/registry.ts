/**
 * AI Tool Registry & Runtime Execution Engine
 * Bloqueador B-08: Timeout rígido individual (máx 15s) em todas as tools de agentes de runtime.
 * Squad 70 — Ada (Tool Calling e Ferramentas de IA)
 */

import {
  MAX_RUNTIME_TOOL_TIMEOUT_MS,
  type ToolDefinition,
  type ToolExecutionContext,
  ToolExecutionEngine,
  toolEngine,
  ToolPermissionError,
  ToolTimeoutError,
} from '../../voice-runtime/ToolEngine.js';

export {
  MAX_RUNTIME_TOOL_TIMEOUT_MS,
  type ToolDefinition,
  type ToolExecutionContext,
  ToolExecutionEngine,
  ToolPermissionError,
  ToolTimeoutError,
};

/**
 * B-08: `toolRegistry` é alias do engine canônico `toolEngine` (voice-runtime).
 * Antes existiam DUAS instâncias de `ToolExecutionEngine`: tools registradas numa
 * nunca eram visíveis para `executeTool` chamado pela outra (`Tool not found`).
 * Um único registry por processo é o comportamento correto — registro e execução
 * devem compartilhar o mesmo Map de tools.
 */
export const toolRegistry = toolEngine;

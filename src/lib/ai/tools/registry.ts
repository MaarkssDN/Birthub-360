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

export const toolRegistry = new ToolExecutionEngine();

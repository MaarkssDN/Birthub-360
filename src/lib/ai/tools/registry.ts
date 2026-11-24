/**
 * AI Tool Registry & Runtime Execution Engine
 * Bloqueador B-08: Timeout rígido individual (máx 15s) em todas as tools de agentes de runtime.
 * Squad 70 — Ada (Tool Calling e Ferramentas de IA)
 *
 * B-08 (Onda 4): `toolRegistry` DEVE ser a mesma instância de `toolEngine`
 * (`src/lib/voice-runtime/ToolEngine.ts`). Antes desta correção era um
 * `new ToolExecutionEngine()` paralelo e vazio: qualquer tool registrada pelo
 * registry de IA ficava invisível para o engine que o runtime executa
 * ("Tool X not found") — registrada, porém indisponível.
 */

import {
  MAX_RUNTIME_TOOL_TIMEOUT_MS,
  type ToolDefinition,
  type ToolExecutionContext,
  ToolExecutionEngine,
  ToolPermissionError,
  ToolTimeoutError,
  toolEngine,
} from '../../voice-runtime/ToolEngine.js';

export {
  MAX_RUNTIME_TOOL_TIMEOUT_MS,
  type ToolDefinition,
  type ToolExecutionContext,
  ToolExecutionEngine,
  ToolPermissionError,
  ToolTimeoutError,
};
export { toolEngine };

export const toolRegistry = toolEngine;

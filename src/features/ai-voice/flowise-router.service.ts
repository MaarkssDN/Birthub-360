import { logger } from '../../lib/logger.js';

/**
 * Stub service for LLM routing via Flowise.
 * This service handles sending prompts/transcriptions to Flowise and receiving LLM responses.
 */
export class FlowiseRouterService {
  /**
   * Routes a prompt to Flowise for processing.
   */
  async routePrompt(
    sessionId: string,
    prompt: string,
    context: Record<string, unknown> = {},
  ): Promise<string> {
    logger.info({ sessionId, context }, 'Routing prompt to Flowise... (STUB)');
    // TODO: Implement actual API call to Flowise endpoint
    return 'Stub response from Flowise LLM';
  }
}

export const flowiseRouterService = new FlowiseRouterService();

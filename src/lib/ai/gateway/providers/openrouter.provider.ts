import '../../../../config/env.js';
import { callProvider } from '../circuit-breaker.js';
import { requestChatCompletion } from '../http-client.js';
import type { ChatCompletionResponse } from '../types.js';
import type { ProviderAdapter, ProviderChatParams } from './types.js';

export const openrouterProvider: ProviderAdapter = {
  name: 'openrouter',
  isConfigured(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY);
  },
  async chatCompletion(params: ProviderChatParams): Promise<ChatCompletionResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter no est configurado (OPENROUTER_API_KEY ausente).');

    const targetUrl = 'https://openrouter.ai/api/v1/chat/completions';

    return callProvider('openrouter', () =>
      requestChatCompletion(
        targetUrl,
        apiKey,
        params.resolvedModel === 'qwen-coder'
          ? 'qwen/qwen-2.5-coder-32b-instruct'
          : params.resolvedModel === 'deepseek-coder'
            ? 'deepseek/deepseek-coder'
            : params.resolvedModel,
        params.messages,
        params.temperature,
        params.agentContext,
        params.timeoutMs,
        false, // useLiteLlmMetadata
      ),
    );
  },
};

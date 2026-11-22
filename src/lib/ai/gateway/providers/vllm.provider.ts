/**
 * Adapter vLLM - motor para alta vazão com modelos Open Source (como Llama 3) no cluster.
 * Entra na cadeia de fallback do chat-model.
 */
import { callProvider } from '../circuit-breaker.js';
import { requestChatCompletion } from '../http-client.js';
import type { ChatCompletionResponse } from '../types.js';
import type { ProviderAdapter, ProviderChatParams } from './types.js';

export const vllmProvider: ProviderAdapter = {
  name: 'vllm',
  isConfigured(): boolean {
    return Boolean(process.env.VLLM_API_URL);
  },
  async chatCompletion(params: ProviderChatParams): Promise<ChatCompletionResponse> {
    const apiUrl = process.env.VLLM_API_URL;
    const apiKey = process.env.VLLM_API_KEY || 'sk-no-key'; // vLLM may not require a key
    if (!apiUrl) throw new Error('vLLM não está configurado (VLLM_API_URL ausente).');

    const url = `${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}/v1/chat/completions`;

    return callProvider('vllm', () =>
      requestChatCompletion(
        url,
        apiKey,
        params.resolvedModel,
        params.messages,
        params.temperature,
        params.agentContext,
        params.timeoutMs,
        false,
      ),
    );
  },
};

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks antes da importação do módulo
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

const mockGetAiConsent = vi.fn();
vi.mock('../../../../src/lib/voice-hub/services/settingService.js', () => ({
  getAiConsent: (...args: unknown[]) => mockGetAiConsent(...args),
}));

const mockCreateMetric = vi.fn();
vi.mock('../../../../src/lib/voice-hub/services/metricService.js', () => ({
  createMetric: (...args: unknown[]) => mockCreateMetric(...args),
}));

vi.mock('../../../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  llmProviderGateway,
} from '../../../../src/lib/voice-runtime/providers/LLMGateway.js';

describe('LLMProviderGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAiConsent.mockResolvedValue({ granted: true });
    mockCreateMetric.mockResolvedValue({});
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  it('deve bloquear chamada quando consentimento de IA não foi concedido para tenant não-sistema', async () => {
    mockGetAiConsent.mockResolvedValueOnce({ granted: false });

    const response = await llmProviderGateway.processRequest(
      'Olá',
      'GoogleGemini',
      'Instrução',
      'tenant-sem-consentimento',
    );

    expect(response.blockedByConsent).toBe(true);
    expect(response.providerUsed).toBe('NONE');
    expect(response.text).toContain('consentimento de uso de IA');
  });

  it('deve executar com sucesso via GoogleGemini como provedor padrão', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'Resposta gerada pelo Gemini',
      usageMetadata: { totalTokenCount: 42 },
    });

    const response = await llmProviderGateway.processRequest(
      'Qual o status do pedido?',
      'GoogleGemini',
      'Instrução de sistema segura',
      'tenant-123',
    );

    expect(response.providerUsed).toBe('GoogleGemini');
    expect(response.text).toBe('Resposta gerada pelo Gemini');
    expect(response.tokensUsed).toBe(42);
    expect(response.fromFallback).toBe(false);
  });

  it('deve executar via OpenAI quando OpenAI é o preferredProvider', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Resposta gerada pelo OpenAI' } }],
        usage: { total_tokens: 30 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await llmProviderGateway.processRequest(
      'Pergunta comercial',
      'OpenAI',
      'Instrução do assistente',
      'tenant-456',
    );

    expect(response.providerUsed).toBe('OpenAI');
    expect(response.text).toBe('Resposta gerada pelo OpenAI');
    expect(response.tokensUsed).toBe(30);
    expect(response.fromFallback).toBe(false);
  });

  it('deve executar via Claude quando Claude é o preferredProvider', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Resposta gerada pelo Claude' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await llmProviderGateway.processRequest(
      'Pergunta Claude',
      'Claude',
      'Instrução Claude',
      'tenant-789',
    );

    expect(response.providerUsed).toBe('Claude');
    expect(response.text).toBe('Resposta gerada pelo Claude');
    expect(response.tokensUsed).toBe(30);
    expect(response.fromFallback).toBe(false);
  });

  it('deve fazer fallback para Gemini se OpenAI falhar', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });
    vi.stubGlobal('fetch', fetchMock);

    mockGenerateContent.mockResolvedValueOnce({
      text: 'Resposta recuperada via fallback Gemini',
      usageMetadata: { totalTokenCount: 50 },
    });

    const response = await llmProviderGateway.processRequest(
      'Pergunta com falha no primário',
      'OpenAI',
      'Instrução de fallback',
      'tenant-fallback',
    );

    expect(response.providerUsed).toBe('GoogleGemini');
    expect(response.text).toBe('Resposta recuperada via fallback Gemini');
    expect(response.fromFallback).toBe(true);
  });
});

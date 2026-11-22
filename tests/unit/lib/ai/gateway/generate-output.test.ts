import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Cobre os caminhos de cache semântico de `generateTextOutput`/`generateStructuredOutput`
 * no barrel `src/lib/ai/gateway.ts` (hit, set após invoke e fallback em erro).
 */
const invoke = vi.fn();
const cacheGet = vi.fn();
const cacheSet = vi.fn();

vi.mock('../../../../../src/lib/ai/gateway/chat-model.js', () => ({
  getAiModel: vi.fn(() => ({ invoke })),
}));
vi.mock('../../../../../src/lib/ai/gateway/semanticCache.js', () => ({
  CACHE_TTL: 0,
  SEMANTIC_CACHE_KEY_PREFIX: 'x',
  SemanticCacheService: class {},
  semanticCache: { get: cacheGet, set: cacheSet },
}));

const { generateTextOutput, generateStructuredOutput } = await import(
  '../../../../../src/lib/ai/gateway.js'
);

describe('src/lib/ai/gateway.ts — geração com cache semântico', () => {
  beforeEach(() => {
    invoke.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
  });

  it('generateTextOutput retorna o texto em cache sem chamar o modelo', async () => {
    cacheGet.mockResolvedValue('em cache');
    const res = await generateTextOutput({ organizationId: 'org-1', prompt: 'oi', useCache: true });
    expect(res).toEqual({ text: 'em cache' });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('generateTextOutput grava no cache após miss', async () => {
    cacheGet.mockResolvedValue(null);
    invoke.mockResolvedValue({ content: 'resposta' });
    const res = await generateTextOutput({
      organizationId: 'org-1',
      feature: 'f',
      systemInstruction: 'sys',
      prompt: 'oi',
      useCache: true,
      ttlSeconds: 60,
    });
    expect(res).toEqual({ text: 'resposta' });
    expect(cacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', purpose: 'f', promptText: 'sys\noi' }),
      'resposta',
      expect.objectContaining({ tokens: 150, ttlSeconds: 60 }),
    );
  });

  it('generateTextOutput usa fallback em erro e relança sem fallback', async () => {
    invoke.mockRejectedValue(new Error('boom'));
    await expect(generateTextOutput({ prompt: 'oi', fallback: () => 'fb' })).resolves.toEqual({
      text: 'fb',
    });
    await expect(generateTextOutput({ prompt: 'oi' })).rejects.toThrow('boom');
  });

  it('generateStructuredOutput lê JSON do cache', async () => {
    cacheGet.mockResolvedValue('{"a":1}');
    const res = await generateStructuredOutput<{ a: number }>({
      organizationId: 'org-1',
      prompt: 'p',
      useCache: true,
    });
    expect(res).toEqual({ a: 1 });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('generateStructuredOutput grava no cache após miss', async () => {
    cacheGet.mockResolvedValue(null);
    invoke.mockResolvedValue({ content: '{"b":2}' });
    const res = await generateStructuredOutput<{ b: number }>({
      organizationId: 'org-1',
      prompt: 'p',
      useCache: true,
      ttlSeconds: 30,
    });
    expect(res).toEqual({ b: 2 });
    expect(cacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: 'general-structured' }),
      '{"b":2}',
      expect.objectContaining({ tokens: 200, ttlSeconds: 30 }),
    );
  });
});

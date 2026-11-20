import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateTextOutput } from '../../../../lib/ai/gateway.js';
import { runWithContext } from '../../../../lib/context.js';
import { prisma } from '../../../../lib/prisma.js';
import { scriptAndPromptTool } from '../scriptAndPromptTool.js';

/**
 * DEBT-0015 — regressão: o fallback inline de `script_and_prompt_factory` fabricava conteúdo
 * comercial e o persistia em `Prompt` com `approved: true`. Conteúdo gerado por fallback nunca
 * pode ser gravado como aprovado. Estes testes travam o comportamento correto: falha do
 * gateway retorna erro honesto e NÃO persiste nada; sucesso persiste apenas conteúdo real de IA.
 */

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    prompt: {
      create: vi.fn().mockResolvedValue({ id: 'prompt-1' }),
    },
    lead: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
  withRlsContext: vi.fn((_orgId: string, fn: any) => fn({})),
}));

vi.mock('../../../../lib/ai/gateway.js', () => ({
  generateTextOutput: vi.fn(),
  // features.ts (sales_pitch/objection/email) importa getAiModel deste módulo; precisa existir
  // no mock mesmo sem ser exercitado nestes testes.
  getAiModel: vi.fn(),
}));

const generateTextOutputMock = vi.mocked(generateTextOutput);
const promptCreateMock = vi.mocked(prisma.prompt.create);

describe('scriptAndPromptTool (DEBT-0015)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não persiste Prompt aprovado quando o gateway de IA falha (sem fallback fabricado)', async () => {
    generateTextOutputMock.mockRejectedValueOnce(new Error('provider indisponível'));

    const raw = await runWithContext({ organizationId: 'org-1', userId: 'user-1' }, () =>
      scriptAndPromptTool.invoke({
        artifactType: 'cold_call_script',
        targetAudienceOrPersona: 'CFO de Logística',
        objective: 'Agendar diagnóstico de 15 minutos',
        saveToPromptLibrary: true,
      }),
    );

    const parsed = JSON.parse(String(raw));
    expect(parsed.error).toBeTruthy();
    expect(parsed.success).toBeUndefined();
    expect(parsed.savedPromptId).toBeUndefined();
    // O ponto central do débito: nenhuma linha de Prompt pode ser criada a partir de
    // conteúdo fabricado por fallback.
    expect(promptCreateMock).not.toHaveBeenCalled();
  });

  it('persiste Prompt aprovado somente com conteúdo realmente gerado pelo gateway', async () => {
    generateTextOutputMock.mockResolvedValueOnce({
      text: '# COLD_CALL_SCRIPT — CFO de Logística\n\nRoteiro real gerado pelo modelo.',
    });

    const raw = await runWithContext({ organizationId: 'org-1', userId: 'user-1' }, () =>
      scriptAndPromptTool.invoke({
        artifactType: 'cold_call_script',
        targetAudienceOrPersona: 'CFO de Logística',
        objective: 'Agendar diagnóstico de 15 minutos',
        saveToPromptLibrary: true,
        promptTitle: 'Script CFO Logística',
      }),
    );

    const parsed = JSON.parse(String(raw));
    expect(parsed.success).toBe(true);
    expect(parsed.savedPromptId).toBe('prompt-1');
    expect(promptCreateMock).toHaveBeenCalledTimes(1);

    const createArg = promptCreateMock.mock.calls[0][0] as any;
    expect(createArg.data.organizationId).toBe('org-1');
    expect(createArg.data.approved).toBe(true);
    expect(createArg.data.history[0].content).toContain('Roteiro real gerado pelo modelo');
    // Garante que o conteúdo persistido é o texto retornado pelo gateway, não um template.
    expect(createArg.data.history[0].content).not.toContain('Abertura Quebra-Gelo');
  });
});

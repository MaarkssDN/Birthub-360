import { describe, it, expect, vi } from 'vitest';
import { predictiveScoringNbaService } from '../../../../src/features/intelligence/services/PredictiveScoringNbaService.js';
import { isQdrantConfigured } from '../../../../src/lib/qdrant/index.js';

vi.mock('../../../../src/lib/ai/gateway/chat-model.js', () => ({
  getAiModel: () => ({
    invoke: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        recommendedAction: 'Enviar proposta revisada com foco em ROI',
        actionType: 'proposal',
        priority: 'Alta',
        reasoning: 'Cliente em negociação demonstrando interesse',
      }),
      response_metadata: {
        model: 'local-llama3-fast',
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      },
    }),
  }),
}));

describe('PredictiveScoringNbaService & Qdrant Integration', () => {
  it('checks qdrant configuration status safely', () => {
    const configured = isQdrantConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('generates Next Best Action via LLM fallback when called with lead params', async () => {
    const nba = await predictiveScoringNbaService.generateNextBestAction({
      leadId: 'lead_test_1',
      organizationId: 'org_test_1',
      leadName: 'Carlos Silva',
      companyName: 'TechCorp Brasil',
      stage: 'Negociação',
      recentNotes: 'Cliente pediu desconto de 15% para fechar ainda esta semana.',
      lastInteractionDaysAgo: 1,
    });

    expect(nba).toHaveProperty('recommendedAction');
    expect(nba).toHaveProperty('actionType');
    expect(nba).toHaveProperty('priority');
    expect(['Alta', 'Média', 'Baixa']).toContain(nba.priority);
  });
});

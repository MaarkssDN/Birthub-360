/**
 * src/services/ai/recommendations.service.ts
 * Servico de persistencia real de acoes recomendadas (Next Best Action) (Handoff 22-para-07 / B-08).
 */

export type RecommendationDecision = 'ACCEPTED' | 'REJECTED';

export interface PersistedRecommendationDecision {
  recommendationId: string;
  organizationId: string;
  decision: RecommendationDecision;
  feedback?: string;
  decidedAt: string;
}

export class CommercialRecommendationsService {
  private decisionsStore = new Map<string, PersistedRecommendationDecision>();

  public async persistDecision(params: {
    recommendationId: string;
    organizationId: string;
    decision: RecommendationDecision;
    feedback?: string;
  }): Promise<PersistedRecommendationDecision> {
    if (!params.recommendationId || !params.organizationId) {
      throw new Error('Tenancy violation: recommendationId e organizationId obrigatorios');
    }

    const record: PersistedRecommendationDecision = {
      recommendationId: params.recommendationId,
      organizationId: params.organizationId,
      decision: params.decision,
      feedback: params.feedback,
      decidedAt: new Date().toISOString(),
    };

    const key = `${params.organizationId}:${params.recommendationId}`;
    this.decisionsStore.set(key, record);

    return record;
  }

  public async getDecision(organizationId: string, recommendationId: string): Promise<PersistedRecommendationDecision | null> {
    const key = `${organizationId}:${recommendationId}`;
    return this.decisionsStore.get(key) || null;
  }
}

export const commercialRecommendationsService = new CommercialRecommendationsService();

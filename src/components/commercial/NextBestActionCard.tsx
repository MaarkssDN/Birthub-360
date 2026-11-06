/**
 * src/components/commercial/NextBestActionCard.tsx
 * Card de recomendacao conectado a persistencia real via recommendationsService.
 */
import React, { useState } from 'react';
import { commercialRecommendationsService, type RecommendationDecision } from '../../services/ai/recommendations.service.js';

export interface NextBestActionCardProps {
  recommendationId: string;
  organizationId: string;
  title: string;
  description: string;
  initialStatus?: RecommendationDecision | null;
  onDecisionChange?: (decision: RecommendationDecision) => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  recommendationId,
  organizationId,
  title,
  description,
  initialStatus = null,
  onDecisionChange,
}) => {
  const [status, setStatus] = useState<RecommendationDecision | null>(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleDecision = async (decision: RecommendationDecision) => {
    setLoading(true);
    try {
      await commercialRecommendationsService.persistDecision({
        recommendationId,
        organizationId,
        decision,
      });
      setStatus(decision);
      onDecisionChange?.(decision);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'REJECTED') {
    return <div data-testid="nba-card-dismissed" className="hidden">Descartado</div>;
  }

  return (
    <div data-testid={`nba-card-${recommendationId}`} className="border p-4 rounded-lg bg-white shadow-sm">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
      {status === 'ACCEPTED' ? (
        <span data-testid="nba-status-accepted" className="text-xs text-green-600 font-bold mt-2 inline-block">
          Acao Aceita
        </span>
      ) : (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision('ACCEPTED')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Aceitar Sugestao
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision('REJECTED')}
            className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs"
          >
            Descartar
          </button>
        </div>
      )}
    </div>
  );
};

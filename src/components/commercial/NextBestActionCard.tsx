/**
 * src/components/commercial/NextBestActionCard.tsx
 * Card de recomendacao conectado a persistencia real via recommendationsService.
 */
import type React from 'react';
import { useState } from 'react';
import {
  commercialRecommendationsService,
  type RecommendationDecision,
} from '../../services/ai/recommendations.service.js';

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
    return (
      <div data-testid="nba-card-dismissed" aria-hidden="true" className="hidden">
        Descartado
      </div>
    );
  }

  return (
    <section
      data-testid={`nba-card-${recommendationId}`}
      aria-label={title}
      aria-busy={loading}
      className="rounded-xl border border-slate-200/80 bg-white p-4 transition-colors dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {status === 'ACCEPTED' ? (
        <output
          data-testid="nba-status-accepted"
          aria-live="polite"
          className="mt-3 inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
        >
          Acao Aceita
        </output>
      ) : (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision('ACCEPTED')}
            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-100"
          >
            Aceitar Sugestao
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision('REJECTED')}
            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Descartar
          </button>
        </div>
      )}
    </section>
  );
};

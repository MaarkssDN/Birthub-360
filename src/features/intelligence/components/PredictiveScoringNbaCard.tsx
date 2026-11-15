import {
  AlertCircle,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  Info,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { CopyButton } from '../../../components/ui/CopyButton.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { api } from '../../../lib/api.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { toast } from '../../../lib/toast.js';

export interface PredictiveScoreData {
  leadId: string;
  deterministicIcpScore: number;
  lookalikeSimilarityScore: number;
  finalPredictiveScore: number;
  temperature: 'Frio' | 'Morno' | 'Quente';
  insights: string[];
  computedAt: string;
}

export interface NextBestActionData {
  leadId: string;
  action: string;
  rationale: string;
  recommendedChannel: 'whatsapp' | 'email' | 'phone' | 'meeting';
  urgency: 'baixa' | 'media' | 'alta';
  suggestedMessageTemplate?: string;
}

interface PredictiveScoringNbaCardProps {
  leadId: string;
  leadName: string;
  companyName?: string;
  stage?: string;
  recentNotes?: string;
  className?: string;
}

const CHANNEL_ICONS = {
  whatsapp: MessageSquare,
  email: Mail,
  phone: Phone,
  meeting: Calendar,
};

const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  phone: 'Ligação / Voz',
  meeting: 'Reunião',
};

const URGENCY_VARIANTS: Record<string, 'danger' | 'warning' | 'success'> = {
  alta: 'danger',
  media: 'warning',
  baixa: 'success',
};

export function PredictiveScoringNbaCard({
  leadId,
  leadName,
  companyName,
  stage = 'Novo Lead',
  recentNotes,
  className = '',
}: PredictiveScoringNbaCardProps) {
  const [scoreData, setScoreData] = useState<PredictiveScoreData | null>(null);
  const [nbaData, setNbaData] = useState<NextBestActionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async (): Promise<boolean> => {
    if (!leadId) return false;
    setLoading(true);
    setError(null);
    try {
      const [scoreRes, nbaRes] = await Promise.all([
        api.post<{ success: boolean; data: PredictiveScoreData }>(
          '/api/intelligence/suite/predictive/lead-score',
          { leadId },
        ),
        api.post<{ success: boolean; data: NextBestActionData }>(
          '/api/intelligence/suite/predictive/next-best-action',
          {
            leadId,
            leadName,
            companyName: companyName || leadName,
            stage,
            recentNotes: recentNotes || undefined,
          },
        ),
      ]);

      setScoreData(scoreRes.data);
      setNbaData(nbaRes.data);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar inteligência preditiva';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [leadId, leadName, companyName, stage, recentNotes]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleRefresh = async () => {
    SoundFX.play('click');
    const ok = await loadInsights();
    if (ok) {
      toast.success('Pontuação e Next Best Action recalculados com sucesso!');
    } else {
      toast.error('Não foi possível recalcular a pontuação preditiva.');
    }
  };

  const ChannelIcon = nbaData ? (CHANNEL_ICONS[nbaData.recommendedChannel] ?? Zap) : Zap;

  return (
    <div
      className={`rounded-2xl border border-white/5 bg-surface-2 p-5 space-y-5 transition-all shadow-lg ${className}`}
    >
      {/* Header com identidade RevOps IA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-iris/15 border border-iris/25 text-iris">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-ink tracking-tight">
                Inteligência Preditiva & Ação Recomendada
              </h3>
              <Badge variant="holographic" className="text-[10px] py-0 px-1.5">
                Qdrant + LiteLLM
              </Badge>
            </div>
            <p className="text-[11px] text-ink-2">
              Scoring por similaridade vetorial com histórico de ganhos e Next Best Action
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Recalcular pontuação preditiva"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-surface text-ink-2 hover:text-ink hover:border-iris/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-iris' : ''}`} />
        </button>
      </div>

      {loading && !scoreData && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
            <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Erro na análise preditiva</p>
            <p className="text-[11px] text-ink-2 mt-0.5">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadInsights}
              className="mt-2.5 text-xs h-7 border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {scoreData && (
        <div className="space-y-4">
          {/* Métricas de Score Preditivo */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/5 bg-surface p-3 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-2">
                Score Preditivo
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-xl font-black text-ink">
                  {scoreData.finalPredictiveScore}
                </span>
                <span className="text-[11px] text-ink-2">/100</span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1">
                <Flame
                  className={`h-3 w-3 ${
                    scoreData.temperature === 'Quente'
                      ? 'text-rose-500'
                      : scoreData.temperature === 'Morno'
                        ? 'text-amber-500'
                        : 'text-sky-400'
                  }`}
                />
                <span className="text-[10px] font-semibold text-ink">
                  {scoreData.temperature}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface p-3 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-2">
                ICP Fit
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-xl font-black text-iris">
                  {scoreData.deterministicIcpScore}
                </span>
                <span className="text-[11px] text-ink-2">/100</span>
              </div>
              <span className="mt-1 block text-[10px] text-ink-2">Regras de Perfil</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface p-3 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-2">
                Lookalike Vetorial
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-xl font-black text-emerald-400">
                  {scoreData.lookalikeSimilarityScore}
                </span>
                <span className="text-[11px] text-ink-2">/100</span>
              </div>
              <span className="mt-1 block text-[10px] text-ink-2">Histórico Qdrant</span>
            </div>
          </div>

          {/* Insights do Modelo */}
          {scoreData.insights.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 flex items-center gap-1">
                <Info className="h-3 w-3 text-iris" /> Sinais Identificados
              </span>
              <div className="space-y-1">
                {scoreData.insights.map((insight) => (
                  <div
                    key={insight}
                    className="flex items-start gap-1.5 text-xs text-ink leading-snug"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-iris shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Best Action Card */}
      {nbaData && (
        <div className="rounded-xl border border-iris/20 bg-surface p-4 space-y-3 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-iris/40 to-transparent" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-iris/20 text-iris">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-xs font-bold text-ink">Next Best Action (NBA)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={URGENCY_VARIANTS[nbaData.urgency] ?? 'warning'}
                className="text-[10px]"
              >
                Urgência {nbaData.urgency.toUpperCase()}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink">
                <ChannelIcon className="h-2.5 w-2.5 text-iris" />
                {CHANNEL_LABELS[nbaData.recommendedChannel] ?? nbaData.recommendedChannel}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-iris flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {nbaData.action}
            </h4>
            <p className="text-xs text-ink leading-relaxed">{nbaData.rationale}</p>
          </div>

          {nbaData.suggestedMessageTemplate && (
            <div className="mt-2.5 rounded-lg border border-white/5 bg-surface-2 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2">
                  Rascunho Sugerido ({CHANNEL_LABELS[nbaData.recommendedChannel]})
                </span>
                <CopyButton
                  value={nbaData.suggestedMessageTemplate}
                  label="Copiar"
                  copiedLabel="Copiado!"
                  showText
                  className="h-6 text-[10px] px-2"
                />
              </div>
              <p className="text-xs text-ink font-mono whitespace-pre-wrap leading-relaxed bg-surface p-2.5 rounded-md border border-white/5">
                {nbaData.suggestedMessageTemplate}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

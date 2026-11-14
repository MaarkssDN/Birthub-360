import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Globe,
  HelpCircle,
  IdCard,
  Lightbulb,
  Loader2,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { LinkedinIcon as Linkedin } from '../../../../components/ui/icons/LinkedinIcon.js';
import { api } from '../../../../lib/api.js';
import { SoundFX } from '../../../../lib/soundEffects.js';
import { getTelephoneLink, validContactEmails } from '../../../../shared/utils/contact-links.js';
import type { FitScoreResult } from '../../services/enrichment.service.js';
import type {
  ProspectCandidate,
  RequirementEvaluation,
} from '../../services/prospecting.service.js';
import { getDecisionMakerLinkedInLink } from '../../utils/linkedin.js';
import { DecisionMakerSearch } from './DecisionMakerSearch.js';

interface PromoteResult {
  lead: { id: string };
  fit?: FitScoreResult;
  enrichment?: {
    company: {
      googleRating?: number;
      googleReviewsCount?: number;
      observations?: string;
    };
    apolloContacts?: Array<{
      name: string;
      title: string | null;
      email: string | null;
      phone?: string | null;
      linkedin_url?: string | null;
    }>;
  };
}

/** Pill compacta de uma avaliação do Requirement Engine (`domain/requirementEngine.ts`) — mostra,
 * por critério pedido na busca, se o que foi observado de verdade confirma, diverge, ou não
 * confirma nem diverge (`title` carrega a explicação completa em português). */
function RequirementPill({ evaluation }: { evaluation: RequirementEvaluation }) {
  const style =
    evaluation.status === 'matched'
      ? 'bg-success/15 text-success-active dark:text-success'
      : evaluation.status === 'unmatched'
        ? 'bg-warning/15 text-warning-active dark:text-warning'
        : 'bg-surface-2 text-ink-2 border border-line';
  const Icon =
    evaluation.status === 'matched'
      ? CheckCircle2
      : evaluation.status === 'unmatched'
        ? AlertTriangle
        : HelpCircle;

  return (
    <span
      title={evaluation.reason}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style}`}
    >
      <Icon size={10} /> {evaluation.label}
    </span>
  );
}

/** SOFT_FILTER/ENRICHMENT "não confirmado" é o caso comum (esses providers raramente confirmam
 * esse tipo de dado) — mostrar sempre viraria ruído em toda busca com filtro avançado. HARD_FILTER
 * é sempre mostrado, incluindo "não confirmado": é o critério que definiu a busca, esconder que
 * ele não foi confirmado seria a própria fabricação que o Requirement Engine existe para evitar. */
function visibleRequirementEvaluations(
  evaluations: RequirementEvaluation[] | undefined,
): RequirementEvaluation[] {
  if (!evaluations) return [];
  return evaluations.filter((e) => e.type === 'HARD_FILTER' || e.status !== 'unknown');
}

/** Badge de proveniência — materializa o handoff onda-7/05-para-02 (rótulo
 * confirmado/inferido). Mapeamento sobre os campos REAIS do modelo (não há
 * `dataOrigin` por campo no schema; a granularidade existente é
 * `ProspectCandidate.provenance[field].status` + `DecisionMaker.emailSource`):
 * - `reported` (fonte oficial: Receita/BrasilAPI/catálogo CNPJ) → ✓ CONFIRMADO;
 * - `estimated` (heurística/estimativa do provider) → 💡 INFERIDO;
 * - `unverified` → NÃO VERIFICADO (cinza, mesmo peso de "não confirmado");
 * - e-mail com `emailSource: 'hunter'` → HUNTER (provider de enriquecimento —
 *   Hunter.io não garante verificação do e-mail, por isso é badge de ORIGEM,
 *   não de confirmação); `'apollo'` → APOLLO pelo mesmo motivo.
 * Campos sem entrada em `provenance` (ex.: resultados Apollo/Google Places, que
 * não gravam provenance por campo hoje) simplesmente não exibem badge — a
 * limitação está documentada no handoff. */
type OriginBadgeKind = 'confirmed' | 'inferred' | 'unverified' | 'hunter' | 'apollo';

const ORIGIN_BADGE_CONFIG: Record<
  OriginBadgeKind,
  { label: string; className: string; Icon: LucideIcon }
> = {
  confirmed: {
    label: 'CONFIRMADO',
    className: 'bg-success/15 text-success-active dark:text-success border-success/30',
    Icon: CheckCircle2,
  },
  inferred: {
    label: 'INFERIDO',
    className: 'bg-warning/15 text-warning-active dark:text-warning border-warning/30',
    Icon: Lightbulb,
  },
  unverified: {
    label: 'NÃO VERIFICADO',
    className: 'bg-surface-2 text-ink-2 border-line',
    Icon: HelpCircle,
  },
  hunter: {
    label: 'HUNTER',
    className: 'bg-info/15 text-info-active dark:text-info border-info/30',
    Icon: Sparkles,
  },
  apollo: {
    label: 'APOLLO',
    className: 'bg-surface-2 text-ink-2 border-line',
    Icon: Users,
  },
};

function OriginBadge({ kind, title }: { kind: OriginBadgeKind; title?: string }) {
  const { label, className, Icon } = ORIGIN_BADGE_CONFIG[kind];
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${className}`}
    >
      <Icon size={10} /> {label}
    </span>
  );
}

type ProvenanceEntry = NonNullable<ProspectCandidate['provenance']>[string];

const PROVENANCE_STATUS_KIND: Record<ProvenanceEntry['status'], OriginBadgeKind> = {
  reported: 'confirmed',
  estimated: 'inferred',
  unverified: 'unverified',
};

/** Badge por campo: lê `candidate.provenance[campo]` (gravado por brasilapi,
 * cnpjCatalog e receita_federal). Retorna null quando o campo não tem
 * proveniência registrada — candidato de provider sem provenance não ganha
 * badge inventado. */
function FieldOriginBadge({ entry }: { entry?: ProvenanceEntry }) {
  if (!entry) return null;
  return (
    <OriginBadge
      kind={PROVENANCE_STATUS_KIND[entry.status]}
      title={`${entry.source} · consultado em ${entry.queriedAt}`}
    />
  );
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function CandidateCard({
  candidate,
  onPromote,
  isPromoting,
  promoted,
  promotedResult,
  isSelected,
  onToggleSelect,
  onReject,
  isRejecting,
}: {
  isSelected?: boolean;
  onToggleSelect?: () => void;
  candidate: ProspectCandidate;
  onPromote: () => void;
  isPromoting: boolean;
  promoted: boolean;
  promotedResult?: PromoteResult;
  /** Marca o candidato como "Não é esse perfil" — passa a ser excluído de buscas futuras deste tenant. */
  onReject?: () => void;
  isRejecting?: boolean;
}) {
  const finalScore =
    promotedResult?.fit?.score ?? candidate.metrics?.icpScore ?? candidate.fitScoreEstimate;
  const isEstimate = !promotedResult?.fit;
  const enrichment = promotedResult?.enrichment;
  // Variável local em vez de `candidate.phone` repetido: o narrowing de `candidate.phone &&`
  // não sobrevive dentro do closure do onClick do botão de WhatsApp abaixo (TS não propaga
  // narrowing de acesso a propriedade para dentro de funções aninhadas).
  const candidatePhone = candidate.phone;
  const [icebreakerText, setIcebreakerText] = useState<string | null>(
    candidate.icebreakerHook ?? null,
  );
  const [isLoadingIcebreaker, setIsLoadingIcebreaker] = useState(false);
  const handleFetchIcebreaker = async () => {
    setIsLoadingIcebreaker(true);
    try {
      const res = await api.post<{ icebreaker: string }>('/api/prospecting/icebreaker', {
        companyName: candidate.tradeName,
      });
      if (res?.icebreaker) {
        setIcebreakerText(res.icebreaker);
      } else {
        setIcebreakerText('Nenhuma notícia/fato recente encontrado via busca web.');
      }
    } catch {
      setIcebreakerText('Falha ao buscar fatos recentes na internet.');
    } finally {
      setIsLoadingIcebreaker(false);
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: onMouseEnter só toca um efeito sonoro decorativo; as ações do card são botões próprios.
    <div
      onMouseEnter={() => {
        SoundFX.play('hover');
      }}
      data-accent="cyan"
      className="bh-platform-card relative p-6 rounded-2xl border border-line transition-all duration-300 shadow-sm group overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
        <div className="mt-1 mr-3">
          <input
            type="checkbox"
            className="rounded border-line text-brand focus:ring-brand w-5 h-5 cursor-pointer transition-transform active:scale-90"
            aria-label={`Selecionar ${candidate.tradeName}`}
            disabled={candidate.source === 'googlePlaces'}
            checked={!!isSelected}
            onChange={() => {
              SoundFX.play('click');
              onToggleSelect?.();
            }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-black text-lg text-ink group-hover:text-brand transition-colors">
              {candidate.tradeName}
            </h3>
            <FieldOriginBadge entry={candidate.provenance?.tradeName} />
            {/* Tier de Fit é um sinal de negócio (score), não uma cor de marca — usa o
                            token semântico bg-warning/text-warning (mesmo já usado 2 linhas abaixo
                            pro badge de rating do Google), não atlas-yellow. */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                finalScore >= 75
                  ? 'bg-success/15 text-success-active dark:text-success border border-success/30'
                  : finalScore >= 45
                    ? 'bg-info/15 text-info-active dark:text-info border border-info/30'
                    : 'bg-warning/15 text-warning-active dark:text-warning border border-warning/30'
              }`}
            >
              {finalScore >= 75 && (
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
              )}
              <TrendingUp size={11} /> Fit {finalScore}% {isEstimate && '(estimado)'}
            </div>
            {enrichment?.company.googleRating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/10 text-warning-active dark:text-warning border border-warning/30">
                ⭐ {enrichment.company.googleRating} Google ({enrichment.company.googleReviewsCount}
                )
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink-2 mb-2">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-ink-2" />{' '}
              {candidate.segmentObserved ? candidate.segment : 'Segmento não confirmado'}
              <FieldOriginBadge entry={candidate.provenance?.segment} />
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-ink-2" /> {candidate.size}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-ink-2" /> {candidate.location}
              <FieldOriginBadge entry={candidate.provenance?.location} />
            </span>
            {candidate.cnpjGuess && (
              <span className="flex items-center gap-1.5">
                <IdCard size={14} className="text-ink-2" /> {candidate.cnpjGuess}
                <FieldOriginBadge
                  entry={candidate.provenance?.cnpjGuess ?? candidate.provenance?.cnpj}
                />
              </span>
            )}
            {candidate.foundedYear && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-ink-2" /> Fundada em {candidate.foundedYear}
              </span>
            )}
            {candidate.annualRevenue != null && (
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-ink-2" /> {formatUsd(candidate.annualRevenue)}
                /ano
              </span>
            )}
            {candidatePhone &&
              (getTelephoneLink(candidatePhone) ? (
                <a
                  href={getTelephoneLink(candidatePhone)}
                  className="flex items-center gap-1.5 hover:text-ink hover:underline"
                >
                  <Phone size={14} className="text-ink-2" /> {candidatePhone}
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-ink-2" /> {candidatePhone}
                </span>
              ))}
            {candidate.website && (
              <a
                href={
                  candidate.website.startsWith('http')
                    ? candidate.website
                    : `https://${candidate.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sky-400 hover:underline"
              >
                <Globe size={14} /> Site
              </a>
            )}
            {candidate.linkedinUrl && (
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-600 hover:underline"
              >
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
          </div>

          {validContactEmails(candidate.emails).length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-success-active dark:text-success mb-2">
              {validContactEmails(candidate.emails).map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Mail size={14} /> {email}
                </a>
              ))}
            </div>
          )}

          {candidate.technologies && candidate.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {candidate.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 bg-surface-2 border border-line rounded-full px-2 py-0.5 text-[10px] text-ink-2"
                >
                  <Wrench size={9} /> {tech}
                </span>
              ))}
            </div>
          )}

          {visibleRequirementEvaluations(candidate.requirementEvaluations).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {visibleRequirementEvaluations(candidate.requirementEvaluations).map((evaluation) => (
                <RequirementPill key={evaluation.criterion} evaluation={evaluation} />
              ))}
            </div>
          )}

          <details className="my-3 text-xs text-ink-2">
            <summary className="cursor-pointer py-2 font-semibold">
              Fontes e qualidade dos dados
            </summary>
            <p>
              Fonte de descoberta: {candidate.source ?? 'Não informada'}. WhatsApp: não confirmado.
            </p>
            {candidate.source === 'googlePlaces' && (
              <p>Conteúdo Google Places: consulta temporária; CRM e exportação indisponíveis.</p>
            )}
            {candidate.metrics && (
              <div className="space-y-1 py-2">
                <p>
                  Score ICP: {candidate.metrics.icpScore}/100 · Completude:{' '}
                  {candidate.metrics.completeness}%
                </p>
                <p>
                  Identificação: {candidate.metrics.identificationConfidence}% · Qualidade de
                  contatos: {candidate.metrics.contactQuality}%
                </p>
                {candidate.metrics.factors.map((factor) => (
                  <p key={factor.criterion}>
                    {factor.criterion}: {factor.points} pontos (
                    {factor.status === 'matched'
                      ? 'confirmado'
                      : factor.status === 'unmatched'
                        ? 'divergente'
                        : 'não confirmado'}
                    )
                  </p>
                ))}
              </div>
            )}
            {Object.entries(candidate.provenance ?? {}).map(([field, origin]) => (
              <p key={field} className="flex items-center gap-1.5 flex-wrap">
                <FieldOriginBadge entry={origin} />
                {field}: {origin.source} ·{' '}
                {origin.status === 'estimated'
                  ? 'estimado'
                  : origin.status === 'reported'
                    ? 'informado pela fonte'
                    : 'não verificado'}{' '}
                · {origin.queriedAt}
              </p>
            ))}
            {candidate.companyData &&
              Object.entries(candidate.companyData)
                .filter(([, value]) => value !== null && typeof value !== 'object')
                .map(([field, value]) => (
                  <p key={field}>
                    {field}: {String(value)}
                  </p>
                ))}
          </details>
          {!enrichment && candidate.rationale && (
            <p className="text-sm leading-[1.7] text-ink-2 italic mb-2">
              &quot;{candidate.rationale}&quot;
            </p>
          )}

          {icebreakerText || (candidate.webInsights && candidate.webInsights.length > 0) ? (
            <div className="my-3 p-3 bg-brand/10 border border-brand/20 rounded-xl">
              <p className="text-[10px] tracking-wider font-bold uppercase text-brand-ink dark:text-brand mb-1 flex items-center gap-1">
                <Sparkles size={12} /> ❄️ Quebra-Gelo / Notícia Recente (Busca Web)
              </p>
              {icebreakerText && (
                <p className="text-xs text-ink font-medium leading-relaxed mb-1">
                  {icebreakerText}
                </p>
              )}
              {candidate.webInsights && candidate.webInsights.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  {candidate.webInsights.slice(0, 3).map((news, idx) => (
                    <a
                      key={idx}
                      href={news.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-500 hover:underline flex items-center gap-1 truncate"
                    >
                      <Globe size={11} /> {news.title}{' '}
                      <span className="text-[9px] text-ink-2">({news.domain})</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="my-2">
              <button
                type="button"
                onClick={handleFetchIcebreaker}
                disabled={isLoadingIcebreaker}
                className="text-[11px] font-semibold text-brand-ink dark:text-brand hover:underline flex items-center gap-1 bg-brand/5 border border-brand/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {isLoadingIcebreaker ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <Sparkles size={12} />
                )}
                {isLoadingIcebreaker
                  ? 'Buscando fatos recentes na internet...'
                  : '🔍 Buscar Notícias / Quebra-Gelo Web'}
              </button>
            </div>
          )}

          {!enrichment && candidate.decisionMakers && candidate.decisionMakers.length > 0 && (
            <div className="mt-2 mb-3">
              <p className="text-[10px] tracking-wider font-bold uppercase text-ink-2 mb-2 flex items-center gap-1">
                <Users size={12} /> Decisores encontrados — verifique origem e finalidade antes de
                utilizar
              </p>
              <div className="flex flex-col gap-2">
                {candidate.decisionMakers.map((dm, idx) => {
                  const linkedIn = getDecisionMakerLinkedInLink({
                    name: dm.name,
                    title: dm.title,
                    companyName: candidate.tradeName,
                    linkedinUrl: dm.linkedinUrl,
                  });
                  const tel = getTelephoneLink(dm.phone);

                  return (
                    <div
                      key={idx}
                      className="bg-surface-2 border border-line rounded-xl p-3 text-xs text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1.5"
                    >
                      <strong className="text-ink text-sm">{dm.name}</strong>
                      {dm.title && (
                        <span className="text-ink-2 bg-surface-2 px-2 py-0.5 rounded-md">
                          {dm.title}
                        </span>
                      )}
                      {dm.email && (
                        <>
                          <a
                            href={`mailto:${dm.email}`}
                            className="flex items-center gap-1 text-success-active dark:text-success hover:underline"
                          >
                            <Mail size={12} /> {dm.email}
                            <span className="text-[10px] text-ink-2">
                              verificação não informada
                            </span>
                          </a>
                          <OriginBadge
                            kind={dm.emailSource === 'hunter' ? 'hunter' : 'apollo'}
                            title={`E-mail via ${dm.emailSource === 'hunter' ? 'Hunter.io' : 'Apollo'} — origem do dado, não verificação de caixa`}
                          />
                        </>
                      )}
                      {tel && (
                        <a
                          href={tel}
                          className="flex items-center gap-1 text-ink-2 hover:text-ink hover:underline"
                        >
                          <Phone size={12} /> {dm.phone}
                        </a>
                      )}
                      <a
                        href={linkedIn.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <Linkedin size={12} />{' '}
                        {linkedIn.isDirectProfile ? 'Abrir perfil' : 'Buscar no LinkedIn'}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!enrichment && candidate.decisionMakers?.length === 0 && (
            <p className="text-[11px] text-ink-2 mb-3">
              Nenhum decisor encontrado automaticamente para este domínio — seu plano Apollo pode
              não incluir People Search e não há chave Hunter.io configurada. Você ainda pode tentar
              uma busca manual abaixo.
            </p>
          )}

          <DecisionMakerSearch
            companyName={candidate.tradeName}
            website={candidate.website}
            rationale={candidate.rationale}
            companyCnpj={candidate.cnpjGuess}
            companyEmails={candidate.emails}
            companyPhones={candidate.phone ? [candidate.phone] : []}
            alreadyFoundCount={candidate.decisionMakers?.length}
          />

          {enrichment?.company.observations && (
            <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-[10px] tracking-wider font-bold uppercase text-indigo-300 mb-1 flex items-center gap-1">
                <Sparkles size={12} /> 📝 Resumo do Enriquecimento
              </p>
              <p className="text-sm text-ink-2 leading-[1.7]">{enrichment.company.observations}</p>
            </div>
          )}

          {enrichment?.apolloContacts && enrichment.apolloContacts.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] tracking-wider font-bold uppercase text-ink-2 mb-2 flex items-center gap-1">
                <Users size={12} /> Decisores Descobertos (Apollo)
              </p>
              <div className="flex flex-col gap-3">
                {enrichment.apolloContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-2 border border-line rounded-xl p-3 text-xs text-ink-2 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-ink text-sm">{contact.name}</strong>
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                    {contact.title && <span className="text-ink-2">{contact.title}</span>}

                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {contact.email && (
                        <span className="flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-md">
                          <Mail size={12} className="text-ink-2" /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-md">
                          <Phone size={12} className="text-ink-2" /> {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {promoted ? (
          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={16} className="text-emerald-500" /> ✅ No CRM
          </span>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto relative z-20">
            {onReject && (
              <button
                type="button"
                onClick={() => {
                  SoundFX.play('click');
                  onReject();
                }}
                disabled={isPromoting || isRejecting || candidate.source === 'googlePlaces'}
                title="Descarta este candidato e o exclui de buscas futuras"
                className="bg-surface-2 border border-line text-ink-2 px-4 py-2.5 rounded-xl font-bold text-xs hover:border-danger/50 hover:text-danger-active dark:hover:text-danger transition-all hover:scale-[1.01] active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-60 cursor-pointer"
              >
                {isRejecting ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <ThumbsDown size={15} />
                )}
                {isRejecting ? 'Descartando...' : 'Não é esse perfil'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                SoundFX.play('success');
                onPromote();
              }}
              disabled={isPromoting || isRejecting || candidate.source === 'googlePlaces'}
              className="relative overflow-hidden bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-hover)] text-on-brand px-5 py-2.5 rounded-xl font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-card hover:scale-[1.02] w-full sm:w-auto justify-center disabled:opacity-60 cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none"
                aria-hidden="true"
              />
              {isPromoting ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <ShieldCheck size={15} />
              )}
              {isPromoting
                ? 'Salvando...'
                : candidate.source === 'googlePlaces'
                  ? 'CRM indisponível para Google Places'
                  : 'Salvar no CRM'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

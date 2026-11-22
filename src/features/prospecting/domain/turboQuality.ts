import type { ProspectCandidate, ProspectCriteria } from './prospectTypes.js';

/** Score uses observed matches only; contact availability never adds ICP points. */
export function annotateTurboCandidate(
  candidate: ProspectCandidate,
  weights?: Record<string, number>,
): void {
  const evaluations = candidate.requirementEvaluations ?? [];
  const totalWeight = evaluations.reduce((sum, e) => sum + (weights?.[e.criterion] ?? 1), 0);
  const factors = evaluations.map((e) => ({
    criterion: e.criterion,
    points:
      e.status === 'matched' && totalWeight > 0
        ? ((weights?.[e.criterion] ?? 1) / totalWeight) * 100
        : 0,
    status: e.status,
  }));
  const score = Math.round(factors.reduce((sum, factor) => sum + factor.points, 0));
  candidate.fitScoreEstimate = score;
  const fields = [
    candidate.legalNameGuess,
    candidate.cnpjGuess,
    candidate.phone,
    candidate.emails?.length,
    candidate.website,
    candidate.locationObserved !== false && candidate.location,
    candidate.segmentObserved && candidate.segment,
    candidate.decisionMakers?.length,
  ];
  candidate.metrics = {
    icpScore: score,
    completeness: Math.round((fields.filter(Boolean).length / fields.length) * 100),
    contactQuality: 0,
    identificationConfidence: candidate.companyData?.cnpj ? 95 : candidate.website ? 50 : 0,
    factors,
  };
  const queriedAt = new Date().toISOString();
  candidate.provenance ??= {};
  for (const [field, value] of Object.entries(candidate)) {
    if (
      [
        'website',
        'phone',
        'emails',
        'legalNameGuess',
        'cnpjGuess',
        'segment',
        'location',
        'annualRevenue',
        'foundedYear',
      ].includes(field) &&
      value &&
      !candidate.provenance[field]
    ) {
      candidate.provenance[field] = {
        source:
          field === 'emails' || field === 'cnpjGuess'
            ? 'unknown'
            : candidate.companyData
              ? 'brasilapi'
              : (candidate.source ?? 'unknown'),
        queriedAt,
        status:
          field === 'annualRevenue'
            ? 'estimated'
            : (field === 'segment' && !candidate.segmentObserved) ||
                (field === 'location' && candidate.locationObserved === false) ||
                field === 'cnpjGuess'
              ? 'unverified'
              : 'reported',
      };
    }
  }
}

export function getTurboFilterWarnings(criteria: ProspectCriteria, paidAllowed: boolean): string[] {
  const warnings: string[] = [];
  if (!paidAllowed)
    warnings.push(
      'Consultas pagas não autorizadas; Apollo, Google Places e enriquecimento de contatos não serão executados.',
    );
  const details = criteria.segmentoDetalhes;
  if (details?.cnaesSecundarios?.length)
    warnings.push(
      'Filtro de CNAEs secundários não suportado pelo contrato de listagem do catálogo; pesquisa não executada.',
    );
  if (
    details?.setorEconomico ||
    details?.tipoMercado ||
    details?.modeloNegocio ||
    details?.descricaoIdeal ||
    details?.descricaoPesquisa
  )
    warnings.push(
      'Descrição, setor, tipo de mercado e modelo de negócio são contexto de interpretação; use Interpretar para gerar filtros verificáveis.',
    );
  if (
    criteria.personas?.some(
      (p) => p.departamentos?.length || p.descricao || p.nome || p.palavrasChave,
    )
  )
    warnings.push(
      'Nome da persona, departamento e descrição são contexto; People API Search não documenta filtro de departamento. Cargos, senioridades e localização são aplicados separadamente.',
    );
  if (criteria.tecnologiasExcluir || criteria.apenasCapitalAberto)
    warnings.push(
      'Exclusão de tecnologia e capital aberto não constam no contrato atual Organization Search; não serão enviados como filtros suportados.',
    );
  return warnings;
}

export function hasUnavailableDiscoveryFilter(criteria: ProspectCriteria): boolean {
  return (
    !!criteria.segmentoDetalhes?.cnaesSecundarios?.length ||
    !!criteria.tecnologiasExcluir ||
    !!criteria.apenasCapitalAberto
  );
}

export function matchesTurboLocalFilters(
  candidate: ProspectCandidate,
  criteria: ProspectCriteria,
): boolean {
  const details = criteria.segmentoDetalhes;
  const observed = [
    candidate.tradeName,
    candidate.legalNameGuess,
    candidate.segmentObserved ? candidate.segment : '',
    candidate.rationale,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (details?.palavrasExcluir?.some((word) => observed.includes(word.toLowerCase()))) return false;
  if (details?.palavrasObrigatorias?.some((word) => !observed.includes(word.toLowerCase())))
    return false;
  if (details?.cnaePrincipal && candidate.companyData?.cnae !== details.cnaePrincipal) return false;
  if (details?.cnaesSecundarios?.length) return false; // secondary CNAEs are not mapped by the current cadastral adapter
  return true;
}

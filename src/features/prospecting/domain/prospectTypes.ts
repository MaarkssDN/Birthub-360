/**
 * Tipos centrais do domínio de prospecção (`ProspectCriteria`, `ProspectCandidate`,
 * `DecisionMaker`, `DiscoverResult`) e `buildLocationLabel`, movidos para cá na decomposição do
 * antigo `services/prospecting.service.ts` (ARCH-009, correção de 2026-08-28).
 *
 * Vivem em `domain/`, não em `services/prospecting/types.ts`, de propósito: tanto
 * `services/prospecting/*` quanto `services/apollo/*` precisam desses tipos (Apollo é uma fonte de
 * candidatos/decisores, não só um detalhe interno de prospecting), e as duas pastas de serviço já
 * se importam mutuamente (`prospecting/discovery.ts` chama `apollo.service.ts`). Antes desta
 * mudança, `apollo/types.ts`, `apollo/organizationSearch.ts` e `apollo/people.ts` importavam esses
 * tipos de volta de `services/prospecting.service.ts` — um import circular real entre os dois
 * barrels de serviço (confirmado por `npx depcruise`, regra `no-circular`; ver também o comentário
 * em `domain/searchIntent.ts::ProspectCriteriaLike`, que documentava o mesmo ciclo e por isso evita
 * importar `ProspectCriteria` até hoje). Colocar os tipos num módulo de domínio sem dependência de
 * volta para `services/` quebra o ciclo pela raiz, em vez de só reposicioná-lo.
 */

import type { DiscoveryProviderId } from './providerCapabilities.js';

/** Tipos do Requirement Engine (`domain/requirementEngine.ts`) — vivem aqui, não lá, pelo mesmo
 * motivo do resto deste arquivo: `ProspectCandidate.requirementEvaluations` precisa do tipo
 * `RequirementEvaluation`, e `requirementEngine.ts` precisa de `ProspectCandidate`/`SearchIntent`
 * — colocar os tipos no módulo que os dois importam (em vez de um importar do outro) evita um
 * ciclo real entre dois arquivos de `domain/`. */
export type RequirementType = 'HARD_FILTER' | 'SOFT_FILTER' | 'ENRICHMENT';
export type RequirementStatus = 'matched' | 'unmatched' | 'unknown';

export interface RequirementEvaluation {
  criterion: string;
  /** Rótulo pronto para exibição (ex: "Segmento", "Estado", "Cargo do decisor") — evita a UI
   * duplicar o mapeamento `criterion` → texto em português. */
  label: string;
  type: RequirementType;
  expected: string;
  /** null quando nenhum provider confirmou este dado para o candidato específico — nunca
   * preenchido com o valor pedido só para não ficar vazio (isso seria exatamente a fabricação que
   * este tipo existe para impedir). */
  observed: string | null;
  status: RequirementStatus;
  /** De onde veio o valor observado (`apollo`, `googlePlaces`, `nominatim`, ou `none` quando
   * `observed` é null). */
  source: DiscoveryProviderId | 'cnpjCatalog' | 'brasilapi' | 'none';
  /** Frase pronta em português explicando o status — para a UI não precisar montar texto a partir
   * de `type`+`status`. */
  reason: string;
}

export interface SegmentDetails {
  subsegmento?: string;
  nicho?: string;
  produtos?: string[];
  servicos?: string[];
  descricaoIdeal?: string;
  palavrasObrigatorias?: string[];
  palavrasOpcionais?: string[];
  palavrasExcluir?: string[];
  cnaePrincipal?: string;
  cnaesSecundarios?: string[];
  setorEconomico?: string;
  tipoMercado?: string;
  modeloNegocio?: string;
  descricaoPesquisa?: string;
}
export interface DecisionPersona {
  nome?: string;
  cargoPrincipal?: string;
  cargosEquivalentes?: string[];
  cargosExcluir?: string[];
  departamentos?: string[];
  senioridades?: string[];
  localizacoes?: string[];
  palavrasChave?: string;
  descricao?: string;
  limite?: number;
}
export interface ApolloFilters {
  dominios?: string[];
  dominiosExcluir?: string[];
  organizacaoIds?: string[];
  funcionariosFaixas?: string[];
  financiamentoTotalMin?: number;
  financiamentoTotalMax?: number;
  ultimaRodadaMin?: number;
  ultimaRodadaMax?: number;
}
export interface ProspectCriteria {
  icpPesos?: Record<string, number>;
  segmentoDetalhes?: SegmentDetails;
  personas?: DecisionPersona[];
  apolloFiltros?: ApolloFilters;
  cnpj?: string;
  modoPesquisa?: 'economico' | 'equilibrado' | 'completo';
  autorizarPagos?: boolean;
  /** Detalhes adicionais do ICP além dos campos estruturados abaixo (texto livre, nuance qualitativa). */
  icp?: string;
  /** Cargos-alvo do decisor (ex: "Diretor de Logística", "CEO") — um por linha, adicionados dinamicamente na UI. */
  decisorCargos?: string[];
  segmento: string;
  localizacao: string;
  quantidade: number;
  /** Estado (UF por extenso, ex: "Rio de Janeiro") — refina a busca além da região ampla do playbook. Opcional. */
  estado?: string;
  /** Cidade específica — refina ainda mais dentro do estado. Opcional. */
  cidade?: string;
  /** Faixa de funcionários no formato Apollo "min,max" (ex: "11,50"). Opcional. */
  porte?: string;
  /** Faturamento anual estimado em USD — dado da Apollo é normalizado em USD. Opcional. */
  faturamentoMin?: number;
  faturamentoMax?: number;
  /** Faturamento mensal estimado em USD — convertido para faixa anual (×12) antes de ir pra Apollo, que só reconhece faturamento anual. Opcional. */
  faturamentoMensalMin?: number;
  faturamentoMensalMax?: number;
  /** Volume de operação/carga (texto livre — ex: "50 cargas/mês", "frota de 30+ veículos"). Sem taxonomia fixa na Apollo; entra como palavra-chave adicional na busca. Opcional. */
  volume?: string;
  /** Palavras-chave adicionais (além do segmento), separadas por vírgula. Opcional. */
  palavrasChave?: string;
  /** Nome da empresa/local para Google Maps, Apollo e fallback OpenStreetMap. Opcional. */
  nomeEmpresa?: string;
  /** Ano mínimo de fundação. Opcional. */
  anoFundacaoMin?: number;
  /** Ano máximo de fundação. Opcional. */
  anoFundacaoMax?: number;
  /** Tecnologias utilizadas (UIDs confirmados, separados por vírgula — ver TECNOLOGIA_OPTIONS). Opcional. */
  tecnologias?: string;
  /** Tecnologias a EXCLUIR (mesmo formato de `tecnologias`). Opcional. */
  tecnologiasExcluir?: string;
  /** Cidades/estados a excluir da busca, separados por vírgula (ex: "São Paulo, Minas Gerais"). Opcional. */
  localizacaoExcluir?: string;
  /** Filtra só empresas de capital aberto (B3/bolsa). Opcional. */
  apenasCapitalAberto?: boolean;
  /** Página do ranking da Apollo (1-based, padrão 1). Usada pelo botão "Buscar mais resultados"
   * do frontend para trazer a próxima fatia do mesmo ranking em vez de repetir sempre o topo. */
  pagina?: number;
  /** Nomes a serem excluidos da busca para evitar duplicidade no append. */
  excludeNames?: string[];
}

export interface DecisionMaker {
  name: string;
  title: string | null;
  email: string | null;
  emailSource?: 'apollo' | 'hunter';
  phone: string | null;
  linkedinUrl: string | null;
}

export interface ProspectCandidate {
  tradeName: string;
  legalNameGuess: string | null;
  cnpjGuess: string | null;
  segment: string;
  size: string;
  location: string;
  fitScoreEstimate: number;
  suggestedContact: { name: string; role: string } | null;
  rationale: string;
  /** Provider que efetivamente encontrou este candidato — usado pelo Requirement Engine
   * (`domain/requirementEngine.ts`) para saber se um campo é dado observado de verdade ou só o
   * critério pedido ecoado (ver `segmentObserved`). Não confundir com `rationale`, que é texto
   * livre pensado pra exibição, não pra leitura por código. */
  source?: DiscoveryProviderId | 'cnpjCatalog' | 'brasilapi';
  locationObserved?: boolean;
  companyData?: Record<string, unknown>;
  provenance?: Record<
    string,
    { source: string; queriedAt: string; status: 'reported' | 'estimated' | 'unverified' }
  >;
  metrics?: {
    icpScore: number;
    completeness: number;
    contactQuality: number;
    identificationConfidence: number;
    factors: Array<{ criterion: string; points: number; status: RequirementStatus }>;
  };
  /** true quando `segment` veio de uma classificação de indústria real do provider (Apollo
   * `organization.industry`) — false/undefined quando `segment` é só o segmento PEDIDO na busca
   * ecoado de volta (sempre o caso para Google Places/Nominatim, que não classificam indústria; e
   * também o caso da Apollo quando ela não devolveu `industry` para aquela organização). Sem esta
   * distinção, o Requirement Engine trataria todo `segment` como confirmado — exatamente a
   * "fabricação sutil" (filtro solicitado virando atributo observado) que ele existe para evitar. */
  segmentObserved?: boolean;
  /** Avaliação, por critério pedido na busca, do que foi de fato observado neste candidato
   * (`domain/requirementEngine.ts::evaluateCandidateRequirements`) — preenchido em
   * `discoverCandidates` depois do enriquecimento de qualidade. Não decide inclusão/exclusão do
   * candidato, só documenta a honestidade de cada critério para a UI mostrar. */
  requirementEvaluations?: RequirementEvaluation[];
  // Dados extras retornados pela Apollo — deixam o candidato mais rico em informação antes mesmo de promover.
  linkedinUrl?: string | null;
  phone?: string | null;
  /** Domínio/site real já conhecido (Apollo primary_domain ou Google Places websiteUri) — evita
   * que o enriquecimento precise "adivinhar" um domínio a partir do nome da empresa depois. */
  website?: string | null;
  foundedYear?: number | null;
  annualRevenue?: number | null;
  technologies?: string[];
  emails?: string[];
  apolloContacts?: DecisionMaker[];
  /** Decisores encontrados via Apollo People Search (+ Hunter.io como fallback de e-mail) já na descoberta. */
  decisionMakers?: DecisionMaker[];
  /** Quebra-gelo / fato relevante / notícia recente da empresa obtida via busca na internet para abordagem inicial */
  icebreakerHook?: string | null;
  webInsights?: Array<{ title: string; url: string; domain: string }>;
}

export interface DiscoverResult {
  candidates: ProspectCandidate[];
  sources: Array<{ title: string; uri: string }>;
  apolloError?: string;
  providerMode: 'free' | 'hybrid';
  costSummary?: {
    apolloOrganizationSearchCredits: number;
    estimatedUsd: number;
    coverage: 'partial';
    message: string;
  };
  partialFailures?: Array<{ provider: string; message: string }>;
  filterWarnings?: string[];
  /** Onda 42 (dossiê CPI, DEC-13, opção A): id único desta EXECUÇÃO de busca (cuid) — amarra
   * critério usado, providers chamados, resultados e custo, persistido em
   * `ProspectingSearchExecution` (ver searchExecution.service.ts) e consultável depois via
   * `GET /api/prospecting/searches/:searchId`. */
  searchId: string;
}

/** Monta a localização mais precisa disponível: cidade + estado > estado > região ampla do playbook. */
export function buildLocationLabel(criteria: ProspectCriteria): string {
  if (criteria.cidade && criteria.estado) return `${criteria.cidade}, ${criteria.estado}`;
  if (criteria.estado) return criteria.estado;
  return criteria.localizacao;
}

/**
 * Sinais extraídos de uma página pelo crawler Crawlee (`crawlee/crawler.ts`), já normalizados
 * (e-mails deduplicados, links sociais filtrados). Tipo de domínio para que a ponte de
 * persistência (`services/webCrawlPersistence.service.ts`) não dependa do módulo `crawlee`
 * (que é opcional/não instalado em todos os ambientes) nem do arquivo excluído do tsconfig.
 */
export interface CrawledPageSignals {
  url: string;
  title: string;
  emails: string[];
  socialMedia: string[];
}

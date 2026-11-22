import { z } from 'zod';
import { isValidCnpj } from '../../../lib/cnpj.js';
import { MAX_LEADS_PER_SEARCH } from '../domain/searchIntent.js';

/**
 * Espelha `ProspectCriteria` (prospecting.service.ts) — sem isso, um filtro em formato errado
 * (ex: `quantidade` como string, `estado` como array) falhava silenciosamente lá dentro: nada
 * quebrava, mas o filtro em questão simplesmente não pegava, e o vendedor só via um resultado
 * estranho sem entender por quê. Todo campo é livre-texto/número solto de propósito — a Apollo é
 * quem de fato interpreta o valor; aqui só garantimos o tipo e um teto de tamanho.
 *
 * Compartilhado entre `/api/prospecting/discover` (multi-provider) e as ferramentas standalone de
 * `/api/prospecting/tools/*` (Google Places / Apollo isolados) — mesmo shape de critério em
 * qualquer um dos dois modos de busca.
 */
const text = z.string().trim().max(1000);
const values = z.array(z.string().trim().min(1).max(200)).max(30);
const segmentDetails = z.object({
  subsegmento: text.optional(),
  nicho: text.optional(),
  produtos: values.optional(),
  servicos: values.optional(),
  descricaoIdeal: text.optional(),
  palavrasObrigatorias: values.optional(),
  palavrasOpcionais: values.optional(),
  palavrasExcluir: values.optional(),
  cnaePrincipal: z
    .string()
    .regex(/^\d{7}$/)
    .optional(),
  cnaesSecundarios: z
    .array(z.string().regex(/^\d{7}$/))
    .max(30)
    .optional(),
  setorEconomico: text.optional(),
  tipoMercado: text.optional(),
  modeloNegocio: text.optional(),
  descricaoPesquisa: text.optional(),
});
const persona = z.object({
  nome: text.optional(),
  cargoPrincipal: text.optional(),
  cargosEquivalentes: values.optional(),
  cargosExcluir: values.optional(),
  departamentos: values.optional(),
  senioridades: values.optional(),
  localizacoes: values.optional(),
  palavrasChave: text.optional(),
  descricao: text.optional(),
  limite: z.number().int().min(1).max(10).optional(),
});
export const discoverCriteriaSchema = z
  .object({
    icpPesos: z.record(z.string().max(50), z.number().min(0).max(100)).optional(),
    segmentoDetalhes: segmentDetails.optional(),
    personas: z.array(persona).max(10).optional(),
    cnpj: z.string().trim().refine(isValidCnpj, 'CNPJ inválido').optional(),
    modoPesquisa: z.enum(['economico', 'equilibrado', 'completo']).optional(),
    autorizarPagos: z.boolean().optional(),
    apolloFiltros: z
      .object({
        dominios: values.optional(),
        dominiosExcluir: values.optional(),
        organizacaoIds: values.optional(),
        funcionariosFaixas: z
          .array(z.string().regex(/^\d+,\d+$/))
          .max(20)
          .optional(),
        financiamentoTotalMin: z.number().nonnegative().optional(),
        financiamentoTotalMax: z.number().nonnegative().optional(),
        ultimaRodadaMin: z.number().nonnegative().optional(),
        ultimaRodadaMax: z.number().nonnegative().optional(),
      })
      .optional(),

    icp: z.string().trim().max(1000).optional(),
    decisorCargos: z.array(z.string().trim().max(200)).max(20).optional(),
    // Vazio = "todos os segmentos" (sem filtro) — ver `discovery.ts`/`organizationSearch.ts`, que já
    // tratam `segmento` vazio como ausência de filtro. Antes exigia min(1), forçando a UI a sempre
    // pré-selecionar um segmento logístico específico mesmo quando o ICP já não é mais vertical-específico.
    segmento: z.string().trim().max(200).default(''),
    localizacao: z.string().trim().max(200).default(''),
    // Teto de 20 — prioriza qualidade (CNPJ, decisores, notícias enriquecidos em todos os leads da
    // busca) em vez de volume. Mesma constante que `SearchIntent` usa para normalizar
    // `quantityRequested` (domain/searchIntent.ts) — uma única fonte de verdade, não mais um "20"
    // duplicado em cada lugar que precisa desse teto.
    quantidade: z.number().int().min(1).max(MAX_LEADS_PER_SEARCH).default(MAX_LEADS_PER_SEARCH),
    estado: z.string().trim().max(100).optional(),
    cidade: z.string().trim().max(100).optional(),
    porte: z.string().trim().max(50).optional(),
    faturamentoMin: z.number().nonnegative().optional(),
    faturamentoMax: z.number().nonnegative().optional(),
    faturamentoMensalMin: z.number().nonnegative().optional(),
    faturamentoMensalMax: z.number().nonnegative().optional(),
    palavrasChave: z.string().trim().max(300).optional(),
    nomeEmpresa: z.string().trim().max(200).optional(),
    anoFundacaoMin: z.number().int().min(1800).max(2100).optional(),
    anoFundacaoMax: z.number().int().min(1800).max(2100).optional(),
    tecnologias: z.string().trim().max(500).optional(),
    tecnologiasExcluir: z.string().trim().max(500).optional(),
    localizacaoExcluir: z.string().trim().max(500).optional(),
    apenasCapitalAberto: z.boolean().optional(),
    pagina: z.number().int().min(1).max(20).optional(),
    excludeNames: values.optional(),
  })
  .superRefine((criteria, ctx) => {
    const ranges = [
      [criteria.faturamentoMin, criteria.faturamentoMax],
      [criteria.faturamentoMensalMin, criteria.faturamentoMensalMax],
      [criteria.anoFundacaoMin, criteria.anoFundacaoMax],
      [
        criteria.apolloFiltros?.financiamentoTotalMin,
        criteria.apolloFiltros?.financiamentoTotalMax,
      ],
      [criteria.apolloFiltros?.ultimaRodadaMin, criteria.apolloFiltros?.ultimaRodadaMax],
    ];
    if (ranges.some(([min, max]) => min != null && max != null && min > max))
      ctx.addIssue({
        code: 'custom',
        message: 'Intervalo mínimo deve ser menor ou igual ao máximo',
      });
  });

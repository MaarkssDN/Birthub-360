import { Router, type Request, type Response } from 'express';
import { getDatabase, saveDatabase } from '../db.js';
import { parseSearchIntent, validateSearchIntent } from '../searchIntent.js';
import { buildRequirementsFromSearchIntent, evaluateRequirements } from '../requirementEngine.js';
import { planSearch } from '../queryPlanner.js';
import { buildFunnelSummary } from '../progressiveSearch.js';
import { buildCompanyKey, findDuplicate, type CompanyKey } from '../entityResolution.js';
import {
  buildCnpjEvidence,
  buildDecisionMakerEvidence,
  saveFieldEvidence,
} from '../evidence.js';
import { computeLeadScores } from '../scoring.js';
import { detectSignalsForLead } from '../signals.js';
import {
  startSearchRun,
  attachSearchPlan,
  recordStep,
  recordProviderCall,
  recordCandidateDecision,
  finishSearchRun,
} from '../observability.js';
import { complementDecisionMakerEmail as complementDecisionMakerEmailWithHunter } from '../search/providers/hunter.provider.js';
import { resolveBitrixWebhookForCompany, checkBitrixDuplicate } from '../services/bitrix.js';
import {
  withCache,
  hasFreshCacheEntry,
  CACHE_TTL_MS,
  createBudgetTracker,
  hasEnrichmentBudget,
  isBudgetExhausted,
  recordApiCall,
  recordEnrichment,
  parseSearchBudget,
  getCircuitState,
} from '../resilience.js';
import { requireAuth, tenantCompany } from '../auth.js';
import type { Lead, DecisionMaker } from '../../types.js';
import type { CnpjData } from '../cnpj.js';
import {
  findLeads,
  enrichLeadWithApollo,
  resolveCnpjWithResilience,
  cleanDomainForCache,
  buildCnpjCacheKey,
} from '../services/leadSearch.service.js';
import { heavyAiLimiter, LEAD_COMPANY_CLAUSE } from './leads.shared.js';

export const prospectRouter = Router();

// Prospecting Pipeline
prospectRouter.post('/prospect', heavyAiLimiter, requireAuth, async (req: Request, res: Response) => {
  let searchId: string = '';
  try {
    const {
      pitch,
      aiConfig,
      googleApiKey,
      apolloApiKey,
      hunterApiKey,
      company: bodyCompany,
      bitrixWebhook,
    } = req.body;

    // Handoff 12→05 (F2, parecer 24 PR #323): a company vem SEMPRE da sessão,
    // normalizada como nas demais rotas (tenantCompany) — o bypass anterior
    // `role !== 'admin' ? session : body` permitia a um admin gravar leads com
    // a company de outro tenant via body. `bodyCompany` resta apenas como
    // fallback defensivo (requireTenantScope já garante company na sessão).
    const company = tenantCompany(req) || bodyCompany;

    const budgetTracker = createBudgetTracker(parseSearchBudget(req.body.budget));
    const searchIntent = parseSearchIntent(req.body);

    const searchRun = startSearchRun({
      request: {
        query: req.body?.query,
        segment: searchIntent.segment,
        region: searchIntent.location.state,
        city: searchIntent.location.city,
        companyType: searchIntent.companyType,
        employeeCount: searchIntent.employeeCount,
        annualRevenue: searchIntent.annualRevenue,
        decisionMakerRole: searchIntent.decisionMakerRole,
        company: company || 'birthhub360',
        limit: searchIntent.targetCount,
      },
      searchIntent,
    });
    searchId = searchRun.searchId;
    const finishIntentStep = recordStep(searchId, 'search_intent_validated');

    const validation = validateSearchIntent(searchIntent);
    if (!validation.valid) {
      finishIntentStep({ status: 'error', detail: validation.errors.join(' ') });
      finishSearchRun(searchId, 'failed', validation.errors.join(' '));
      return res.status(400).json({
        error: validation.errors.join(' '),
        searchIntentErrors: validation.errors,
        searchId,
      });
    }
    finishIntentStep({ status: 'ok' });

    const { segment, decisionMakerRole, decisionMakerTitles } = searchIntent;

    const effectiveCompany = company || 'birthhub360';
    const effectiveGoogleKey = (googleApiKey || process.env.GOOGLE_PLACES_API_KEY || '').trim();
    const effectiveApolloKey = (apolloApiKey || process.env.APOLLO_API_KEY || '').trim();
    const effectiveHunterKey = (hunterApiKey || process.env.HUNTER_API_KEY || '').trim();

    const searchQuery = searchIntent.freeTextQuery;
    const effectiveLimit = searchIntent.targetCount;
    const campaignId = `camp-${Date.now()}`;
    const now = new Date().toISOString();
    const db = await getDatabase();

    // Handoff 12→05 (F2): dedupe deve considerar só os leads da MESMA company —
    // antes lia a tabela inteira (vazamento cross-tenant) e podia descartar
    // candidatos por homônimo de outro tenant.
    const existingLeadsRes = await db.exec(
      `SELECT id, domain, name, cnpj FROM leads WHERE ${LEAD_COMPANY_CLAUSE}`,
      [effectiveCompany],
    );
    const existingCompanyKeys: Array<{
      key: CompanyKey;
      entry: { id: string; domain: string; name: string };
    }> = [];
    const excludeDomains = new Set<string>();
    const excludeNames = new Set<string>();
    if (existingLeadsRes.length > 0 && existingLeadsRes[0].values) {
      for (const row of existingLeadsRes[0].values) {
        const id = row[0] as string;
        const domain = (row[1] as string) || '';
        const name = (row[2] as string) || '';
        const cnpj = (row[3] as string) || '';
        const key = buildCompanyKey({ cnpj, domain, name });
        existingCompanyKeys.push({ key, entry: { id, domain, name } });
        if (key.domain) excludeDomains.add(key.domain);
        if (key.normalizedName) excludeNames.add(key.normalizedName);
      }
    }

    const finishDiscoveryStep = recordStep(searchId, 'discovery');
    const rawLeads = await findLeads({
      query: searchQuery,
      limit: effectiveLimit,
      googleApiKey: effectiveGoogleKey,
      excludeDomains,
      excludeNames,
      onProviderCall: (log) => recordProviderCall(searchId, log as any),
      onCandidateDiscarded: (log) =>
        recordCandidateDecision(searchId, {
          name: log.name,
          domain: log.domain,
          decision: 'discarded',
          reasonCode: log.reasonCode,
          reason: log.reason,
        }),
    });
    finishDiscoveryStep({
      status: 'ok',
      detail: `${rawLeads.length} candidato(s) novo(s) após pré-filtro de duplicidade.`,
    });

    if (rawLeads.length === 0) {
      finishSearchRun(searchId, 'completed');
      if (!effectiveGoogleKey) {
        return res.status(503).json({
          error:
            'Provedor de descoberta de empresas (Google Places) não está configurado. Configure a API key para buscar leads reais.',
          provider: 'google_places',
          providerConfigured: false,
          searchId,
        });
      }
      return res.status(404).json({
        error:
          'Nenhum lead novo encontrado para os critérios informados (empresas já prospectadas foram excluídas). Tente outros filtros.',
        searchId,
      });
    }

    const defaultPitch =
      pitch ||
      'A Atlas conecta pessoas e tecnologia gerando valores com segurança, inteligência logística e gestão de risco rodoviário.';
    const providerName = aiConfig?.provider || 'ollama';
    const modelName =
      providerName === 'ollama'
        ? aiConfig?.ollamaModel || 'llama3'
        : providerName === 'groq'
          ? aiConfig?.groqModel || 'llama-3.3-70b-versatile'
          : 'gemini-3.7-flash';

    await db.run(
      `
      INSERT INTO campaigns (id, title, segment, pitch, provider, model, leads_count, company, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        campaignId,
        `Prospecção: ${searchQuery}`,
        segment || searchQuery,
        defaultPitch,
        providerName,
        modelName,
        rawLeads.length,
        effectiveCompany,
        now,
      ],
    );

    const enrichedLeads: Lead[] = [];
    const requirements = buildRequirementsFromSearchIntent(searchIntent);
    const searchPlan = planSearch(requirements, {
      googlePlacesConfigured: Boolean(effectiveGoogleKey),
      apolloConfigured: Boolean(effectiveApolloKey),
    });
    attachSearchPlan(searchId, searchPlan);
    recordStep(
      searchId,
      'query_planned',
    )({
      status: 'ok',
      detail: `${searchPlan.steps.length} etapa(s) planejada(s), ${searchPlan.unsupportedCriteria.length} critério(s) sem provider capaz nesta execução.`,
    });

    const sellersRes = await db.exec(
      `SELECT id FROM users WHERE role = 'user' AND company = ? AND active IS DISTINCT FROM false`,
      [effectiveCompany],
    );
    const sellerIds: string[] = (sellersRes[0]?.values || []).map((row: any) => row[0] as string);

    const sdrLoads: Record<string, number> = {};
    sellerIds.forEach((id) => {
      sdrLoads[id] = 0;
    });

    if (sellerIds.length > 0) {
      const placeholders = sellerIds.map(() => '?').join(',');
      const activeLeadsRes = await db.exec(
        `SELECT assigned_to, COUNT(*) as count FROM leads WHERE assigned_to IN (${placeholders}) AND stage IN ('prospecto', 'contatado', 'negociacao') AND ${LEAD_COMPANY_CLAUSE} GROUP BY assigned_to`,
        [...sellerIds, effectiveCompany],
      );
      (activeLeadsRes[0]?.values || []).forEach((row: any) => {
        if (row[0] && sdrLoads[row[0] as string] !== undefined) {
          sdrLoads[row[0] as string] = Number(row[1]) || 0;
        }
      });
    } else {
      console.warn(
        `Nenhum vendedor ativo cadastrado para a marca "${effectiveCompany}" — leads serão salvos sem atribuição automática.`,
      );
    }

    function pickSeller(): string | null {
      if (sellerIds.length === 0) return null;
      return sellerIds.reduce(
        (best, id) => (sdrLoads[id] < sdrLoads[best] ? id : best),
        sellerIds[0],
      );
    }

    const effectiveBitrixWebhook = (
      bitrixWebhook || resolveBitrixWebhookForCompany(effectiveCompany)
    ).replace(/\/$/, '');

    const duplicatesSkipped: Array<{ name: string; matchedBy: string; existingLeadId: string }> =
      [];
    const finishEnrichmentStep = recordStep(searchId, 'enrichment_loop');

    for (let i = 0; i < rawLeads.length; i++) {
      const leadItem = rawLeads[i];
      const leadId = `lead-${Date.now()}-${i}`;

      let cnpjInfo: CnpjData;
      if (budgetTracker.used.apiCalls < budgetTracker.budget.maxApiCalls) {
        const cnpjCacheKey = buildCnpjCacheKey({
          name: leadItem.name,
          domain: leadItem.domain,
          cnpj: leadItem.cnpj,
        });
        const cnpjWasCached = hasFreshCacheEntry(cnpjCacheKey);
        cnpjInfo = await resolveCnpjWithResilience(
          {
            name: leadItem.name,
            domain: leadItem.domain,
            cnpj: leadItem.cnpj,
            address: leadItem.address,
          },
          cnpjCacheKey,
          (info) =>
            recordProviderCall(searchId, {
              provider: 'cnpj_receita_federal',
              operation: 'lookup_cnpj',
              status: info.status,
              latencyMs: info.latencyMs,
              source: info.source,
              leadName: leadItem.name,
            }),
        );
        if (!cnpjWasCached) recordApiCall(budgetTracker);
      } else {
        cnpjInfo = {};
      }

      let candidateKey: CompanyKey | null = null;
      if (cnpjInfo.cnpj) {
        candidateKey = buildCompanyKey({
          cnpj: cnpjInfo.cnpj,
          domain: leadItem.domain,
          name: leadItem.name,
        });
        const duplicate = findDuplicate(candidateKey, existingCompanyKeys);
        if (duplicate && duplicate.matchedBy === 'cnpj') {
          duplicatesSkipped.push({
            name: leadItem.name,
            matchedBy: duplicate.matchedBy,
            existingLeadId: duplicate.entry.id,
          });
          console.info(
            `CNPJ ${cnpjInfo.cnpj} já existe na base — "${leadItem.name}" não foi duplicado.`,
          );
          recordCandidateDecision(searchId, {
            name: leadItem.name,
            domain: leadItem.domain,
            cnpj: cnpjInfo.cnpj,
            decision: 'discarded',
            reasonCode: 'duplicate_cnpj',
            reason: `Mesmo CNPJ oficial (${cnpjInfo.cnpj}) de um lead já existente na base (id ${duplicate.entry.id}), mesmo com nome/domínio diferentes.`,
            matchedExistingLeadId: duplicate.entry.id,
          });
          continue;
        }
        existingCompanyKeys.push({
          key: candidateKey,
          entry: { id: leadId, domain: leadItem.domain || '', name: leadItem.name },
        });
      }

      const assignedSdr = pickSeller();
      if (assignedSdr) sdrLoads[assignedSdr]++;

      let apolloResult: { decisionMakers: DecisionMaker[]; companyLinkedin?: string };
      if (hasEnrichmentBudget(budgetTracker)) {
        const apolloTitlesKeyPart =
          decisionMakerTitles && decisionMakerTitles.length > 0
            ? [...decisionMakerTitles].sort().join(',')
            : '';
        const apolloCacheKey = `apollo:${cleanDomainForCache(leadItem.domain) || leadItem.name.toLowerCase()}:${decisionMakerRole || ''}:${apolloTitlesKeyPart}`;
        const apolloWasCached = hasFreshCacheEntry(apolloCacheKey);
        apolloResult = await withCache(
          apolloCacheKey,
          (r: { decisionMakers: DecisionMaker[]; companyLinkedin?: string }) =>
            r.decisionMakers.length > 0 ? CACHE_TTL_MS.MEDIUM_CONTACT : CACHE_TTL_MS.SHORT_SIGNAL,
          () =>
            enrichLeadWithApollo(
              leadItem.domain,
              leadItem.name,
              effectiveApolloKey,
              decisionMakerRole,
              decisionMakerTitles,
              (log) => recordProviderCall(searchId, { ...log, leadName: leadItem.name } as any),
            ),
        );
        if (!apolloWasCached) recordEnrichment(budgetTracker, { apiCalls: 2, paidCredits: 2 });
      } else {
        apolloResult = { decisionMakers: [], companyLinkedin: leadItem.company_linkedin || '' };
      }
      const decisionMakers = apolloResult.decisionMakers;
      const companyLinkedin = apolloResult.companyLinkedin || leadItem.company_linkedin || '';

      let mainDm: DecisionMaker | undefined = decisionMakers[0];

      if (effectiveHunterKey && leadItem.domain) {
        if (mainDm && !mainDm.email) {
          const foundEmail = await complementDecisionMakerEmailWithHunter(
            mainDm,
            leadItem.domain,
            effectiveHunterKey,
          );
          if (foundEmail) {
            mainDm = {
              ...mainDm,
              email: foundEmail,
              emails: [...(mainDm.emails || []), foundEmail],
            };
            decisionMakers[0] = mainDm;
          }
        } else if (!mainDm && cnpjInfo.qsa && cnpjInfo.qsa.length > 0) {
          const socio = cnpjInfo.qsa[0];
          const foundEmail = await complementDecisionMakerEmailWithHunter(
            { name: socio.nome_socio },
            leadItem.domain,
            effectiveHunterKey,
          );
          if (foundEmail) {
            mainDm = {
              name: socio.nome_socio,
              title: socio.qualificacao_socio || '',
              email: foundEmail,
              emails: [foundEmail],
              linkedin: '',
            };
            decisionMakers.push(mainDm);
          }
        }
      }

      const requirementEvaluations = evaluateRequirements(
        requirements,
        {
          segment: cnpjInfo.cnae_fiscal_descricao,
          region: cnpjInfo.uf,
          city: cnpjInfo.municipio,
          companyType: undefined,
          employeeCount: undefined,
          annualRevenue: undefined,
          decisionMakerRole: mainDm?.title,
        },
        {
          segment: 'cnpj_receita_federal',
          region: 'cnpj_receita_federal',
          city: 'cnpj_receita_federal',
          decisionMakerRole: 'apollo',
        },
      );

      const evidences = [
        ...buildCnpjEvidence(cnpjInfo),
        ...(mainDm ? buildDecisionMakerEvidence(mainDm, 'apollo') : []),
      ];

      const signals = detectSignalsForLead({ name: leadItem.name }, { cnpjData: cnpjInfo });

      const leadScores = computeLeadScores({
        requirementEvaluations,
        evidences,
        signals,
        company: effectiveCompany,
      });

      const situacaoAtiva = (cnpjInfo.situacao_cadastral || '').toUpperCase() === 'ATIVA';
      const tags = [
        segment ? `Busca: ${segment}` : undefined,
        'Novo Lead',
        situacaoAtiva ? 'CNPJ Ativo' : undefined,
      ].filter((t): t is string => Boolean(t));

      const bitrixCheck = await checkBitrixDuplicate(effectiveBitrixWebhook, {
        phone: leadItem.phone,
        email: mainDm?.email,
      });

      const completeLead: Lead = {
        ...leadItem,
        id: leadId,
        campaign_id: campaignId,
        search_id: searchId,
        cnpj: cnpjInfo.cnpj,
        razao_social: cnpjInfo.razao_social,
        nome_fantasia: cnpjInfo.nome_fantasia || leadItem.name,
        situacao_cadastral: cnpjInfo.situacao_cadastral,
        cnae_fiscal: cnpjInfo.cnae_fiscal,
        cnae_fiscal_descricao: cnpjInfo.cnae_fiscal_descricao,
        capital_social: cnpjInfo.capital_social,
        natureza_juridica: cnpjInfo.natureza_juridica,
        porte: cnpjInfo.porte,
        qsa: cnpjInfo.qsa,
        cnpj_consultado: true,
        company_linkedin: companyLinkedin,
        decision_makers: decisionMakers,
        decision_maker_name: mainDm?.name,
        decision_maker_title: mainDm?.title,
        decision_maker_email: mainDm?.email,
        decision_maker_emails: mainDm?.emails,
        decision_maker_phone: mainDm?.phone,
        decision_maker_phones: mainDm?.phones,
        decision_maker_linkedin: mainDm?.linkedin,
        stage: 'prospecto',
        tags,
        requirement_evaluations: requirementEvaluations,
        scores: leadScores,
        copies: {
          cold_call: '',
          cold_email: '',
          whatsapp: '',
          linkedin: '',
        },
        copies_generated: false,
        created_at: now,
      };
      (completeLead as any).company = effectiveCompany;
      (completeLead as any).bitrix_check_status = bitrixCheck.status;
      (completeLead as any).bitrix_check_detail = bitrixCheck.detail;

      const isEstimated =
        !cnpjInfo.situacao_cadastral || !cnpjInfo.cnae_fiscal || !cnpjInfo.capital_social;
      (completeLead as any).is_estimated = isEstimated;

      await db.run(
        `
        INSERT INTO leads (
          id, campaign_id, name, cnpj, razao_social, situacao_cadastral, cnae_fiscal, cnae_fiscal_descricao, capital_social, qsa,
          address, phone, corporate_email, website, domain, company_linkedin,
          rating, total_ratings, segment, company_type, employee_count, annual_revenue,
          decision_maker_name, decision_maker_title, decision_maker_email, decision_maker_emails,
          decision_maker_phone, decision_maker_phones, decision_maker_linkedin, stage, tags, assigned_to,
          company, bitrix_check_status, bitrix_check_detail, bitrix_checked_at, is_estimated, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          leadId,
          campaignId,
          completeLead.name,
          completeLead.cnpj || '',
          completeLead.razao_social || '',
          completeLead.situacao_cadastral || '',
          completeLead.cnae_fiscal || '',
          completeLead.cnae_fiscal_descricao || '',
          completeLead.capital_social || '',
          JSON.stringify(completeLead.qsa || []),
          completeLead.address || '',
          completeLead.phone || '',
          completeLead.corporate_email || '',
          completeLead.website || '',
          completeLead.domain,
          completeLead.company_linkedin || '',
          Number(completeLead.rating) || 0,
          completeLead.total_ratings || 0,
          completeLead.segment || '',
          completeLead.company_type || '',
          completeLead.employee_count || '',
          completeLead.annual_revenue || '',
          mainDm?.name || '',
          mainDm?.title || '',
          mainDm?.email || '',
          JSON.stringify(mainDm?.emails || []),
          mainDm?.phone || '',
          JSON.stringify(mainDm?.phones || []),
          mainDm?.linkedin || '',
          'prospecto',
          JSON.stringify(completeLead.tags || []),
          assignedSdr,
          effectiveCompany,
          bitrixCheck.status,
          bitrixCheck.detail,
          bitrixCheck.status === 'unchecked' ? null : now,
          isEstimated,
          now,
        ],
      );

      if (evidences.length > 0) {
        try {
          await saveFieldEvidence(db, 'lead', leadId, evidences);
        } catch (err: any) {
          console.warn(`[field_evidence] Falha ao salvar evidências do lead ${leadId}:`, err);
        }
      }

      enrichedLeads.push(completeLead);

      const unmatchedHardFilters = requirementEvaluations
        .filter((e) => e.type === 'HARD_FILTER' && e.status === 'unmatched')
        .map((e) => e.criterion);
      recordCandidateDecision(searchId, {
        name: leadItem.name,
        domain: leadItem.domain,
        cnpj: cnpjInfo.cnpj,
        decision: 'included',
        reasonCode: 'included',
        reason: 'Passou pela checagem de duplicidade (Wave 5) e foi incluído no resultado final.',
        leadId,
        unmatchedHardFilters: unmatchedHardFilters.length > 0 ? unmatchedHardFilters : undefined,
      });
    }
    finishEnrichmentStep({
      status: 'ok',
      detail: `${enrichedLeads.length} lead(s) enriquecido(s) e incluído(s).`,
    });

    const finishPersistenceStep = recordStep(searchId, 'persistence');
    saveDatabase();
    finishPersistenceStep({ status: 'ok' });

    const duplicateNote =
      duplicatesSkipped.length > 0
        ? ` (${duplicatesSkipped.length} ${duplicatesSkipped.length === 1 ? 'empresa já estava' : 'empresas já estavam'} na base pelo CNPJ e não ${duplicatesSkipped.length === 1 ? 'foi duplicada' : 'foram duplicadas'})`
        : '';

    const decisionMakersConfirmedCount = enrichedLeads.filter((l) =>
      Boolean(l.decision_maker_name),
    ).length;
    const funnelSummary = buildFunnelSummary({
      targetCount: effectiveLimit,
      discoveryProviderConfigured: Boolean(effectiveGoogleKey),
      discoveredCount: rawLeads.length,
      duplicatesSkippedCount: duplicatesSkipped.length,
      finalCount: enrichedLeads.length,
      decisionMakersConfirmedCount,
    });

    finishSearchRun(searchId, 'completed');

    res.json({
      success: true,
      campaignId,
      searchId,
      leads: enrichedLeads,
      searchPlan,
      duplicatesSkipped,
      skippedDuplicateCnpjCount: duplicatesSkipped.length,
      funnelSummary,
      stopReason: funnelSummary.stopReason,
      rankingApplied: false,
      rankingNote:
        'Resultados na ordem de descoberta, não há ranking por adequação ainda (ver Wave 8 - Scoring).',
      budget: {
        limits: budgetTracker.budget,
        used: budgetTracker.used,
      },
      budgetExhausted: isBudgetExhausted(budgetTracker),
      callsUsed: budgetTracker.used.apiCalls,
      providerCircuits: {
        cnpj_receita_federal: getCircuitState('cnpj_receita_federal'),
        apollo: getCircuitState('apollo'),
      },
      message: `${enrichedLeads.length} empresas prospectadas com Places, CNPJ Oficial e Decisores Apollo salvos com sucesso no SQLite!${duplicateNote}`,
    });
  } catch (err: any) {
    console.error('Erro na prospecção:', err);
    if (searchId)
      finishSearchRun(searchId, 'failed', err.message || 'Falha no processamento da prospecção.');
    res.status(500).json({
      error: err.message || 'Falha no processamento da prospecção.',
      searchId: searchId || undefined,
    });
  }
});

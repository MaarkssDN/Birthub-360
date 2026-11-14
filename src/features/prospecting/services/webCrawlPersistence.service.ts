/**
 * Ponte Crawlee → persistência (reconciliação do handoff 16→05, Onda 14).
 *
 * O `runCrawler` (`crawlee/crawler.ts`) extrai `{ url, title, emails, socialMedia }` em memória
 * e o workflow Temporal `prospectWorkflow`/`scrapeProspect` não persistia nada — a "resolução"
 * anterior superestimava. Este serviço é a ponte mínima real: dado o resultado do crawl,
 * resolve a Company correspondente (por `companyId` explícito, `leadId` → company, ou domínio
 * do website) e grava com DEDUPE:
 *
 * - `Company.emails` (String[]): união case-insensitive — e-mail já registrado nunca é
 *   duplicado (mesma regra de `filterNewContacts`/`saveDecisionMakersAsContacts` em
 *   enrichment.service.ts, aqui sobre o array da própria Company);
 * - `Company.linkedin/instagram/twitter/facebook`: só preenche campo VAZIO — nunca sobrescreve
 *   um valor já cadastrado (manual ou de outro provider);
 * - `EnrichmentLog`: uma linha de proveniência por página efetivamente alterada — re-scrape que
 *   não traz nada novo NÃO gera log novo (sem spam de trilha de auditoria).
 *
 * Se não houver Company correspondente, nada é criado automaticamente: criar Company/Lead a
 * partir de um scrape de domínio solto é decisão de produto (02/00), não de infraestrutura —
 * registrado como pendência no handoff. O resultado devolve `reason: 'no_company_match'` para
 * que o chamador decida o fallback.
 */

import type { Company } from '@prisma/client';
import { logger } from '../../../lib/logger.js';
import type { CrawledPageSignals } from '../domain/prospectTypes.js';
import {
  defaultEnrichmentRepository,
  type IEnrichmentRepository,
} from '../infra/PrismaEnrichmentRepository.js';
import { extractDomainFromWebsite } from './enrichment/domainGuess.js';

export type CrawlMatchBy = 'companyId' | 'leadId' | 'websiteDomain' | 'none';

export interface CrawlPagePersistence {
  url: string;
  companyId: string | null;
  matchedBy: CrawlMatchBy;
  persisted: boolean;
  /** true quando a Company foi de fato alterada (e-mail/rede novos); false = já estava tudo lá. */
  changed: boolean;
  emailsAdded: number;
  socialFieldsAdded: number;
  reason?: string;
}

export interface PersistCrawledSignalsOptions {
  organizationId: string;
  /** Atalho quando o chamador já sabe a empresa (ex.: workflow disparado a partir de um lead). */
  companyId?: string;
  /** Resolve a empresa dona do lead quando `companyId` não é informado. */
  leadId?: string;
  repo?: IEnrichmentRepository;
}

const SOCIAL_FIELDS = ['linkedin', 'instagram', 'twitter', 'facebook'] as const;
type SocialField = (typeof SOCIAL_FIELDS)[number];

/** Classifica um link social pelo hostname — primeiro match por rede vence. */
function classifySocialUrl(url: string): SocialField | null {
  const lower = url.toLowerCase();
  if (lower.includes('linkedin.com')) return 'linkedin';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('twitter.com') || lower.includes('x.com/')) return 'twitter';
  if (lower.includes('facebook.com') || lower.includes('fb.com/')) return 'facebook';
  return null;
}

interface CompanyWebSignals {
  emails: string[];
  linkedin: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
}

interface MergeResult {
  update: {
    emails?: string[];
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  emailsAdded: number;
  socialFieldsAdded: number;
}

/**
 * Merge puro e testável: união deduplicada de e-mails + preenchimento só de campos sociais
 * vazios. Nunca remove nem sobrescreve dado existente.
 */
export function mergeCrawledSignalsIntoCompany(
  company: CompanyWebSignals,
  signals: CrawledPageSignals,
): MergeResult {
  const existingEmails = new Set(company.emails.map((e) => e.trim().toLowerCase()));
  const newEmails = signals.emails.filter((e) => {
    const key = e.trim().toLowerCase();
    if (!key || existingEmails.has(key)) return false;
    existingEmails.add(key);
    return true;
  });

  const update: MergeResult['update'] = {};
  if (newEmails.length > 0) {
    update.emails = [...company.emails, ...newEmails];
  }

  let socialFieldsAdded = 0;
  const seen = new Set<SocialField>();
  for (const link of signals.socialMedia) {
    const field = classifySocialUrl(link);
    if (!field || seen.has(field)) continue;
    seen.add(field);
    if (company[field]) continue; // campo já preenchido — não sobrescreve
    update[field] = link;
    socialFieldsAdded += 1;
  }

  return { update, emailsAdded: newEmails.length, socialFieldsAdded };
}

/**
 * Resolve a Company alvo de um resultado de crawl, nesta ordem: `companyId` explícito →
 * `leadId` (empresa dona do lead) → domínio do website da página raspada.
 */
async function resolveTargetCompany(
  organizationId: string,
  page: CrawledPageSignals,
  options: PersistCrawledSignalsOptions,
  repo: IEnrichmentRepository,
): Promise<{ company: Company | null; matchedBy: CrawlMatchBy }> {
  if (options.companyId) {
    const company = await repo.findCompanyById(options.companyId, organizationId);
    if (company) return { company, matchedBy: 'companyId' };
    logger.warn(
      { companyId: options.companyId, url: page.url },
      'persistCrawledSignals: companyId informado não encontrado no tenant — tentando fallback por domínio',
    );
  }

  if (options.leadId) {
    const leadCompanyId = await repo.findLeadCompanyId(options.leadId, organizationId);
    if (leadCompanyId) {
      const company = await repo.findCompanyById(leadCompanyId, organizationId);
      if (company) return { company, matchedBy: 'leadId' };
    }
  }

  const domain = extractDomainFromWebsite(page.url);
  if (domain) {
    const company = await repo.findCompanyByWebsiteDomain(organizationId, domain);
    if (company) return { company, matchedBy: 'websiteDomain' };
  }

  return { company: null, matchedBy: 'none' };
}

/**
 * Persiste os sinais de cada página crawleada na Company correspondente, com dedupe.
 * Nunca lança por página: falha de banco/repo vira `persisted:false` + `reason` observável no
 * resultado (e log de erro) — o scrape em si não deve ser derrubado por um problema de
 * persistência, mas a falha fica registrada, não escondida.
 */
export async function persistCrawledSignals(
  pages: CrawledPageSignals[],
  options: PersistCrawledSignalsOptions,
): Promise<CrawlPagePersistence[]> {
  const repo = options.repo ?? defaultEnrichmentRepository;
  const results: CrawlPagePersistence[] = [];

  for (const page of pages) {
    try {
      const target = await resolveTargetCompany(options.organizationId, page, options, repo);
      const company = target.company;
      if (!company) {
        logger.warn(
          { url: page.url, organizationId: options.organizationId },
          'persistCrawledSignals: nenhum Company correspondente — sinais não persistidos (criação automática de Company/Lead a partir de scrape é decisão pendente de produto)',
        );
        results.push({
          url: page.url,
          companyId: null,
          matchedBy: 'none',
          persisted: false,
          changed: false,
          emailsAdded: 0,
          socialFieldsAdded: 0,
          reason: 'no_company_match',
        });
        continue;
      }

      const merge = mergeCrawledSignalsIntoCompany(company, page);
      const hasChange =
        merge.emailsAdded > 0 ||
        merge.socialFieldsAdded > 0 ||
        Object.keys(merge.update).length > 0;

      if (!hasChange) {
        // Dedupe: nada novo — não grava update nem EnrichmentLog (evita duplicar trilha).
        results.push({
          url: page.url,
          companyId: company.id,
          matchedBy: target.matchedBy,
          persisted: true,
          changed: false,
          emailsAdded: 0,
          socialFieldsAdded: 0,
        });
        continue;
      }

      await repo.updateCompany(company.id, merge.update);
      await repo.createEnrichmentLog({
        companyId: company.id,
        source: 'Crawlee-WebScrape',
        field: 'sinais-web-contatos-sociais',
        status: 'success',
        // Dado observado diretamente no site da própria empresa — "confirmado" (presente na
        // página), nunca estimativa nossa. Mesma convenção de dataOrigin do restante do
        // enriquecimento (ver handoff onda-7/05-para-01-enrichmentlog-provenance-fields.md).
        dataOrigin: 'confirmado',
        appliedToCompany: true,
        rawData: JSON.parse(
          JSON.stringify({
            url: page.url,
            title: page.title,
            emails: page.emails,
            socialMedia: page.socialMedia,
          }),
        ),
      });

      results.push({
        url: page.url,
        companyId: company.id,
        matchedBy: target.matchedBy,
        persisted: true,
        changed: true,
        emailsAdded: merge.emailsAdded,
        socialFieldsAdded: merge.socialFieldsAdded,
      });
    } catch (error) {
      logger.error(
        { err: error, url: page.url, organizationId: options.organizationId },
        'persistCrawledSignals: falha ao persistir sinais do crawl — resultado marcado como não persistido',
      );
      results.push({
        url: page.url,
        companyId: null,
        matchedBy: 'none',
        persisted: false,
        changed: false,
        emailsAdded: 0,
        socialFieldsAdded: 0,
        reason: 'persist_error',
      });
    }
  }

  return results;
}

import { describe, expect, it, vi } from 'vitest';
import type { Company, Contact, EnrichmentLog, Prisma } from '@prisma/client';
import type { CrawledPageSignals } from '../../../shared/contracts/webCrawl.contract.js';
import type { IEnrichmentRepository } from '../../../features/prospecting/infra/PrismaEnrichmentRepository.js';
import {
  mergeCrawledSignalsIntoCompany,
  persistCrawledSignals,
} from '../webCrawlPersistence.service.js';

const ORG = 'org_1';

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 'company_1',
    organizationId: ORG,
    legalName: 'Empresa Teste',
    tradeName: 'Empresa Teste',
    website: 'https://empresa-teste.com.br',
    emails: ['contato@empresa-teste.com.br'],
    linkedin: null,
    instagram: null,
    twitter: null,
    facebook: null,
    ...overrides,
  } as Company;
}

function makeSignals(overrides: Partial<CrawledPageSignals> = {}): CrawledPageSignals {
  return {
    url: 'https://empresa-teste.com.br/',
    title: 'Empresa Teste',
    emails: ['vendas@empresa-teste.com.br', 'CONTATO@empresa-teste.com.br'],
    socialMedia: [
      'https://www.linkedin.com/company/empresa-teste',
      'https://instagram.com/empresa_teste',
      'https://twitter.com/empresa_teste',
      'https://facebook.com/empresa.teste',
    ],
    ...overrides,
  };
}

/** Repo fake em memória — implementa IEnrichmentRepository sem Prisma. */
function makeFakeRepo(seed: { companies?: Company[]; leadCompanyId?: string | null }) {
  const companies = new Map((seed.companies ?? []).map((c) => [c.id, { ...c }]));
  const calls = {
    updateCompany: [] as Array<{ id: string; data: Prisma.CompanyUpdateInput }>,
    createEnrichmentLog: [] as Array<Prisma.EnrichmentLogUncheckedCreateInput>,
    createContacts: 0,
  };

  const repo: IEnrichmentRepository = {
    async findCompanyById(id, organizationId) {
      const c = companies.get(id);
      return c && c.organizationId === organizationId ? c : null;
    },
    async findCompanyByWebsiteDomain(organizationId, domain) {
      for (const c of companies.values()) {
        if (c.organizationId !== organizationId || !c.website) continue;
        try {
          const host = new URL(
            c.website.startsWith('http') ? c.website : `https://${c.website}`,
          ).hostname
            .replace(/^www\./, '')
            .toLowerCase();
          if (host === domain.toLowerCase()) return c;
        } catch {
          /* website inválido — ignora */
        }
      }
      return null;
    },
    async findLeadCompanyId() {
      return seed.leadCompanyId ?? null;
    },
    async updateCompany(id, data) {
      calls.updateCompany.push({ id, data });
      const c = companies.get(id);
      if (c) Object.assign(c, data);
      return companies.get(id) as Company;
    },
    async findContactsEmailsAndPhones(): Promise<Pick<Contact, 'email' | 'phone'>[]> {
      return [];
    },
    async createContacts(): Promise<number> {
      calls.createContacts += 1;
      return 0;
    },
    async createEnrichmentLog(data): Promise<EnrichmentLog> {
      calls.createEnrichmentLog.push(data);
      return { id: 'log_1', createdAt: new Date(), ...data } as EnrichmentLog;
    },
    async deleteEnrichmentLogsCreatedBefore(): Promise<number> {
      return 0;
    },
  };

  return { repo, calls, companies };
}

describe('mergeCrawledSignalsIntoCompany', () => {
  it('deduplica e-mails case-insensitive e só preenche campos sociais vazios', () => {
    const company = {
      emails: ['Contato@Empresa-Teste.com.br'],
      linkedin: 'https://linkedin.com/company/já-cadastrado',
      instagram: null,
      twitter: null,
      facebook: null,
    };
    const merge = mergeCrawledSignalsIntoCompany(company, makeSignals());

    // 'CONTATO@empresa-teste.com.br' já existe (case-insensitive) → só 'vendas@' entra.
    expect(merge.emailsAdded).toBe(1);
    expect(merge.update.emails).toEqual([
      'Contato@Empresa-Teste.com.br',
      'vendas@empresa-teste.com.br',
    ]);
    // linkedin já preenchido → não sobrescreve; instagram/twitter/facebook vazios → preenche.
    expect(merge.update.linkedin).toBeUndefined();
    expect(merge.update.instagram).toBe('https://instagram.com/empresa_teste');
    expect(merge.update.twitter).toBe('https://twitter.com/empresa_teste');
    expect(merge.update.facebook).toBe('https://facebook.com/empresa.teste');
    expect(merge.socialFieldsAdded).toBe(3);
  });

  it('retorna update vazio quando tudo já existe (dedupe total)', () => {
    const company = {
      emails: ['vendas@empresa-teste.com.br', 'contato@empresa-teste.com.br'],
      linkedin: 'https://www.linkedin.com/company/empresa-teste',
      instagram: 'https://instagram.com/empresa_teste',
      twitter: 'https://twitter.com/empresa_teste',
      facebook: 'https://facebook.com/empresa.teste',
    };
    const merge = mergeCrawledSignalsIntoCompany(company, makeSignals());
    expect(merge.update).toEqual({});
    expect(merge.emailsAdded).toBe(0);
    expect(merge.socialFieldsAdded).toBe(0);
  });
});

describe('persistCrawledSignals', () => {
  it('persiste sinais na Company encontrada por domínio, com EnrichmentLog de proveniência', async () => {
    const { repo, calls } = makeFakeRepo({ companies: [makeCompany()] });
    const results = await persistCrawledSignals([makeSignals()], {
      organizationId: ORG,
      repo,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      companyId: 'company_1',
      matchedBy: 'websiteDomain',
      persisted: true,
      changed: true,
      emailsAdded: 1,
      socialFieldsAdded: 4,
    });
    expect(calls.updateCompany).toHaveLength(1);
    expect(calls.updateCompany[0].data.emails).toContain('vendas@empresa-teste.com.br');
    expect(calls.createEnrichmentLog).toHaveLength(1);
    expect(calls.createEnrichmentLog[0]).toMatchObject({
      companyId: 'company_1',
      source: 'Crawlee-WebScrape',
      status: 'success',
      dataOrigin: 'confirmado',
      appliedToCompany: true,
    });
  });

  it('dedupe: segundo scrape idêntico não grava update nem EnrichmentLog', async () => {
    const { repo, calls, companies } = makeFakeRepo({ companies: [makeCompany()] });
    const first = await persistCrawledSignals([makeSignals()], {
      organizationId: ORG,
      repo,
    });
    expect(first[0].changed).toBe(true);

    // Estado persistido no fake reflete o update — segundo run com os MESMOS sinais.
    const second = await persistCrawledSignals([makeSignals()], {
      organizationId: ORG,
      repo,
    });
    expect(second[0]).toMatchObject({ persisted: true, changed: false });
    expect(calls.updateCompany).toHaveLength(1); // sem novo update
    expect(calls.createEnrichmentLog).toHaveLength(1); // sem novo log
    expect(companies.get('company_1')?.emails).toHaveLength(2);
  });

  it('resolve a empresa via leadId quando companyId/domínio não bastam', async () => {
    const company = makeCompany({ website: 'https://outro-dominio.com' });
    const { repo, calls } = makeFakeRepo({
      companies: [company],
      leadCompanyId: 'company_1',
    });
    const results = await persistCrawledSignals([makeSignals()], {
      organizationId: ORG,
      leadId: 'lead_9',
      repo,
    });
    expect(results[0]).toMatchObject({
      companyId: 'company_1',
      matchedBy: 'leadId',
      persisted: true,
    });
    expect(calls.updateCompany).toHaveLength(1);
  });

  it('retorna no_company_match quando não há empresa correspondente e não cria nada', async () => {
    const { repo, calls } = makeFakeRepo({ companies: [] });
    const results = await persistCrawledSignals([makeSignals()], {
      organizationId: ORG,
      repo,
    });
    expect(results[0]).toMatchObject({
      persisted: false,
      matchedBy: 'none',
      reason: 'no_company_match',
    });
    expect(calls.updateCompany).toHaveLength(0);
    expect(calls.createEnrichmentLog).toHaveLength(0);
  });

  it('falha de repo vira persist_error observável, sem derrubar o lote', async () => {
    const { repo } = makeFakeRepo({ companies: [makeCompany()] });
    repo.updateCompany = vi.fn(async () => {
      throw new Error('db down');
    });
    const results = await persistCrawledSignals([makeSignals()], {
      organizationId: ORG,
      repo,
    });
    expect(results[0]).toMatchObject({ persisted: false, reason: 'persist_error' });
  });
});

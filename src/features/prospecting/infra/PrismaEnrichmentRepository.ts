import type { Company, Prisma, Contact, EnrichmentLog } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import type { IEnrichmentRepository } from '../domain/IEnrichmentRepository.js';
export type { IEnrichmentRepository };

/** Extrai o hostname (sem "www.") de uma URL/website — versão local e mínima para não criar
 * dependência de infra → services; aceita os mesmos formatos de `website` gravados na Company. */
function websiteHostname(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '').toLowerCase() || null;
  } catch {
    return null;
  }
}

export class PrismaEnrichmentRepository implements IEnrichmentRepository {
  async findCompanyById(id: string, organizationId: string): Promise<Company | null> {
    return prisma.company.findFirst({ where: { id, organizationId } });
  }

  async findCompanyByWebsiteDomain(
    organizationId: string,
    domain: string,
  ): Promise<Company | null> {
    const normalized = domain.trim().toLowerCase();
    if (!normalized) return null;
    // Filtro grosso no banco (contains no domínio) + verificação fina do hostname em JS — um
    // `contains` puro casaria "notexample.com" com "example.com" e gravaria sinal na empresa
    // errada (dedupe/tenant corretos, mas alvo errado é pior que não persistir).
    const candidates = await prisma.company.findMany({
      where: {
        organizationId,
        website: { contains: normalized, mode: 'insensitive' },
      },
      select: { id: true, website: true },
      take: 50,
    });
    const match = candidates.find((c) => websiteHostname(c.website) === normalized);
    if (!match) return null;
    return prisma.company.findUnique({ where: { id: match.id } });
  }

  async findLeadCompanyId(leadId: string, organizationId: string): Promise<string | null> {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId },
      select: { companyId: true },
    });
    return lead?.companyId ?? null;
  }

  async updateCompany(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return prisma.company.update({ where: { id }, data });
  }

  async findContactsEmailsAndPhones(
    companyId: string,
  ): Promise<Pick<Contact, 'email' | 'phone'>[]> {
    return prisma.contact.findMany({ where: { companyId }, select: { email: true, phone: true } });
  }

  async createContacts(data: Prisma.ContactCreateManyInput[]): Promise<number> {
    if (data.length === 0) return 0;
    const res = await prisma.contact.createMany({ data });
    return res.count;
  }

  async createEnrichmentLog(
    data: Prisma.EnrichmentLogUncheckedCreateInput,
  ): Promise<EnrichmentLog> {
    return prisma.enrichmentLog.create({ data });
  }

  async deleteEnrichmentLogsCreatedBefore(cutoff: Date): Promise<number> {
    const res = await prisma.enrichmentLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return res.count;
  }
}

export const defaultEnrichmentRepository = new PrismaEnrichmentRepository();

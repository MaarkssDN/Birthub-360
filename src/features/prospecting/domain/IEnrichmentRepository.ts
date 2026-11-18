import type { Company, Prisma, Contact, EnrichmentLog } from '@prisma/client';

export interface IEnrichmentRepository {
  findCompanyById(id: string, organizationId: string): Promise<Company | null>;
  /**
   * Localiza a Company do tenant cujo `website` aponta para o domínio informado (hostname sem
   * "www."). Usado pela ponte Crawlee→persistência quando o workflow recebe só a URL raspada,
   * sem `companyId` explícito. Retorna no máximo uma Company (a primeira que casa o domínio).
   */
  findCompanyByWebsiteDomain(organizationId: string, domain: string): Promise<Company | null>;
  /**
   * Resolve a Company dona de um Lead (Lead.companyId). Retorna null quando o lead não existe,
   * pertence a outro tenant ou ainda não foi vinculado a uma empresa.
   */
  findLeadCompanyId(leadId: string, organizationId: string): Promise<string | null>;
  updateCompany(id: string, data: Prisma.CompanyUpdateInput): Promise<Company>;
  findContactsEmailsAndPhones(companyId: string): Promise<Pick<Contact, 'email' | 'phone'>[]>;
  createContacts(data: Prisma.ContactCreateManyInput[]): Promise<number>;
  createEnrichmentLog(data: Prisma.EnrichmentLogUncheckedCreateInput): Promise<EnrichmentLog>;
  /**
   * Expurgo de retenção (TAREFA-SANEAMENTO-019 / BT360-DT-0027): remove logs de enriquecimento
   * criados antes de `cutoff`. Retorna quantos registros foram apagados.
   */
  deleteEnrichmentLogsCreatedBefore(cutoff: Date): Promise<number>;
}

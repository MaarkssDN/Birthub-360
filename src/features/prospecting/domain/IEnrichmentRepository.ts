import type { Company, Prisma, Contact, EnrichmentLog } from '@prisma/client';

export interface IEnrichmentRepository {
  findCompanyById(id: string, organizationId: string): Promise<Company | null>;
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

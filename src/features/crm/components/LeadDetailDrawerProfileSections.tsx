import { Building2, Globe, Mail, Phone, User } from 'lucide-react';
import type { Lead } from '../../../types/index.js';

type LeadCompany = NonNullable<Lead['company']>;
type LeadContact = NonNullable<Lead['contact']>;

export function LeadCompanySection({ company }: { company: LeadCompany }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-brand" /> Dados da Empresa
      </h3>
      <div className="grid grid-cols-2 gap-4 bg-surface-2/40 p-4 rounded-2xl border border-line">
        {company.cnpj && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">CNPJ</span>
            <span className="text-xs font-semibold text-ink">{company.cnpj}</span>
          </div>
        )}
        {company.segment && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">Segmento</span>
            <span className="text-xs font-semibold text-ink">{company.segment}</span>
          </div>
        )}
        {company.employeeCount && company.employeeCount > 0 && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">Funcionários</span>
            <span className="text-xs font-semibold text-ink">{company.employeeCount}</span>
          </div>
        )}
        {company.website && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">Website</span>
            <a
              href={
                company.website.startsWith('http') ? company.website : `https://${company.website}`
              }
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-brand-ink dark:text-brand hover:underline flex items-center gap-1"
            >
              <Globe className="w-3 h-3" /> {company.website}
            </a>
          </div>
        )}
        {company.enrichmentStatus && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">Enriquecimento</span>
            <span
              className={`text-xs font-semibold ${
                company.enrichmentStatus === 'Enriquecido'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : company.enrichmentStatus === 'Enriquecendo'
                    ? 'text-amber-500'
                    : 'text-ink-2'
              }`}
            >
              {company.enrichmentStatus}
              {company.enrichmentSource ? ` (${company.enrichmentSource})` : ''}
            </span>
          </div>
        )}
        {company.capitalSocial != null && company.capitalSocial > 0 && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">Capital Social</span>
            <span className="text-xs font-semibold text-ink">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(company.capitalSocial)}
            </span>
          </div>
        )}
        {company.googleRating != null && (
          <div>
            <span className="text-[10px] text-ink-2 font-medium block">Avaliação Google</span>
            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
              ★ {company.googleRating}
              {company.googleReviewsCount ? ` (${company.googleReviewsCount} avaliações)` : ''}
            </span>
          </div>
        )}
        {company.technologies && company.technologies.length > 0 && (
          <div className="col-span-2 pt-2 border-t border-line">
            <span className="text-[10px] text-ink-2 font-medium block mb-1">
              Tecnologias Identificadas
            </span>
            <div className="flex flex-wrap gap-1">
              {company.technologies.slice(0, 8).map((tech: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-surface border border-line text-ink font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function LeadContactSection({ contact }: { contact: LeadContact }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
        <User className="w-4 h-4 text-brand" /> Contato Principal
      </h3>
      <div className="bg-surface-2/40 p-4 rounded-2xl border border-line space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">{contact.name}</span>
          {contact.role && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-line font-medium text-ink-2">
              {contact.role}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
          {contact.email && (
            <div className="flex items-center gap-2 text-xs text-ink-2">
              <Mail className="w-3.5 h-3.5 text-brand shrink-0" />
              <a href={`mailto:${contact.email}`} className="hover:text-brand truncate">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-xs text-ink-2">
              <Phone className="w-3.5 h-3.5 text-brand shrink-0" />
              <a href={`tel:${contact.phone}`} className="hover:text-brand truncate">
                {contact.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

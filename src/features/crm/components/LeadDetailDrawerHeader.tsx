import { Building2, ChevronDown, Loader2, X } from 'lucide-react';
import { type RefObject, useId } from 'react';
import { LEAD_STATUS_EMOJI as STATUS_EMOJI } from '../../../lib/enumMap.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { LEAD_STATUS } from '../../../lib/zod.js';
import type { Lead, LeadStatus } from '../../../types/index.js';
import { TEMPERATURE_EMOJI } from './leadDetailDrawer.constants.js';

const LEAD_STATUSES: LeadStatus[] = [...LEAD_STATUS];

interface LeadDetailDrawerHeaderProps {
  lead: Lead;
  company: Lead['company'];
  owners: { id: string; name: string }[];
  savingOwner: boolean;
  titleId: string;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onStatusChange: (status: string) => void;
  onOwnerChange: (ownerId: string) => void;
  onClose: () => void;
}

export function LeadDetailDrawerHeader({
  lead,
  company,
  owners,
  savingOwner,
  titleId,
  closeButtonRef,
  onStatusChange,
  onOwnerChange,
  onClose,
}: LeadDetailDrawerHeaderProps) {
  const statusSelectId = useId();
  const ownerSelectId = useId();

  return (
    <div className="p-6 border-b border-line bg-surface-2/50 backdrop-blur-sm shrink-0">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand-ink dark:text-brand flex items-center justify-center shrink-0 border border-brand/20 shadow-sm">
            <Building2 size={24} />
          </div>
          <div>
            <h2 id={titleId} className="text-xl font-bold text-ink leading-tight">
              {company?.tradeName || lead.contact?.name || 'Lead sem nome'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {company?.legalName && (
                <span className="text-xs text-ink-2 truncate max-w-xs">{company.legalName}</span>
              )}
              {lead.temperature && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-line font-medium text-ink">
                  {TEMPERATURE_EMOJI[lead.temperature] || ''} {lead.temperature}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            ref={closeButtonRef}
            onClick={() => {
              SoundFX.play('click');
              onClose();
            }}
            aria-label="Fechar detalhes do lead"
            title="Fechar detalhes do lead"
            className="p-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <label htmlFor={statusSelectId} className="block text-xs font-semibold text-ink-2 mb-1.5">
            Status do Funil
          </label>
          <div className="relative">
            <select
              id={statusSelectId}
              value={lead.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-surface/90 border border-line rounded-xl text-sm font-semibold text-ink appearance-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-brand/40 transition-all cursor-pointer"
            >
              {LEAD_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_EMOJI[st] || '📌'} {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-ink-2 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor={ownerSelectId} className="block text-xs font-semibold text-ink-2 mb-1.5">
            Responsável
          </label>
          <div className="relative">
            <select
              id={ownerSelectId}
              value={owners.find((o) => o.name === lead.owner)?.id || lead.owner || ''}
              onChange={(e) => onOwnerChange(e.target.value)}
              disabled={savingOwner}
              className="w-full pl-3 pr-8 py-2 bg-surface border border-line rounded-xl text-sm font-semibold text-ink appearance-none focus:outline-none focus:border-brand disabled:opacity-50"
            >
              <option value="">Sem responsável</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            {savingOwner ? (
              <Loader2 className="w-4 h-4 text-brand animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-ink-2 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

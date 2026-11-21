import React from 'react';

export interface CompactLeadRow {
  id: string;
  name: string;
  company: string;
  stageLabel: string;
}

export interface LeadListCompactProps {
  leads: readonly CompactLeadRow[];
}

export const LeadListCompact: React.FC<LeadListCompactProps> = ({ leads }) => {
  return (
    <div
      data-testid="mobile-lead-list-compact"
      className="w-full max-w-full overflow-x-hidden space-y-2 px-2"
    >
      {leads.map((lead) => (
        <article
          key={lead.id}
          data-testid={`compact-lead-${lead.id}`}
          className="flex flex-col gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-3 min-w-0 break-words"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{lead.name}</span>
            <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
              {lead.stageLabel}
            </span>
          </div>
          <span className="text-xs text-slate-500 truncate">{lead.company}</span>
        </article>
      ))}
    </div>
  );
};

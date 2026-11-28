import { Globe } from 'lucide-react';
import type { Lead } from '../../../types/index.js';

export function LeadDetailDrawerBitrixSection({ lead }: { lead: Lead }) {
  return (
    /* Seção de status Bitrix24 — a ação de enviar/reenviar vive na LeadActionBar
       (topo do drawer); esta seção só exibe o estado da sincronização. */
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-2">
        <Globe className="w-4 h-4 text-sky-500" /> Integração Bitrix24
      </h3>
      <div className="bg-surface-2/40 p-4 rounded-2xl border border-line space-y-3">
        <div>
          <span className="text-[10px] text-ink-2 font-bold uppercase block">Status no Portal</span>
          {lead.bitrixLeadId || lead.bitrixDealId ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300">
                🌐 Sincronizado (#{lead.bitrixLeadId || lead.bitrixDealId})
              </span>
              {lead.bitrixSyncedAt && (
                <span className="text-[10px] text-ink-2">
                  · {new Date(lead.bitrixSyncedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium text-ink-2 bg-surface border border-line mt-0.5">
              Não sincronizado no Bitrix
            </span>
          )}
        </div>
        {lead.bitrixSyncError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            ⚠️ Falha na sincronização: {lead.bitrixSyncError}
          </div>
        )}
      </div>
    </section>
  );
}

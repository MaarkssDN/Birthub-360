import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { BitrixMappingSettingsTab } from './BitrixMappingSettingsTab.js';
import { ConversationsTab } from './ConversationsTab.js';

export type CopilotoIaTab = 'conversas' | 'configuracoes';

interface CopilotoIaPanelProps {
  /** Modo embed (painel global/drawer): sem chrome de página e largura livre. */
  embedded?: boolean;
  /** Filtro de Lead — no dock global vem do ActiveRecordContext; na rota, de ?leadId=. */
  leadId?: string;
  /** Aba controlada externamente (rota `/app/copiloto_ia` usa ?tab=). */
  tab?: CopilotoIaTab;
  onTabChange?: (tab: CopilotoIaTab) => void;
  className?: string;
}

/**
 * Conteúdo do Copiloto IA reutilizável em dois contextos:
 * - `/app/copiloto_ia` (página cheia, `CopilotoIaHub`);
 * - painel global dockável (`AssistantsDock` → Drawer), onde `embedded` remove
 *   o max-width/header de página e o estado de aba é local ao painel — nunca
 *   escreve `?tab=` na URL da rota hospedeira.
 */
export function CopilotoIaPanel({
  embedded = false,
  leadId,
  tab: controlledTab,
  onTabChange,
  className,
}: CopilotoIaPanelProps) {
  const { currentUser } = useAuth();
  const canManage = !!currentUser && ['ADMIN', 'GESTOR'].includes(currentUser.role);
  const [internalTab, setInternalTab] = useState<CopilotoIaTab>('conversas');
  const tab = controlledTab ?? internalTab;
  const setTab = (next: CopilotoIaTab) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };

  const TABS: { id: CopilotoIaTab; label: string; managementOnly?: boolean }[] = [
    { id: 'conversas', label: 'Conversas' },
    { id: 'configuracoes', label: 'Configurações', managementOnly: true },
  ];
  const visibleTabs = TABS.filter((t) => !t.managementOnly || canManage);

  return (
    <div className={className ?? (embedded ? 'flex h-full flex-col' : 'p-6 space-y-6 max-w-6xl mx-auto')}>
      {!embedded && (
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Copiloto IA</h1>
          <p className="text-sm text-ink-2">
            Conversas, reuniões e ligações capturadas pelo Copiloto Comercial IA — resumo, deal
            health, coaching e sugestões de CRM já processados.
          </p>
        </div>
      )}

      <nav
        className={`flex gap-1 border-b border-line ${embedded ? '' : ''}`}
        aria-label="Abas do Copiloto IA"
      >
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              SoundFX.play('navigate');
              setTab(t.id);
            }}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              tab === t.id
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={embedded ? 'min-h-0 flex-1 overflow-y-auto' : ''}>
        {tab === 'conversas' && <ConversationsTab leadId={leadId} />}
        {tab === 'configuracoes' && canManage && <BitrixMappingSettingsTab />}
      </div>
    </div>
  );
}

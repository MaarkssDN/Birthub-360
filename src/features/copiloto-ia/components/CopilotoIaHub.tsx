import { useSearchParams } from 'react-router-dom';
import { CopilotoIaPanel, type CopilotoIaTab } from './CopilotoIaPanel.js';

/**
 * Rota `/app/copiloto_ia` — página cheia do Copiloto Comercial IA.
 * Wrapper fino sobre `CopilotoIaPanel`: a aba continua deep-linkável via
 * `?tab=` e o filtro de lead via `?leadId=` (contrato preservado).
 */
export function CopilotoIaHub() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get('tab') as CopilotoIaTab) || 'conversas';
  const leadId = searchParams.get('leadId') || undefined;

  const setTab = (next: CopilotoIaTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params);
  };

  return (
    <CopilotoIaPanel
      tab={tab}
      onTabChange={setTab}
      leadId={leadId}
      className="p-6 space-y-6 max-w-6xl mx-auto"
    />
  );
}

import { useCallback } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import type { SavedViewItem } from '../features/crm/components/SavedViewsPanel.js';
import { SoundFX } from '../lib/soundEffects.js';

interface UseCrmBoardUrlParamsOptions {
  /** Quando o funil é fixado por prop, o toggle e a aplicação de views salvas não se aplicam. */
  funnelProp?: 'Lead' | 'Negocio';
  setSearchParams: SetURLSearchParams;
  /** Limpa a multi-seleção (equivalente a `setSelectedLeadIds(new Set())`). */
  clearSelection: () => void;
}

/**
 * Handlers de parâmetros de URL do board CRM (`funnel`, `owner`, `q`, `enrichment`, `temp`,
 * `lead`), extraídos de `src/components/CrmBoard.tsx` na refatoração de hotspot (Onda 3,
 * handoff 00→04). O `useSearchParams` continua sendo a fonte de verdade — este hook só
 * encapsula a mecânica de escrita/leitura dos params, sem mudança de comportamento.
 */
export function useCrmBoardUrlParams({
  funnelProp,
  setSearchParams,
  clearSelection,
}: UseCrmBoardUrlParamsOptions) {
  const handleFunnelChange = useCallback(
    (next: 'Lead' | 'Negocio') => {
      if (funnelProp) return; // funil fixado por prop — toggle não se aplica
      SoundFX.play('navigate');
      clearSelection();
      // remove `lead` junto — evita manter aberto o drawer de um lead que já não está no funil
      // visível (mesmo comportamento de antes, agora expresso na URL em vez de em state local).
      setSearchParams(next === 'Lead' ? {} : { funnel: next }, { replace: true });
    },
    [funnelProp, setSearchParams, clearSelection],
  );

  // Aplica funil+filtros de uma view salva de uma vez (Onda B2b) — mesma lógica de
  // handleFunnelChange (não se aplica com funnel fixado por prop, fecha o drawer aberto), mas
  // reconstrói a URL inteira em vez de alternar só o funil.
  const handleApplySavedView = useCallback(
    (view: SavedViewItem) => {
      if (funnelProp) return;
      SoundFX.play('navigate');
      clearSelection();
      setSearchParams(
        (() => {
          const next = new URLSearchParams();
          if (view.funnel === 'Negocio') next.set('funnel', 'Negocio');
          if (view.filters.owner) next.set('owner', view.filters.owner);
          if (view.filters.q) next.set('q', view.filters.q);
          return next;
        })(),
        { replace: true },
      );
    },
    [funnelProp, setSearchParams, clearSelection],
  );

  const handleOwnerFilterChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('owner', value);
          else next.delete('owner');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleEnrichmentFilterChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('enrichment', value);
          else next.delete('enrichment');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleTemperatureFilterChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('temp', value);
          else next.delete('temp');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('q', value);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('owner');
        next.delete('q');
        next.delete('enrichment');
        next.delete('temp');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return {
    handleFunnelChange,
    handleApplySavedView,
    handleOwnerFilterChange,
    handleEnrichmentFilterChange,
    handleTemperatureFilterChange,
    handleSearchQueryChange,
    handleClearFilters,
  };
}

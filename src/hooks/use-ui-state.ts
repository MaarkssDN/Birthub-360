import { useMemo } from "react";

/**
 * useUIState — Agente 32 (Ema), Onda ONDA-DESIGN-PREMIUM-2026-11-24.
 *
 * Normaliza o ciclo de vida de dados assíncronos de uma tela nos 4 estados
 * canônicos (loading / error / empty / stale) para que features escolham
 * UM componente de estado por render, em vez de ifs espalhados.
 *
 * Uso:
 *   const state = useUIState({
 *     isLoading: query.isLoading,
 *     isError: query.isError,
 *     isEmpty: (query.data ?? []).length === 0,
 *     isStale: query.isStale,
 *   });
 *   if (state.kind === 'loading') return <LoadingStateV2 />;
 *   if (state.kind === 'error')   return <ErrorStateV2 onRetry={refetch} />;
 *   if (state.kind === 'empty')   return <EmptyStateV2 />;
 *   return <StaleDataIndicatorV2 ... /> + conteúdo;
 */

export type UIStateKind = "loading" | "error" | "empty" | "stale" | "ready";

export interface UIStateInput {
  isLoading?: boolean;
  isError?: boolean;
  /** Só avaliado quando não há loading nem erro. */
  isEmpty?: boolean;
  /** Dados servidos de cache — exibidos com StaleDataIndicator, não bloqueiam. */
  isStale?: boolean;
}

export interface UIState {
  kind: UIStateKind;
  /** true quando a tela deve renderizar bloqueio (loading/error/empty). */
  blocking: boolean;
}

const PRIORITY: Record<UIStateKind, number> = {
  loading: 0,
  error: 1,
  empty: 2,
  stale: 3,
  ready: 4,
};

export function useUIState(input: UIStateInput): UIState {
  return useMemo(() => {
    let kind: UIStateKind = "ready";
    if (input.isLoading) kind = "loading";
    else if (input.isError) kind = "error";
    else if (input.isEmpty) kind = "empty";
    else if (input.isStale) kind = "stale";

    return {
      kind,
      blocking: PRIORITY[kind] <= PRIORITY.empty,
    };
  }, [input.isLoading, input.isError, input.isEmpty, input.isStale]);
}

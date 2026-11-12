import { Skeleton } from '../ui/Skeleton.js';

// Fallback de Suspense para chunks lazy de página. Extraído de App.tsx na
// TAREFA-SANEAMENTO-016 (W4).

export function PageFallback() {
  return (
    // data-testid: sinal determinístico de "módulo lazy ainda carregando" para os testes E2E
    // (tests/e2e/helpers.ts → waitForAppReady). Substitui waitForLoadState('networkidle'), que
    // nunca podia funcionar aqui: CrmBoard.tsx mantém um EventSource (SSE) aberto em /app/crm, e
    // uma conexão de longa duração impede a rede de ficar ociosa por definição.
    <div
      data-testid="page-fallback"
      className="p-8 space-y-6 w-full max-w-7xl mx-auto animate-pulse"
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48 bg-white/10" />
        <Skeleton className="h-10 w-32 bg-white/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 bg-white/5 rounded-2xl" />
        <Skeleton className="h-32 bg-white/5 rounded-2xl" />
        <Skeleton className="h-32 bg-white/5 rounded-2xl" />
      </div>
      <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
    </div>
  );
}

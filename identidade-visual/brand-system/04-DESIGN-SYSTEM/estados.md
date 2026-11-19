# Estados — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Estados de Interface (Loading/Empty/Error/Stale e demais)
- **Propósito:** Documentar os 4 estados operacionais obrigatórios, o `OperationalStateContainer` e os demais estados interativos do DS.
- **Escopo:** `src/components/ui/` (`OperationalStateContainer`, `EmptyState`, `ErrorBoundary`, `Skeleton`, `VisualState`, `BlockedState`), classes `bh-state-*`, `OfflineBanner`, `SyncIndicator`.
- **Estado da informação:** CONFIRMADO — verificado em código em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `src/components/ui/OperationalStateContainer.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`, `Skeleton.tsx`, `VisualState.tsx`, `BlockedState.tsx`, `src/styles/globals.css:1484-1545`, `src/components/layout/OfflineBanner.tsx`, `SyncIndicator.tsx`, `DESIGN.md` cap.5, `_FATOS-CANONICOS.md` §16.
- **Documentos relacionados:** `foundations.md` (§8), `componentes.md`, `especificacoes/feedback.md`, `especificacoes/navegacao.md`.

---

## 1. Os 4 estados obrigatórios por módulo

Regra de `DESIGN.md` cap.5 (`_FATOS-CANONICOS.md` §16): toda tela/módulo deve cobrir **Loading, Empty, Error e Stale**. Implementação de referência: `<OperationalStateContainer>`.

### 1.1 Loading

- Skeletons: `Skeleton` (com shimmer via `.bh-skeleton-shimmer`, `globals.css:1536-1545`) e variantes `MetricSkeleton`, `CardSkeleton`, `TableSkeleton({rows,cols})`, `ListSkeleton({items})`, `ChartSkeleton` (`ui/Skeleton.tsx:23-114`).
- `OperationalStateContainer` prop `loadingSkeleton` permite skeleton customizado; default renderiza grid de 3 skeletons `h-32` (`OperationalStateContainer.tsx:43-50`).
- Page-level: `PageFallback` do shell usa `Skeleton` + `data-testid="page-fallback"` (`AppLayout.tsx:361-383`).

### 1.2 Empty

- `EmptyState` — props `{ title, description, actionLabel?, onAction?, icon? }` (`ui/EmptyState.tsx:6-14`); card centralizado com ícone decorativo (`Sparkles` default), `role` implícito via texto; animado com framer-motion respeitando `useReducedMotion`.
- `OperationalStateContainer` prop `empty?: EmptyStateConfig { title, description, actionLabel?, onAction?, icon? }` (`OperationalStateContainer.tsx:11-17`).

### 1.3 Error

- `ErrorStateConfig { title?, message?, onRetry?, retryLabel? }` (`OperationalStateContainer.tsx:19-24`).
- `ErrorBoundary` (classe) — props `{ children, fallback? }`; fallback customizável; loga em `console.error` (`ui/ErrorBoundary.tsx:3-30`).

### 1.4 Stale (dados possivelmente desatualizados)

- `StaleStateConfig { lastUpdated?: string|Date, message?, onRefresh?, isRefreshing? }` (`OperationalStateContainer.tsx:26-31`) — exibe timestamp de última sincronização, requisito das jornadas offline-first (J18).

### `OperationalStateContainer`

Props completas (`OperationalStateContainer.tsx:33-41`):

```ts
{
  state: OperationalStateType;   // 'loading' | 'empty' | 'error' | 'stale' | 'ready' (valores exatos: ver tipo no arquivo — NÃO VERIFICADO a união literal)
  children: React.ReactNode;
  className?: string;
  loadingSkeleton?: React.ReactNode;
  empty?: EmptyStateConfig;
  error?: ErrorStateConfig;
  stale?: StaleStateConfig;
}
```

Renderiza o estado correspondente ou `children` quando pronto. Exportado por `ui/index.ts:21`.

## 2. Estados adicionais

### 2.2.1 Disabled

- `.bh-state-disabled` — `opacity:.45; pointer-events:none; cursor:not-allowed` (`globals.css:1508-1512`).
- Componentes: `disabled:opacity-60 disabled:cursor-not-allowed` (Input/Select/Textarea), `disabled:pointer-events-none disabled:opacity-50` (IconButton), `disabled:pointer-events-none disabled:bg-surface-subtle disabled:text-ink-2` (Button).

### 2.2.2 Hover / Active / Focus / Selected

| Estado | Mecanismo |
|---|---|
| Hover | `.bh-state-hover:hover` (fundo misturado com brand); `hover-lift` (`translateY(-2px)`); variantes `hover:` por componente |
| Active/pressed | `.bh-state-active:active` (`scale(.98)`); Button `active:scale-[0.97]`; Card `active:scale-[0.99]` |
| Focus | `.bh-state-focus:focus-visible` (outline 2px `--focus-ring`, offset 2px); `focus-visible:ring-2 ring-focus-ring` nos componentes; `.bh-focus`/`.bh-official-control:focus-visible` (`outline: var(--color-focus-ring); outline-offset: var(--focus-offset)`) |
| Selected | `.bh-state-selected` (borda `--brand` + fundo `--soft` + texto `--brand`) |

### 2.2.3 Feedback de operação

| Estado | Componente | Evidência |
|---|---|---|
| Offline | `OfflineBanner` | `layout/OfflineBanner.tsx` — banner `role="status" aria-live="polite"` quando `useOnlineStatus()` false; botão "verificar conexão" dispara `dispatchSyncStatus({status:'syncing'})` + evento `online`; montado no topo do `MainLayout` em fluxo |
| Sync | `SyncIndicator` (+`OfflineBadge`, `useNetworkSync`) | `layout/SyncIndicator.tsx` — `NetworkSyncStatus = 'online'|'offline'|'syncing'`; evento global `app:sync-status` (`SYNC_STATUS_EVENT`); consome `offlineSyncService` (fila mobile); mostra pendingCount/lastSyncedAt |
| Toast | `Toaster` | `ui/Toaster.tsx` — kinds `success/error/info` via `src/lib/toast.ts`; auto-dismiss 4500ms; `role`/animação framer-motion; posição `fixed bottom-6 right-6 z-[100]` |

### 2.2.4 Loading inline

- `Button loading` → `Loader2` spinner + `aria-busy` + `disabled` (`Button.tsx:113-125`).
- `Card isLoading` prop (`Card.tsx`).
- `Pagination loading` prop.
- `Toggle` usa `useReducedMotion` de framer-motion.

## 3. Classes `bh-state-*` (referência)

`globals.css:1484-1533` (`@layer utilities`):

| Classe | Efeito |
|---|---|
| `.bh-state-default` | opacity 1 |
| `.bh-state-hover:hover` | `background: color-mix(surface 92%, brand)` |
| `.bh-state-active:active` | `transform: scale(.98)` |
| `.bh-state-focus:focus-visible` | outline 2px `--focus-ring`, offset 2px |
| `.bh-state-selected` | borda `--brand`, fundo `--soft`, texto `--brand` |
| `.bh-state-disabled` | opacity .45, `pointer-events:none`, `cursor:not-allowed` |
| `.bh-state-loading` | opacity .7, `pointer-events:none` |
| `.bh-state-success` | borda+texto `--color-success` |
| `.bh-state-warning` | borda+texto `--warn` |
| `.bh-state-error` | borda+texto `--critical` |

## 4. Outros estados visuais

- `VisualState.tsx`, `BlockedState.tsx` — componentes de estado de tela **NÃO VERIFICADO** em detalhe (existem em `ui/`; props não lidas nesta revisão).
- `.balloon-item.explode` — animação de entrada de tags (landing) — `globals.css:547-570`.
- `ModulePlaceholder.tsx` — placeholder de módulo.

## 5. Regras

1. Toda rota/módulo novo deve implementar os 4 estados via `OperationalStateContainer` ou equivalente (`DESIGN.md` cap.5).
2. Erro de API não deve ser exibido como empty state (débito conhecido UX: "erro de API como empty state" — `_FATOS-CANONICOS.md` §14, DEBT list).
3. `prefers-reduced-motion` desativa animações de entrada/saída (`globals.css:1582-1598`).
4. Estados nunca usam cor como único indicador — pares com ícone/texto (regra `src/styles/AGENTS.md`).

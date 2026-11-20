# Sistema de Feedback

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** documentar os canais de feedback do produto: notificações transitórias, alertas, confirmações, estados vazios, erros fatais, loading e sincronização.
- **Escopo:** `src/components/ui/{Toaster,Alert,ConfirmDialog,EmptyState,ErrorBoundary,Skeleton,OperationalStateContainer,Badge}.tsx`, `src/components/layout/{OfflineBanner,SyncIndicator}.tsx`, `src/lib/toast.ts`, `src/features/notifications/`, `src/lib/sse*.ts`.
- **Estado da informação:** CONFIRMADO em 2026-11-19.
- **Fontes:** arquivos citados inline.
- **Relacionados:** `formularios.md`, `dashboards.md`, `acessibilidade.md`.

---

## 1. Toasts — `Toaster` + `toast` store

- `src/components/ui/Toaster.tsx`: componente montado no shell; consome `toast.subscribe` de `src/lib/toast.ts`.
- Kinds: `success` / `error` / `info` com estilos semânticos (`KIND_STYLES`, linhas 8-22) — superfícies usam tokens `--ok`, `--critical`, `--surface`.
- Auto-dismiss: `AUTO_DISMISS_MS = 4500` (linha 22).
- Som acoplado: `SoundFX.play('success'|'error'|'focus')` por kind (linhas 30-37).
- Acessibilidade: WCAG 2 AA contrast comment (linha 7); animação `toast-in` (globals.css:968), neutralizada por reduced-motion.

## 2. Alertas — `Alert.tsx`

`src/components/ui/Alert.tsx` — alerta inline de página/seção (info/success/warning/error presumido pelas variantes do DS; **variantes exatas NÃO VERIFICADAS** linha a linha).

## 3. Confirmação — `ConfirmDialog.tsx`

Diálogo de confirmação destrutiva/crítica sobre `Dialog` (radix). Uso típico: exclusões, ações irreversíveis. Animação via `modalBackdropMotion`/`modalDialogMotion` quando dentro de `Modal`.

## 4. Estados de conteúdo

| Componente | Papel |
|---|---|
| `EmptyState.tsx` | Estado vazio com título/descrição/CTA (`EmptyStateConfig`); honra `useReducedMotion` (linha 15) |
| `OperationalStateContainer.tsx` | **Padrão canônico dos 4 estados obrigatórios**: `loading` (Skeleton), `empty` (EmptyState+CTA), `error` (causa+retry via `ErrorStateConfig`), `stale` (timestamp `lastUpdated` + refresh) — `OperationalStateType` linhas 8-30 |
| `BlockedState.tsx`, `VisualState.tsx` | Estados de bloqueio/visual auxiliar |
| `ModulePlaceholder.tsx` | placeholder de módulo não implementado |

Regra de produto (DESIGN.md cap.5, `_FATOS-CANONICOS.md` §16): **todo módulo operacional deve cobrir Loading/Empty/Error/Stale** — `OperationalStateContainer` é o veículo.

## 5. Erros fatais — `ErrorBoundary.tsx`

`src/components/ui/ErrorBoundary.tsx` — boundary de render; existe também um segundo em `src/features/voice-hub/components/design-system/` (divergência registrada em `_FATOS-CANONICOS.md` §8).

## 6. Loading — `Skeleton.tsx` + variantes

- `Skeleton.tsx` usa variant `shimmer` de `motion.ts` (loop 2.5s) + classe `.bh-skeleton-shimmer`.
- Skeletons também em tabelas/cards via composição; `PageHeader`/`PageTitleCard` têm estados de loading próprios.

## 7. Rede e sincronização (offline-first, J18)

| Componente | Comportamento | Evidência |
|---|---|---|
| `OfflineBanner.tsx` | Banner persistente não-intrusivo no topo do `MainLayout` quando offline; `role="status"` + `aria-live="polite"`; botão "verificar conexão" | `OfflineBanner.tsx:1-30`; hook `useOnlineStatus` |
| `SyncIndicator.tsx` | Indicador de status de sync (online/offline/syncing + `pendingCount`, `lastSyncedAt`); evento global `app:sync-status` (`SYNC_STATUS_EVENT`); consome `offlineSyncService` de `features/mobile/` | `SyncIndicator.tsx:1-30` |
| `dispatchSyncStatus` | API para outros módulos publicarem estado de sync | `SyncIndicator.tsx` |

## 8. Notificações em tempo real — SSE

- `src/features/notifications/sse.service.ts` + `src/lib/sse.ts`, `src/lib/sseKeepAlive.ts` — Server-Sent Events para notificações.
- Consumidor de UI: feature `notifications` + sino no shell (rota `/app/notifications`); `LiveCopilotHUD` (lazy shell fixo).
- Teste: `src/lib/__tests__/sseKeepAlive.test.ts`.

## 9. Sons como feedback

`src/lib/soundEffects.ts` (`SoundFX`) — sons `success`/`error`/`focus` em toasts e `soundClick`/`soundHover` em `Button`. **Preferência de mute NÃO VERIFICADA** — não foi encontrado toggle de som documentado.

## 10. Matriz de decisão rápida

| Necessidade | Canal |
|---|---|
| Confirmar ação efêmera | `toast` (Toaster) |
| Atenção persistente na página | `Alert` |
| Ação irreversível | `ConfirmDialog` |
| Lista vazia | `EmptyState`/`OperationalStateContainer` |
| Falha de render | `ErrorBoundary` |
| Carregando conteúdo | `Skeleton` |
| Offline/fila de sync | `OfflineBanner` + `SyncIndicator` |
| Evento em tempo real | SSE → `notifications` |
| Erro de formulário | inline + `aria-invalid` (ver `formularios.md`) |

## 11. Lacunas

- Nenhum sistema de "undo" global (toast com ação de desfazer) encontrado — **NÃO VERIFICADO** exaustivamente.
- `ToastMessage` kinds limitados a success/error/info — sem kind `warning` dedicado no `KIND_STYLES`.
- Cobertura de `aria-live` em toasts: não confirmada no código lido (**NÃO VERIFICADO** — verificar `Toaster.tsx` render completo).

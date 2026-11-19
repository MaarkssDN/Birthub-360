# Especificação — Feedback — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Feedback
- **Propósito:** Especificar Alert, Toaster, Dialog/ConfirmDialog (confirmação), EmptyState, ErrorBoundary, Skeleton e `bh-skeleton-shimmer`.
- **Escopo:** `src/components/ui/{Alert,Toaster,EmptyState,ErrorBoundary,Skeleton,ConfirmDialog,VisualState,BlockedState,ContextualTip,OperationalStateContainer}.tsx`, `src/lib/toast.ts`, `globals.css`.
- **Estado da informação:** CONFIRMADO — arquivos lidos em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** arquivos citados; `estados.md`.
- **Documentos relacionados:** `../estados.md`, `../componentes.md`, `sobreposicoes.md`.

---

## 1. Alert — `ui/Alert.tsx`

- Props (`AlertProps`, linhas 48-54): `severity` (via cva) + `title?`, `onClose?`, `icon?`, `children`, HTML attrs.
- Severities (`alertVariants`, linhas 8-16): `success|warning|error|info|brand` (default `info`) — fundo `color-mix` 8-10% da cor semântica sobre `--surface`.
- Ícone de severidade em "well" circular (`iconWellVariants`, linhas 18-30): CheckCircle2/AlertTriangle/AlertCircle/Info; `aria-hidden` (role="alert" já anuncia — comentário linhas 64-66).
- `role="alert"`, `onClose` → botão "Fechar alerta" com focus ring.
- `title` renderiza `h5` em Sora (`font-display`).

## 2. Toaster — `ui/Toaster.tsx` + `src/lib/toast.ts`

- Store imperativo `toast` (`lib/toast.ts`) com `subscribe`; `Toaster` consome e renderiza pilha `fixed bottom-6 right-6 z-[100] max-w-sm` (linhas 25,45).
- Kinds: `success|error|info` (`KIND_STYLES`, linhas 9-21) — cores via color-mix semânticos; sons via `SoundFX` (`success`/`error`/`focus`).
- Auto-dismiss **4500ms** (`AUTO_DISMISS_MS`, linha 23); `AnimatePresence` + `motion.div` com `layout`, drag="x" para dispensar; animação 200ms easeOut.
- Montado no `MainLayout` (`MainLayout.tsx:82`).

## 3. ConfirmDialog — `ui/ConfirmDialog.tsx`

- `useConfirmDialog()` hook (linha 21) + `ConfirmOptions` (linha 5). API detalhada **NÃO VERIFICADO** — arquivo pequeno; padrão provável: retorna `{ confirm, dialog }` ou similar. **Lacuna: ler fonte antes de documentar uso.**
- `Dialog.tsx` (Radix) é a base de modais — ver `sobreposicoes.md`.

## 4. EmptyState — `ui/EmptyState.tsx`

- Props: `{ title, description, actionLabel?, onAction?, icon? }` (linhas 6-12).
- Card centralizado `my-6 p-12 rounded-card border-line bg-surface shadow-card`; ícone em well circular 48px (`Sparkles` default, `strokeWidth 1.5`); `motion.div` fade 200ms com `useReducedMotion`.
- Uso canônico: estado Empty dos 4 estados operacionais (`estados.md`).

## 5. ErrorBoundary — `ui/ErrorBoundary.tsx`

- Classe `Component`: props `{ children, fallback? }`; `getDerivedStateFromError` + `componentDidCatch` (console.error); renderiza `fallback` custom ou UI default (**NÃO VERIFICADO** aparência do default — linhas 30+ não lidas integralmente).

## 6. Skeleton — `ui/Skeleton.tsx`

- `Skeleton({ className, shimmer = true, ...divProps })` — shimmer via `.bh-skeleton-shimmer` (`globals.css:1536-1545`: gradiente `surface-2`↔`surface`, `animation: shimmer 2s`).
- Variantes: `MetricSkeleton`, `CardSkeleton`, `TableSkeleton({rows=5,cols=4})`, `ListSkeleton({items=4})`, `ChartSkeleton`.
- `OperationalStateContainer` usa skeleton default próprio quando `loadingSkeleton` ausente.

## 7. `bh-skeleton-shimmer` — `globals.css:1536-1545`

Gradiente animado 200% com `color-mix` de `--surface-2`/`--surface`; keyframe `shimmer` (`--animate-shimmer`, `globals.css:953`, 2.5s infinite linear — **atenção**: `.bh-skeleton-shimmer` usa `2s cubic-bezier(0.4,0,0.6,1)`, o `--animate-shimmer` é 2.5s linear; duas durações coexistem).

## 8. Outros Componentes de Feedback — Especificações Detalhadas

### 8.1 BlockedState — `src/components/ui/BlockedState.tsx` (94 ln)
- **Propósito:** Apresentar telas ou painéis inacessíveis por motivos de permissão RBAC, plano comercial ou processamento de IA pendente.
- **Tipos e Tons (`BlockedStateTone`):**
  - `'neutral'`: Bloqueio padrão de sistema.
  - `'warning'`: Alerta de assinatura expirando ou limite contratual atingido.
  - `'info'`: Recurso em configuração ou aguardando aprovação administrativa.
  - `'iris'`: Bloqueio por motivo de inteligência artificial em treinamento/processamento ("Neon Tokyo × Cosmic Gold" com glow violeta).
- **Props (`BlockedStateProps`):**
  - `title: string`, `description: string`, `tone?: BlockedStateTone` (default `'neutral'`), `icon?: ReactNode`, `action?: ReactNode`.

### 8.2 VisualState — `src/components/ui/VisualState.tsx` (168 ln)
- **Propósito:** Badge ou banner de estado operacional da tela para comunicar transparência sobre a origem e frescor do dado.
- **Tipos (`VisualStateType`):**
  - `'LIVE'`: Dados em tempo real sincronizados.
  - `'SYNCING'`: Sincronização em segundo plano ativa.
  - `'PROCESSING'`: Fila de worker ou agente processando lote.
  - `'RECOMMENDED'`: Sugestão algorítmica pendente de validação humana.
  - `'ACTION_REQUIRED'`: Tarefa exigindo intervenção imediata do vendedor.
  - `'BLOCKED'`: Recurso inacessível.
  - `'BETA'`: Módulo experimental.
  - `'PLANNED'`: Recurso no roadmap com visualização de prévia.
  - `'NO_DATA'`: Sem volume estatístico suficiente para inferência.

### 8.3 ContextualTip — `src/components/ui/ContextualTip.tsx` (94 ln)
- **Propósito:** Card compacto de orientação pró-ativa e boas práticas sugeridas pela IA diretamente no fluxo de trabalho.
- **Props (`ContextualTipProps`):**
  - `id: string` (identificador único para persistência de dispensa local).
  - `title: string`, `description: string`.
  - `badgeText?: string` (default `'💡 Dica da IA do Hub'`).
  - `actionLabel?: string`, `onAction?: () => void`.
- **Interação:** Suporte a colapso/expansão e fechamento com botão dismiss (`X`).

### 8.4 BugReportButton — `src/components/ui/BugReportButton.tsx` (180 ln)
- Ver especificação detalhada em `acoes.md` §7.5.

## 9. Regras

1. Feedback assíncrono: `toast.*` (sucesso/erro/info) — não criar sistema paralelo.
2. Confirmações destrutivas: `ConfirmDialog`/`Dialog` — ação destrutiva nunca magnética.
3. Loading sempre via `Skeleton` (shimmer) — nunca spinner solto em área de conteúdo.
4. `role="alert"`/`aria-live` já embutidos em Alert/Toaster/OfflineBanner — não duplicar.

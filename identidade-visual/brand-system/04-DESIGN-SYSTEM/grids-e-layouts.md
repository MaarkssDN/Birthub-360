# Grids e Layouts — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Grids e Layouts do App Shell
- **Propósito:** Documentar o app shell autenticado (`/app/*`), breakpoints reais, padrões de página e grids de métricas.
- **Escopo:** `src/components/layout/`, classes `bh-page`/`bh-section`, `PageHeader`/`PageTitleCard`, `StatsGrid`/`BentoGrid`.
- **Estado da informação:** CONFIRMADO — verificado em código em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `src/components/layout/*`, `src/styles/globals.css`, `src/components/ui/PageHeader.tsx`, `PageTitleCard.tsx`, `StatsGrid.tsx`, `bento/*`, `_FATOS-CANONICOS.md` §15.
- **Documentos relacionados:** `componentes.md`, `estados.md`, `especificacoes/navegacao.md`, `especificacoes/composicao.md`, `especificacoes/dados.md`.

---

## 1. App shell (`/app/*`)

Árvore de montagem (`src/components/layout/MainLayout.tsx`):

```
<div h-screen h-[100dvh] flex flex-col bg-bg text-ink>
  <OfflineBanner />                    {/* topo, em fluxo — empurra conteúdo */}
  <div flex flex-1 min-h-0>
    <Sidebar />                        {/* rail + painel, hidden < lg */}
    <MobileNavDrawer />                {/* drawer off-canvas < lg */}
    <div flex-1 flex-col>
      <AppTopbar />                    {/* barra superior */}
      <main flex-1 overflow-y-auto data-accent data-page-accent>
        <DataFlowLines />              {/* fundo decorativo */}
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  </div>
  <VoiceCommandWidget />
  <ModuleAgentWidget />
  <AssistantsDock />                   {/* Chatbook + Copiloto IA flutuantes */}
  <CommandPalette />
  <Toaster />
</div>
```

`MainLayout.tsx:46-84`. O `activeTab` é derivado da URL por `deriveActiveTabFromPath(pathname)` (`MainLayout.tsx:31`; exceção `/app/settings/pillars/<slug>` → `settings_<slug>`, ver `settingsPillarNav.ts`).

### Camadas do shell

| Camada | Componente | Arquivo | Notas |
|---|---|---|---|
| Rail de módulos | `ModuleRail` | `layout/ModuleRail.tsx` (213 ln) | ícones-only, 11 módulos + Hub Central; botões `h-11 w-11 rounded-[12px]`; acentos `cyan/pink/gold/iris` por módulo |
| Painel contextual | `ModuleNavPanel` | `layout/ModuleNavPanel.tsx` (338 ln) | itens do módulo ativo, largura `w-[248px]`; estado de colapso persistido em `localStorage['@birthhub:module-panel-collapsed']` (`Sidebar.tsx:14,34-44`) |
| Sidebar composta | `Sidebar` | `layout/Sidebar.tsx` (70 ln) | desktop: `hidden lg:flex` rail+painel; mobile (`mobileOpen`): só o painel em largura total |
| Topbar | `AppTopbar` | `layout/AppTopbar.tsx` (268 ln) | breadcrumbs (`AppBreadcrumbs`), sino de notificações (contagem real via `GET /api/notifications?unread=1`), toggle tema, toggle som (`SoundFX`), botão voltar contextual, menu mobile `< md`, `SyncIndicator`/`OfflineBadge` |
| Drawer mobile | `MobileNavDrawer` | `layout/MobileNavDrawer.tsx` (45 ln) | `fixed inset-0 z-40 lg:hidden`; backdrop `bg-overlay/80 backdrop-blur-sm`; painel `w-64 max-w-[85vw]` com safe-area insets; fecha com `Escape` |
| Assistentes | `AssistantsDock` | `layout/AssistantsDock.tsx` (307 ln) | Chatbook (`FloatingChatbook`, lazy) + Copiloto IA (`CopilotoIaPanel` embed, gated por `canAccessCopilotoIa`); estado persistido; em ≥lg o Copiloto desloca para `lg:right-[540px]` quando ambos abertos |
| Transição de página | `PageTransition` | `layout/PageTransition.tsx` | envolve `children` com `id=pathname` |
| Acento de domínio | `data-page-accent`/`--page-accent` | `MainLayout.tsx:32-43,66-68` | regex sobre `activeTab`: forecast/revenue→`gold`, copiloto/ai→`iris`, prospect/market/commercial-intel→`cyan`, automation/cadence→`iris`, voice/call→`pink`, default→`blue` |

Todas as rotas `/app/*` são `React.lazy` + `Suspense` + `PageTransition` (`AppLayout.tsx`); fallback = `PageFallback` com `data-testid="page-fallback"` e `Skeleton` (`AppLayout.tsx:361-383`).

## 2. Breakpoints reais

| Breakpoint | Uso confirmado |
|---|---|
| `sm`/`md` | classes utilitárias esparsas; topbar documenta "telas < md" para menu mobile (`AppTopbar.tsx` comentário) |
| `lg` = **1024px** | sidebar desktop aparece (`hidden lg:flex` em `Sidebar.tsx:63`); drawer mobile some (`lg:hidden` em `MobileNavDrawer.tsx:27`); rail/painel só existem ≥lg |
| Viewports de QA | 1440/1366/768/390 (GA gate) + 360/390/768/1024/1440 (`_FATOS-CANONICOS.md` §15) |

Mobile real: Capacitor Android (`android/`, `capacitor.config.ts`); `pageTransitionClean` otimizado para mobile; `useIsTouchDevice` desativa tilt/magnetic/spotlight.

## 3. Padrões de página

### 3.1 Containers

| Classe | Definição | Origem |
|---|---|---|
| `.bh-page` | `width:100%; max-width:92rem; margin-inline:auto; padding:clamp(1rem,2vw,2rem)` | `globals.css:1403-1408` |
| `.bh-page-stack` | flex column, gap `clamp(1rem,1.5vw,1.5rem)` | `globals.css:1410-1414` |
| `.bh-section` | `border-top:1px solid var(--line); padding-top:1rem` | `globals.css:1416-1419` |
| `.bh-surface-elevated` | `background:var(--surface-elevated); border:1px solid var(--line); box-shadow:var(--shadow-card)` | `globals.css:1421-1425` |

### 3.2 Cabeçalhos de página

| Componente | Props confirmadas | Arquivo |
|---|---|---|
| `PageHeader` | `{ title, subtitle?, icon?, badge?, actions?, glow? }` — delega a `PageTitleCard` | `ui/PageHeader.tsx:4-19` |
| `PageTitleCard` | `{ title, subtitle?, eyebrow?, icon?, badge?, actions?, accent? }` — `PageTitleAccent = 'brand'\|'iris'\|'success'\|'warning'\|'pink'\|'gold'\|'neutral'` | `ui/PageTitleCard.tsx:5-98` |

`PageTitleCard` renderiza card com barra de acento, chip, título `text-ink` (nunca gradiente cru) e ações à direita — pares claro/escuro calibrados AA (`PageTitleCard.tsx:8-67`).

### 3.3 Densidade executiva

- Topbar fixa com breadcrumbs + clock ao vivo (`useLiveClock`) + ações globais — padrão "central de comando".
- Cards usam `bh-platform-card` (superfície + acento sutil) e `bh-card[data-accent]` (borda colorida) — ver `especificacoes/composicao.md`.
- Números de KPI em `IBM Plex Mono`/`tabular-nums` (`.bh-data`, `.bh-metric`).

## 4. Grids de métricas

| Componente | Props confirmadas | Arquivo |
|---|---|---|
| `StatsGrid` | `{ stats?: StatItem[], ...divProps }`; `StatItem = { value, label, description?, trend?, highlightColor, titleColor, descColor }` — **atenção:** recebe classes de cor hardcoded por item (`titleColor: 'text-[#3f6212] dark:text-[#D4F434]'` etc. em `DEFAULT_STATS`, `StatsGrid.tsx:19-52`) | `ui/StatsGrid.tsx` |
| `KpiCard` | `{ icon, label?, title?, value, caption?, subtitle?, tone?, variant?, trend?{value,isPositive?,text?}, spotlight?, sound?, onSelect?, active?, className? }`; `KpiTone` = chaves de `KPI_TONES` (`brand/ink/ok/gold/…`) | `ui/KpiCard.tsx:6-92` |
| `BentoGrid`/`BentoCard`/`BentoHero`/`BentoInsight`/`BentoMetric` | exports em `ui/bento/index.ts`; props **NÃO VERIFICADO** nesta revisão | `ui/bento/*.tsx` |
| `BentoShowcase` | exportado por `ui/index.ts`; showcase interno | `ui/BentoShowcase.tsx` |

## 5. Convenções de página (confirmadas por uso)

- Página típica: `PageHeader`/`PageTitleCard` → seções `.bh-page-stack` com `.bh-section`/`bh-platform-card` → grids `StatsGrid`/bento → tabelas (`Table`/`VirtualTable`) ou `DealsGrid`.
- Acento de página vem do shell via `data-page-accent` (`MainLayout.tsx:66-68`); componentes não devem hardcodar acento de domínio.
- `bh-page` limita largura a `92rem` (~1472px) — telas mais largas usam grids internos.

## 6. Lacunas

- Props exatas de `BentoGrid`/`BentoCard`/`BentoHero`/`BentoInsight`/`BentoMetric` — **NÃO VERIFICADO**.
- `ExecutiveHeader.tsx` (layout) — papel distinto de `AppTopbar` **NÃO VERIFICADO** (não lido nesta revisão).
- Breakpoints intermediários (`sm`,`md`,`xl`) usados de forma esparsa nos componentes — sem escala documentada além de `lg=1024`.

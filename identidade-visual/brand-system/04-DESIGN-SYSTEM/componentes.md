# Inventário de Componentes — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Inventário de Componentes do Design System
- **Propósito:** Mapear as famílias de componentes, contagens reais e ponteiros para as especificações detalhadas.
- **Escopo:** `src/components/ui/` (89 `.tsx` na raiz + `bento/` 5 + `icons/` 5), `src/components/layout/` (21 `.tsx`), `src/components/brand/` (7 `.tsx` + `title-icons/`), `src/components/icons/` (3 `.tsx`).
- **Estado da informação:** CONFIRMADO — contagens por `ls` em 2026-11-19; props detalhadas nas especificações.
- **Data de referência:** 2026-11-19
- **Fontes:** listagem de `src/components/`, `src/components/ui/index.ts`, `DESIGN.md` (catálogo de 30 componentes oficiais), `_FATOS-CANONICOS.md` §8.
- **Documentos relacionados:** `especificacoes/acoes.md`, `formularios.md`, `navegacao.md`, `dados.md`, `feedback.md`, `sobreposicoes.md`, `composicao.md`, `estados.md`.

---

## 1. Visão geral

| Pasta | `.tsx` | Papel |
|---|---|---|
| `src/components/ui/` (raiz) | 89 | Design system próprio estilo shadcn (cva + cn; Radix só via `@radix-ui/react-slot`, `react-dialog`; `vaul` no BottomSheet) |
| `src/components/ui/bento/` | 5 | BentoGrid/BentoCard/BentoHero/BentoInsight/BentoMetric |
| `src/components/ui/icons/` | 5 | AnimatedIcon, ícones de marca (Github/Linkedin/Youtube), Isometric3DIcons |
| `src/components/layout/` | 21 | Shell, navegação, topbar, guards de rota, transições |
| `src/components/brand/` | 7 (+`title-icons/`) | BirthHubLogo, emblemas, órbita, PillarIcons, BrandEmblemBadge, CompanyBrandIcon, LandingTitleIcons |
| `src/components/icons/` | 3 | AnimatedIcon raiz, BrandIcons |
| `src/components/crm/` | — | componentes CRM (dono: Agente 04) — fora do DS |

`ui/index.ts` reexporta 31 módulos (Alert, AuroraButton, Badge, BentoShowcase, Button, ButtonGroup, Card, CommandPalette, CtaBanner, CyberInput, Dialog, Drawer, EmptyState, Fab, FloatingNavbar, Glow, HeroMockup, IconButton, Input, Magnetic, OperationalStateContainer, OrbitRing, Pagination, PricingSection, Select, Skeleton, StatsGrid, Table, Textarea, Toggle, Tooltip, VisualState) — **não é barrel completo**: vários componentes existem no disco mas não são reexportados (ex.: `Modal.tsx`, `ConfirmDialog.tsx`, `DropdownMenu.tsx`, `BottomSheet.tsx`, `Toaster.tsx`, `ErrorBoundary.tsx`, `PageHeader.tsx`, `PageTitleCard.tsx`, `KpiCard.tsx`, `VirtualTable.tsx`, `DealsGrid.tsx`, `CompareTable.tsx`, `CompareBar.tsx`, `Carousel.tsx`, `TabNavCards.tsx`, `ClickSpark.tsx`, `BorderBeam.tsx`, `Timeline.tsx`, `Checklist.tsx`, `CalendarHeatmap.tsx`, etc.). Consumidores importam por caminho direto.

## 2. Famílias

### 2.1 Ações → `especificacoes/acoes.md`

`Button.tsx` (cva: 13 variants, 8 sizes; props `asChild/loading/soundClick/soundHover/sound/shine/magnetic`), `IconButton.tsx`, `Fab.tsx`, `ButtonGroup.tsx` (+`ToggleButtonGroup`), `AuroraButton.tsx`, `Magnetic.tsx` (wrapper), `ClickSpark.tsx`, `CtaBanner.tsx`, `PricingSection.tsx`, `FloatingNavbar.tsx`, `CommandPalette.tsx` (ação global). Link = `Button variant="link"`.

### 2.2 Formulários → `especificacoes/formularios.md`

`Input.tsx`, `CyberInput.tsx`, `Textarea.tsx`, `Select.tsx` (select nativo), `Toggle.tsx` (switch), `Label.tsx`. **Ausentes em `ui/`:** `Switch`, `Slider`, `DatePicker`, `Checkbox`, `RadioGroup`, `Form` (RHF) — NÃO EXISTEM como primitives; data/hora e sliders são implementados inline nas features (**NÃO VERIFICADO** cada uso). Validação: `react-hook-form ^7.88` + `zod ^4.6.7` disponíveis (`package.json:201,221`); `aria-invalid` aplicado por `Input` via prop `error` e por `.bh-official-control[aria-invalid="true"]` (`official-identity.css:205-207`).

### 2.3 Navegação → `especificacoes/navegacao.md`

Layout: `Sidebar.tsx` (compõe `ModuleRail`+`ModuleNavPanel`), `ModuleRail.tsx`, `ModuleNavPanel.tsx`, `AppTopbar.tsx`, `MobileNav.tsx`, `MobileNavDrawer.tsx`, `AppBreadcrumbs.tsx`, `AssistantsDock.tsx`, `ExecutiveHeader.tsx`, `NavLaunchTransition.tsx`, `PageTransition.tsx`. UI: `TabNavCards.tsx`, `Pagination.tsx`, `Carousel.tsx` (embla). **Ausentes:** `Tabs`, `Stepper` primitives — tabs são implementadas por rota/estado nas features ou via `TabNavCards` (**NÃO VERIFICADO** uso amplo).

### 2.4 Dados → `especificacoes/dados.md`

`Table.tsx` (+`TableHeader` etc.), `VirtualTable.tsx` (virtualização própria, `ColumnDef<T>`), `KpiCard.tsx`, `StatsGrid.tsx`, `bento/*`, `DealsGrid.tsx` (+`DealCard`), `CompareTable.tsx` (+`CompareBar.tsx`, `DeltaPill`), `CalendarHeatmap.tsx`, `ChannelDonut.tsx`, `FunnelBars.tsx`, `Timeline.tsx`, `Checklist.tsx`. Gráficos: `echarts`/`recharts` consumidos nas features (não há wrapper `ui/Chart` — **NÃO VERIFICADO**).

### 2.5 Feedback → `especificacoes/feedback.md`

`Alert.tsx`, `Toaster.tsx` (+`src/lib/toast.ts` store), `EmptyState.tsx`, `ErrorBoundary.tsx`, `Skeleton.tsx` (+`MetricSkeleton`/`CardSkeleton`/`TableSkeleton`/`ListSkeleton`/`ChartSkeleton`), `VisualState.tsx`, `BlockedState.tsx`, `ContextualTip.tsx`, `OperationalStateContainer.tsx`.

### 2.6 Sobreposições → `especificacoes/sobreposicoes.md`

`Dialog.tsx` (Radix, exports `Dialog*`), `Drawer.tsx` (Radix dialog lateral), `Modal.tsx` (simples, props `{isOpen,onClose,title,children}`), `BottomSheet.tsx` (vaul, snap points), `DropdownMenu.tsx` (simples, `{triggerLabel,items[]}`), `Tooltip.tsx` (@floating-ui + framer-motion), `Popover` — **não existe primitive genérico**; existem `AIContextPopover.tsx`, `ToolTechPopover.tsx` (domínio). `CommandPalette.tsx` (Ctrl/⌘+K + evento `birthhub360:open-command-palette`).

### 2.7 Composição → `especificacoes/composicao.md`

`Card.tsx` (16 variants + padding + accentBar/isLoading/borderBeam/spotlight/som), `PageHeader.tsx`, `PageTitleCard.tsx`, classes `bh-page/bh-page-stack/bh-section/bh-surface(-elevated)/bh-card/bh-platform-card/bh-landing-card/bh-glass/bh-label/bh-kicker/bh-heading/bh-display/bh-headline/bh-data/bh-metric/bh-orbit-ring`, utilitários `glass-*`, `vancouver-*`, `border-glow-*`, `shadow-glow-*`, `text-gradient-*`, `badge-coolors-*`, `bg-orbit-conic`, `btn-neon-cta`, `btn-vancouver-outline`, `bh-state-*`, `bh-skeleton-shimmer`, `bh-official-control`.

### 2.8 Domínio (em `ui/` mas com regra de apresentação específica)

`GamificationWidget.tsx`, `Gamified3DOrb.tsx`, `HolographicCard.tsx`, `OrbitRing.tsx`, `Glow.tsx`, `BorderBeam.tsx`, `DataFlowLines.tsx`, `ModuleAgentWidget.tsx`(+`.css`), `ModulePlaceholder.tsx`, `HeroMockup.tsx`, `TechToolLogo.tsx`, `VoiceCommandWidget.tsx`, `CopilotTrigger.tsx`, `ClockCalendarWidget.tsx`, `LiveStatsWidget.tsx`, `AIContextPopover.tsx`, `AIEmailGenerator.tsx`, `AiReasoningPipeline.tsx`, `AiReasoningVisualizer.tsx`, `ActionPlanSteps.tsx`, `FindingsList.tsx`, `BugReportButton.tsx`, `Sign-in-page.tsx`/`sign-in-page.demo.tsx`, `StyleShowcase.tsx`, `ParticleSystem.tsx`, `BrandOrb.tsx`, `TiltCard.tsx`.

## 3. Fora do DS (propriedade de outros agentes)

- `src/components/crm/` — Agente 04.
- `src/components/landing/` e afins — landing fora do escopo `/app/*` do DESIGN.md.
- `src/components/layout/` guards (`ProtectedRoute`, `RequireRole`, `RequireModuleAccess`, `RequireProductModule`, `OnboardingGate`) — navegação/gates do Agente 02.
- `src/features/voice-hub/components/design-system/` — segundo mini DS (divergência registrada).

## 4. Stories e catálogo vivo

- Storybook: `Badge.stories.tsx`, `Button.stories.tsx`, `Card.stories.tsx`, `Input.stories.tsx` (4 arquivos — fatos canônicos citavam 3; `Input.stories.tsx` também existe).
- Design Lab: `/design-lab/{command-language,components-v2,home-proposals}` (`src/App.tsx:95-111`).

## 5. Débitos

- Barrel `ui/index.ts` incompleto (ver §1).
- ~26% dos `.tsx` com hex literais; PR #368 de migração aberto com gates vermelhos.
- Componentes "showcase/orbe/3D" misturados aos primitives — candidatos a reorganização futura **[PROPOSTO]**.

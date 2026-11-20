# Especificação — Navegação — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Navegação
- **Propósito:** Especificar o shell de navegação: Sidebar/ModuleRail/ModuleNavPanel, AppTopbar, MobileNav/Drawer, Tabs/Breadcrumbs/Stepper/Pagination e AssistantsDock.
- **Escopo:** `src/components/layout/*`, `src/components/ui/{Pagination,TabNavCards,Carousel}.tsx`.
- **Estado da informação:** CONFIRMADO — arquivos lidos em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `src/components/layout/*`, `moduleRegistry.ts`, `tabMeta.ts`, `settingsPillarNav.ts`.
- **Documentos relacionados:** `../grids-e-layouts.md`, `../componentes.md`, `dados.md`, `sobreposicoes.md`.

---

## 1. Arquitetura de navegação (confirmada)

O produto usa **navegação em duas camadas** (missão "navegação modular"):

- **`ModuleRail`** (`layout/ModuleRail.tsx`, 213 ln): rail fixo de ícones com os 11 módulos oficiais (`PRODUCT_MODULES` p01–p08, m09–m11) + Hub Central (logo). Ícones-only; rótulos em tooltip/painel. Botões `h-11 w-11 rounded-[12px]`; acento por módulo ∈ `cyan|pink|gold|iris` (`railAccentClass`, linhas 20-42) com glow `shadow-[0_0_14px_…]` no ativo. Módulos filtrados por permissão (`getRailModules` com `canAccessCommercialIntelligence`, `canAccessCopilotoIa`, `canManageOperations`, `isAdmin` — linhas 62-74). `SoundFX.play('navigate')` na navegação.
- **`ModuleNavPanel`** (`layout/ModuleNavPanel.tsx`, 338 ln): painel contextual `w-[248px]` com os itens do módulo ativo; resolve item ativo por prefixo de path com desempate por "irmão mais específico" (`isItemActive`, linhas 43-60+); usa `TAB_META`, `getVisibleModuleItems`, `getModuleTheme` (`moduleThemes.ts`), `NavLaunchTransition`.
- **`Sidebar`** (`layout/Sidebar.tsx`, 70 ln): compõe rail+painel no desktop (`hidden lg:flex`, `z-30`); em `mobileOpen` renderiza só o painel em largura total; colapso do painel persistido em `localStorage['@birthhub:module-panel-collapsed']` (linhas 14,34-44). CSS dedicado: `Sidebar.css`.
- Registro canônico de módulos: `layout/moduleRegistry.ts` (`PRODUCT_MODULES` 11 entradas, `HUB_MODULE`, `ALL_MODULES`, `getActiveModuleId`, `getModuleById`, `getRailModules`, `getVisibleModuleItems`).

## 2. AppTopbar — `layout/AppTopbar.tsx` (268 ln)

- Props: `{ activeTab: TabType; onOpenMobileNav?: () => void }`.
- Conteúdo confirmado: `AppBreadcrumbs`, `BirthHubLogo`, relógio ao vivo (`useLiveClock`), botão voltar contextual (`navigate(-1)` com fallback `/app` quando `location.key==='default'` — linhas 33-39), sino de notificações com contagem real (`notificationsApi.list(true)` → unread; reload ao montar e ao focar a aba — sem polling), toggle de tema (`useTheme`), toggle de som (`SoundFX.isEnabled`), `OfflineBadge`/`SyncIndicator`, botão de menu mobile.
- Ícone/título derivados de `TAB_META[activeTab]`.

## 3. MobileNav / Drawer

- `MobileNav.tsx` — arquivo de 2 linhas (**provável reexport** — NÃO VERIFICADO conteúdo).
- `MobileNavDrawer.tsx` (45 ln): `fixed inset-0 z-40 lg:hidden`; backdrop button `bg-overlay/80 backdrop-blur-sm` fecha ao clique; `<aside>` `w-64 max-w-[85vw] bg-surface-elevated` com `env(safe-area-inset-*)`; Escape fecha (linhas 13-23); renderiza `<Sidebar mobileOpen>` (só painel).
- Estado de abertura: `useNavigationState()` (`layout/hooks/useNavigationState.ts`) — `mobileNavOpen/toggleMobileNav/closeMobileNav`.

## 4. Breadcrumbs — `AppBreadcrumbs.tsx` (116 ln)

- Props: `{ className?, items?: BreadcrumbItem[] }`; `BreadcrumbItem { label, href?, current? }`.
- Modo automático: `resolveAutoBreadcrumbs(pathname)` mapeia `/app/*` para labels via `TAB_META`; caso especial `/app/settings/pillars/<slug>` → `Início › Ajustes Globais › <Pilar>` (`settingsPillarNav.ts`); fallback "Visão Geral".
- Ícones `ChevronRight`, `Home`; `Link` do react-router.

## 5. Tabs / Stepper / Paginação

- **Tabs primitive:** não existe `Tabs.tsx` em `ui/`. Alternativas confirmadas: `TabNavCards.tsx` (cards de navegação por aba) e navegação por rota. Uso de tabs internas nas features é **NÃO VERIFICADO**.
- **Stepper:** não existe em `ui/` — **NÃO EXISTE** como primitive (onboarding usa etapas próprias em `features/onboarding/SetupWizard`).
- **Pagination** (`ui/Pagination.tsx`): props `{ page, totalPages, onPageChange, totalItems?, itemLabel?, pageSize?, onPageSizeChange?, pageSizeOptions?=[20,50,100], loading? }` — paginação assíncrona para 10k+ registros, primeira/última página e salto direto (linhas 5-27).

## 6. AssistantsDock — `layout/AssistantsDock.tsx` (307 ln)

- Dois assistentes globais persistentes sobre qualquer workspace: **Chatbook** (`FloatingChatbook` lazy, drawer flutuante) e **Copiloto IA** (`CopilotoIaPanel` modo embed, gated por `canAccessCopilotoIa`).
- Estado de abertura persistido (`CHATBOOK_OPEN_KEY`/`COPILOTO_OPEN_KEY` em localStorage); montagem lazy do Chatbook só após primeira abertura (linhas 56-63).
- Layout: em viewport ≥lg, com ambos abertos, Copiloto desloca para `lg:right-[540px]` (linha 44-45); backdrop do Chatbook `z-[999]`.
- Botões flutuantes com `label` ("Copiloto IA", "Chatbook") — possivelmente `Fab`-like (**NÃO VERIFICADO** se usa `Fab`).

## 7. Outros elementos de navegação

- `NavLaunchTransition.tsx` — transição animada ao trocar de módulo.
- `PageTransition.tsx` — wrapper de transição de rota por `pathname`.
- `ExecutiveHeader.tsx` — cabeçalho executivo **NÃO VERIFICADO** (existe; distinto do AppTopbar).
- `moduleThemes.ts` — temas por módulo; `tabMeta.ts` — metadados (label, ícone `TabNavIcon`, path) por `TabType`; `NAV_HIDDEN_TABS` esconde tabs (dialer/voice-hub/outbound — ver `AppLayout.tsx:465-478`).
- Guards: `ProtectedRoute`, `RequireRole`, `RequireModuleAccess`, `RequireProductModule`, `OnboardingGate` — não são visuais.

## 8. Regras

1. Todo destino principal acessível por teclado; drawer mobile fecha com Escape e backdrop.
2. Itens de nav usam `focus-visible:ring-2 ring-focus-ring` (`ModuleNavPanel.tsx` `FOCUS_RING`).
3. Navegação entre módulos passa por `ModuleRail`; itens internos por `ModuleNavPanel` — não criar sidebars paralelas.
4. `activeTab` deriva da URL (`deriveActiveTabFromPath`) — deep-link é contrato.

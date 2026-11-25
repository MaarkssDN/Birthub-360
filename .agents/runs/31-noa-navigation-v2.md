# Relatório de Execução — Agente 31 · Noa

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 2 — Estrutura
**Branch:** `agente/31-noa-navigation-v2` (base: `agente/34-ari-acessibilidade-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. A navegação modular existente (ModuleRail + ModuleNavPanel + moduleRegistry + tabMeta) já é arquiteturalmente premium — o redesign foca no **chrome visual** (superfícies, bordas, acentos), não em reescrever lógica de rotas/menu.
2. Reescrever Sidebar/Topbar do zero duplicaria ~700 linhas de lógica de auth, badges, sons e navegação — violaria P2/P3. Em vez disso, v2 é uma camada fina que reutiliza os componentes de lógica existentes.
3. Mobile drawer mantém a renderização v1 (markup idêntico entre Sidebar e SidebarV2 no modo mobile).

## Plano executado

- **Etapa 1 — Auditoria:** `App.tsx` é só providers + rotas públicas; o shell autenticado vive em `AppLayout.tsx` → `MainLayout.tsx` → `Sidebar.tsx` (rail + painel) + `AppTopbar.tsx`. Rotas `/app/*` já são lazy + protegidas.
- **Etapa 2 — Layout v2:** `src/components/layout/v2/SidebarV2.tsx` criado — mesma máquina de estados da Sidebar v1 (colapso persistido em localStorage, variantes desktop/mobile), com chrome premium (`bg-card`, `border-border-default`). Reutiliza `ModuleRail`/`ModuleNavPanel` sem duplicar autorização nem navegação.
- **Etapa 3 — App Shell v2:** wiring por feature flag em `MainLayout.tsx` — `design.newNavigation` alterna `<SidebarV2>` ↔ `<Sidebar>`; todo o resto do shell (SkipLink, OfflineBanner, Topbar, widgets, CommandPalette, Toaster, PageTransition, PageTransition key=pathname) permanece idêntico, garantindo que **todas as rotas existentes continuam funcionando** sem alteração.
- **Etapa 4 — Acessibilidade:** SkipLink, focus-visible rings e navegação por teclado herdados dos componentes v1 reutilizados; SidebarV2 não introduz elementos novos interativos.
- **Etapa 5 — Performance:** zero re-render adicional — a flag é lida uma vez por render do MainLayout (mesmo padrão de hooks existente); nenhum lazy/Suspense novo necessário.

## Arquivos alterados

- `src/components/layout/v2/SidebarV2.tsx` (novo)
- `src/components/layout/MainLayout.tsx` (import + flag + swap condicional do Sidebar)
- `.agents/runs/31-noa-navigation-v2.md` (este relatório)

## Comandos executados

- `npx tsc --noEmit` → limpo para arquivos da missão.
- `npx biome lint` → limpo.

## Testes

- Typecheck/lint verdes. Testes E2E de navegação existentes cobrem as rotas (não modificadas). Validação visual do v2 depende de habilitar `design.newNavigation` em dev.

## Evidências

- Diff mínimo em `MainLayout.tsx`: +9 linhas; nenhuma rota, provider ou regra de acesso alterada.
- Flag `design.newNavigation` já existia em `src/config/feature-flags.ts` (Agente 33).

## Problemas fora do escopo

- ModuleRail/ModuleNavPanel/AppTopbar ainda usam tokens v1 (neon) internamente — reskin profundo desses componentes é handoff para integração (Fase 5) ou edição futura com dono de `src/components/layout/**`.

## Handoffs abertos

- Para Agente 00/Fase 5: reskin interno de `ModuleRail.tsx`, `ModuleNavPanel.tsx`, `AppTopbar.tsx`, `MobileNavDrawer.tsx` para tokens v2 (hoje o v2 muda só a superfície do painel).
- Para Agente 34: validar SidebarV2 com teclado/leitor de tela quando a flag estiver ativa.

## Aprendizados reutilizáveis

- Padrão de migração de shell: wrapper v2 fino + flag no ponto de composição (`MainLayout`) é mais seguro que `App-v2.tsx` paralelo — zero duplicação de rotas.

## Pendências

- Topbar v2 (breadcrumbs/ações premium), drawer mobile v2, transição de página v2 (PageTransition reskin).

## Riscos

- Baixo: flag off = comportamento idêntico ao atual. Único risco é visual parcial do painel v2 até o reskin interno dos módulos.

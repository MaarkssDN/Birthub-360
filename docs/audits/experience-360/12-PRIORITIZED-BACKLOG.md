# 12 — Backlog Priorizado Consolidado
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Legenda:** P0 bloqueador · P1 alto impacto · P2 moderado · P3 refinamento. Donos conforme AGENTS.md §15.

## P0 — Bloqueadores

| ID | Achado | Dono | Onda |
|---|---|---|---|
| — | Nenhum P0 de UX/UI confirmado em código de produto. O maior volume de `!important` (530) está na landing — **intocável por decisão**; registrada como dívida, não bloqueador. | — | — |

## P1 — Alto impacto

| ID | Achado | Evidência | Dono | Status |
|---|---|---|---|---|
| UX-001 | `/app/voice-hub` monta UI contra backend 503; redirect prometido não aplicado | `AppLayout.tsx:465-478` | 02 | identificado — decisão de produto necessária |
| UX-002 | Rotas órfãs/duplicadas com título "Command Center" errado (war-room, failover×2, resilience, elite-agent, pending-actions×2, characters) | `AppLayout.tsx:448-646` | 02 | identificado |
| A11Y-001 | `/app/characters` contraste 1,52:1 + paleta dark forçada no tema claro | `CharacterGalleryView.tsx:204-211` | 03 + feature | identificado |
| A11Y-002 | `role="button"`+tabIndex sem handler em KanbanBoard | `KanbanBoard.tsx:19` | 04 | identificado — fix de 1 linha |
| DS-001 | Duas camadas de tokens (globals × official-identity) sem precedência documentada | `main.tsx:11-12` | 03 + humano (DL) | identificado |
| DS-002 | DL §3 diverge da implementação de fontes — DL desatualizado | DL vs globals.css | humano | identificado |
| DS-003 | Radius diverge do DL + `.bh-card` 2× divergente | globals.css:913-916,1342-1652 | 03 | identificado |
| OPP-01 | Criação manual de lead inexistente na UI (backend pronto) | `LeadUseCases.ts:66` | 04 + 21 + 02 | oportunidade aprovada p/ Onda 4 |
| PERF/REND | `useFetch` sem cancel/race-guard (app inteiro) + 5 providers sem memo | `useDatabase.ts:29-53`; contexts | 03/02 | identificado |
| COMP-001 | **Duas design systems paralelas**: `ui/` × voice-hub `design-system/index.tsx` (19 componentes redefinidos, a11y divergente) | `design-system/index.tsx:55-1196` | 03 + voice-hub owner | identificado — decisão de consolidação |
| COMP-002 | `VirtualTable` sem `role="table"/aria-rowcount/colcount`, teclado parcial | `VirtualTable.tsx:91-169` | 03 | identificado |
| COMP-003 | ≥12 modais `role="dialog"` manuais sem focus trap/Escape do `ui/Dialog` | KnowledgeManager, DashboardBuilderModal, WhatsAppChatPanel, BitrixImportModal etc. | 03 + módulos | identificado |

## P2 — Impacto moderado

| ID | Achado | Dono |
|---|---|---|
| UX-003 | Command Palette ignora permissões; inclui settings_* legadas; não indexa ~10 rotas | 02 + 03 |
| UX-004 | 3-4 nomes para market-intelligence | 02 |
| UX-005 | settings/pillars sem entrada de navegação | 02 |
| UX-006 | Home sem empty state no filtro; active-state ambíguo `/app` vs `/app/home` | 02/30 |
| UX-007 | SignalsAndRisksHub catch silencioso (erro=empty) | dono do módulo |
| UX-010 | 3 fontes de verdade p/ navegabilidade | 02 |
| A11Y-003 | TableRow voice-hub sempre role=button | voice-hub owner |
| A11Y-004 | Backlog de labels em formulários (warns Biome) | 03E |
| A11Y-005 | axe critical/serious em 19/70 rotas (settings pilares, gamification, contraste) | 03E + módulos |
| CSS-001 | 530 `!important` LandingRegenerationV4 (+772 total landing) — **dívida landing, handoff** | 03G/03A + humano |
| CSS-002 | `index.css`/`luxury-tokens.css` ~339 linhas órfãs de import | 03 (verificar `.lux-` antes) |
| CSS-003 | 3 mecanismos de tema (.dark, data-theme, prefers-color-scheme hub-orbit) | 03 |
| CSS-004 | 3 autoridades de cor de título (policing × page-accent × utilities) | 03 |
| CSS-007 | z-index sem escala | 03 |
| CSS-008 | hex literais em CSS produto (#00E5FF não-token, neon-btn-cta) | 03 |
| CSS-010 | ~3.889 classes arbitrárias + hex inline em ~85-90 tsx de produto | 03 + features |
| DS-004 | tokens `--space-*` inexistentes | 03 |
| DS-005 | breakpoints DL não codificados | 03 |
| DS-006 | `--light-pink` diverge do DL | humano/03 |
| DS-007 | motion.ts × tokens CSS concorrentes | 03D |
| DS-010 | legado Vancouver/coolors ~200 linhas no DS global | 03 |
| DS-011 | policing de títulos frágil ([class*=title]) conflita c/ page-accent | 03 |
| DS-012 | duplicações cross-file (.badge-coolors, .text-gradient×3, .bh-*) | 03 |
| PERF-001 | useFetch sem cancel (ver P1) | hooks owner |
| PERF-002 | SW precache de todos os chunks (~1.78MB gzip) | 08/03 |
| RSP-001 | modais voice-hub w-[450-560px] sem max-w | voice-hub owner |
| RSP-002 | tabelas sem wrapper overflow em commercial-intelligence | módulo |
| RSP-007 | logout inexistente em mobile | 02 |
| COMP-004 | 3 EmptyStates divergentes; `feedback/EmptyState` órfão provável | 03 |
| COMP-005 | 4 ErrorBoundaries; 3 sem uso fora de testes | 03 |
| COMP-006 | forms sem `aria-invalid`/`aria-describedby`; sem FormField compartilhado (só 7/46 forms usam RHF+Zod) | 03 |
| COMP-007 | `window.confirm` residual ×2 | módulos |
| COMP-008 | toast toca SoundFX 2× por mensagem; 2º sistema de toast no voice-hub | 03 |
| COMP-009 | sem DataTable; 39 `<table>` crus; Pagination em só 4 arquivos | 03 + módulos |
| COMP-010 | batch actions duplicadas (CompanyList × CrmBoard) | 04/30 |
| COMP-013 | `alert()` nativo em 7 arquivos | módulos |
| COMP-014 | ~875 `<button>` nativos vs ~98 usando `<Button>`; ~425 inputs nativos vs ~204 componentes | transversal |

## P3 — Refinamento

| ID | Achado | Dono |
|---|---|---|
| UX-008 | títulos duplicados h1+topbar; `alert()` nativo VoiceHubView:133 | módulos |
| UX-009 | avatar sem menu (parcialmente coberto por OPP-02) | 02 |
| UX-011 | breadcrumb diverge do título | 02 |
| UX-012 | isHome cobre 2/3 homes | 02 |
| UX-013 | quick action "Relatórios de IA" ambíguo | 02 |
| A11Y-006/007/009 | inert vs tabIndex; title-only info; redundância alt | 03E |
| A11Y-008 | title-color pink/gold <4.5:1 p/ texto pequeno | 03C/03E |
| A11Y-010 | tema hub-orbit diverge (ver CSS-003) | 03 |
| CSS-009 | reduced-motion fragmentado por feature | 03 |
| CSS-011 | ~20 hex de contraste em official-identity fora de tokens | 03 |
| DS-008/009 | animações infinitas vs DL §8; `<style>` inline pontual | 03D/03 |
| PERF-003/004/005/006/007 | ClickSpark, pino optimizeDeps, font TTF fallback, img lazy, Landing360 monolítica | 03/08 |
| REND-003/004 | VirtualTable subutilizada; kanban colunas re-render | 03/04 |
| RSP-003/004/005/006/008 | touch targets, mobile-sweep parcial, breakpoints, canvas min-w, img lazy | módulos/02/14 |
| UX-01 residual | sem criação manual de lead (ver OPP-01 — promovido a P1) | 04/21/02 |
| UX-08 residual | 3/4 abas settings pilar placeholder (honesto) | 02/17 |
| UX-10 residual | DEAL_COLUMNS fallback hardcoded | 04 + regra components/AGENTS.md |
| UX-11 | ~~deep link ?lead~~ CORRIGIDO (LeadDetailDrawer.tsx:199) | — |
| COMP-011 | órfãos candidatos em ui/ (StatsGrid, Carousel, BottomSheet, DropdownMenu, Modal, ThemeSwitcher, sign-in-page.demo) — triagem pendente | 03 |
| COMP-012 | DropdownMenu Math.random/sem keyboard nav; Modal duplica focus trap | 03 |
| COMP-015 | 4 padrões de título de página (ver UX/COMP) | 02/03 |

## Corrigidos desde a auditoria UX de 2026-11-18 (verificado nesta operação)

- UX-02 botão morto PlaybooksHub → onClick real ✅
- UX-03 Gamificação erro→empty → `loadError` state ✅
- UX-07 KPI pipeline R$0 → null tratado ✅
- UX-09 Perfil somente leitura → edição nome/imagem/senha ✅ (PR #496)
- UX-05 componentes auth mortos → removidos ✅ (PR #495, parcial — ver knip p/ restante)
- UX-11 deep link lead ✅

## Itens que exigem decisão humana antes de implementar

1. **DEC-UX-01** criação manual de lead (produto).
2. **DEC-UX-02** destino das abas placeholder de settings pilar.
3. **DEC-UX-03** `/app/characters` paleta dark forçada.
4. **DEC-UX-04** fallback hardcoded de estágios (regra API-only).
5. **DL v2.0 revisão** — fontes, radius, tons light, display scale (DS-002/003/006).
6. **Voice-hub 503** — redirect vs reabrir gate.

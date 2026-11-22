# 06 — Auditoria de Componentes e Interações
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`

## 1. Inventário `src/components/ui/` (~95 primitivos)

shadcn-style sobre Radix slot + Tailwind + CVA/tailwind-merge. Categorias:

- **Primitivos de form:** Input, Textarea, Select, Label, Toggle, Checkbox (impl.), CalendarHeatmap.
- **Overlay:** Modal (focus trap+ESC+restore ✓), Dialog, Drawer, BottomSheet, ConfirmDialog, DropdownMenu, Tooltip, AIContextPopover, ToolTechPopover.
- **Data display:** Table (overflow+aria ✓), VirtualTable, Pagination, StatsGrid, KpiCard, LiveStatsWidget, CalendarHeatmap, Timeline, FunnelBars, ChannelDonut, DealsGrid, CompareTable/CompareBar, FindingsList, Checklist.
- **Feedback:** Alert, EmptyState, BlockedState, OperationalStateContainer, VisualState, Skeleton, ErrorBoundary, Toaster, ContextualTip, Badge, Glow, HolographicCard, TiltCard, Magnetic, BorderBeam, ClickSpark, ParticleSystem.
- **Navegação:** CommandPalette (⌘K, trap ✓), TabNavCards, FloatingNavbar, CtaBanner, PricingSection, HeroMockup.
- **Marketing/showcase:** BentoShowcase, StyleShowcase, ButtonGallery-ish, sign-in-page demo, AuroraButton, OrbitRing, Gamified3DOrb.
- **Especiais:** VoiceCommandWidget, ModuleAgentWidget(+css próprio), GamificationWidget, CopilotTrigger, BugReportButton, CopyButton, ThemeSwitcher, ClockCalendarWidget, DealsGrid, AiReasoningPipeline/Visualizer, AIEmailGenerator, ActionPlanSteps, IconButton, ButtonGroup, Carousel, Fab, BrandOrb, TechToolLogo, semanticTokensValidator.

**Observação:** a pasta mistura primitivos de produção com showcases/marketing (BentoShowcase, StyleShowcase, sign-in-page.demo, HeroMockup, PricingSection) — candidatos a mover para design-lab ou remover do bundle se importados em rotas de produção (verificar).

## 2. Duplicações e padrões paralelos

| Padrão | Primitivo canônico | Duplicações encontradas |
|---|---|---|
| Modal/dialog | `ui/Modal.tsx`, `ui/Dialog.tsx` | **23 arquivos de feature definem modais próprios**; 16 com `role="dialog"`/`aria-modal` — amostra indica padrão consistente mas nem todos com focus trap verificado |
| Tabela | `ui/Table.tsx` (overflow+aria) | voice-hub tem `design-system/TableRow` próprio (A11Y-003); commercial-intelligence usa `<table>` cru sem wrapper (RSP-002) |
| Empty state | `components/feedback/EmptyState.tsx` (47 usos) | variantes locais e casos de erro tratados como empty (UX-03 corrigido; UX-007 residual) |
| Toast | `lib/toast` (66 usos) | `alert()` nativo em **7 arquivos**: CompanyList, voice-hub CommandPalette ×2, TestSimulatorModal, VoiceHubView, Playground ×2 |
| Loading | Skeleton (`ui/Skeleton`) | spinner/Loader2 avulsos em várias telas; skeleton coverage desigual |
| Título de página | `PageHeader` (~18 telas) | `PageTitleCard` (CadenceHub, SignalsAndRisks, ProspectingHub, playbooks, Billing, Automations, Knowledge), h1 ad-hoc (Integrations:109, CopilotoIaPanel:57, GamificationView, CentralModulesHome:143), nenhuma (CrmBoard, Ldr) — **4 padrões convivendo** |
| Confirmação destrutiva | `ConfirmDialog` | verificar adoção em deletes (amostra: presente em flows principais) |

## 3. Achados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| COMP-001 | P2 | 4 padrões de título de página convivendo (PageHeader/PageTitleCard/h1 ad-hoc/nenhum) | refs acima |
| COMP-002 | P2 | `alert()` nativo em 7 arquivos — fora do sistema de feedback | lista acima |
| COMP-003 | P2 | 23 modais custom em features; focus trap/Escape verificado só em amostra (Modal/Dialog/Drawer/CommandPalette ok; ~15 restantes não auditados) | grep role=dialog |
| COMP-004 | P2 | voice-hub `design-system/index.tsx` (1.098 linhas) é segunda biblioteca de componentes paralela — TableRow próprio com bug a11y | A11Y-003 |
| COMP-005 | P3 | showcases/marketing dentro de `ui/` (BentoShowcase, StyleShowcase, sign-in-page.demo, HeroMockup, PricingSection) — risco de bundle/ruído | listagem |
| COMP-006 | P3 | loading states inconsistentes (skeleton vs spinner vs texto) entre módulos | amostra |
| COMP-007 | P2 | KanbanBoard `role=button` sem handler (A11Y-002); KanbanCard correto — inconsistência interna do mesmo componente | KanbanBoard.tsx:19 vs KanbanCard.tsx:170-188 |
| COMP-008 | P3 | `.bh-*` e primitivos duplicados em globals × official-identity (CSS-005) | ver 05 |

## 4. Catálogo de estados por tela (transversal)

| Estado | Cobertura |
|---|---|
| Loading | majoritário; skeleton em dashboards, spinner em listas; sem padrão único |
| Empty | `EmptyState` bem adotado (47 arquivos); falhas residuais: home filter (UX-006), signals-risks erro=empty (UX-007) |
| Error | toast + inline; exceções: alert() ×7, catch silencioso signals-risks |
| Confirmação destrutiva | ConfirmDialog existe; adoção por fluxo não auditada exaustivamente |
| Salvamento | forms aguardam resposta (verificado em amostra: Company, Contact, Proposta, Cadência, Knowledge, PillarSettings) |
| Otimista | kanban drag com rollback ✅ |

## 5. Recomendações

1. **P2:** padronizar título de página — eleger `PageHeader` (ou `PageTitleCard`) como único, migrar h1 ad-hoc e telas sem título.
2. **P2:** eliminar `alert()` → toast; varrer `catch {}` silenciosos.
3. **P2:** auditoria de focus trap nos ~15 modais custom restantes (checklist: focus on open, Tab cycle, Escape, restore).
4. **P2:** decidir destino do DS paralelo voice-hub (consolidar em ui/ ou isolar formalmente com owner).
5. **P3:** mover showcases de `ui/` para design-lab; padronizar skeleton vs spinner por tipo de conteúdo.

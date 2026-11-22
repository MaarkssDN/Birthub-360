# 06 — Auditoria de Componentes e Interações
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Método:** auditoria especializada completa de `src/components/ui/` + padrões de feature (subagente dedicado) + verificação direta do coordenador.

## 1. Inventário `src/components/ui/` (~89 tsx + bento/ + icons/)

- **Radix/shadcn-style:** Button (Slot+CVA), Dialog (@radix-ui/react-dialog, composto+conveniência), Drawer, BottomSheet (Vaul), ConfirmDialog (sobre Dialog), Carousel (Embla), Tooltip (Floating UI+FM).
- **Wrappers custom:** Input, Select, Textarea, Label, Badge, Card, Alert, Toggle, Pagination, Table, Skeleton, EmptyState, Toaster, OperationalStateContainer, ButtonGroup.
- **Produto:** dashboards (DealsGrid, KpiCard, FunnelBars, CompareBar/Table, FindingsList, AiReasoning*, CopilotTrigger, VoiceCommandWidget, CommandPalette, ContextualTip, ToolTechPopover), landing (HeroMockup, PricingSection, CtaBanner, sign-in-page*, BentoShowcase, StyleShowcase, CalendarHeatmap, Gamified3DOrb), efeitos (AuroraButton, BorderBeam, ClickSpark, Glow, HolographicCard, Magnetic, OrbitRing, ParticleSystem, TiltCard, BrandOrb), utilitários (IconButton, CopyButton, Fab, BlockedState, VisualState, PageHeader, PageTitleCard, Timeline, TechToolLogo, ModuleAgentWidget, LiveStatsWidget, ClockCalendarWidget, GamificationWidget, ModulePlaceholder, ThemeSwitcher).
- **Barrel `index.ts` exporta só 32 módulos** — muitos consumidores importam paths diretos; barrel não prova uso.
- **Mistura produção/marketing:** showcases e demos (BentoShowcase, StyleShowcase, sign-in-page.demo, HeroMockup, PricingSection) dentro de `ui/` — candidatos a design-lab ou remoção do bundle de produção (verificar imports).

## 2. Achados consolidados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| COMP-001 | **P1** | **Duas design systems paralelas**: `ui/` e `features/voice-hub/components/design-system/index.tsx` (1.098 linhas) redefinem Button, Input, Textarea, Checkbox/Switch, Select, Badge, Card, Skeleton, EmptyState, Alert, Spinner/Progress, Avatar, Tabs, Table*, Modal, Timeline, Tooltip, useToast/ToastContainer, ErrorBoundary — com tokens e a11y divergentes. Inputs do voice-hub têm `aria-invalid`/`aria-describedby` **melhores** que `ui/Input` | design-system/index.tsx:55-1196 vs ui/*; ex.: Input :126-174 vs ui/Input.tsx:6-50 |
| COMP-002 | **P1** | `VirtualTable` com débito ARIA: divs com roles parciais (row/columnheader/cell/rowgroup), **sem `role="table"/"grid"`, sem `aria-rowcount`/`colcount`**, teclado só em linhas clicáveis | `VirtualTable.tsx:91-117,142-169` |
| COMP-003 | **P1** | ≥12 modais com `role="dialog"` manual em features que **não herdam focus trap/Escape/preventClose** do `ui/Dialog`: KnowledgeManager, DashboardBuilderModal, RoiSimulatorModal, PillarDetailDialog, ExternalCrmConnectModal, WhatsAppChatPanel, BitrixImportModal, LeadDetailDrawer, CharacterDetailPanel, voice-hub CommandPalette ×2, design-system Modal | refs por arquivo |
| COMP-004 | P2 | Três `EmptyState` divergentes; `components/feedback/EmptyState.tsx` **sem imports fora dele** (órfão provável) | ui/EmptyState.tsx:14-51; feedback/EmptyState.tsx:11-45; design-system:477-492 |
| COMP-005 | P2 | Quatro `ErrorBoundary` com logging/fallback diferentes; `ui/ErrorBoundary` e as duas do voice-hub sem uso fora de testes | components/ErrorBoundary.tsx:13-47 (usada em App.tsx:176); demais refs |
| COMP-006 | P2 | Erros de form sem `aria-invalid`/`aria-describedby` nos campos compartilhados; só 32 matches no total em features — quase todos do DS voice-hub. RHF renderiza erros em `<p>` solto | ContactForm.tsx:121-152; CompanyForm.tsx:107-125 |
| COMP-007 | P2 | `window.confirm` residual em 2 call sites; `useConfirmDialog` cobre só ~15 arquivos | AgentRegistry.tsx:60; ExternalCrmPanel.tsx:452 |
| COMP-008 | P2 | Toast toca `SoundFX` **duas vezes** por mensagem (emit em lib/toast.ts:23-25 + render em Toaster.tsx:30-36); segundo sistema de toast no voice-hub | refs |
| COMP-009 | P2 | Sem `DataTable`/busca/filtro/ordenação compartilhados; **39 features com `<table>` cru**; `Pagination` usada em só 4 arquivos | ui/Table.tsx:14-117; VirtualTable; Pagination.tsx:28-195 |
| COMP-010 | P2 | Batch actions duplicadas: toolbar local de CompanyList vs `useCrmBoardBatchActions` do board — sem `BulkActionsBar` compartilhado | CompanyList.tsx:180-201,721-785; CrmBoard.tsx:199-200,517-571 |
| COMP-011 | P3 | Candidatos a órfãos em `ui/`: StatsGrid, Carousel, BottomSheet, DropdownMenu, Modal, ThemeSwitcher, ModulePlaceholder, sign-in-page.demo (triagem pendente — barrels/imports dinâmicos podem escapar) | index.ts:1-32 |
| COMP-012 | P3 | `DropdownMenu.tsx` usa `Math.random()` p/ ID e sem keyboard nav; `Modal.tsx` duplica focus trap manual do Radix | DropdownMenu.tsx:11,15-47; Modal.tsx:18-74 |
| COMP-013 | P2 | `alert()` nativo em 7 arquivos (CompanyList, voice-hub CommandPalette ×2, TestSimulatorModal, VoiceHubView, Playground ×2) | grep |
| COMP-014 | P3 | Botões/inputs nativos massivos: ~875 `<button>` vs ~98 arquivos usando `<Button>`; ~425 inputs nativos vs ~204 usos de componentes | contagem regex (aproximada) |
| COMP-015 | P2 | Quatro padrões de título de página (PageHeader/PageTitleCard/h1 ad-hoc/nenhum) | ver 10-INFORMATION-ARCHITECTURE |

## 3. Padrões de formulário

- **Não existe `Form`/`FormField` compartilhado.** 46 arquivos de feature com forms; só **7 usam React Hook Form + Zod** (ContactForm, CompanyForm, QualificationItemForm, ObjectionItemForm, DsrRequestForm, PropostaForm, MemoryGovernancePanel).
- RHF renderiza erros em `<p>` sem ligar `aria-invalid`/`aria-describedby` aos campos — padrão do voice-hub DS é melhor e deveria virar referência.

## 4. Padrões de feedback

- Toast global custom (`lib/toast.ts` + `Toaster.tsx`, montado em MainLayout) com `role=alert` p/ erro e `role=status` p/ demais — bom.
- `OperationalStateContainer` modela loading/empty/error/stale/ready mas usado em só 4 arquivos.
- Skeleton: ~59 arquivos usam, muitos com `animate-pulse`/`animate-spin` manuais em vez do `Skeleton` component.
- Confirmações: `useConfirmDialog` bem adotado (~15 features); restam `window.confirm` ×2.

## 5. Tabelas e batch

- `Table.tsx` é primitiva semântica correta (overflow+aria); falta **DataTable** com busca/filtro/ordenação.
- `VirtualTable` (tanstack virtual) usado em só 2-3 arquivos e com débito ARIA (COMP-002).
- Batch actions locais duplicadas (COMP-010).

## 6. Recomendações priorizadas

1. **P1:** decidir o destino do DS paralelo do voice-hub — documentar como sistema isolado intencional OU migrar gradualmente para `ui/` (prioridade Button/Input/Select/Dialog/Toast). O voice-hub tem a11y de form melhor — extrair esse padrão para `ui/` em vez de migrar tudo.
2. **P1:** corrigir ARIA do VirtualTable (role=table/grid + rowcount/colcount + teclado) ou restringir a listas não-tabulares.
3. **P1:** migrar os ≥12 modais `role="dialog"` manuais para `ui/Dialog` (focus trap/Escape/preventClose de graça).
4. **P2:** criar `FormField` com `aria-invalid`/`aria-describedby` e adotar nos 7 forms RHF + expansão gradual.
5. **P2:** consolidar EmptyStates (3→1 canônico + decidir feedback/EmptyState órfão); ErrorBoundaries (4→1-2); remover SoundFX duplicado do toast.
6. **P2:** `BulkActionsBar` compartilhado; avaliar DataTable leve (ou estender Table) para os 39 `<table>` crus.
7. **P3:** triagem de órfãos COMP-011 antes de qualquer remoção; `DropdownMenu` sem Math.random/keyboard.

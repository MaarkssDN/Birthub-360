# 03 — Inventário de Rotas

**Propósito:** tabela completa de rotas do produto (públicas, autenticadas fora de `/app`, `/app/*` e redirects/legadas): path → componente → módulo → status.

**Escopo:** react-router-dom v7, `BrowserRouter` em `src/main.tsx`; rotas declaradas em `src/App.tsx` (nível raiz) e `src/components/layout/AppLayout.tsx` (sub-rotas de `/app/*`). Todas as telas autenticadas são `React.lazy` + `Suspense` + `PageTransition` (`_FATOS-CANONICOS.md` §9).

**Estado da informação:** CONFIRMADO em código, salvo itens marcados. Data de referência: 2026-11-19.

**Fontes:** `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/layout/moduleRegistry.ts`, `src/components/layout/tabMeta.ts`, `_FATOS-CANONICOS.md` §9.

**Documentos relacionados:** `mapa-de-modulos.md`, `inventario-de-telas.md`, `jornadas-do-usuario.md`.

---

## 1. Rotas públicas (sem autenticação)

| Path | Componente | Módulo | Status |
|---|---|---|---|
| `/` | `Landing360` (initialScreen default) | Marca/Entrada | Ativo — landing canônica |
| `/welcome` | `Landing360 initialScreen="intro"` | Marca/Entrada | Ativo — hero + CTA "Explorar Hub", sem form (`App.tsx:81-93`) |
| `/login` | `Landing360 initialScreen="login"` | Marca/Entrada | Ativo — formulário de acesso |
| `/landing-new` | `LandingInnovative` (`features/voice-hub/pages/`) | P08 (origem) | Ativo — landing alternativa; sub-app voice-hub tem DS próprio (divergência §12 FATOS) |
| `/privacy` | `PrivacyPolicy` (`src/pages/`) | Legal | Ativo |
| `/terms` | `TermsOfUse` (`src/pages/`) | Legal | Ativo |
| `/privacidade/dsr/verificar` | `DsrVerifyPage` (`features/lgpd/pages/`) | LGPD | Ativo — canal público DSR (LGPD art. 18) |
| `/privacidade/dsr/acompanhamento` | `DsrStatusPage` (`features/lgpd/pages/`) | LGPD | Ativo — canal público DSR |
| `/reset-password` | `ResetPasswordScreen` (`features/auth/`) | Auth | Ativo |
| `/book/:slug` | `PublicBookingPage` (`features/calendar/components/`) | P03 | Ativo — agendamento público |
| `/select-brand` | `<Navigate to="/welcome" replace>` | — | **Redirect legado** (marca única; preserva links salvos — `App.tsx:127-130`) |
| `*` (catch-all raiz) | `<Navigate to="/welcome" replace>` | — | Ativo — fallback global |

## 2. Rotas autenticadas fora de `/app/*`

| Path | Componente | Gate | Módulo | Status |
|---|---|---|---|---|
| `/design-lab/command-language` | `DesignLabPage section="command-language"` (`features/design-lab/`) | `ProtectedRoute` | Design Lab | Ativo — catálogo vivo interno |
| `/design-lab/components-v2` | `DesignLabPage section="components-v2"` | `ProtectedRoute` | Design Lab | Ativo |
| `/design-lab/home-proposals` | `CentralModulesHome` | `ProtectedRoute` | Hub | Ativo — proposta de home |
| `/social-selling` | `SocialSellingHub` (`features/social-selling/`) | `ProtectedRoute` + `RequireModuleAccess moduleKey="social-selling"` (grant em banco) | M11 | Ativo — rota top-level intencional ("não quero que apareça no CRM" — `App.tsx:140-145`) |
| `/setup` | `SetupWizard` (`features/onboarding/components/`) | `ProtectedRoute` + `RequireRole ADMIN` | Onboarding/M09 | Ativo — setup inicial da organização |
| `/hub` | `<Navigate to="/app" replace>` | — | — | **Redirect legado** (Hub Executivo antigo — `App.tsx:139`) |

## 3. Rotas autenticadas em `/app/*` (dentro de `AppLayout` → `OnboardingGate` + `MainLayout`)

Shell fixo em todas: `OnboardingTour` (lazy, 1ª visita via `localStorage '@prospector:has_seen_tour'`) e `LiveCopilotHUD` (lazy, sempre — `AppLayout.tsx:386-394,651-659`).

### 3.1 Hub Central

| Path | Componente | Status |
|---|---|---|
| `/app` (index) e `/app/home` | `CentralModulesHome` (`features/home/`) — "Portal dos 11 Módulos", 1ª tela pós-login | Ativo |
| `/app/dashboard` | `AdaptiveDashboard` (`features/dashboard/`) — Cockpit Operacional | Ativo |
| `/app/workspace` | `WorkspaceHome` (`features/workspace/`) — workspace por JobRole; estados READY/NO_JOB_ROLE/NO_WORKSPACE_DEFINITION | Ativo |
| `/app/daily-plan` | `DailyPlanHub` (`features/commercial-intelligence/`) | Ativo |
| `/app/notifications` | `Notifications` (`features/notifications/`) — SSE | Ativo |

### 3.2 P01 — Hub Comercial

| Path | Componente | Status |
|---|---|---|
| `/app/crm` | `CrmBoard` (`src/components/CrmBoard.tsx` — kanban arrastar-e-soltar) | Ativo |
| `/app/crm360` | `CrmOverview` (`features/crm360/`) — Cockpit de Negócios | Ativo (rota confirmada; handoff crm360 resolvido — `mapa-de-navegacao.md` obs.) |
| `/app/propostas` | `PropostasList` (`features/crm360/`) | Ativo |
| `/app/companies` | `CompanyList` (`features/companies/`) | Ativo |
| `/app/contacts` | `ContactList` (`features/contacts/`; `?view=decisores` = Mapeamento de Decisores) | Ativo |

### 3.3 P02 — Inteligência de Mercado

| Path | Componente | Status |
|---|---|---|
| `/app/prospect` | `ProspectingHub` (`features/prospecting/`) | Ativo |
| `/app/prospect/inteligente` | `ProspeccaoInteligenteHub` (`features/prospecting/`) | Ativo |
| `/app/market-intelligence` | `Ldr` (`features/market-intelligence/`) — Pesquisa LDR | Ativo |
| `/app/market-intelligence/hub` | `InteligenciaMercadoHub` | Ativo |
| `/app/market-intelligence/accounts/:id` | `Account360` | Ativo — param `:id` |
| `/app/market-intelligence/deck` | `LeadApprovalDeck` | Ativo — fila de aprovação do Gestor (J04) |

### 3.4 P03 — Orquestração de Vendas

| Path | Componente | Status |
|---|---|---|
| `/app/jornadas` | `JornadasComerciaisHub` | Ativo |
| `/app/playbooks` | `PlaybooksHub` | Ativo (débito: botão morto registrado em auditoria UX) |
| `/app/processos` | `ProcessosVendasHub` | Ativo |
| `/app/roteiros` | `RoteirosHub` | Ativo |
| `/app/cadence` | `CadenceHub` (`features/cadence/`) — cadência multicanal | Ativo |
| `/app/activities` | `ActivityList` (`features/activities/`) | Ativo |
| `/app/calendar` | `Calendar` (`features/calendar/`) | Ativo |
| `/app/roleplay` | `RoleplayHub` (`features/roleplay/`) | Ativo — rótulo "Roleplay" (docs antigas dizem "Dojo de Vendas" — ver `mapa-de-navegacao.md` obs.) |
| `/app/qualification_matrix` | `QualificationMatrixPage` (`features/playbook/`) | Ativo |
| `/app/objections_matrix` | `ObjectionsMatrixPage` | Ativo |
| `/app/topic_training` | `TopicTrainingAcademy` (`features/intelligence/`) | Ativo |
| `/app/chatbook` | `ChatbookHub` (`features/chatbook/`) | Ativo |
| `/app/editor` | `DocumentEditor` (`features/document-editor/` — Tiptap) | Ativo |
| `/app/dialer/*` | `<Navigate to="/app/cadence" replace>` | **Redirect legado** (`AppLayout.tsx:474`) |

### 3.5 P04 — Performance Comercial

| Path | Componente | Status |
|---|---|---|
| `/app/analytics` | `Analytics` (`features/analytics/` — WinLoss/Cohort/churn) | Ativo |
| `/app/winloss` | `WinLossAnalysis` | Ativo |
| `/app/reports` | `ReportsHub` | Ativo |
| `/app/gamification` | `GamificationView` (`features/gamification/`) | Ativo (duplicata de rota removida — MEL-31/Onda 4) |
| `/app/war-room` | `WarRoomArenaView` (`features/gamification/`) | Ativo — extraPath de P04 |

### 3.6 P05 — Previsibilidade Comercial (todas `RequireRole COMMERCIAL_INTELLIGENCE_ROLES`)

| Path | Componente | Status |
|---|---|---|
| `/app/forecast` | `ForecastHub` (`features/commercial-intelligence/`) | Ativo — gated |
| `/app/metas` | `MetasHub` | Ativo — gated |
| `/app/pipeline_ponderado` | `PipelinePonderadoHub` | Ativo — gated |

### 3.7 P06 — Inteligência Artificial

| Path | Componente | Status |
|---|---|---|
| `/app/intelligence` | `IntelligenceHub` (`features/intelligence/`) | Ativo |
| `/app/intelligence/elite-agent` | `EliteCommercialAgentWorkspace` | Ativo |
| `/app/intelligence/pending-actions` | `AIPendingActionsInbox` | Ativo |
| `/app/pending-actions` | `AIPendingActionsInbox` (alias) | Ativo — extraPath P06 |
| `/app/copiloto_ia` | `CopilotoIaHub` (`features/copiloto-ia/`) | Ativo — `RequireRole` (SDR+) |
| `/app/commercial_intelligence` | `CommercialIntelligenceHub` | Ativo — `RequireRole` |
| `/app/signals-risks` | `SignalsAndRisksHub` (`features/signals-risks/`) | Ativo |
| `/app/signals-risks/radar` | `SignalsAndRisksHub initialView="radar"` | Ativo |
| `/app/signals-risks/deal-risks` | `SignalsAndRisksHub initialView="deal-risks"` | Ativo |
| `/app/knowledge` | `KnowledgeBase` (`features/knowledge/`) | Ativo |
| `/app/sdr-diagnostic` | `JoaoReisDiagnosticHub` | Ativo |

### 3.8 P07 — Automação & Conectividade

| Path | Componente | Status |
|---|---|---|
| `/app/automations` | `Automations` (`features/automations/`) | Ativo — item `requires:'operations'` |
| `/app/integrations` | `Integrations` (`features/integrations/`) | Ativo — item `requires:'operations'` |
| `/app/bitrix` | `BitrixGuideHub` (`features/integrations/`) | Ativo |

### 3.9 P08 — Engajamento Comercial

| Path | Componente | Status |
|---|---|---|
| `/app/mesa-tratamento` | `MesaTratamento` (`features/mesa-tratamento/`) | Ativo — `RequireRole` ADMIN/GESTOR/CLOSER/SDR |
| `/app/voice-hub/*` | `VoiceHubView` (`features/voice-hub/`) | **PARCIALMENTE BLOQUEADO** — backend 503 `MODULE_NOT_READY` (`legacyModuleGate`, intencional; handoff 17→12); splat cobre `/app/voice-hub` exato |
| `/app/dialer/*` | `<Navigate to="/app/cadence">` | Redirect (ver §3.4) |
| `/app/outbound/*` | `<Navigate to="/app/dashboard">` | **Redirect legado** — deep-links voltam ao dashboard (`AppLayout.tsx:478`) |

### 3.10 M09 — Admin & Operations

| Path | Componente | Status |
|---|---|---|
| `/app/settings` | `Settings` (`features/settings/`) | Ativo |
| `/app/settings/pillars` | `<Navigate to="/app/settings/pillars/hub" replace>` | Redirect canônico (MEL-30/Onda 4) |
| `/app/settings/pillars/:pillar` | `PillarSettingsHub` | Ativo — hub por pilar |
| `/app/settings_hub` | `<Navigate to="/app/settings/pillars/hub">` | Redirect legado |
| `/app/settings_market` | `<Navigate to="/app/settings/pillars/market">` | Redirect legado |
| `/app/settings_sales` | `<Navigate to="/app/settings/pillars/sales">` | Redirect legado |
| `/app/settings_performance` | `<Navigate to="/app/settings/pillars/performance">` | Redirect legado |
| `/app/settings_predictability` | `<Navigate to="/app/settings/pillars/predictability">` | Redirect legado |
| `/app/settings_ai` | `<Navigate to="/app/settings/pillars/ai">` | Redirect legado |
| `/app/settings_automation` | `<Navigate to="/app/settings/pillars/automation">` | Redirect legado |
| `/app/settings_engagement` | `<Navigate to="/app/settings/pillars/engagement">` | Redirect legado |
| `/app/team` | `Team` (`features/team/`) | Ativo — `RequireRole ADMIN` |
| `/app/module-access` | `ModuleAccessAdmin` (`features/module-access/`) | Ativo — `RequireRole ADMIN` |
| `/app/usage` | `Usage` | Ativo — `RequireRole ADMIN` |
| `/app/failover` | `MultiRegionFailoverPanel` | Ativo — `RequireRole ADMIN\|GESTOR` |
| `/app/resilience` | `MultiRegionFailoverPanel` (mesmo componente) | Ativo — `RequireRole ADMIN\|GESTOR` |
| `/app/characters` | `CharacterGalleryView` (`features/characters/`) | Ativo — sem entrada em menu; acesso direto por URL |

### 3.11 Catch-all interno

| Path | Componente | Status |
|---|---|---|
| `/app/*` (não casado) | `<Navigate to="/app" replace>` | Ativo — fallback para Hub (`AppLayout.tsx:647`) |

---

## 4. Resumo de redirects e rotas legadas

| Origem | Destino | Motivo |
|---|---|---|
| `/select-brand` | `/welcome` | Marca única (era escolha entre marcas antigas) |
| `/hub` | `/app` | Hub Executivo antigo extinto |
| `/app/dialer/*` | `/app/cadence` | Discador 3CX indisponível; Cadências é o destino honesto |
| `/app/outbound/*` | `/app/dashboard` | Outbound 503 `MODULE_NOT_READY` |
| `/app/settings` (bare) | — | `/app/settings/pillars` → `/app/settings/pillars/hub` |
| `/app/settings_{hub,market,sales,performance,predictability,ai,automation,engagement}` | `/app/settings/pillars/{slug}` | Consolidação MEL-30/Onda 4 — `replace`, preserva bookmarks/CommandPalette/navigationBus |
| `/app` (splat interno) | `/app` | catch-all |
| `*` (global) | `/welcome` | catch-all raiz |

**Rotas aposentadas (não existem mais):** `/treinamento-birthhub360`, `/proposta-comercial`, `/hub-inteligencia-marketing` — removidas junto com seus módulos do catálogo (`App.tsx:146-151`). Identificadores `enrich`/`prompts` removidos de `tabMeta.ts` (Onda 10 — `mapa-de-navegacao.md` obs.).

## 5. Gates consolidados

| Gate | Rotas afetadas |
|---|---|
| `ProtectedRoute` (sessão) | todas as rotas autenticadas e `/social-selling`, `/setup`, `/design-lab/*` |
| `RequireRole ADMIN` | `/setup`, `/app/team`, `/app/module-access`, `/app/usage` |
| `RequireRole ADMIN\|GESTOR` | `/app/failover`, `/app/resilience` |
| `RequireRole COMMERCIAL_INTELLIGENCE_ROLES` | `/app/forecast`, `/app/metas`, `/app/pipeline_ponderado`, `/app/commercial_intelligence` |
| `RequireRole` mesa-tratamento | `/app/mesa-tratamento` (ADMIN/GESTOR/CLOSER/SDR) |
| `RequireRole` copiloto | `/app/copiloto_ia` (SDR+) |
| `RequireModuleAccess` | `/social-selling` (grant `ModuleAccessGrant`) |
| `OnboardingGate` | todas as rotas `/app/*` (wrapper do `AppLayout`) |
| Item-level `requires` (nav) | `copilotoIa`, `commercialIntelligence`, `operations`, `admin` — filtram visibilidade, não acesso direto |

## 6. Lacunas

- **NÃO VERIFICADO:** mapa completo de sub-rotas internas (ex.: drawers, tabs com `?view=` além de `contacts?view=decisores`, `signals-risks` com `initialView`) — o inventário cobre rotas de primeiro nível; estados internos de tela pertencem a `inventario-de-telas.md`.
- **NÃO VERIFICADO:** existência de rotas filhas em features com router próprio (ex.: `prospecting/outbound/` tem `main.tsx`/server próprios — sub-app quase standalone, `_FATOS-CANONICOS.md` §10).
- Deep-links por query string além dos citados podem existir por feature; auditar por feature se necessário.

---
*Documento gerado na missão Brand System 03-PRODUTO. Evidências consolidadas em `../_FATOS-CANONICOS.md`.*

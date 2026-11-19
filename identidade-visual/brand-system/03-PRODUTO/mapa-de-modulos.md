# 03 — Mapa de Módulos

**Propósito:** tabela canônica dos 12 workspaces do produto (Hub Central + 11 módulos P01–P08 e M09–M11): nome, código, propósito, rotas de entrada, público e status.

**Escopo:** registro canônico `src/components/layout/moduleRegistry.ts` + catálogo `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv` (59 funcionalidades, todas `Status_Especificacao = Especificada`).

**Estado da informação:** CONFIRMADO. Data de referência: 2026-11-19.

**Fontes:** `src/components/layout/moduleRegistry.ts` (linhas citadas), `src/components/layout/AppLayout.tsx`, `src/App.tsx`, `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv`, `PRODUCT.md`, `BIRTHUB360_JORNADAS_OPERACIONAIS.md`, `_FATOS-CANONICOS.md` §2,§10.

**Documentos relacionados:** `arquitetura-da-informacao.md`, `inventario-de-rotas.md`, `inventario-de-telas.md`, `jornadas-do-usuario.md`.

---

## 0. Nota sobre status

O catálogo CSV marca **todas as 59 funcionalidades como "Especificada"** (status de especificação, não de implantação). O status de cada módulo abaixo reflete o **registro de navegação vigente**: `web` = workspace roteado em `/app/*`; `mobile` = somente app Capacitor; `external` = rota top-level fora de `/app`. Gates de API podem bloquear partes do módulo (ex.: P08 com 503 `MODULE_NOT_READY` em voice/outbound — ver §P08).

---

## 1. Hub Central (fora da numeração oficial)

| Campo | Valor |
|---|---|
| Código / ID | `HUB` / `hub` |
| Nome | Hub Central |
| Tagline | "Command Center e Meu Espaço" |
| Propósito | Centro neural: visão consolidada 360°, feed de alertas, cockpit diário (`PRODUCT.md` pilar 1; jornadas J05/J13) |
| Entrada (`home`) | `/app` (index e `/app/home` → `CentralModulesHome`); Cockpit `/app/dashboard` → `AdaptiveDashboard` |
| Itens | Portal dos 11 Módulos, Cockpit Operacional, Meu Espaço (`/app/workspace`), Plano Diário (`/app/daily-plan`), Notificações (`/app/notifications`) |
| Público | Todos os papéis autenticados |
| Accent / ícone | `gold` / `LayoutDashboard` (lucide) |
| Status | **Web — ativo** |
| Fonte | `moduleRegistry.ts:110-125`; `AppLayout.tsx:411-421,519,522` |

---

## 2. P01 — Hub Comercial

| Campo | Valor |
|---|---|
| Código / ID | `P01` / `p01` |
| Nome | Hub Comercial |
| Tagline | "CRM 360°, negócios e relacionamentos" |
| Propósito | Pipeline kanban, gestão de negócios, propostas, empresas/contatos e decisores (catálogo: P01-FN-001 Kanban CrmBoard, P01-FN-002 Cockpit CrmOverview, P01-FN-003 contas/contatos, P01-FN-004 propostas com diff) |
| Entrada | `/app/crm` (`CrmBoard`) |
| Rotas do módulo | `/app/crm`, `/app/crm360`, `/app/propostas`, `/app/companies`, `/app/contacts` (+ `?view=decisores`); extra: `settings/pillars/hub` |
| Público | SDR, BDR, Closer, Gestor, Diretor (`PRODUCT.md` personas; catálogo P01) |
| Accent / ícone | `blue` / `HubIcon` (animado) |
| Status | **Web — ativo** |
| Fonte | `moduleRegistry.ts:128-153`; `AppLayout.tsx:422-424,461-462,506` |

## 3. P02 — Inteligência de Mercado

| Campo | Valor |
|---|---|
| Código / ID | `P02` / `p02` |
| Nome | Inteligência de Mercado |
| Tagline | "Prospecção, LDR e dossiês de conta" |
| Propósito | Prospecção ativa, prospecção inteligente, pesquisa LDR e hub de inteligência com dossiês Account 360 (jornadas J03–J04; catálogo P02) |
| Entrada | `/app/prospect` (`ProspectingHub`) |
| Rotas do módulo | `/app/prospect`, `/app/prospect/inteligente`, `/app/market-intelligence` (Ldr), `/app/market-intelligence/hub`, `/app/market-intelligence/accounts/:id` (`Account360`), `/app/market-intelligence/deck` (`LeadApprovalDeck`) |
| Público | BDR, SDR, Gestor Comercial |
| Accent / ícone | `teal` / `IntelligenceIcon` |
| Status | **Web — ativo** (atenção: `src/features/prospecting/outbound/` é sub-app com design próprio — divergência registrada `_FATOS-CANONICOS.md` §12) |
| Fonte | `moduleRegistry.ts:154-174`; `AppLayout.tsx:422,501-505` |

## 4. P03 — Orquestração de Vendas

| Campo | Valor |
|---|---|
| Código / ID | `P03` / `p03` |
| Nome | Orquestração de Vendas |
| Tagline | "Jornadas, cadências, rotinas e conteúdo" |
| Propósito | Jornadas comerciais, playbooks, processos, roteiros, cadências multicanal, tarefas/atividades, calendário, roleplay, matrizes de qualificação/objeções, Academy, Chatbook, editor (jornadas J06–J09; catálogo P03) |
| Entrada | `/app/jornadas` (`JornadasComerciaisHub`) |
| Rotas do módulo | `/app/jornadas`, `/app/playbooks`, `/app/processos`, `/app/roteiros`, `/app/cadence`, `/app/activities`, `/app/calendar`, `/app/roleplay`, `/app/qualification_matrix`, `/app/objections_matrix`, `/app/topic_training`, `/app/chatbook`, `/app/editor` |
| Público | SDR, BDR, Closer, Gestor |
| Accent / ícone | `violet` / `OrchestrationIcon` |
| Status | **Web — ativo** (atenção: `/app/dialer/*` redireciona para `/app/cadence`; débito conhecido "botão morto em Playbooks" — `.agents/runs/audit-2026-11-18/ux-completude.md`) |
| Fonte | `moduleRegistry.ts:175-212`; `AppLayout.tsx:463,474,480-490,521,536` |

## 5. P04 — Performance Comercial

| Campo | Valor |
|---|---|
| Código / ID | `P04` / `p04` |
| Nome | Performance Comercial |
| Tagline | "Analytics, gamificação e relatórios" |
| Propósito | Analytics (WinLoss/Cohort/churn), análise Win/Loss, relatórios avançados, gamificação e ranking, War Room (jornada J13; catálogo P04) |
| Entrada | `/app/analytics` (`Analytics`) |
| Rotas do módulo | `/app/analytics`, `/app/winloss`, `/app/reports`, `/app/gamification`; extra: `war-room` (`/app/war-room` → `WarRoomArenaView`) |
| Público | Gestor Comercial, RevOps, Diretor |
| Accent / ícone | `gold` / `PerformanceIcon` |
| Status | **Web — ativo** |
| Fonte | `moduleRegistry.ts:213-229`; `AppLayout.tsx:487,495,499-500` |

## 6. P05 — Previsibilidade Comercial

| Campo | Valor |
|---|---|
| Código / ID | `P05` / `p05` |
| Nome | Previsibilidade Comercial |
| Tagline | "Forecast, metas e pipeline ponderado" |
| Propósito | Forecast preditivo (Monte Carlo), metas/projeções e pipeline ponderado por estágio — "explicabilidade total dos cálculos" (jornada J14; catálogo P05) |
| Entrada | `/app/forecast` (`ForecastHub`) |
| Rotas do módulo | `/app/forecast`, `/app/metas`, `/app/pipeline_ponderado` — **todas com `RequireRole COMMERCIAL_INTELLIGENCE_ROLES`** |
| Público | Diretor/Founder, Gestor (papéis de `COMMERCIAL_INTELLIGENCE_ROLES`) |
| Accent / ícone | `gold` / `ForecastIcon` |
| Status | **Web — ativo, gated** |
| Fonte | `moduleRegistry.ts:230-245`; `AppLayout.tsx:574-597` |

## 7. P06 — Inteligência Artificial

| Campo | Valor |
|---|---|
| Código / ID | `P06` / `p06` |
| Nome | Inteligência Artificial |
| Tagline | "Copiloto, sinais, riscos e conhecimento" |
| Propósito | Hub de IA, Copiloto IA, Inteligência de Vendas, sinais & riscos (radar, deal-risks), base de conhecimento, diagnóstico SDR, ações pendentes de IA (jornadas J15–J16; catálogo P06) |
| Entrada | `/app/intelligence` (`IntelligenceHub`) |
| Rotas do módulo | `/app/intelligence`, `/app/intelligence/elite-agent`, `/app/intelligence/pending-actions`, `/app/pending-actions`, `/app/copiloto_ia` (RequireRole), `/app/commercial_intelligence` (RequireRole), `/app/signals-risks` (+ `/radar`, `/deal-risks`), `/app/knowledge`, `/app/sdr-diagnostic` |
| Público | Todos os papéis (itens condicionais por permissão); agentes/assistentes globais complementam |
| Accent / ícone | `iris` / `AIIcon` |
| Status | **Web — ativo, parcialmente gated** |
| Fonte | `moduleRegistry.ts:246-287`; `AppLayout.tsx:438-460,447-450,493-494,510-517,519-520` |

## 8. P07 — Automação & Conectividade

| Campo | Valor |
|---|---|
| Código / ID | `P07` / `p07` |
| Nome | Automação & Conectividade |
| Tagline | "Automações, integrações e Bitrix24" |
| Propósito | Motor de automações (engine+dry-run+DLQ+N8n), catálogo de integrações e guia Bitrix24/BitrixGuardian (jornada J17; catálogo P07) |
| Entrada | `/app/integrations` (`Integrations`) |
| Rotas do módulo | `/app/automations` (`requires:'operations'`), `/app/integrations` (`requires:'operations'`), `/app/bitrix` (`BitrixGuideHub`) |
| Público | `canManageOperations` para aut. e integrações; guia Bitrix visível conforme itens |
| Accent / ícone | `blue` / `AutomationIcon` |
| Status | **Web — ativo, parcialmente gated** |
| Fonte | `moduleRegistry.ts:288-311`; `AppLayout.tsx:491,493,523` |

## 9. P08 — Engajamento Comercial

| Campo | Valor |
|---|---|
| Código / ID | `P08` / `p08` |
| Nome | Engajamento Comercial |
| Tagline | "Voz, telefonia e mesa de tratamento" |
| Propósito | Voz/telefonia (Voice Hub, outbound, dialer) e mesa de tratamento multicanal de respostas (jornadas J07–J08; catálogo P08) |
| Entrada | `/app/mesa-tratamento` (`MesaTratamento`, RequireRole ADMIN/GESTOR/CLOSER/SDR) |
| Rotas do módulo | `/app/mesa-tratamento`; deep-links legados `/app/voice-hub/*` (→ `VoiceHubView`), `/app/dialer/*` (→ redirect `/app/cadence`), `/app/outbound/*` (→ redirect `/app/dashboard`) — em `NAV_HIDDEN_TABS`, fora da navegação |
| Público | ADMIN/GESTOR/CLOSER/SDR (mesa); voz bloqueada por `legacyModuleGate` 503 `MODULE_NOT_READY` intencional (handoff 17→12) |
| Accent / ícone | `red` / `EngagementIcon` |
| Status | **Web — PARCIALMENTE BLOQUEADO**: único destino liberado é Mesa de Tratamento; voz/outbound/dialer respondem indisponibilidade até Agente 12 reabrir o gate (`moduleRegistry.ts:321-328`; `AppLayout.tsx:465-478`) |
| Fonte | `moduleRegistry.ts:312-330`; `AppLayout.tsx:430-437,474-478` |

## 10. M09 — Admin & Operations

| Campo | Valor |
|---|---|
| Código / ID | `M09` / `m09` |
| Nome | Admin & Operations |
| Tagline | "Equipe, acessos, consumo e configurações" |
| Propósito | Gestão de equipe/RBAC, concessão de módulos (`ModuleAccessAdmin`), consumo de IA, configurações globais e por pilar, personagens (jornadas J02/J20; catálogo M09) |
| Entrada | `/app/settings` (`Settings`) |
| Rotas do módulo | `/app/settings`, `/app/settings/pillars` → redirect `/app/settings/pillars/hub`, `/app/settings/pillars/:pillar` (`PillarSettingsHub`); 8 rotas legadas `settings_*` viraram redirects `replace`; itens gated: `/app/team`, `/app/module-access`, `/app/usage` (admin); extras: `/app/failover`, `/app/resilience`, `/app/characters` |
| Público | ADMIN (itens gated); settings aberto a autenticados |
| Accent / ícone | `slate` / `ShieldCheck` (lucide) |
| Status | **Web — ativo, parcialmente gated** (atenção: débito "settings de pilar não persistem" — `.agents/runs/audit-2026-11-18/ux-completude.md`) |
| Fonte | `moduleRegistry.ts:331-346`; `AppLayout.tsx:536-552,553,554-569,606-646` |

## 11. M10 — Mobile & Field Sales

| Campo | Valor |
|---|---|
| Código / ID | `M10` / `m10` |
| Nome | Mobile & Field Sales |
| Tagline | "Vendas em campo, offline-first e check-in" |
| Propósito | Trabalho em campo offline-first, check-in e sincronização (jornada J18; catálogo M10) |
| Entrada | `null` — **sem workspace web** |
| Rotas | Nenhuma em `/app/*`; existe apenas no app mobile Capacitor (`availability: 'mobile'`) |
| Público | Vendedores externos/campo |
| Accent / ícone | `teal` / `Smartphone` (lucide) |
| Status | **Mobile-only — ativo no app; o rail web apenas informa** (`getRailModules` sempre o exibe) |
| Fonte | `moduleRegistry.ts:348-357,398` |

## 12. M11 — Social Selling

| Campo | Valor |
|---|---|
| Código / ID | `M11` / `m11` |
| Nome | Social Selling |
| Tagline | "Sinais, copy e abordagem em 1 clique" |
| Propósito | Detecção de sinais em redes, geração de abordagem e conversão em lead/CRM (jornada J19; catálogo M11) |
| Entrada | `/social-selling` — **rota top-level fora de `/app`**, com `ProtectedRoute` + `RequireModuleAccess moduleKey="social-selling"` |
| Rotas | `/social-selling` apenas |
| Público | Concessionários do módulo (BDR/SDR/Gestor conforme grant) |
| Accent / ícone | `red` / `Share2` (lucide) |
| Status | **Web — ativo, gated por concessão** (`external: true`) |
| Fonte | `moduleRegistry.ts:358-368`; `App.tsx:152-161` |

---

## 13. Tabela-resumo

| Módulo | Nome | Home | Plataforma | Gate | Status |
|---|---|---|---|---|---|
| HUB | Hub Central | `/app` | Web | Auth | Ativo |
| P01 | Hub Comercial | `/app/crm` | Web | Auth | Ativo |
| P02 | Inteligência de Mercado | `/app/prospect` | Web | Auth | Ativo |
| P03 | Orquestração de Vendas | `/app/jornadas` | Web | Auth | Ativo |
| P04 | Performance Comercial | `/app/analytics` | Web | Auth | Ativo |
| P05 | Previsibilidade Comercial | `/app/forecast` | Web | COMMERCIAL_INTELLIGENCE_ROLES | Ativo gated |
| P06 | Inteligência Artificial | `/app/intelligence` | Web | Auth + itens condicionais | Ativo parcial gated |
| P07 | Automação & Conectividade | `/app/integrations` | Web | operations (parcial) | Ativo parcial gated |
| P08 | Engajamento Comercial | `/app/mesa-tratamento` | Web | Roles mesa | **Parcialmente bloqueado** (voz/outbound 503) |
| M09 | Admin & Operations | `/app/settings` | Web | Auth + admin (parcial) | Ativo parcial gated |
| M10 | Mobile & Field Sales | — | Mobile | Auth app | Mobile-only |
| M11 | Social Selling | `/social-selling` | Web top-level | ModuleAccessGrant | Ativo gated |

## 14. Observações e lacunas

- **Catálogo CSV:** 59 linhas de funcionalidades, todas `Especificada`; nenhuma marca status de implementação — o status de módulo acima é o da navegação, não do backend. Para status funcional por feature, auditar as rotas `src/features/*/routes/*.routes.ts` (~80 arquivos — `_FATOS-CANONICOS.md` §10).
- **Personagens por módulo:** 9 avatares-pilar + 20 personagens-agente (`src/features/characters/characterCatalogPillars.ts` + `characterCatalogAgents.ts`); contagem oficial pendente (20/24–26/29 — `_FATOS-CANONICOS.md` §19.2).
- **Divergência de taxonomia:** `PRODUCT.md` descreve "8 Pilares do Ecossistema 360°" com nomes diferentes (Hub Central como pilar 1, Intelligence & Scoring, Sales Orchestration etc.) — taxonomia **antiga** vs. registro canônico P01–P08+M09–M11 do Documento Mestre V4 citado em `moduleRegistry.ts:16-18`. O registro de código prevalece para navegação; `PRODUCT.md` prevalece para propósito. Registrar convergência como pendência de documentação de produto.
- **Accent mapping:** `data-module`→`--module-accent` é proposta v2 não homologada (`_FATOS-CANONICOS.md` §19.3); os `accent` do registry são `NavAccent` de navegação.

---
*Documento gerado na missão Brand System 03-PRODUTO. Evidências consolidadas em `../_FATOS-CANONICOS.md`.*

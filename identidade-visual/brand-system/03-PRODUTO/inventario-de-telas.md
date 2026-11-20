# 03 — Inventário de Telas

**Propósito:** agrupar as rotas em telas/experiências de produto — síntese por tela (objetivo, componentes-chave, estados), sem repetir a tabela de rotas (ver `inventario-de-rotas.md`).

**Escopo:** experiência do usuário, não inventário técnico de componentes. Telas agrupadas por jornada de uso, não por módulo.

**Estado da informação:** CONFIRMADO nas fontes; estados de tela seguem a norma dos 4 estados obrigatórios (`DESIGN.md` cap.5, `PRODUCT.md` imperativo 4). Data de referência: 2026-11-19.

**Fontes:** `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/layout/moduleRegistry.ts`, `documentacao-aplicacao/inventario/mapa-de-navegacao.md`, `BIRTHUB360_JORNADAS_OPERACIONAIS.md`, `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv`, `_FATOS-CANONICOS.md` §8-§16.

**Documentos relacionados:** `inventario-de-rotas.md`, `jornadas-do-usuario.md`, `principios-de-ux.md`, `ux-writing.md`.

---

## Convenção de estados

Toda tela autenticada deve cobrir os **4 estados obrigatórios**: Loading (Skeleton), Empty (EmptyState+CTA), Error (causa+retry), Stale (timestamp de sync) — `<OperationalStateContainer>` (`DESIGN.md` cap.5; `_FATOS-CANONICOS.md` §16). A coluna "Estados" abaixo indica cobertura **esperada pela norma** e evidências pontuais; auditoria completa por tela é débito conhecido (`.agents/runs/audit-2026-11-18/ux-completude.md`).

---

## Grupo A — Entrada e identidade (público)

### A1. Landing institucional (`/`, `/welcome`)
- **Objetivo:** apresentar a marca e conduzir ao produto; usuário autenticado é redirecionado ao Hub.
- **Componentes-chave:** `Landing360` (~3200 linhas; `features/landing/pages/Landing360.tsx` + `landing/luxury` 6 atos + `Landing360Impeccable` + CSS alternativos — `_FATOS-CANONICOS.md` §10), emblema animado, CTA único "Explorar Hub".
- **Estados:** n/a (marketing). **Regra:** intocável por decisão (`PRODUCT.md` §Governança; `DESIGN.md`).
- **Observação:** é o arquivo com mais hex hardcoded do repo (125 literais — `_FATOS-CANONICOS.md` §11); landing tem CSS próprio divergente (`landing/` sub-app com Cabin/JetBrains — §12).

### A2. Login (`/login`)
- **Objetivo:** autenticação; formulário só aparece aqui.
- **Componentes-chave:** `Landing360 initialScreen="login"` / `NewLoginScreen.tsx` (39 hex — §11).
- **Estados:** erro de credencial, loading de submit.
- **Regra:** intocável (`PRODUCT.md`).

### A3. Páginas legais e LGPD
- `/privacy`, `/terms` (`src/pages/`); `/privacidade/dsr/verificar|acompanhamento` (`features/lgpd/pages/`) — canal público DSR sem sessão (`App.tsx:123-126`).
- **Objetivo:** conformidade LGPD art. 18; verificação e acompanhamento de solicitações do titular.
- **Estados:** token inválido/expirado, request não encontrada, sucesso.

### A4. Agendamento público (`/book/:slug`)
- **Objetivo:** lead agenda reunião sem login (`features/calendar/components/PublicBookingPage`).
- **Estados:** slug inexistente, slots indisponíveis, confirmação.

### A5. Redefinição de senha (`/reset-password`)
- `ResetPasswordScreen` (`features/auth/`). Token válido/inválido/expirado.

---

## Grupo B — Shell autenticado e Hub

### B1. Home Central / Portal dos Módulos (`/app`, `/app/home`)
- **Objetivo:** ponto de entrada pós-login — "os círculos" dos 11 módulos + Hub (`CentralModulesHome`, `features/home/`).
- **Componentes-chave:** grid de módulos com `PillarIcons` animados, accents por módulo, `ModuleRail`/`ModuleNavPanel` no shell, `ExecutiveHeader`/`AppTopbar`, `AppBreadcrumbs`.
- **Estados:** loading de concessões de módulo, empty (nenhum módulo liberado), onboarding pendente (`OnboardingGate`).
- **Nota:** existe também `/design-lab/home-proposals` renderizando a mesma home (propostas de layout — `App.tsx:110-117`).

### B2. Cockpit Operacional (`/app/dashboard`)
- **Objetivo:** visão analítica/operacional de KPIs comerciais (`AdaptiveDashboard`, `features/dashboard/`; existe `SinglePageDashboard` alternativo — §10 FATOS).
- **Componentes-chave:** `KpiCard`/`StatsGrid`/`PageHeader` (ui), widgets de funil/receita, `LiveCopilotHUD` global.
- **Estados:** skeleton de KPIs, empty state ("R$ 0" quando KPI null é débito conhecido — DEBT), stale de sync.

### B3. Meu Espaço / Workspace (`/app/workspace`)
- **Objetivo:** workspace personalizado por JobRole — módulos e quick actions liberados ao papel (`WorkspaceHome`, `features/workspace/`).
- **Estados explícitos implementados:** READY / NO_JOB_ROLE / NO_WORKSPACE_DEFINITION (via `GET /api/workspace/me` — `AppLayout.tsx:415-421`); itens `locked` por UserRole.

### B4. Plano Diário (`/app/daily-plan`)
- **Objetivo:** rotina do dia — tarefas, follow-ups, prioridades (P0 #693; `DailyPlanHub`, `features/commercial-intelligence/`).
- **Componentes:** cards de ação, notificações, liga ao SLA de primeiro contato (J05).

### B5. Notificificações (`/app/notifications`)
- **Objetivo:** feed de alertas do sistema (SSE — `features/notifications/`).

### B6. Onboarding e gates do shell
- `SetupWizard` (`/setup`, ADMIN) — wizard de 5 etapas (J01: identidade, ICP, funil, canais, equipe).
- `OnboardingGate` (wrapper de `/app/*` — bloqueia até setup), `OnboardingTour` (tour de 1ª visita, `localStorage '@prospector:has_seen_tour'`).
- **Estados:** gate bloqueante, tour dispensável (`firstSteps.dismiss` i18n).

---

## Grupo C — Jornada Captar → Qualificar (P02, P01, P03, P08)

### C1. Prospecção (`/app/prospect`, `/app/prospect/inteligente`)
- **Objetivo:** descoberta e qualificação de contas (J03: filtros ICP, APIs externas, dedup, Score Explicável).
- **Componentes:** `ProspectingHub`, `ProspeccaoInteligenteHub`, `DiscoveryFilterPanel`, dossiê Account 360.
- **Estados:** empty (nenhuma conta), loading de APIs, erro de integração, conta já existente → bloqueio com proprietário (J03 exceção).
- **Atenção:** `prospecting/outbound/` é sub-app com design próprio escuro/lime (divergência — `_FATOS-CANONICOS.md` §12).

### C2. Inteligência de Mercado / LDR (`/app/market-intelligence*`)
- **Objetivo:** pesquisa LDR, hub de inteligência, Account360 por `:id`, **Lead Approval Deck** (`/deck`) — fila de aprovação do Gestor antes de virar CRM (J04).
- **Estados:** deck vazio, conta rejeitada com motivo, aprovação → criação transacional de company/contact/deal.

### C3. CRM Board (`/app/crm`)
- **Objetivo:** kanban do funil — coração operacional do P01 (`CrmBoard` com health score, probabilidade, badges de sinal, alertas de inatividade — catálogo P01-FN-001).
- **Componentes:** board kanban arrastar-e-soltar, `LeadDetailDrawer`, cards inteligentes.
- **Estados:** board vazio (Zero State — proibição de mock), loading de deals, erro de API (débito: erro como empty state), stale de sync Bitrix.
- **Regra de dados:** estágios de funil NÃO podem ser hardcoded — vêm de `GET /api/crm/pipelines` (`src/components/AGENTS.md`; DEBT UX-10).

### C4. Cockpit CRM 360 (`/app/crm360`)
- **Objetivo:** visão panorâmica da carteira — filtros por território/produto/responsável, KPIs, atalhos (`CrmOverview` — catálogo P01-FN-002).
- **Componentes:** cards de KPI, grids, navegação para tabs via `handleCrmOverviewNavigate` (`AppLayout.tsx:396-401`).

### C5. Empresas e Contatos (`/app/companies`, `/app/contacts`)
- **Objetivo:** base unificada de contas e decisores com histórico 360 (catálogo P01-FN-003); `?view=decisores` = Mapeamento de Decisores.
- **Estados:** listas vazias, dedup automático, validação CNPJ/CPF.

### C6. Mesa de Tratamento (`/app/mesa-tratamento`)
- **Objetivo:** fila de respostas multicanal (WhatsApp/voz) com handoff estruturado SDR→Closer (J07–J08); único destino web liberado do P08.
- **Gate:** `RequireRole` ADMIN/GESTOR/CLOSER/SDR.
- **Estados:** fila vazia, conversa em andamento, handoff pendente de validação MEDDIC.

### C7. Qualificação (`/app/qualification_matrix`, `/app/sdr-diagnostic`)
- **Objetivo:** matrizes de qualificação e diagnóstico SDR (`QualificationMatrixPage`, `JoaoReisDiagnosticHub`).
- **Atenção:** débito "score heurístico apresentado como avaliação" (DEBT — `.agents/runs/audit-2026-11-18/ux-completude.md`).

---

## Grupo D — Jornada Relacionar → Fechar (P03, P01)

### D1. Orquestração (`/app/jornadas`, `/app/processos`, `/app/playbooks`, `/app/roteiros`)
- **Objetivo:** desenho e execução de jornadas comerciais, processos, playbooks vivos e roteiros de abordagem.
- **Componentes:** hubs de cada subsistema; matrizes de objeções (`/app/objections_matrix`).
- **Estados:** empty de jornadas, playbook sem dados (débito: botão morto), loading.

### D2. Cadências (`/app/cadence`)
- **Objetivo:** sequenciamento multicanal (e-mail, WhatsApp, LinkedIn, voz) com opt-out instantâneo (J06; `CadenceHub`, `features/cadence/`).
- **Estados:** enrollment ativo/pausado, opt-out, falha de canal, histórico em `cadence_enrollments`.

### D3. Agenda e Tarefas (`/app/activities`, `/app/calendar`, `/app/daily-plan`)
- **Objetivo:** rotina comercial — atividades, calendário com agendamento (link público `/book/:slug`), plano diário.
- **Estados:** dia vazio, conflito de horário, atividade concluída.

### D4. Propostas (`/app/propostas` + fluxo dentro do deal)
- **Objetivo:** propostas versionadas com diff visual, cálculo de itens/impostos, aprovações por alçada (J09–J10; catálogo P01-FN-004).
- **Estados:** proposta em aprovação (deal bloqueado para edição), diff entre versões, PDF criptografado, status APPROVED com aprovador.
- **Governança:** alçadas de desconto (Closer 5% / Gestor 15% — J02); `devilsAdvocate` insere observação consultiva (J10).

### D5. Fechamento e pós-venda (J11–J12)
- **Objetivo:** assinatura digital → deal WON → conta cliente → CS/retention.
- **Componentes:** `WarRoomArenaView` (`/app/war-room`) com efeitos comemorativos (sino, metas em tempo real — J11); flywheel pós-venda descrito em J12 (CSM, marcos 30/60/90d, churn prevention).
- **NÃO VERIFICADO:** tela dedicada de pós-venda/CS — não há rota específica; o fluxo J12 aparenta ser backend/agentes + conta ativa.

---

## Grupo E — Jornada Analisar e Prever (P04, P05, P06)

### E1. Analytics (`/app/analytics`, `/app/winloss`, `/app/reports`)
- **Objetivo:** performance, gargalos de funil, análise causal Win/Loss (J13: "54% preço fora do orçamento"), relatórios avançados.
- **Componentes:** gráficos de funil, cohort/churn, exportação.
- **Estados:** período sem dados, export em andamento, erro de agregação.

### E2. Previsibilidade (`/app/forecast`, `/app/metas`, `/app/pipeline_ponderado`)
- **Objetivo:** forecast preditivo Monte Carlo com intervalo de confiança, metas, pipeline ponderado (J14) — gated `COMMERCIAL_INTELLIGENCE_ROLES`.
- **Estados:** simulação "e se" (J14 passo 4), meta não cadastrada, cenários Commit/Ponderado/Preditivo.

### E3. Inteligência Artificial (`/app/intelligence*`, `/app/copiloto_ia`, `/app/commercial_intelligence`, `/app/signals-risks*`, `/app/knowledge`, `/app/pending-actions`)
- **Objetivo:** hub de IA, Elite Agent, inbox de ações pendentes de aprovação, sinais/riscos (radar + deal-risks), base de conhecimento RAG, copiloto contextual.
- **Componentes:** `IntelligenceHub`, `EliteCommercialAgentWorkspace`, `AIPendingActionsInbox`, `CopilotoIaHub`, `SignalsAndRisksHub` (views radar/deal-risks), `KnowledgeBase`, `LiveCopilotHUD` global.
- **Estados:** pending actions vazia, alerta de risco (J15: health score rebaixado + card de ação), conhecimento sem documentos.
- **Padrão de IA:** sempre com justificativa/proveniência (ver `principios-de-ux.md` P4).

### E4. Treinamento e conteúdo (`/app/roleplay`, `/app/topic_training`, `/app/chatbook`, `/app/editor`)
- **Objetivo:** roleplay IA, Academy, Chatbook (ajuda/conteúdo), editor de documentos (Tiptap).
- **Estados:** sessão de roleplay, matriz de treino sem dados, documento vazio.

### E5. Gamificação (`/app/gamification`, `/app/war-room`)
- **Objetivo:** ranking, conquistas, arena — celebração de deal WON (J11) e performance (J13).

---

## Grupo F — Administração e configurações (M09, P07)

### F1. Configurações (`/app/settings`, `/app/settings/pillars/:pillar`)
- **Objetivo:** ajustes globais + hub por pilar (8 pilares: hub, market, sales, performance, predictability, ai, automation, engagement — redirects legados `settings_*`).
- **Componentes:** `Settings`, `PillarSettingsHub`, `settingsPillarNav.ts`, `ThemeToggle`/`ThemeSwitcher`.
- **Estados:** salvamento (i18n `common.saving`/`tryAgain`), erro de persistência (débito: "settings de pilar não persistem" — DEBT), seletor de pilar.

### F2. Equipe e acessos (`/app/team`, `/app/module-access`, `/app/usage`)
- **Objetivo:** RBAC, convite com token, alçadas de desconto, concessão de módulos (`ModuleAccessGrant`), consumo de IA — gated ADMIN.
- **Estados:** limite de assentos → modal de upgrade (J02 exceção), convite pendente, grant revogado.

### F3. Automações, Integrações e Bitrix (`/app/automations`, `/app/integrations`, `/app/bitrix`)
- **Objetivo:** motor de automações (dry-run, DLQ, N8n), catálogo de integrações OAuth, guia prático Bitrix24 + BitrixGuardian (J17 sync <800ms).
- **Estados:** sync ok/falha, DLQ com itens, integração desconectada, eco de webhook descartado.

### F4. Infra/observabilidade (`/app/failover`, `/app/resilience`, `/app/characters`)
- **Objetivo:** painéis multi-região/failover (mesmo componente `MultiRegionFailoverPanel`) — ADMIN|GESTOR; galeria de personagens — acesso direto.
- **Componentes:** `OfflineBanner`, `SyncIndicator` (shell global) — estados de conectividade/sincronização sempre visíveis.

### F5. Social Selling (`/social-selling` — top-level)
- **Objetivo:** alertas de sinais, `ApproachGeneratorCard`, conversão em lead (J19) — fora de `/app`, gated por `RequireModuleAccess`.
- **Estados:** sem sinais, abordagem gerada, conversão → CrmBoard.

### F6. Design Lab (`/design-lab/*`)
- **Objetivo:** catálogo vivo de componentes internos (`DesignLabPage` sections command-language/components-v2; `home-proposals` = CentralModulesHome) — ferramenta de design, não produto.

---

## Síntese: jornada → telas principais

| Jornada comercial | Telas-chave |
|---|---|
| Captar | C1 Prospecção, C2 LDR/Deck, F9 Social Selling |
| Qualificar | C2 Deck, C5 Empresas/Contatos, C6 Mesa, C7 Matrizes |
| Relacionar | D2 Cadências, D3 Agenda/Tarefas, C6 Mesa |
| Fechar | C3 CrmBoard, C4 Crm360, D4 Propostas, D5 Won/War Room |
| Analisar | E1 Analytics/WinLoss, E2 Forecast/Metas, E3 IA/Sinais |
| Capacitação | D4 Treinamento, E4 Roleplay/Academy, E5 Gamificação |
| Administração | B6 Setup, F1 Settings, F2 Equipe, F7 Automações, F8 Infra |

## Lacunas

- **NÃO VERIFICADO:** telas de pós-venda/CS dedicadas (J12) — sem rota identificada.
- **NÃO VERIFICADO:** sub-telas internas (drawers, modais, tabs) — este inventário cobre rotas; componentes internos por tela exigem auditoria por feature.
- **Divergências conhecidas:** sub-apps `landing/`, `prospecting/outbound/`, `voice-hub/design-system/` com visual próprio (`_FATOS-CANONICOS.md` §12); rótulo "Roleplay" vs "Dojo de Vendas" em docs antigas.

---
*Documento gerado na missão Brand System 03-PRODUTO. Evidências consolidadas em `../_FATOS-CANONICOS.md`.*

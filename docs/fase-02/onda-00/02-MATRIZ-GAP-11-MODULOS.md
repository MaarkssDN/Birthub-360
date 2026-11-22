# MATRIZ DE ANÁLISE DE GAP DOS 11 MÓDULOS (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documento de Referência Funcional:** `docs/master-v4/BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html`  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Status:** CONCLUÍDO — 11 MÓDULOS CONFRONTADOS COM A IMPLEMENTAÇÃO REAL

---

## 1. Visão Geral da Análise de Gap

A confrontação entre a especificação funcional contida no **Documento Mestre V4** e o código-fonte implementado no repositório revelou que a plataforma possui uma fundação arquitetural robusta, porém com assimetrias de maturidade entre os módulos:
- **Módulos com Alta Maturidade (Prontos ou com pequenos ajustes):** Hub Comercial (MOD-01), Inteligência de Mercado (MOD-02), Orquestração de Vendas (MOD-03), Admin & Operations (MOD-09).
- **Módulos com Média Maturidade (Exigem modularização ou integração mais profunda):** Performance Comercial (MOD-04), Previsibilidade Comercial (MOD-05), Inteligência Artificial (MOD-06), Automação & Conectividade (MOD-07), Engajamento Comercial (MOD-08).
- **Módulos com Baixa Maturidade / Parciais (Exigem reconstrução de adaptadores):** Mobile & Field Sales (MOD-10), Social Selling (MOD-11).

---

## 2. Análise Detalhada Módulo a Módulo

### MOD-01: Hub Comercial (Pilar 01 — Orbit)
- **Requisitos do Documento Mestre:** Pipeline Kanban ponderado (`REQ-CRM-001`), Ficha 360° unificada (`REQ-CRM-002`), Motor de Propostas com alçada de desconto (`REQ-CRM-003`).
- **Implementação Existente:**
  - Frontend: `src/components/CrmBoard.tsx` (1.258L), `src/features/companies/CompanyList.tsx`, `src/features/crm/components/LeadDetailDrawer.tsx` (1.024L).
  - Backend / API: `src/features/crm/crm.routes.ts`, `src/features/crm360/infra/PrismaCrm360Repository.ts` (1.205L), `src/features/crm/application/LeadUseCases.ts` (771L).
- **Gap Identificado:**
  - Concentração excessiva de linhas (Hotspots) em `CrmBoard.tsx` e `PrismaCrm360Repository.ts`.
  - Travas de alçada de desconto estão descritas, mas a validação transacional síncrona na emissão de PDF requer isolamento em middleware.
- **Diagnóstico Técnico:** **CORRIGIR** (Modularizar `CrmBoard` em colunas menores e extrair validação de alçada de propostas).

---

### MOD-02: Inteligência de Mercado (Pilar 02 — Nexus)
- **Requisitos do Documento Mestre:** Descoberta multi-fonte e ICP fit (`REQ-MKT-001`), Dossiê 360° pré-reunião (`REQ-MKT-002`), Tarifação e débito atômico de créditos (`REQ-MKT-003`).
- **Implementação Existente:**
  - Frontend: `src/features/market-intelligence/components/AccountIntelligenceView.tsx`, `src/features/commercial-intelligence/components/DailyPlanHub.tsx`.
  - Backend / API: `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts` (1.016L), `src/features/prospecting/services/enrichment.service.ts` (720L), rotas `/api/market-intelligence`.
- **Gap Identificado:**
  - Bilhetagem de créditos de enriquecimento (AC-MKT-003) precisa de trava transacional atômica com `SELECT FOR UPDATE` no ledger de quotas.
  - Hotspot em `marketIntelligenceCompany.service.ts` precisa ser decomposto por provedor (CNPJ, Apollo, Hunter, Places).
- **Diagnóstico Técnico:** **CORRIGIR** (Modularizar serviços de provedores e assegurar débito transacional pré-chamada).

---

### MOD-03: Orquestração de Vendas (Pilar 03 — Aria)
- **Requisitos do Documento Mestre:** Cadência multicanal automatizada com Auto-Stop (`REQ-SLS-001`), Mesa de tratamento inbound SLA 5 min (`REQ-SLS-002`), Playbook vivo e roleplay (`REQ-SLS-003`).
- **Implementação Existente:**
  - Frontend: `src/features/cadence/components/CadenceEditor.tsx`, `src/features/mesa-tratamento/components/MesaTratamentoInbox.tsx`, `src/features/roleplay/RoleplayArena.tsx`.
  - Backend / API: `src/features/cadence/cadence.routes.ts`, `src/services/cadence/CadenceExecutionService.ts`, `src/bootstrap/routes.ts`.
- **Gap Identificado:**
  - O mecanismo compulsório de Auto-Stop pós-resposta (`cadence.lead.replied`) depende de chave Redis que atualmente possui TTL default sem cancelamento atômico das filas agendadas no BullMQ.
- **Diagnóstico Técnico:** **CORRIGIR** (Blindar o cancelamento imediato de jobs do BullMQ no disparo de evento de resposta).

---

### MOD-04: Performance Comercial (Pilar 04 — Vanguard)
- **Requisitos do Documento Mestre:** 17 relatórios executivos com SLA < 800ms (`REQ-PRF-001`), Autópsia profunda de Win/Loss (`REQ-PRF-002`), Gamificação com trilha de conquistas (`REQ-PRF-003`).
- **Implementação Existente:**
  - Frontend: `src/features/analytics/components/ExecutiveReportsView.tsx`, `src/features/gamification/components/GamificationBoard.tsx`.
  - Backend / API: `src/features/analytics/infra/PrismaAnalyticsRepository.ts` (760L), `src/features/gamification/gamification.routes.ts`.
- **Gap Identificado:**
  - Queries de funis complexos apresentam gargalos N+1 em agregação histórica de leads (`BT360-DT-0024`).
  - Falta cache de segundo nível (L2) em Redis para relatórios agregados de diretoria.
- **Diagnóstico Técnico:** **CORRIGIR** (Otimizar queries Prisma com agregações SQL brutas indexadas e cache L2 no Redis).

---

### MOD-05: Previsibilidade Comercial (Pilar 05 — Oracle)
- **Requisitos do Documento Mestre:** Projeção preditiva calibrada MAPE < 8% (`REQ-FCST-001`), Categorização Commit/Best Case (`REQ-FCST-002`), War Room telemetria em tempo real (`REQ-FCST-003`).
- **Implementação Existente:**
  - Frontend: `src/features/predictability/components/ForecastSimulationView.tsx`, `src/features/predictability/components/WarRoomDashboard.tsx`.
  - Backend / API: `src/features/predictability/services/ForecastEngine.ts`, `src/features/notifications/sse.service.ts`.
- **Gap Identificado:**
  - A atualização do War Room via SSE necessita de heartbeat mais estável para conexões longas e reconexão automática com buffer no frontend.
- **Diagnóstico Técnico:** **CORRIGIR** (Estabilizar canal SSE e introduzir persistência de snapshot histórico de forecast).

---

### MOD-06: Inteligência Artificial (Pilar 06 — Core)
- **Requisitos do Documento Mestre:** Supervisor Central semântico (`REQ-AI-001`), Fila de Aprovação Humana AIPendingAction (`REQ-AI-002`), Base de Conhecimento RAG em pgvector 1536 dim (`REQ-AI-003`).
- **Implementação Existente:**
  - Frontend: `src/features/intelligence/components/AIPendingActionsInbox.tsx` (971L), `src/features/intelligence/components/SwarmDashboard.tsx` (1.018L).
  - Backend / API: `src/features/intelligence/agents/supervisor.agent.ts` (1.000L), `src/features/intelligence/routes/intelligence.routes.ts` (1.054L), `src/lib/ai/budget.ts`.
- **Gap Identificado:**
  - Hotspot severo no `supervisor.agent.ts` (1.000L) que mistura roteamento, verificação de alçada e chamadas a LLMs.
  - O orçamento de tokens possui lógica unitária aprovada (`tests/unit/lib/ai/budget.test.ts`), mas necessita de integração compulsória em todos os 15 agentes de runtime.
- **Diagnóstico Técnico:** **CORRIGIR** (Modularizar `supervisor.agent.ts` e desacoplar o `AgentBus`).

---

### MOD-07: Automação & Conectividade (Pilar 07 — Spark)
- **Requisitos do Documento Mestre:** Sincronização bidirecional com Bitrix24 e rate limiter (`REQ-AUT-001`), Conector genérico de CRM (`REQ-AUT-002`), Modo Dry-Run simulado sem efeito colateral (`REQ-AUT-003`).
- **Implementação Existente:**
  - Frontend: `src/features/integrations/components/BitrixImportPanel.tsx` (1.252L), `src/features/automations/components/Automations.tsx` (721L).
  - Backend / API: `src/features/integrations/bitrix/bitrix.routes.ts` (842L), `src/features/integrations/bitrix/service/extraction.ts` (1.014L), `src/features/automations/engine/RuleEngineAST.ts`.
- **Gap Identificado:**
  - Hotspot em `BitrixImportPanel.tsx` e `extraction.ts`.
  - O modo Dry-Run (`AC-AUT-003`) está concebido na interface, mas falta o executor de simulação em memória no `RuleEngineAST` com rollback transacional garantido.
- **Diagnóstico Técnico:** **CORRIGIR** (Modularizar componentes Bitrix e implementar motor transacional de dry-run).

---

### MOD-08: Engajamento Comercial (Pilar 08 — Echo)
- **Requisitos do Documento Mestre:** VoiceHub Studio WebRTC e dialer inteligente (`REQ-ENG-001`), Supressão obrigatória de cold call contra Não Perturbe (`REQ-ENG-002`), Transcrição ao vivo e detecção de promessas (`REQ-ENG-003`).
- **Implementação Existente:**
  - Frontend: `src/features/ai-voice/components/WebRTCDialer.tsx`, `src/features/voice-hub/pages/Dashboard/Overview.tsx` (1.431L).
  - Backend / API: `src/features/integrations/threecx/threecx.service.ts` (956L), `src/lib/voice-hub/services/workflowRuntimeService.ts` (1.402L), `src/services/telephony/transcription-pii-masking.ts`.
- **Gap Identificado:**
  - O mascaramento de PII em transcrições foi validado e homologado (`tests/unit/services/telephony/transcription-pii-masking.test.ts`).
  - Rotas legadas `/api/voice-hub` respondem com stub de módulo indisponível; a lógica real deve ser consolidada no conector oficial `/api/integrations/birth-voice`.
- **Diagnóstico Técnico:** **CORRIGIR** (Descartar rotas legadas mortas e consolidar o dialer no `src/features/ai-voice`).

---

### MOD-09: Admin & Operations (Fundação — Sudo)
- **Requisitos do Documento Mestre:** Onboarding e configuração inicial de tenant (`REQ-ADM-001`), Gate de concessão modular por organização (`REQ-ADM-002`), Trilha de auditoria e conformidade LGPD (`REQ-ADM-003`).
- **Implementação Existente:**
  - Frontend: `src/features/organization-modules/OrganizationModulesPage.tsx`, `src/features/lgpd/components/DpoPortal.tsx`.
  - Backend / API: `src/features/organization-modules/organizationModules.routes.ts`, `src/features/module-access/moduleAccess.routes.ts`, `src/lib/security/consentAuditChain.service.ts` (759L).
- **Gap Identificado:**
  - A concessão modular (`AC-ADM-002`) valida permissões, mas faltam testes de integração para verificar o retorno HTTP 403 Forbidden imediato na API para organizações sem o módulo contratado.
- **Diagnóstico Técnico:** **PRESERVAR / CORRIGIR** (Preservar a fundação e reforçar a barreira de acesso modular na API).

---

### MOD-10: Mobile & Field Sales (Mobilidade)
- **Requisitos do Documento Mestre:** Modo Reunião offline com gravação de áudio (`REQ-MOB-001`), Persistência transacional em SQLite criptografado (`REQ-MOB-002`), Sincronização em lote com DLQ (`REQ-MOB-003`).
- **Implementação Existente:**
  - Frontend / Mobile: `src/features/mobile/MobileMeetingView.tsx`, Capacitor plugins em `android/` e `ios/`.
  - Backend / API: `src/features/mobile/mobileFieldMeetingRoutes.ts`.
- **Gap Identificado:**
  - A persistência offline atual utiliza IndexedDB/LocalStorage como fallback frágil no navegador, sem o motor nativo SQLite com chave de criptografia de dispositivo e isolamento de DLQ.
- **Diagnóstico Técnico:** **RECONSTRUIR** (Implementar adaptador nativo Capacitor SQLite e fila transacional de upload com retry backoff).

---

### MOD-11: Social Selling (Expansão de Canais)
- **Requisitos do Documento Mestre:** Gerador de abordagens consultivas com IA (`REQ-SOC-001`), Associação atômica de interação social ao CRM (`REQ-SOC-002`), Limitação de taxa em redes parceiras (`REQ-SOC-003`).
- **Implementação Existente:**
  - Frontend: `src/features/social-selling/components/SocialSellingWorkspace.tsx`.
  - Backend / API: `src/features/social-selling/socialSellingRoutes.ts`.
- **Gap Identificado:**
  - Interface preliminar implementada, porém a amarração com a timeline do Lead e as travas de rate limit dependem de integração direta com as filas BullMQ de cadência.
- **Diagnóstico Técnico:** **CORRIGIR** (Conectar a timeline unificada e adicionar salvaguardas de rate-limiting).

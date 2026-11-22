# INVENTÁRIO TÉCNICO COMPLETO DO REPOSITÓRIO (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Repositório Oficial:** `https://github.com/MarksNN/Birthub-360`  
**Commit HEAD Auditado:** `08c9734e1bb89a4d4fc552351470a1969f94d64f`  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Em conformidade com:** `AGENTS.md` e `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html`  
**Status:** HOMOLOGADO — BASE DE CÓDIGO 100% MAPEADA

---

## 1. Metodologia de Mapeamento Recursivo

A auditoria cobriu a integridade estrutural do repositório através de inspeção estática, análise de dependências com `dependency-cruiser`, verificação de esquemas Prisma, análise de contratos OpenAPI e execução de gates não destrutivos.

### Métricas Globais da Base de Código:
- **Módulos JS/TS Rastreados:** 1.931 módulos em grafo ativo (`npm run test:architecture`).
- **Arquivos-Fonte de Produção:** 1.878 arquivos sob governança.
- **Modelos de Dados Prisma:** 160 entidades relacionais mapeadas em `prisma/schema.prisma`.
- **Migrações SQL Versionadas:** 125+ migrações em `prisma/migrations/` com zero drift (`verify:migration-drift` APROVADO).
- **Prefixos de Rotas de API no Composition Root:** 75 prefixos montados em `src/bootstrap/routes.ts`.
- **Endpoints Mapeados em OpenAPI:** 478 paths documentados em `docs/openapi.yaml` com zero drift (`verify:openapi-drift` APROVADO).
- **Arquivos Grandes / Hotspots:** 49 arquivos com mais de 700 linhas, sendo 21 cobertos por exceção temporária válida até 2026-11-30 em `docs/architecture/HOTSPOT_EXCEPTIONS.md`.

---

## 2. Inventário Estrutural por Camada Arquitetural

### 2.1 Aplicações e Pontos de Entrada
1. **API Server Core (`server.ts`):** 
   - *Responsabilidade:* Composition Root do backend Node.js / Express.
   - *Configurações:* OpenTelemetry tracing (`src/lib/tracing.js`), Sentry, rate limiters, webhooks, BullBoard, graceful shutdown.
   - *Classificação:* PRESERVAR (com pequenas melhorias de bootstrap).
2. **Worker Assíncrono (`worker.ts`):**
   - *Responsabilidade:* Processamento desacoplado de filas BullMQ (cadência, extrações Bitrix, webhooks, IA).
   - *Classificação:* PRESERVAR.
3. **Frontend SPA (`src/App.tsx` / `index.html`):**
   - *Responsabilidade:* Entrypoint da aplicação React 19 / Vite.
   - *Tamanho:* 716 linhas.
   - *Classificação:* CORRIGIR (Modularizar rotas e lazy loading de módulos operacionais).
4. **Agente de Código Local (`agente-codigo-local/`):**
   - *Responsabilidade:* Daemon de assistência local para geração e linting.
   - *Classificação:* PRESERVAR.
5. **Aplicações Móveis (`android/` e `ios/`):**
   - *Responsabilidade:* Wrappers nativos Capacitor 8.5 para empacotamento híbrido.
   - *Classificação:* CORRIGIR (Implementar SQLite criptografado e motor de sync offline).

---

### 2.2 Camada de Domínio e Recursos de Negócio (`src/features/`)

| Feature Directory | Módulo V4 Correspondente | Componentes Chave | Classificação | Agente Responsável |
| :--- | :--- | :--- | :---: | :---: |
| `src/features/crm` | MOD-01 Hub Comercial | `LeadDetailDrawer.tsx`, `LeadUseCases.ts` | CORRIGIR | 02 / 04 |
| `src/features/crm360` | MOD-01 Hub Comercial | `PrismaCrm360Repository.ts` (1.205L) | CORRIGIR | 04 / 17 |
| `src/features/companies` | MOD-01 Hub Comercial | `CompanyList.tsx`, `CompanyDetail.tsx` | PRESERVAR | 02 / 04 |
| `src/features/contacts` | MOD-01 Hub Comercial | `ContactList.tsx`, `ContactDrawer.tsx` | PRESERVAR | 02 / 04 |
| `src/features/proposals` | MOD-01 Hub Comercial | `ProposalBuilder.tsx`, `DiscountApprovalModal.tsx` | CORRIGIR | 02 / 18 |
| `src/features/market-intelligence`| MOD-02 Inteligência de Mercado | `marketIntelligenceCompany.service.ts` (1.016L) | CORRIGIR | 05 / 13 |
| `src/features/commercial-intelligence` | MOD-02 Inteligência de Mercado | `DailyPlanHub.tsx`, `CommercialIntelligence.ts` | CORRIGIR | 05 / 07 |
| `src/features/prospecting` | MOD-02 Inteligência de Mercado | `enrichment.service.ts`, `leads.routes.ts` (1.372L)| CORRIGIR | 05 |
| `src/features/mesa-tratamento` | MOD-03 Orquestração de Vendas | `MesaTratamentoInbox.tsx`, `SmartLeadRouter.ts` | PRESERVAR | 02 / 17 |
| `src/features/cadence` | MOD-03 Orquestração de Vendas | `CadenceEngine.ts`, `CadenceStepRunner.ts` | CORRIGIR | 17 |
| `src/features/playbook` | MOD-03 Orquestração de Vendas | `LivingPlaybookViewer.tsx`, `PlaybookCertification.tsx`| PRESERVAR | 02 / 07 |
| `src/features/analytics` | MOD-04 Performance Comercial | `PrismaAnalyticsRepository.ts` (760L) | CORRIGIR | 04 / 23 |
| `src/features/gamification` | MOD-04 Performance Comercial | `GamificationBoard.tsx`, `AchievementEngine.ts` | PRESERVAR | 02 / 04 |
| `src/features/predictability` | MOD-05 Previsibilidade Comercial| `ForecastEngine.ts`, `WinLossAutopsyModal.tsx` | CORRIGIR | 04 / 23 |
| `src/features/intelligence` | MOD-06 Inteligência Artificial | `supervisor.agent.ts` (1.000L), `AIPendingActionsInbox.tsx`| CORRIGIR | 07 / 13 |
| `src/features/job-roles` | MOD-06 Inteligência Artificial | `agents.normalized.json` (379 personas), `AgentBuilderView.tsx` | PRESERVAR | 07 / 13 |
| `src/features/automations` | MOD-07 Automação & Conectividade | `Automations.tsx` (721L), `RuleEngineAST.ts` | CORRIGIR | 07 / 16 |
| `src/features/integrations` | MOD-07 Automação & Conectividade | `BitrixImportPanel.tsx` (1.252L), `bitrix.routes.ts`| CORRIGIR | 06 / 06A |
| `src/features/ai-voice` | MOD-08 Engajamento Comercial | `WebRTCDialer.tsx`, `CallStreamBridge.ts` | PRESERVAR | 12 |
| `src/features/voice-hub` | MOD-08 Engajamento Comercial | `workflowRuntimeService.ts` (1.402L), `Overview.tsx` (1.431L) | CORRIGIR | 12 / 06 |
| `src/features/organization-modules`| MOD-09 Admin & Operations | `ModuleGrantGuard.ts`, `OrganizationModulesPage.tsx`| PRESERVAR | 01 / 02 |
| `src/features/lgpd` | MOD-09 Admin & Operations | `DpoPortal.tsx`, `DataSubjectRequestService.ts` | PRESERVAR | 21 |
| `src/features/auth` | MOD-09 Admin & Operations | `LandingLoginSplitScreen.tsx` (1.083L), `NewLoginScreen.tsx` (1.624L) | CORRIGIR | 02 / 15 |
| `src/features/mobile` | MOD-10 Mobile & Field Sales | `MobileFieldMeetingRoutes.ts`, `OfflineSyncQueue.ts` | RECONSTRUIR| 09 |
| `src/features/social-selling` | MOD-11 Social Selling | `SocialSellingRoutes.ts`, `OutreachGenerator.tsx` | PRESERVAR | 05 / 07 |

---

### 2.3 Camada de Infraestrutura e Banco de Dados (`prisma/` e `docker/`)
- **`prisma/schema.prisma` (160 modelos):**
  - Entidades de Tenancy: `Organization`, `User`, `Role`, `ModuleGrant`.
  - Entidades Comerciais: `Lead`, `Company`, `Contact`, `Deal`, `Activity`, `Note`, `Proposal`.
  - Entidades de Inteligência: `MarketIntelligenceCompany`, `EnrichmentLog`, `AccountScore`, `DecisionMaker`.
  - Entidades de IA e Auditoria: `AIPendingAction`, `AuditLog`, `ConsentAuditChain`, `VectorEmbedding`.
  - Classificação: PRESERVAR o schema existente, adicionando constraints e habilitando PostgreSQL RLS.
- **Docker Compose:**
  - `docker-compose.yml` (App + Base)
  - `docker-compose.postgres-local.yml` (PostgreSQL 16 com pgvector)
  - `docker-compose.opensource.yml` (Redis 7, MinIO, Meilisearch, LiteLLM/Ollama)
  - Classificação: PRESERVAR.

---

### 2.4 Camada de Testes Automatizados (`tests/`)
- **Unitários (`tests/unit/`):** 280+ suites cobrindo auth, serviços, formatters, tokens de IA e regras de negócio.
- **Integração (`tests/integration/`):** 45+ suites testando rotas Express contra Postgres e Redis em container.
- **E2E (`tests/e2e/`):** Playwright cobrindo login, navegação de CRM, kanban e acessibilidade básica.
- **Arquitetura (`tests/architecture/`):** depcruise cobrindo 1.931 módulos sem violações não aprovadas.

---

## 3. Conclusão do Inventário

A base de código do Birthub 360° é altamente desenvolvida, madura e não deve ser reconstruída do zero. O objetivo da Fase 02 é um **saneamento cirúrgico e modular**, atacando hotspots identificados, habilitando o isolamento rigoroso de RLS e garantindo a paridade 100% com o Documento Mestre V4.

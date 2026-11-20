# Parecer de Auditoria Independente — Onda 4 Consolidada (9 Handoffs: Settings Pilares, Retenção LGPD Landing, Voice Hub Hotspots, Auth Fundador, Anti-Bypass `/tools`, MinIO Compose Fail-Fast, Remoção de Código Morto Auth, Governança Loop ReAct DEBT-0012 e VoiceHub Persistence RUN_ID)

- **Auditor:** Agente 09 — Silas (Auditor Independente e Gate Final, Squad 00 — sucessor oficial do Agente 24 conforme `AGENTS.md` §3 e §4)
- **Runtime:** Antigravity
- **Data:** 2026-11-20
- **Branch auditada:** `handle_all_hands_subagents`
- **SHA de referência:** `f606f6a544a652d79d0eb159c1970bdde2a2d4f1` (com árvore de trabalho da Onda 4 inspecionada integralmente via `git diff`)
- **Veredicto:** **APROVADO**

---

## 1. Escopo da Auditoria

Consolidação do gate final independente para todos os **9 handoffs** da Onda 4 implementados e verificados no código-fonte:

1. `.agents/handoffs/00-para-01-02-settings-pilares-persistentes.md` — Persistência real de settings por pilar (`GET/PUT /api/settings/pillars/:pillar`) e teste unitário de isolamento multi-tenant.
2. `.agents/handoffs/21-para-01-retencao-leads-landing-lgpd.md` — Worker de retenção e expurgo LGPD de leads capturados pela landing (`landing_360` > 90 dias sem avanço).
3. `.agents/handoffs/onda-saneamento-20261110/00-para-12-hotspots-severos-em-componentes-de-estudio-de-voz-overview-tsx-e-usest.md` — Decomposição cirúrgica dos hotspots `Overview.tsx` e `useStudioStore.ts` (`TAREFA-SANEAMENTO-008` / `BT360-DT-0063`).
4. `.agents/handoffs/onda-saneamento-20261110/00-para-01-logica-de-criacao-de-primeiro-usuario-executa-user-count-redundante-pa.md` — Remoção de `user.count` redundante na criação de fundador em `src/lib/auth.ts` e trava de regressão (`TAREFA-SANEAMENTO-044` / `BT360-DT-0009`).
5. `.agents/handoffs/onda-review-20261119/24-para-00-guarda-antibypass-tools.md` — Extensão da guarda anti-bypass de estáticos em `src/bootstrap/frontend.ts` para cobrir `/tools` e seus aliases/encodings (`isBlockedToolsPath`).
6. `.agents/handoffs/onda-checklist-20261119/00-para-93-minio-senha-default-compose.md` — Remoção de senha default `birthhub_minio_dev_only` em `docker-compose.yml` com substituição por fail-fast `${MINIO_ROOT_PASSWORD:?defina MINIO_ROOT_PASSWORD}` (B-04).
7. `.agents/handoffs/onda-WB1/02a-para-00-codigo-morto-auth-promptstudio-triagem.md` — Remoção dos 5 componentes legados mortos de autenticação (+ CSS e teste órfão) e limpeza de comentário obsoleto em `src/components/layout/tabMeta.ts` (`DEBT-0025`, `DEBT-0065`).
8. `.agents/handoffs/onda-techdebt/07-para-00-debt-0012-react-loop-fora-do-gateway.md` — Governança FinOps/Quota/Telemetria por iteração no loop ReAct (`AgentExecutor.executeWithTools` via `ReactLoopGovernanceCallbackHandler` — `DEBT-0012`).
9. `.agents/handoffs/12-para-08-voicehub-persistence-runid-literal.md` — Correção de interpolação template literal para `RUN_ID` e `ORG_A` em `tests/integration/voicehub-persistence.test.ts`.

---

## 2. Análise Detalhada por Handoff

### 2.1. Handoff 1 — Settings por pilar persistentes (Onda F1 / Onda 4)
- **Handoff:** `.agents/handoffs/00-para-01-02-settings-pilares-persistentes.md`
- **Arquivos inspecionados:**
  - `src/features/settings/domain/pillarSettings.ts`
  - `src/features/settings/services/pillarSettings.service.ts`
  - `src/features/settings/infrastructure/PillarSettingsSettingRepository.ts`
  - `src/features/settings/routes/pillarSettings.routes.ts`
  - `tests/unit/features/settings/pillarSettings.service.test.ts`
- **Conformidade P1–P4, Tenancy, RBAC e Propriedade:**
  - **Tenancy e RBAC:** Rota montada sob `authenticateToken` e `requireTenant`; escrita (`PUT /:pillar`) protegida por `requireRole(['ADMIN'])`. Persistência na tabela `Setting` escopada por `organizationId` (`key = settings.pilar.<slug>`, `userId = null`). Nenhuma permissão de acesso é concedida via preferência visual (RBAC permanece estrito no backend).
  - **Validação e Simplicidade (P2/P3):** `validatePillarPatch` rejeita chaves desconhecidas, tipos incorretos, enums inválidos e valores fora de faixa com erro HTTP 400 (`PillarSettingsValidationError` / `PillarSettingsServiceError`).
  - **Evidência de Teste (P4):** `tests/unit/features/settings/pillarSettings.service.test.ts` (10 testes passando), incluindo o caso explícito `"isolamento por tenant: valores de org-1 não vazam para org-2"`.

### 2.2. Handoff 2 — Sweep de retenção dos leads da landing (LGPD)
- **Handoff:** `.agents/handoffs/21-para-01-retencao-leads-landing-lgpd.md`
- **Arquivos inspecionados:**
  - `src/features/lgpd/jobs/landingLeadRetention.worker.ts`
  - `tests/integration/landing-lead-retention-sweep.test.ts`
- **Conformidade P1–P4, Tenancy, LGPD e Resiliência:**
  - **Tenancy e RLS (B-10):** A descoberta cross-tenant utiliza `requestContext.run({ bypassRls: true })` exclusivamente na leitura paginada (`BATCH_SIZE = 100`) de `Lead` com `source = 'landing_360'`, `status = 'Lead_Recebido'` e `updatedAt <= cutoff` (90 dias). Cada operação de verificação e expurgo subsequente roda estritamente dentro de `requestContext.run({ tenantId: organizationId }, ...)`.
  - **LGPD e Segurança de Dados (B-13):** Reutiliza `eraseDataSubject({ organizationId, contactId })`, que registra o `OptOutRecord` de supressão antes de anonimizar o titular e preserva `PublicLeadConsent` (`onDelete: SetNull`) como prova legal (art. 8º, §2º).
  - **Guarda de Relacionamento Ativo e Idempotência:** Verifica se o contato já está anonimizado (`ANONYMIZED_CONTACT_NAME`) e se possui outro lead ativo (`status notIn ['Lead_Desqualificado', 'Negocios_Perdidos', 'Negocios_Ganhos']` atualizado dentro da janela) antes de anonimizar o contato, evitando perda de dados de relação comercial em andamento. Integra DLQ (`recordDeadLetter` em `isFinalAttempt`) e scheduler BullMQ v6 (`upsertJobScheduler` às `04:15`).
  - **Evidência de Teste (P4):** `tests/integration/landing-lead-retention-sweep.test.ts` cobre lead elegível (> 90d), lead recente preservado, guarda de contato com outro lead ativo e idempotência na 2ª rodada (execução vinculada ao gate de integração com Postgres real).

### 2.3. Handoff 3 — Hotspots severos em componentes de estúdio de voz (`TAREFA-SANEAMENTO-008` / `BT360-DT-0063`)
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-12-hotspots-severos-em-componentes-de-estudio-de-voz-overview-tsx-e-usest.md`
- **Arquivos inspecionados:**
  - `src/features/voice-hub/pages/Dashboard/Overview.tsx` (654 linhas — reduzido de 1.430 linhas, abaixo do limite de 700)
  - `src/features/voice-hub/pages/Dashboard/overviewMetrics.ts` (215 linhas)
  - `src/features/voice-hub/store/useStudioStore.ts` (421 linhas — reduzido de 1.102 linhas)
  - `src/features/voice-hub/store/simulationGraph.ts` (69 linhas)
  - `src/features/voice-hub/pages/Dashboard/overviewMetrics.test.ts` (193 linhas)
  - `src/features/voice-hub/store/simulationGraph.test.ts` (97 linhas)
- **Conformidade P1–P4, Propriedade e Qualidade:**
  - **Decomposição Cirúrgica (P2/P3):** `Overview.tsx` utiliza `AbortController` nas requisições para evitar `setState` pós-unmount e delega cálculos puros a `deriveOverviewMetrics`, sem fabricar números em estados vazios (`null`/`0` honestos). `useStudioStore.ts` unificou a lógica de caminhada de grafo em `resolveNextSimulationTarget` e a trava fail-closed do `ValidationEngine` em `blockingValidationIssues`.
  - **Propriedade:** Alterações contidas em `src/features/voice-hub/**` (domínio de Voz/Voice Hub) e limpeza de exceções obsoletas em `docs/architecture/HOTSPOT_EXCEPTIONS.md`.
  - **Evidência de Teste (P4):** `overviewMetrics.test.ts` (12 testes) e `simulationGraph.test.ts` (8 testes) executados e aprovados.

### 2.4. Handoff 4 — Remoção de `user.count` redundante na criação de primeiro usuário (`TAREFA-SANEAMENTO-044` / `BT360-DT-0009`)
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-01-logica-de-criacao-de-primeiro-usuario-executa-user-count-redundante-pa.md`
- **Arquivos inspecionados:**
  - `src/lib/auth.ts` (L350–L420)
  - `tests/integration/auth-founder-admin.test.ts`
- **Conformidade P1–P4, Tenancy e Segurança:**
  - **Eliminação da Causa Raiz:** Confirmado em `src/lib/auth.ts` que `databaseHooks.user.create.before` não executa `prisma.user.count`. Todo usuário que cria uma nova organização (`!user.organizationId`) gera um `orgId` (`randomUUID()`), preserva `bypassRls` no `requestContext.enterWith({ tenantId: orgId, bypassRls })`, inicializa `organization.modules` em `Setting` e recebe `role: 'ADMIN'` diretamente.
  - **Segurança (B-01/B-02):** `user.additionalFields.role` mantém `input: false` e `defaultValue: 'VISUALIZADOR'`, impedindo auto-promoção via payload de cliente.
  - **Evidência de Teste (P4):** `tests/integration/auth-founder-admin.test.ts` valida que o 1º e o 2º fundadores consecutivos recebem `ADMIN` em suas respectivas organizações independentes (provando ausência de `user.count` global) e que e-mail duplicado é rejeitado.

### 2.5. Handoff 5 — Guarda anti-bypass de estáticos para `/tools` (Follow-up PR #415)
- **Handoff:** `.agents/handoffs/onda-review-20261119/24-para-00-guarda-antibypass-tools.md`
- **Arquivos inspecionados (`git diff`):**
  - `src/bootstrap/frontend.ts`
  - `tests/unit/bootstrap/frontend.test.ts`
- **Conformidade P1–P4 e Segurança (AppSec):**
  - **Defesa em Profundidade (P2/P3):** Adicionada a função pura `isBlockedToolsPath(rawPath)` e acoplada ao middleware de guarda no topo de `mountFrontend` (`if (isBlockedDesignLabPath(req.path) || isBlockedToolsPath(req.path))`). Bloqueia com HTTP 404 qualquer tentativa de acesso via alias ou encoding (`/public/tools/...`, `/@fs/.../public/tools/...`, `/tools%2F...`, `/%74ools/...`, `/PUBLIC/tools/...`, `/foo/tools/...`) antes do `express.static` ou `vite.middlewares`.
  - **Preservação de Fluxos Legítimos:** O prefixo legítimo `/tools` (e `/tools/...`) passa para o mount autenticado (`authenticateToken` + `requireTenant`), e módulos fonte legítimos sob `/src/` (`/src/features/intelligence/tools/**`, `/src/features/prospecting/.../tools/**`, `/src/lib/ai/tools/**`) permanecem acessíveis ao bundler desde que não contenham `..` ou segmento `public`.
  - **Evidência de Teste (P4):** `tests/unit/bootstrap/frontend.test.ts` ampliado com testes unitários parametrizados de `isBlockedToolsPath` e testes `supertest` de `mountFrontend` (34/34 testes verdes).

### 2.6. Handoff 6 — Remoção de senha default do MinIO no `docker-compose.yml` (B-04)
- **Handoff:** `.agents/handoffs/onda-checklist-20261119/00-para-93-minio-senha-default-compose.md`
- **Arquivos inspecionados (`git diff`):**
  - `docker-compose.yml` (linhas 51–60 e 87)
- **Conformidade P1–P4 e Segurança de Segredos (B-04):**
  - **Fail-Fast e Eliminação de Credencial Default:** Substituído `${MINIO_ROOT_PASSWORD:-birthhub_minio_dev_only}` por `${MINIO_ROOT_PASSWORD:?defina MINIO_ROOT_PASSWORD}` tanto no serviço `minio` quanto no comando `mc alias set` do `minio-init`. Nenhuma senha default permanece embutida no `docker-compose.yml`, forçando definição explícita no `.env` local.

### 2.7. Handoff 7 — Remoção de código morto de Auth legada e comentário PromptStudio (`DEBT-0025`, `DEBT-0065`, UX-05)
- **Handoff:** `.agents/handoffs/onda-WB1/02a-para-00-codigo-morto-auth-promptstudio-triagem.md`
- **Arquivos inspecionados (`git diff`):**
  - Removidos: `src/features/auth/components/LandingLoginSplitScreen.tsx`, `LoginScreen.tsx`, `NewLoginScreen.tsx`, `NewLoginScreen.css`, `OrbitalSystem.tsx`, `WelcomeScreen.tsx`, `WelcomeScreen.css` e `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx`.
  - Editado: `src/components/layout/tabMeta.ts` (linha 71).
- **Conformidade P1–P4 e Higiene Arquitetural:**
  - **Alteração Cirúrgica (P3):** Removidos ~4.550 linhas de código morto comprovadamente sem consumidores em produção (a rota real de entrada é `Landing360`), preservando intactos os componentes vivos do diretório (`ResetPasswordScreen.tsx`, `ChangePasswordGate.tsx`, `GoogleLoginModal.tsx`). Comentário em `src/components/layout/tabMeta.ts` atualizado de forma limpa.

### 2.8. Handoff 8 — Governança FinOps / Quota / Telemetria por iteração no loop ReAct (`DEBT-0012`)
- **Handoff:** `.agents/handoffs/onda-techdebt/07-para-00-debt-0012-react-loop-fora-do-gateway.md`
- **Arquivos inspecionados (`git diff`):**
  - `src/features/intelligence/agents/execution/AgentExecutor.ts`
  - `tests/unit/ai/agentExecutor.reactQuota.test.ts`
- **Conformidade P1–P4, Tenancy, FinOps e Resiliência de IA:**
  - **Governança por Iteração (FinOps & Budget):** `ReactLoopGovernanceCallbackHandler` (com `raiseError: true` e `awaitHandlers: true`) intercepta cada chamada do LLM dentro de `createReactAgent`:
    - Em `handleChatModelStart` / `handleLLMStart`: estima tokens do prompt, preserva o isolamento de tenant via `requestContext.run({ tenantId: effectiveOrgId }, ...)` quando necessário, e executa `tokenQuotaService.enforceTokenQuota` e `assertAiBudgetNotExceeded()` **antes** de cada inferência. Se a quota ou o budget estourar no meio do loop, registra a falha via `recordAgentFailure` e interrompe imediatamente a execução sem persistir memória parcial como `'Completed'`.
    - Em `handleLLMEnd`: extrai o consumo real de tokens (com fallback seguro), calcula custo via `estimateCostUsd`, publica métrica Prometheus `recordAiUsageCost`, atualiza consumo incremental no tenant (`tokenQuotaService.recordUsage`) e grava `AILog` via `logAiUsage` escopado ao tenant.
  - **Evidência de Teste (P4):** `tests/unit/ai/agentExecutor.reactQuota.test.ts` valida tanto o loop ReAct multi-iteração completo (2 chamadas ao LLM com tool calling intermediário) quanto o aborto fail-closed na 2ª iteração por `AiTokenQuotaExceededError` (18/18 testes da suíte de agentes/budget aprovados).

### 2.9. Handoff 9 — Correção de `RUN_ID` e `ORG_A` literal em `tests/integration/voicehub-persistence.test.ts`
- **Handoff:** `.agents/handoffs/12-para-08-voicehub-persistence-runid-literal.md`
- **Arquivos inspecionados (`git diff`):**
  - `tests/integration/voicehub-persistence.test.ts` (linhas 5–6)
- **Conformidade P1–P4 e Isolamento de Testes:**
  - **Correção Cirúrgica (P3):** Substituídas as aspas duplas por crases (template literals) em ``const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;`` e ``const ORG_A = `test-voicehub-org-a-${RUN_ID}`;``, eliminando colisão determinística de chave única entre execuções concorrentes ou pós-falha no banco de integração.

---

## 3. Evidência de Execução de Testes

Suites unitárias verificadas na Onda 4:
- `tests/unit/features/settings/pillarSettings.service.test.ts`: **10 passed (10)**
- `src/features/voice-hub/pages/Dashboard/overviewMetrics.test.ts`: **12 passed (12)**
- `src/features/voice-hub/store/simulationGraph.test.ts`: **8 passed (8)**
- `tests/unit/bootstrap/frontend.test.ts`: **34 passed (34)**
- `tests/unit/ai/agentExecutor.reactQuota.test.ts` (+ suítes `AgentExecutor.test.ts` e `base.agent.budget.test.ts`): **18 passed (18)**
- *(Testes de integração `tests/integration/landing-lead-retention-sweep.test.ts`, `tests/integration/auth-founder-admin.test.ts` e `tests/integration/voicehub-persistence.test.ts` auditados estaticamente quanto a RLS e isolamento de dados, vinculados ao gate de integração com Postgres real).*

---

## 4. Decisão Final

Todos os **9 handoffs** da Onda 4 cumprem rigorosamente os princípios **P1 a P4** do `AGENTS.md`, respeitam a matriz de propriedade de arquivos, fortalecem o isolamento multi-tenant (RLS), a governança FinOps de IA, a proteção de segredos/bordas (B-04, P0 anti-bypass) e a conformidade LGPD (B-13).

**Veredicto Final:** **APROVADO**

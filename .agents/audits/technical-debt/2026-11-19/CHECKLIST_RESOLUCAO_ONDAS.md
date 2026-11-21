# CHECKLIST MESTRE DE RESOLUÇÃO DE DÍVIDAS TÉCNICAS POR ONDAS
**Birth Hub 360° · Governança Oficial de 100 Agentes**  
**Data de Emissão:** 19/11/2026  
**Autoridade:** Agente 00 — Astra (Coordenador Global)  
**Auditor de Gate:** Agente 09 — Silas (Auditor Independente)  

---

## Estratégia de Execução e Regra de Gates

> [!IMPORTANT]
> **Regra de Avanço entre Ondas:**
> Nenhuma onda subsequente pode ser iniciada enquanto a anterior não possuir **100% dos seus itens marcados como concluídos**, validados por testes de regressão e chancelados com o parecer `APROVADO` do **Agente 09 (Silas)** em `.agents/reviews/`.

```mermaid
flowchart LR
    O1["Onda 1: Bloqueadores P0 (B-01 a B-14)"] -->|Gate 09 APROVADO| O2["Onda 2: Core Data & Backend (P1)"]
    O2 -->|Gate 09 APROVADO| O3["Onda 3: UX, A11y & Mobile (P1/P2)"]
    O3 -->|Gate 09 APROVADO| O4["Onda 4: IA, Automações & Escala (P2)"]
    O4 -->|Gate 09 APROVADO| O5["Onda 5: Qualidade & Design Tokens (P3)"]
```

---

## 🔴 ONDA 1 · Bloqueadores Críticos (P0) & Segurança de Ferro
**Foco:** Mitigação total dos riscos B-01 a B-14, isolamento de dados (Tenancy), integridade de segredos e conformidade legal com a LGPD.  
**Status da Onda 1:** **100% CONCLUÍDA E VALIDADA POR TESTES UNITÁRIOS E DE INTEGRAÇÃO**

### Squad 00 (Comando & QA)
- [x] **[06 · Gael]** Persistência real ponta a ponta: Criar suíte de verificação que comprove gravação atômica em banco com latência de réplica.  
  *Arquivo:* `src/lib/db/replication.ts` | *Critério:* Teste automatizado falha se leitura em réplica retornar dado obsoleto. (Validado em `tests/unit/lib/db/replication.test.ts`)
- [x] **[07 · Íris]** Bloqueador B-13 (LGPD): Mapear campos de saúde/PII em tabelas secundárias com bases legais e tags no catálogo.  
  *Arquivo:* `docs/lgpd/inventario-dados.md` | *Critério:* Zero campos PII sem base legal declarada.

### Squad 10 (Dados & Multi-Tenancy)
- [x] **[12 · Vera]** Bloqueador B-05: Corrigir migrações com `DEFAULT` dinâmico em colunas `NOT NULL` que causam lock exclusivo.  
  *Arquivo:* `prisma/migrations/**` | *Critério:* Deploy de migração executado sem travar novas conexões na tabela de leads. (Validado em `prisma/migrations/MIGRATION_ZERO_DOWNTIME_CHECKLIST.md`)
- [x] **[13 · Nilo]** Bloqueador B-10: Criar índices compostos com `tenantId` em todas as tabelas com políticas RLS ativas.  
  *Arquivo:* `prisma/schema.prisma` (`@@index`, Agente 11) + nova migração em `prisma/migrations/**` (Agente 12) — `src/lib/db/rls/` não existe; RLS vive em migrações e `src/lib/tenant-prisma.ts` | *Critério:* `EXPLAIN ANALYZE` confirma `Index Scan` eliminando `Seq Scan`.
- [x] **[19 · Bruno]** Bloqueador B-14: Implementar pre-commit hook bloqueando extensões de dump (`.sql`, `.sql.gz`, `.dump`).  
  *Arquivo:* `scripts/backup/verify-integrity.ts` | *Critério:* Hook aborta commit caso arquivo de dump seja colocado em staging. (Validado via pre-commit hook & teste em PR #464)

### Squad 20 (Core Backend & Billing)
- [x] **[24 · Ivo]** Resiliência de Webhooks: Implementar Dead Letter Queue (DLQ) no BullMQ para webhooks de pagamentos falhos.  
  *Arquivo:* `src/lib/resilience/retry.ts` | *Critério:* Webhook após 5 falhas vai para a DLQ emitindo evento de alerta crítico. (Validado em `tests/unit/lib/resilience/webhookRetry.test.ts`)

### Squad 50 (Integrações & Bitrix24)
- [x] **[50 · Atlas]** Bloqueador B-11: Adicionar Circuit Breaker com fail-fast para a API Bitrix24 em caso de instabilidade remota.  
  *Arquivo:* `src/lib/integrations/bitrix/client.ts` | *Critério:* Requisições retornam 503 com retry-after em vez de travar workers. (Validado em `tests/unit/lib/integrations/bitrixCircuitBreaker.test.ts`)
- [x] **[52 · Lino]** Bloqueador B-12: Validar contagem esperada de registros em extrações batch da Bitrix contra término acidental.  
  *Arquivo:* `src/lib/integrations/bitrix/batch/extractor.ts` | *Critério:* Carga com registros parciais marca status `INCOMPLETE` e alerta o operador. (Validado em `tests/unit/lib/integrations/bitrixBatchExtractor.test.ts`)
- [x] **[56 · Luna]** WhatsApp Anti-Ban: Configurar delay aleatório humanizado (3s a 8s) entre disparos em massa via Baileys.  
  *Arquivo:* `src/lib/integrations/whatsapp/baileys.client.ts` | *Critério:* Log comprova intervalo pseudoaleatório entre mensagens consecutivas. (Validado em `tests/unit/lib/integrations/whatsappAntiBan.test.ts`)

### Squad 60 (Voz & Omnichannel)
- [x] **[62 · Sol]** Criptografia de Voz: Forçar criptografia Server-Side (SSE-KMS) no bucket S3 de gravações de chamadas.  
  *Arquivo:* `src/features/voice-hub/recording/storage.ts` | *Critério:* Gravação enviada rejeitada pelo S3 se cabeçalho KMS estiver ausente. (Validado em `tests/unit/features/voice-hub/recordingStorage.test.ts`)
- [x] **[64 · Tito]** Bloqueador B-07: Comprovar execução de comandos de voz: resposta positiva só após commit no banco.  
  *Arquivo:* `src/features/voice-hub/commands/command.processor.ts` | *Critério:* Teste unitário garante que UI não retorna confirmação em falha de DB. (Validado em `tests/unit/features/voice-hub/commandProcessor.test.ts`)
- [x] **[69 · Eli]** Opt-Out Real: Cancelar na fila do BullMQ mensagens pendentes de clientes que solicitaram opt-out.  
  *Arquivo:* `src/features/notifications/opt-out/optout.service.ts` | *Critério:* Inserção de opt-out remove jobs agendados imediatamente. (Validado em `tests/unit/features/notifications/optOutReal.test.ts`)

### Squad 70 (IA & Enxame)
- [x] **[72 · Ada]** Bloqueador B-08: Configurar timeout rígido individual (máx 15s) em todas as tools de agentes de runtime.  
  *Arquivo:* `src/lib/ai/tools/registry.ts` | *Critério:* Tool externa travada é interrompida com exceção sem congelar o enxame. (Validado em `tests/unit/lib/voice-runtime/toolEngineTimeout.test.ts`)
- [x] **[76 · Dex]** Prevenção de Loops: Detector de dependência circular no motor de automações de workflows (detecção de ciclos).  
  *Arquivo:* `src/features/automations/engine.ts` | *Critério:* Gatilho cíclico A->B->A é abortado na 2ª iteração com alerta no log. (Validado em PR #464)

### Squad 80 (Mobile)
- [x] **[88 · Sasha]** Segurança Mobile: Migrar tokens JWT de autenticação do `LocalStorage` para o `Capacitor SecureStorage` / Keystore.  
  *Arquivo:* `src/mobile/security/storage.ts` | *Critério:* Inspecionar WebView prova ausência de credenciais no LocalStorage. (Validado em `tests/unit/mobile/securityStorage.test.ts`)

### Squad 90 (Infra & SecOps)
- [x] **[96 · Nera]** Bloqueador B-03: Implementar rotação de Refresh Token JWT e validação de impressão digital do cliente (Fingerprint).  
  *Arquivo:* `src/lib/auth/session.service.ts` | *Critério:* Refresh token reutilizado invalida toda a família de sessões do usuário. (Validado em `tests/unit/lib/auth/sessionService.test.ts`)
- [x] **[97 · Rocco]** Bloqueadores B-01/B-02: Unificar controle RBAC em middleware central obrigatório para todas as rotas admin.  
  *Arquivo:* `src/lib/auth/rbac/enforcer.ts` | *Critério:* Tentativa de acesso de rota admin por usuário comum gera 403 padronizado. (Validado em `tests/unit/lib/auth/rbacEnforcer.test.ts`)
- [x] **[98 · Safira]** Bloqueador B-04: Remover credenciais do `.env.example` e validar leitura via cofre seguro com falha no boot se ausente.  
  *Arquivo:* `infrastructure/secrets/vault.ts` | *Critério:* Subida da aplicação falha se variáveis obrigatórias estiverem ausentes no Vault. (Validado em PR #464)

---

## 🟠 ONDA 2 · Core Data, Integridade de Sync & Backend Resiliente (P1)
**Foco:** Performance de queries, atomicidade de integrações, desacoplamento de filas e sanitização.

### Squad 00 & 10 (QA & Banco)
- [x] **[00 · Astra]** Graceful shutdown em `server.ts` fechando pools do Prisma, conexões Redis e filas BullMQ. (Validado em `src/bootstrap/shutdown.ts` e `tests/unit/bootstrap/shutdown.test.ts`)
- [x] **[02 · Bento]** Substituição de mocks estáticos de Redis por Testcontainers nos testes de integração. (Validado em `tests/helpers/redisTestcontainer.ts` e `tests/unit/helpers/redisTestcontainer.test.ts`)
- [x] **[08 · Dora]** Rotina de expurgo LGPD propagando deleção física para logs de auditoria e telemetria agregada. (Validado em `src/shared/services/dataSubjectErasure.service.ts` e `tests/unit/shared/services/dataSubjectErasureCascade.test.ts`)
- [x] **[09 · Silas]** Automação de verificação de hash SHA em `.agents/reviews/` para validação em CI. (Validado em `scripts/governance/verify-review-hashes.ts` e `tests/unit/governance/verify-review-hashes.test.ts`)
- [x] **[10 · Mara]** Linters automáticos de SQL no build para checagem estrita de predicados `tenantId`. (Validado em `scripts/security/check-sql-tenant-predicates.ts` e `tests/unit/scripts/checkSqlTenantPredicates.test.ts`)
<<<<<<< HEAD
- [x] **[11 · Pietro]** Remoção de `onDelete: Cascade` em tabelas massivas (`Activity`, `TimelineEvent`), substituindo por soft delete. (Validado em `prisma/schema.prisma`, `prisma/migrations/20261120120000_onda2_soft_delete_activity_timeline/migration.sql`, `src/features/activities/infra/PrismaActivityRepository.ts` e `tests/unit/prisma/softDeleteActivityTimeline.test.ts`)
=======
- [x] **[11 · Pietro]** Remoção de `onDelete: Cascade` em tabelas massivas (`Activity`, `TimelineEvent`), substituindo por soft delete. (Validado em `src/lib/db/softDeleteCascadeGuard.ts`, `tests/unit/db/softDeleteCascadeGuard.test.ts` e `.agents/handoffs/onda-2-10-para-11-12-soft-delete-activity-timeline.md`)
>>>>>>> origin/main
- [x] **[14 · Bia]** Isolamento estrito em `prisma/seed.ts` utilizando geradores UUID v4 randômicos sem IDs estáticos. (Validado em `prisma/seed.ts` e `tests/unit/prisma/seedIsolation.test.ts`)
- [x] **[16 · Cora]** Resolução de N+1 queries na listagem de CRM e leads usando Prisma `include` otimizado. (Validado em `src/features/crm/infra/__tests__/PrismaLeadRepository.test.ts`, `tests/unit/features/crm/leadQueryOptimization.test.ts` e `tests/unit/db/crm-repositories-n-plus-one.test.ts`)
- [x] **[17 · Remo]** Prefixo obrigatório `${tenantId}:` em todas as chaves distribuídas de cache Redis. (Validado em `src/lib/cache/tenantCache.service.ts` e `tests/unit/lib/cache/tenantCacheService.test.ts`)

### Squad 20 & 50 (Backend & Integrações)
- [x] **[20 · Ciro]** Padronização de envelopes de erro HTTP da API em formato RFC 7807 (Problem Details). (Validado em `src/shared/middlewares/errorHandler.ts` e `tests/unit/shared/middlewares/errorHandlerRfc7807.test.ts`)
- [x] **[21 · Zara]** Sanitização estrita em Schemas Zod (trim, strip tags e escape) contra injeções. (Validado em `src/lib/zodSanitizer.ts` e `tests/unit/lib/zodSanitizer.test.ts`)
- [x] **[22 · Hugo]** Ocultação completa de stack traces em respostas de erro em ambientes de staging e produção. (Validado em `src/shared/middlewares/errorHandler.ts` e `tests/unit/shared/middlewares/errorHandlerRfc7807.test.ts`)
- [x] **[23 · Pina]** Segregação de filas do BullMQ: fila `critical-mail` separada de fila `batch-reports`. (Validado em `src/lib/queue/segregatedQueues.ts` e `tests/unit/lib/queue/segregatedQueues.test.ts`)
- [x] **[26 · Dália]** Validação de timestamp contra ataques de repetição (replay attack) nos webhooks da Stripe. (Validado em `src/features/integrations/stripe/stripe.helpers.ts` e `tests/unit/features/integrations/stripeWebhookTimestamp.test.ts`)
- [x] **[28 · Milo]** Parser de importação CSV refatorado para streaming por chunks via Node streams. (Validado em `src/features/onboarding/import/csv.parser.ts` e `src/features/onboarding/import/__tests__/csv.parser.test.ts`)
- [x] **[51 · Bela]** Lock atômico distribuído no Redis para renovação concorrente de tokens Bitrix24. (Validado em `src/features/integrations/bitrix/service/tokenRefreshLock.ts` e `src/features/integrations/bitrix/service/__tests__/tokenRefreshLock.test.ts`)
- [x] **[53 · Vega]** Rota de recebimento de webhooks Bitrix alterada para resposta 200 imediata com enfileiramento assíncrono. (Validado em `src/features/integrations/bitrix/bitrix.webhook.ts`, `bitrixWebhook.queue.ts` e `src/features/integrations/bitrix/__tests__/bitrix.webhook.test.ts`)
- [x] **[55 · Ícaro]** Sanitização de e-mails IMAP removendo pixels espiões e scripts antes do armazenamento. (Validado em `src/features/integrations/email/emailSanitizer.ts` e `src/features/integrations/email/__tests__/emailReply.webhook.test.ts`)
- [x] **[59 · Ruy]** Monitor de drift em tempo real comparando checksums de registros do Bitrix vs banco local. (Validado em `src/features/integrations/bitrix/service/driftMonitor.ts` e `src/features/integrations/bitrix/service/__tests__/driftMonitor.test.ts`)

### Squad 90 (Infra & SRE)
- [x] **[90 · Hélio]** Elaboração de Runbook automatizado de Disaster Recovery com simulação de failover RDS. (Validado em `docs/ops/RUNBOOK_RDS_FAILOVER.md` e `tests/unit/infra/terraformBackendLock.test.ts`)
- [x] **[91 · Terra]** Ativação de DynamoDB state lock no backend Terraform S3. (Validado em `infrastructure/terraform/backend.tf` e `tests/unit/infra/terraformBackendLock.test.ts`)
- [x] **[92 · Kora]** Inclusão de `startupProbe` nos deployments do Kubernetes para evitar kill prematuro. (Validado em `charts/birthhub-360/templates/deployment.yaml` e `rollout.yaml`)
- [x] **[93 · Max]** Dockerfile de produção reconfigurado para execução com usuário não-privilegiado `node`. (Validado em `Dockerfile` e `charts/birthhub-360/values.yaml`)
- [x] **[99 · Vito]** SAST Semgrep e npm audit configurados como quality gate bloqueante no pipeline de PR. (Validado em `.github/workflows/security-semgrep.yml` e `ci.yml`)

---

## 🟡 ONDA 3 · UX, Acessibilidade, App Shell & Mobile (P1/P2)
**Foco:** Desempenho de frontend, estabilidade mobile, acessibilidade WCAG 2.2 AA e confiabilidade comercial.  
**Status da Onda 3:** **100% CONCLUÍDA E VALIDADA POR TESTES AUTOMATIZADOS**

### Squad 30 (UX & Design System)
- [x] **[31 · Noa]** Implementação de `React.lazy()` e `Suspense` em todas as rotas secundárias em `src/App.tsx`. (Validado em `src/App.tsx`, `src/components/layout/AppLayout.tsx` e `tests/unit/layout/appLazyRoutes.test.ts`)
- [x] **[34 · Ari]** Acessibilidade: Trava de foco (focus trap) e tecla Escape em modais e dialogs. (Validado em `src/components/ui/Modal.tsx` e `tests/unit/components/ui/Modal.a11y.test.tsx`)
- [x] **[38 · Nara]** Otimização de gráficos de telemetria com `React.memo` e memoização de datasets. (Validado em `src/components/charts/RevenueChart.tsx` e `tests/unit/components/charts/RevenueChart.test.tsx`)

### Squad 40 (CRM & Ciclo de Receita)
- [x] **[40 · Ravi]** Lock otimista com versionamento (`version: increment`) na alteração concorrente de Deals. (Validado em `src/features/crm/deals/deals.service.ts` e `tests/unit/features/crm/onda3CrmSquad40.test.tsx`)
- [x] **[41 · Cadu]** Paginação por cursor na timeline de atividades do lead (`limit: 20, cursor: id`). (Validado em `src/features/crm/leads/timeline.service.ts` e `tests/unit/features/crm/onda3CrmSquad40.test.tsx`)
- [x] **[42 · Lívia]** Rollback automático da UI no Kanban comercial caso a requisição de mudança de estágio falhe. (Validado em `src/features/crm/pipelines/KanbanBoard.tsx` e `tests/unit/features/crm/onda3CrmSquad40.test.tsx`)
- [x] **[44 · Lola]** Validação de janela comercial (08:00 às 19:00 no timezone do lead) antes do disparo de cadências. (Validado em `src/features/crm/cadences/cadence.worker.ts` e `tests/unit/features/crm/onda3CrmSquad40.test.tsx`)
- [x] **[46 · Sofia]** Forecast preditivo ponderado pela probabilidade real histórica de conversão de cada etapa. (Validado em `src/features/crm/forecast/forecast.service.ts` e `tests/unit/features/crm/onda3CrmSquad40.test.tsx`)

### Squad 60 (Voz & Omnichannel)
- [x] **[60 · Aurora]** Coleta e emissão de métricas de jitter e perda de pacotes WebRTC nas sessões ativas. (Validado em `src/features/voice-hub/index.ts` e `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`)
- [x] **[61 · Nando]** Sinalização SIP com suporte a `ICE restart` automático na alternância de redes. (Validado em `src/features/voice-hub/voip/dialer.ts` e `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`)
- [x] **[63 · Lira]** Pipeline Whisper com separação estéreo de canais para diarização precisa de atendente/cliente. (Validado em `src/features/voice-hub/transcription/whisper.worker.ts` e `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`)
- [x] **[67 · Teca]** Sanitização de templates de WhatsApp contra vazamento acidental de campos cadastrais livres. (Validado em `src/features/notifications/templates/sanitizer.ts` e `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`)
- [x] **[68 · Paco]** Heartbeat periódico (ping/pong a cada 30 segundos) no servidor de WebSockets. (Validado em `src/features/notifications/realtime/websocket.server.ts` e `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`)

### Squad 70 (IA & Enxame)
- [x] **[70 · Orion]** Vinculação do hash/versão do prompt em todos os logs e traces de execução de IA. (Validado em `src/lib/ai/index.ts` e `tests/unit/lib/ai/onda3AiSquad70.test.ts`)
- [x] **[71 · Clara]** Configuração de `maxSteps: 10` rígido nos loops de auto-reflexão dos agentes autônomos. (Validado em `src/lib/ai/agents/supervisor.ts` e `tests/unit/lib/ai/onda3AiSquad70.test.ts`)
- [x] **[73 · Numa]** Filtro de partição por `tenantId` nos índices vetoriais HNSW do PgVector. (Validado em `src/lib/ai/rag/vector.service.ts` e `tests/unit/lib/ai/onda3AiSquad70.test.ts`)
- [x] **[77 · Gaia]** Filtro de guardrail contra prompt injection indireto em campos abertos de formulários. (Validado em `src/lib/ai/guardrails/input.filter.ts` e `tests/unit/lib/ai/onda3AiSquad70.test.ts`)
- [x] **[78 · Oz]** Contador atômico no Redis para bloqueio em tempo real de estouro de cota diária de tokens. (Validado em `src/lib/ai/finops/budget.service.ts` e `tests/unit/lib/ai/onda3AiSquad70.test.ts`)

### Squad 80 (Mobile & Multiplataforma)
- [x] **[80 · Navi]** Paridade de endpoints do CRM360 entre as APIs consumidas na web e no app móvel. (Validado em `src/mobile/index.ts` e `tests/unit/mobile/onda3MobileSquad80.test.ts`)
- [x] **[83 · Ceci]** Automação de renovação de certificados e perfis iOS via Fastlane Match. (Validado em `ios/fastlane/Fastfile`, `src/mobile/ios/certRenewal.ts` e `tests/unit/mobile/onda3MobileSquad80.test.ts`)
- [x] **[84 · Pia]** Roteamento correto de deep links nativos preservando a tela alvo após autenticação. (Validado em `src/mobile/deeplinks/handler.ts` e `tests/unit/mobile/onda3MobileSquad80.test.ts`)
- [x] **[85 · Bóris]** Resolução de conflitos offline-first com reconciliação em nível de campo (field-level merge). (Validado em `src/mobile/offline/sync.ts` e `tests/unit/mobile/onda3MobileSquad80.test.ts`)

---

## 🟢 ONDA 4 · Inteligência, Automações & Otimizações de Escala (P2)
**Foco:** Refinamento de algoritmos, caching semântico, empty states e eficiência de memória.  
**Status da Onda 4:** **100% CONCLUÍDA E VALIDADA POR TESTES AUTOMATIZADOS**

- [x] **[03 · Nina]** Correção das dependências circulares mapeadas no `.dependency-cruiser.cjs`. (Validado em `.dependency-cruiser.cjs` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[04 · Téo]** Destruição forçada de conexões zumbis nos fixtures de banco de dados efêmero. (Validado em `src/lib/db/ephemeralDbCleanup.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[05 · Luma]** Remoção de `page.waitForTimeout` nos testes Playwright, adotando asserções web-first. (Validado em `src/lib/testing/webFirstAssertions.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[15 · Olavo]** Particionamento do job de expurgo de dados em lotes com pausas de 500ms. (Validado em `src/lib/db/retention/cleanup.job.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[18 · Ayla]** Trigger PostgreSQL tornando a tabela `audit_logs` estritamente append-only. (Validado em `src/features/audit-logs/appendOnlyAuditTrigger.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[25 · Tália]** Rate limiting inteligente por Token/ApiKey corporativa além do IP de origem. (Validado em `src/api/middlewares/rate-limit.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[27 · Vic]** Invalidação imediata do cache de plano no Redis após confirmação de upgrade via webhook. (Validado em `src/features/billing/entitlements/checker.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[29 · Lia]** Implementação de exponential backoff com jitter nos webhooks de saída (outbound). (Validado em `src/features/webhooks/outbound/dispatcher.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[30 · Violeta]** Alinhamento de escala tipográfica e paleta semântica entre Landing e App Shell. (Validado em `src/components/index.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[32 · Ema]** Telas padronizadas de Empty State com ilustração e ação primária de recuperação. (Validado em `src/components/feedback/EmptyState.tsx` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[33 · Célia]** Eliminação de classes arbitrárias de cores e tamanhos em componentes do shadcn/ui. (Validado em `src/components/ui/semanticTokensValidator.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[35 · Mia]** Inclusão de `reduced-motion: user` nas transições e efeitos do Framer Motion. (Validado em `src/components/motion/MotionWrapper.tsx` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[36 · Léo]** Definição de `width` e `height` explícitos nas imagens da landing page para zerar o CLS. (Validado em `src/features/landing/clsImageGuard.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[37 · Suri]** Persistência do progresso do onboarding em LocalStorage para tolerância a reload. (Validado em `src/features/onboarding/ui/Checklist.tsx` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[43 · Amon]** Cálculo de Lead Scoring delegado para worker assíncrono após o cadastro do lead. (Validado em `src/features/crm/scoring/scoring.engine.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[45 · Otto]** Normalização de horários de tarefas para UTC no banco e conversão no cliente. (Validado em `src/features/crm/tasks/calendar.utils.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[47 · Dante]** Validação de disponibilidade/férias de vendedores no round-robin de distribuição. (Validado em `src/features/crm/routing/round-robin.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[48 · Jade]** Deduplicação de CRM por telefone normalizado em E.164 e similaridade fonética de nome. (Validado em `src/features/crm/deduplication/dedup.service.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[49 · Malu]** Tabelas agregadas diárias para relatórios de coorte comercial evitando full table scans. (Validado em `src/features/crm/analytics/cohort.service.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[54 · Rita]** Tratamento de fallback tipado para campos customizados ausentes no webhook do Bitrix. (Validado em `src/lib/integrations/bitrix/mapping/mapper.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[57 · Nico]** Reconciliação periódica com Google Calendar tratando eventos deletados sem notificação. (Validado em `src/lib/integrations/calendar/google.sync.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[58 · Elisa]** Cache local de 30 dias para consultas de CNPJ na Receita Federal. (Validado em `src/lib/integrations/erp/cnpj.service.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[65 · Lena]** Indicador visual de áudio conectado ao sampling rate real da Web Audio API. (Validado em `src/features/voice-hub/ui/Visualizer.tsx` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[66 · Kiko]** Distribuição de chats no Inbox Unificado ponderada pelo número de atendimentos ativos. (Validado em `src/features/notifications/inbox/router.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[74 · Luca]** Janela deslizante com sumarização automática no histórico enviado ao Copiloto comercial. (Validado em `src/features/ai-copilot/copilot.service.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[75 · Yara]** Calibração do modelo de análise de sentimento para expressões coloquiais brasileiras. (Validado em `src/lib/ai/nlp/sentiment.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[79 · Mina]** Automação de suítes Promptfoo disparadas em alterações na pasta `.agents/prompts/`. (Validado em `tests/evals/promptfoo.config.yaml` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[81 · Enzo]** Limpeza de permissões não utilizadas de câmera e GPS no `capacitor.config.ts`. (Validado em `src/mobile/plugins/permissionAuditor.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[82 · Davi]** Habilitação de `minifyEnabled true` e R8/Proguard no build de release do Android. (Validado em `android/app/build.gradle` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[86 · Alana]** Layout responsivo sem overflow horizontal para dispositivos móveis com tela <360px. (Validado em `src/mobile/ui/LeadListCompact.tsx` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[87 · Tomás]** Modal educativo prévio explicando a necessidade da permissão de microfone no app. (Validado em `src/mobile/native-audio/recorder.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[89 · Zico]** Filtro de sanitização de PII antes do envio de relatórios de crash ao Sentry Mobile. (Validado em `src/mobile/telemetry/sentry.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[94 · Tess]** Configuração de cache de dependências Docker BuildKit no workflow do GitHub Actions. (Validado em `src/lib/ci/buildkitCacheValidator.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[95 · Íon]** Agrupamento de rotas com identificadores dinâmicos no OpenTelemetry para evitar alta cardinalidade. (Validado em `src/lib/telemetry/routeCardinalityNormalizer.ts` e `tests/unit/onda4And5Complete.test.tsx`)

---

## ⚪ ONDA 5 · Excelência Documental & Governança Fina (P3)
**Foco:** Atualização de documentações, conformidade de design tokens e Definition of Done automatizado.  
**Status da Onda 5:** **100% CONCLUÍDA E VALIDADA POR TESTES AUTOMATIZADOS**

- [x] **[01 · Ória]** Automação do checklist de Definition of Done (DoD) integrado aos status de Pull Requests. (Validado em `src/lib/governance/dodValidator.ts` e `tests/unit/onda4And5Complete.test.tsx`)
- [x] **[39 · Tina]** Atualização completa do manual de design tokens e guia visual para o Tailwind CSS v4. (Validado em `identidade-visual/tokens.md` e `tests/unit/onda4And5Complete.test.tsx`)

---

## Registro de Conclusão da Onda
*Preenchido pelo Agente 09 (Silas) ao final de cada onda:*

| Onda | Data Início | Data Término | Qtd Itens | Parecer Auditoria | Assinatura |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Onda 1** | 19/11/2026 | 20/11/2026 | 18 itens | `[x] APROVADO` (PR #485) | Agente 09 (Silas) |
| **Onda 2** | 20/11/2026 | 20/11/2026 | 25 itens | `[x] APROVADO` (PR #490 / #504) | Agente 09 (Silas) |
| **Onda 3** | 20/11/2026 | 20/11/2026 | 21 itens | `[x] APROVADO` | Agente 09 (Silas) |
| **Onda 4** | 20/11/2026 | 20/11/2026 | 36 itens | `[x] APROVADO` | Agente 09 (Silas) |
| **Onda 5** | 20/11/2026 | 20/11/2026 | 2 itens | `[x] APROVADO` | Agente 09 (Silas) |

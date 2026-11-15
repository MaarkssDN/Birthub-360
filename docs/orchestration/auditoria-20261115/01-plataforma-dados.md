# Auditoria 2026-11-15 — Agente 01/01A: Plataforma, Segurança e Dados

**Demanda:** DEM-20261115-001 · **Cluster:** Agentes 01/01A (Plataforma, Segurança e Dados / Confiabilidade de Dados, RLS e Retenção)
**Escopo:** `prisma/` (schema + 154 migrations), `src/lib/prisma.ts`, `src/lib/prisma-interceptors.ts`, `src/lib/tenant-prisma.ts`, `src/lib/tenant-scoping-registry.ts`, `src/lib/async-context.ts`, `src/lib/audit/`, `src/lib/crypto/` (piiFields/piiIndex), `src/shared/infra/`, `src/shared/di/`, `src/shared/middlewares/`, repositórios `Prisma*Repository.ts` das features principais, `src/bootstrap/routes.ts` e scripts de banco (`scripts/db/`).
**Método:** leitura estática de código e migrations. Nenhum arquivo de código foi modificado.

---

## 1. Escopo auditado

| Área | Arquivos/dirs efetivamente lidos |
|---|---|
| Schema | `prisma/schema.prisma` (6.004 linhas; models Company, Contact, Lead, Activity, AuditLog, User, MarketIntelligence*, índices e constraints) |
| Migrations | `prisma/migrations/` — 154 diretórios; lidas em detalhe: `20260722020322_enable_rls`, `20260722025537_enable_rls_auto`, `20260807100000_enable_rls_remaining_tables`, `20260825120000_scope_rls_bypass_to_bootstrap_allowlist`, `20260827200000_drop_dead_ai_governance_models`, `20260908090000_public_booking_link_create_and_rls`, `20261020220000_lgpd_consent_audit_chain_flywheel`, `20261020230000_rebalance_approval`, `20261020240000_lgpd_tenant_key_envelope_cascade_hardening`; varredura por `DROP TABLE`/`WITH CHECK`/`ENABLE ROW LEVEL SECURITY` em todas |
| Client Prisma | `src/lib/prisma.ts` (665 linhas, completo), `src/lib/prisma-interceptors.ts`, `src/lib/tenant-prisma.ts`, `src/lib/tenant-scoping-registry.ts`, `src/lib/async-context.ts`, `src/lib/txEscapeGuard.ts` (parcial), `src/lib/queue/outbox/prismaOutbox.repository.ts` (parcial) |
| PII/cripto | `src/lib/crypto/piiFields.ts`, `src/lib/crypto/piiIndex.ts` (parcial) |
| Auditoria | `src/lib/audit/audit.service.ts` |
| DI/Infra shared | `src/shared/di/container.ts`, `src/shared/di/setup.ts`, `src/shared/di/wiringConsistency.ts`, `src/shared/infra/PrismaOptOutRepository.ts`, `src/shared/infra/events/InMemoryEventBus.ts`, `src/shared/infra/__tests__/` |
| Middlewares | `authenticateToken.ts`, `authorization.ts`, `requireRole.ts`, `requireTenant` (em authorization.ts), `tenantRateLimiter.ts`, `errorHandler.ts` (parcial) |
| Repositórios | `PrismaLeadRepository.ts` (432 linhas, completo), `PrismaCompanyRepository.ts` (187, completo), `PrismaContactRepository.ts` (93, completo), `PrismaCrm360Repository.ts` (1148, parcial — pontos de escrita/leitura e loops), `PrismaAnalyticsRepository.ts` e `PrismaCommercialIntelligenceRepository.ts` (grep de padrões) |
| Rotas/montagem | `src/bootstrap/routes.ts` (linhas 90–249), `src/features/prospecting/outbound/server/db.ts` (legado gated) |
| Testes | `tests/unit/lib/tenant-scoping-parity.test.ts`, `tests/integration/rls-coverage.test.ts` e inventário de `tests/integration/rls-*` |
| Scripts | `scripts/db/` (inventário), `package.json` (scripts prisma/test) |

---

## 2. Elogios

1. **RLS em profundidade, com evidência real.** Todas as tabelas tenant-scoped têm `ENABLE` + `FORCE ROW LEVEL SECURITY` e policies `tenant_isolation` (migrations `20260722020322`, `20260807100000`, `20260825120000`). A migration `20260825120000_scope_rls_bypass_to_bootstrap_allowlist` fechou explicitamente a janela `WITH CHECK (true)` — inclusive `AuditLog`, que hoje exige `tenantId = current_setting('app.current_tenant_id')` (linhas 470–477). O teste estático `tests/integration/rls-coverage.test.ts` classifica 100% dos models (TENANT_SCOPED/GLOBAL_CATALOG/SYSTEM_INTERNAL) e reprova `WITH CHECK (true)` em tabela tenant-scoped.

2. **Bypass de RLS governado por allowlist em produção.** `BYPASS_RLS_ALLOWED_MODELS` (`src/lib/prisma-interceptors.ts:126-155`) restringe `bypassRls` a 15 models justificados um a um no comentário (Better Auth, BitrixConnection, CadenceRun/Sequence, Lead para workers, CrmCommercialDocument para token público, AILog só para `aggregate` de custo, PublicBookingLink, VoiceHubConnection). `Company` foi explicitamente **rejeitado** da allowlist com justificativa documentada (linhas 91-98). `resolveBypassRls` é função pura testável.

3. **Interceptação Prisma exemplar.** `src/lib/prisma.ts` + `prisma-interceptors.ts` implementam, numa única extensão: injeção de `organizationId` em writes, cifragem AES-256-GCM de PII/credenciais, índice cego determinístico (HMAC) para busca em campos cifrados, soft delete com cascade, auditoria e enfileiramento de busca. A lógica pura foi extraída para módulo testável (TAREFA-SANEAMENTO-013) sem mudar comportamento.

4. **Correções de bugs sutis documentadas e testadas.** O fix do AsyncLocalStorage + `PrismaPromise` lazy (`src/lib/async-context.ts:19-76`) e o bug de array-form `$transaction` do Prisma 7 TS Client (`src/lib/prisma.ts:205-227`) estão documentados com causa raiz e reproduções — raro ver esse nível de post-mortem no código.

5. **`runInTransaction` fail-closed.** Exige tenant, rejeita `bypassRls` dentro de tx, detecta mismatch de tenant (`TransactionTenantMismatchError`), propaga tx para chamadas indiretas (AuditService), adia efeitos pós-commit (`afterCommit`) e detecta uso tardio com `TransactionClosedError` (`prisma.ts:593-653`). `txEscapeGuard` bloqueia `$queryRaw`/`$transaction` globais dentro de tx.

6. **PII criptografada em repouso com índice cego.** `Contact.email/phone/whatsapp` cifrados (AES-256-GCM) + colunas `*Index` HMAC para igualdade/sufixo (`schema.prisma:556-566`), com decifragem recursiva de relações aninhadas (`decryptNestedContactPii`, `prisma-interceptors.ts:349+`) e `tryDecryptField` que isola falha por campo em vez de derrubar a query.

7. **Paridade de tenant-scoping testada.** `src/lib/tenant-scoping-registry.ts` + `tests/unit/lib/tenant-scoping-parity.test.ts` impedem que um model novo com `organizationId` fique fora das duas camadas de scoping sem decisão explícita (`KNOWN_RLS_ONLY_MODELS` revisado).

8. **Repositórios com `organizationId` explícito no `where` de escrita** (Company `:170`, Lead `:263`, Crm360) — defesa em profundidade além da RLS.

9. **Operação madura:** pool sizing documentado contra pooler Supabase (`prisma.ts:46-63`), métricas Prometheus do pool (`:75-97`), `beforeExit` com `process.once`, scripts `verify:migration-drift` e `scripts/db/check-migration-safety.ts`, `dbRoleCheck` no bootstrap, `scripts/db/purge-expired-data.sql`, e ~30 testes de integração RLS/tenant em `tests/integration/`.

10. **Rotas bem montadas:** `src/bootstrap/routes.ts` aplica `authenticateToken` + `requireTenant` consistentemente; módulos legados perigosos (`voice-hub`, `outbound`, `dialer-3cx`) estão gated por `unavailableLegacyModule` (`:210-216`); rotas públicas são exceções explícitas e justificadas (`/api/public/demo-leads`, `:105-108`).

---

## 3. Propostas de melhoria

1. **Auditoria sem transação extra por escrita.** Hoje cada create/update/delete auditável dispara `AuditService.log` → nova transação interativa com `SET LOCAL` própria, serializada por `await` (`src/lib/prisma.ts:405-416`). Proposta: quando já houver transação ativa (`runInTransaction`), gravar o audit na mesma tx; fora dela, avaliar buffer/batch de audit logs ou uma única tx cobrindo operação + audit, reduzindo ~50% das transações em writes.

2. **Paginar/limitar includes de detalhe.** `PrismaLeadRepository.findById` (`:164-170`) traz `activities`, `timeline` e `internalNotes` **sem `take`** — um lead com milhares de atividades devolve tudo. Aplicar `take` + `orderBy` (timeline/notes já ordenados; activities idem) e, se a UI precisar de tudo, endpoint de "carregar mais".

3. **Rate limiter distribuído.** `TenantRateLimiter` é `Map` in-memory por processo, sem eviction e sem compartilhamento entre instâncias (`src/shared/middlewares/tenantRateLimiter.ts:8-67`). Redis já é dependência do projeto (`src/lib/redis`, `queuesEnabled`) — migrar contadores para Redis (ou ao menos TTL/eviction no Map) para limites reais em multi-instância.

4. **Índices para soft delete.** `deletedAt` existe em ~14 models e o filtro `deletedAt: null` é injetado em **toda** leitura de model auditável (`applySoftDeleteReadFilter`), mas não há nenhum `@@index` cobrindo `deletedAt` (grep em `schema.prisma` = 0 ocorrências). Avaliar índices parciais `WHERE deletedAt IS NULL` ou compostos `(organizationId, deletedAt)` nas tabelas quentes (Lead, Activity, Contact).

5. **Enforcement de `-- ROLLBACK:` em CI.** `prisma/AGENTS.md` exige bloco `-- ROLLBACK:` em migrations destrutivas, mas **0 de 154** migrations contêm o marcador, e existem `DROP TABLE` reais (ex.: `20260827200000_drop_dead_ai_governance_models`). Estender `scripts/db/check-migration-safety.ts` para falhar o build quando um `DROP`/`ALTER ... TYPE` não tiver o bloco — transforma regra de governança em gate executável.

6. **Unificar as duas camadas de tenant-scoping.** `getTenantPrisma()`/`req.db` e a extensão global de `prisma.ts` coexistem com listas e propósitos diferentes (dívida documentada em `tenant-scoping-registry.ts`). Proposta de médio prazo: deprecar `req.db` ou fazer `getTenantPrisma` delegar à mesma extensão, eliminando a possibilidade de caller usar o client errado.

7. **Minimizar payload de busca.** `searchQueue.add` envia `{ ...result }` completo do registro (`src/lib/prisma.ts:433`) — inclui campos não necessários ao índice e PII em claro (name, etc.; campos cifrados vão como ciphertext). Enviar só campos indexáveis reduz exposição na fila/Meilisearch.

8. **Retenção de `AuditLog`.** `AuditLog.details` grava `beforeState`/`afterState` completos em `Text` (`audit.service.ts:37-47`) e não há política de retenção/particionamento visível — tabela cresce sem bound e acumula snapshots de PII histórica. Avaliar TTL/partição mensal e truncamento de payloads grandes.

9. **Remover ou isolar código legado outbound.** `src/features/prospecting/outbound/server/db.ts` executa SQL cru via `prisma.$queryRawUnsafe` **sem contexto de tenant/RLS** (`:33`,`:45`), `checkExplorerSqlSafety` retorna sempre `{allowed:true}` (`:91-93`) e `executeQuery` é stub (`:95-97`). O módulo está gated (`routes.ts:211`), mas o código permanece importável/morto — mover para quarentena fora de `src/` ou deletar.

10. **Cobertura de teste para interceptadores de escrita.** Existem bons testes de paridade/tenant, mas os caminhos `injectTenantIntoWriteArgs`/`applyPiiEncryptionToWriteArgs` em `upsert`/`createMany`/`updateMany` (ramificações menos exercitadas) merecem testes de unidade adicionais sobre args mutados.

---

## 4. Erros, falhas e dívidas técnicas

### P1 — Alto

- **P1-1 · Escrita de Contact sem `organizationId` no `where`.** `src/features/contacts/infra/PrismaContactRepository.ts:82-85` (`update` usa `where: { id }`) e `:91` (`delete` usa `where: { id }`) — o tenant só é checado num `findFirst` prévio (`:79`,`:89`). Company (`PrismaCompanyRepository.ts:170`) e Lead (`PrismaLeadRepository.ts:263`) incluem `organizationId` na própria escrita. Hoje a RLS segura, mas a camada de aplicação fica inconsistente: qualquer futuro bypass de RLS (ou bug de contexto) vira cross-tenant write real. Severidade P1 por ser inconsistência de defesa em profundidade em modelo de PII.

- **P1-2 · `EventBus` do DI é in-memory e engole falhas.** `src/shared/di/setup.ts` registra `InMemoryEventBus` como `EventBus` global; `src/shared/infra/events/InMemoryEventBus.ts:14-22` captura erro de handler só com `logger.error` e segue — eventos de domínio se perdem em restart do processo e falhas de handler são invisíveis para o chamador. Existe outbox durável (`DomainEventOutbox`) para outro caminho; o risco é dois mecanismos de evento com garantias divergentes e o caller não saber qual está ativo.

### P2 — Médio

- **P2-1 · Custo de transação por query.** Toda operação de model com `tenantId` no contexto executa `basePrisma.$transaction` interativa com `SET LOCAL` (`src/lib/prisma.ts:254-267`) — inclusive `findMany`/`count` simples. E cada escrita auditável adiciona **outra** transação para o audit, serializada por `await` (`:405-416`). Correto para segurança, mas é o maior multiplicador de round-trips do sistema; em import em massa (dezenas de creates) o custo é linear e já causou P2028 documentado. Medir e considerar agrupar audit na mesma tx quando possível.

- **P2-2 · Includes ilimitados em leituras de detalhe.** `PrismaLeadRepository.findById` (`:164-170`) inclui `activities`, `timeline` e `internalNotes` sem `take`; `PrismaCompanyRepository.findById` (`:123-126`) inclui `contacts`+`leads` sem limite; `PrismaContactRepository.findById` (`:51-54`) inclui `leads` sem limite. Leads/empresas com volume alto degradam latência e memória por request.

- **P2-3 · `findAllForExport` sem paginação.** `PrismaLeadRepository.ts:421-431` carrega todos os leads do tenant com `include` — export de tenant grande pode estourar memória/timeout. Exportações deveriam ser paginadas/cursor-based ou via worker.

- **P2-4 · Rate limiter in-memory sem eviction.** `src/shared/middlewares/tenantRateLimiter.ts:10-67`: `Map` por processo, sem TTL de buckets expirados (só reset na próxima request à mesma key) e sem compartilhamento entre réplicas — limite real é `max × instâncias` e o Map cresce com cardinalidade de tenants×paths.

- **P2-5 · Migrations destrutivas sem `-- ROLLBACK:`.** `prisma/AGENTS.md:30-34` exige o bloco em migrations destrutivas; grep por `ROLLBACK:` em `prisma/migrations` retorna **0**. Existem `DROP TABLE` (`20260827200000`), `DROP COLUMN` e `ALTER ... TYPE` em ~19 migrations — rollback depende 100% do runbook manual.

- **P2-6 · SQL explorer legado com guard que sempre permite.** `src/features/prospecting/outbound/server/db.ts:91-97`: `checkExplorerSqlSafety` retorna `{ allowed: true }` incondicionalmente e `executeQuery` é stub que devolve vazio — se o módulo for reativado, o "safety check" não protege nada; e `DbHandle.exec/run` roda SQL cru fora de qualquer contexto RLS (fail-closed por acidente, não por desenho — retorna vazio silencioso em tabelas com RLS).

### P3 — Baixo

- **P3-1 · Sem índices cobrindo `deletedAt`.** ~14 models têm `deletedAt` e toda leitura de model auditável injeta `deletedAt: null` (`prisma-interceptors.ts:316-327`), mas nenhum índice em `schema.prisma` cobre a coluna — scans maiores conforme soft-deleted acumula.

- **P3-2 · Dupla camada de tenant-scoping.** `getTenantPrisma` (`tenant-prisma.ts`) e a extensão global divergem propositalmente (registry documenta), mitigado por `tenant-scoping-parity.test.ts` — manter como dívida conhecida; risco residual de caller usar `req.db` onde o global era esperado (ou vice-versa) sem erro.

- **P3-3 · `beforeState` extra por update/delete auditável.** `prisma.ts:272-286` faz `findUnique` adicional antes de cada update/delete auditável — custo aceito, mas soma +1 query por escrita; falhas são engolidas em `catch {}` (`:283-285`), podendo gerar audit sem beforeState silenciosamente.

- **P3-4 · Payload de busca com registro completo.** `prisma.ts:426-444` envia `{ ...result }` inteiro ao `searchQueue` (Meilisearch) — over-sharing de campos e PII em claro (campos cifrados vão como ciphertext, mas `name`/endereço etc. não). Ver proposta 7.

- **P3-5 · `AuditLog.details` sem retenção/truncamento.** Snapshots `beforeState`/`afterState` completos em `Text` (`audit.service.ts:37-47`); crescimento ilimitado e PII histórica retida indefinidamente (ver proposta 8).

- **P3-6 · `executeWithRls` sem timeout diferenciado para leituras.** Toda query com tenant paga `maxWait 15s / timeout 45s` de transação interativa (`prisma.ts:263-266`) — leituras simples herdam o orçamento de escrita; sob pool saturado, reads enfileiram atrás do mesmo limite.

---

## 5. Resumo executivo

A fundação de dados do Birth Hub 360 é **madura e acima da média**: RLS com `FORCE` em todas as tabelas tenant-scoped, bypass restrito por allowlist justificada em produção, criptografia de PII com índice cego, soft delete auditado, transações interativas fail-closed e uma camada de interceptação Prisma notavelmente bem documentada e testada. Não encontrei bypass de tenancy explorável pelo caminho de request autenticado — a postura é fail-closed por desenho.

Os pontos fracos são de **consistência e custo**, não de vulnerabilidade aberta: (1) `PrismaContactRepository` escreve/deleta sem `organizationId` no `where` da operação (P1, defesa em profundidade); (2) o `EventBus` global é in-memory e engole falhas de handler enquanto existe outbox durável paralelo (P1); (3) cada query com tenant paga uma transação interativa e cada escrita auditável paga mais uma para o audit — o maior multiplicador de latência do sistema (P2); (4) includes/paginação ausentes em leituras de detalhe e export (P2); (5) rate limiter in-memory sem eviction (P2); (6) regra de `-- ROLLBACK:` em migrations existe só no papel — 0/154 compliance (P2).

Recomendação prioritária: corrigir o `where` de Contact (barato, alinha com Company/Lead), avaliar audit na mesma transação quando houver tx ativa, e transformar o gate de migration-safety em enforcement de CI.

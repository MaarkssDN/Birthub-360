# Auditoria de Dados — Schema, RLS, Tenancy e Retenção

**Demanda:** DEM-20261115-001 · **Agente:** 01/01A · **Data:** 2026-11-15
**Escopo:** `prisma/schema.prisma` (162 models, ~6.000 linhas, 225 enums/models declarados), `prisma/migrations/**` (154 migrations), scripts de banco da raiz, camada de dados (`src/lib/prisma.ts`, `prisma-interceptors.ts`, `tenant-scoping-registry.ts`, `async-context.ts`), retenção/anonimização LGPD.
**Método:** leitura estática + `npx prisma validate` (schema válido). `migrate diff` ao vivo **não executado** — o banco de teste local (`.env.test`, 192.168.0.116:5434) usa `prospector_app` (não-owner, sem CREATEDB) e não há shadow database disponível; o reset do shadow falhou com `must be owner of table _prisma_migrations` (P3016). Achados de comportamento de runtime não foram reexecutados — baseados em código e migrations.

## Sumário executivo

| Severidade | Quantidade |
|---|---|
| P0 crítico | 0 |
| P1 alto | 3 |
| P2 médio | 7 |
| P3 baixo | 7 |

**Leitura geral:** a camada de tenancy/RLS deste repositório é excepcionalmente madura — FORCE RLS em todas as tabelas de tenant, bypass restrito a allowlist, separação de papéis no Postgres (`prospector_app` NOSUPERUSER/NOBYPASSRLS), PII cifrada com índices cegos, FKs compostas por tenant e uma cadeia de auditoria LGPD com hash-chain e crypto-shredding. Os riscos residuais concentram-se em **cobertura incompleta da anonimização de titular** (PII em `Note`, `WhatsAppMessage.phoneE164`, `EmailMessage`, `EnrichmentLog.rawData`, anexos em S3) e em **processos/ scripts fora do ciclo de migrations** (drift reincidente, `migrate.sql` solto, scripts de seed com senha conhecida).

---

## 1. ELOGIOS — preservar

1. **RLS completa e enforced.** `ENABLE` + `FORCE ROW LEVEL SECURITY` em todas as tabelas tenant-scoped (ex.: `20260722020322_enable_rls/migration.sql:1-21`), e waves posteriores cobrindo as tabelas criadas depois (`20260807100000`, `20260902130000`, `20261010000000`, `20261110120000`). Policies `FOR ALL` com `USING`+`WITH CHECK` consistentes.
2. **Tabelas-filhas sem `organizationId` cobertas por policy via pai.** `Note`, `TimelineEvent`, `EnrichmentLog`, `CrmPipelineStage`, `DocumentChunk` filtram por subquery na tabela pai (`20260722020322_enable_rls:65-80`, `20260807100000:28-44`, `20260825120000:479-540`). E o caso real de regressão foi pego e corrigido: `Note` ganhou `companyId`/`contactId` em `20260913` e a policy foi reescrita para os três pais no mesmo PR (`20260913000100_notes_cross_entity_and_attachments/migration.sql:32-52`) — com comentário explicando o porquê.
3. **Bypass de RLS cirúrgico.** `app.bypass_rls` só vale para um allowlist de models de identidade em produção (`resolveBypassRls`, `src/lib/prisma-interceptors.ts`; policy reescrita em `20260825120000_scope_rls_bypass_to_bootstrap_allowlist`). Workers cross-tenant fazem bypass só na *descoberta* e re-escopam por tenant na escrita (ex.: `autoAnonymizeDisqualified.worker.ts:48-83`).
4. **Separação de papéis no Postgres.** `prospector_app` = NOSUPERUSER/NOBYPASSRLS, só DML, dono de nada; `prospector_migrator` = dono, só roda migrations; `DELETE`/`TRUNCATE` revogados em `Organization` e tabelas da cadeia de consentimento (`scripts/db/create-app-role.sql`, `20261021000000_lgpd_chain_restrict_org_no_app_delete/migration.sql:100-122`). Isso torna a RLS à prova de app-comprometido.
5. **PII cifrada em repouso com índices cegos.** `Contact.email/phone/whatsapp` em AES-256-GCM (`enc:v1:`) + 8 índices HMAC determinísticos (`schema.prisma:469-504`); tokens OAuth do `Account` cifrados (`encryptedModelFields.ts:35`); interceptors transparentes de cifrar/decifrar inclusive em relações aninhadas (`prisma.ts:447-465`, `decryptNestedContactPii`).
6. **Integridade referencial tenant-aware por FK composta.** `DecisionMaker` referencia `Company`/`Contact` via `[id, organizationId]`/`[id, companyId, organizationId]` — impossível apontar para linha de outro tenant mesmo sob bypass (`schema.prisma:1302-1335`, uniques em `Company:293` e `Contact:548`).
7. **Uniques por tenant corretos nos pontos quentes de sync.** `Lead @@unique([organizationId, bitrixLeadId])` e `([organizationId, bitrixDealId])` (`schema.prisma:716-717`) fecham a janela de duplicidade de importação Bitrix; `Company @@unique([organizationId, cnpj])` (`:303`) e `Prospect @@unique([organizationId, cnpj])` impedem colisão cross-tenant.
8. **Transação interativa fail-closed.** Toda operação passa por `executeWithRls` com `set_config(..., TRUE)` (SET LOCAL) dentro de `$transaction` interativa (`prisma.ts:254-267`); `runInTransaction` exige tenant, rejeita bypass e mismatch de tenant, e lança `TransactionClosedError` para promises tardias (`prisma.ts:593-653`). O fallback "retry sem contexto" foi removido de propósito após mascarar erros reais (`prisma.ts:247-253`).
9. **Anonimização de titular transacional e abrangente no núcleo.** `eraseDataSubject` roda em `runInTransaction`, cria `OptOutRecord` **antes** de destruir identificadores (ordem correta — falha de supressão aborta a anonimização), cobre Contact, `WhatsAppMessage.body`, `ConversationSignal`, `TimelineEvent`, `VoiceCallLog`, toda a árvore Copiloto (transcrições, insights, sugestões, áudios em S3), `AgentMemory` e grava `AuditLog` com hash do titular (`dataSubjectErasure.service.ts:48-372`).
10. **Cadeia de consentimento com hash-chain e crypto-shredding.** `lgpd.service.ts:28-67` encadeia `revocation` na `ConsentAuditChain` após anonimização, com `ConsentPurgeTask` outbox e `TenantKeyEnvelope`; triggers bloqueiam `TRUNCATE` em `ConsentAuditChainHead`/`TenantKeyEnvelope` (`20261020220000`, `20261020240000`).
11. **Soft delete auditável centralizado.** `AUDITABLE_MODELS` no interceptor (`prisma-interceptors.ts:162-176`) converte `delete` em update de `deletedAt/deletedBy/deleteReason` e cascateia Company→Contact/Lead→Activity (`prisma.ts:293-385`), com `AuditLog` antes/depois por escrita (`prisma.ts:401-424`).
12. **Índices tenant-first amplos + trigram.** `Lead` tem `(organizationId)`, `(organizationId, createdAt)`, `(organizationId, status)`, `(organizationId, funnel)`, `(organizationId, pipelineId, pipelineStageId)` (`schema.prisma:718-728`); busca textual com GIN trigram em `Company.tradeName`, `Contact.name/role`, `MarketIntelligenceCompany` (`:308`, `:553-554`, `:425-427`).
13. **CHECK constraints de "exatamente um pai"** em `Note` e `Attachment` (`20260913000100:26-30,95-99`) — integridade que a aplicação sozinha não garante.
14. **Documentação de drift e bugs no próprio código.** Os comentários do schema registram causa raiz de bugs reais (lazy `PrismaPromise` × `AsyncLocalStorage`, array-form de `$transaction` no Prisma 7, pool Supabase EMAXCONNSESSION) — memória operacional exemplar conforme AGENTS.md §8.

---

## 2. PROPOSTAS — priorizadas

### P1 — Cobertura de anonimização de titular (estender `eraseDataSubject`)
Hoje a exclusão LGPD cobre o "núcleo" mas deixa PII em tabelas satélite. Estender `dataSubjectErasure.service.ts` para:
- `Note` — `content` é texto livre com PII arbitrária, ligado por `leadId`/`companyId`/`contactId` (`schema.prisma:773-799`). **Maior gap**: uma nota "ligar para João, cpf X" sobrevive à exclusão do titular.
- `WhatsAppMessage.phoneE164` — hoje só `body` é anulado (`dataSubjectErasure.service.ts:137-140`); o telefone do titular permanece em texto puro e indexado (`schema.prisma:2229,2240`). Avaliar mascarar ou reter apenas sob `OptOutRecord` (já criado) — hoje há duplicação do identificador.
- `EmailMessage` — `fromEmail/toEmail/subject/body` em claro (`schema.prisma:3653-3680`), nada na exclusão.
- `Attachment` — `objectKey` aponta para binário no S3 que **não é deletado** na exclusão (só `copiloto/audioObjectKey` é, `dataSubjectErasure.service.ts:314-323`); anexos de Lead/Company/Contact ficam órfãos de titular.
- `EnrichmentLog.rawData` — snapshots brutos de providers podem conter dados pessoais.
- `AgentMemoryRecord`, `LearningCandidate`, `AILog` (quando `promptId`/metadata carregar PII), `CopilotoDealHealthSnapshot`, `PublicLeadConsent` (dados do lead público).

### P1 — Política formal de retenção por classe de dado
Não existe tabela/worker de retenção unificado. `scripts/db/purge-expired-data.sql` é uma função SQL **nunca invocada** pelo app (só referenciada em doc). Proposta: model `DataRetentionPolicy` (ou config) + worker BullMQ que execute expurgo por classe — `AILog`, `AuditLog.details/afterState`, `EnrichmentLog`, `TimelineEvent`, `WhatsAppMessage`, `EmailMessage`, `Session.ipAddress/userAgent`, `DomainEventOutbox`/`DomainEventConsumption` (já despachados) — com janela por organização. O precedente `ConsentPurgeTask`/`autoAnonymizeDisqualified.worker.ts` já prova o padrão.

### P2 — `AuditLog` sem retenção e com PII em `beforeState/afterState`
`prisma.ts:416-424` grava o row completo (pós-cifra para Contact, mas `name`, `customFields`, `observations` de Lead/Company em claro). Sem purge → cresce para sempre e retém PII indefinidamente. Proposta: truncar/hashear `afterState` para models sensíveis ou reter só diff de campos auditáveis.

### P2 — Eliminar drift schema↔migrations de forma estrutural
Duas correções de drift já foram necessárias (`20260720235926_sync_accumulated_schema_drift`, `20261020200000_fix_schema_migration_drift`). Proposta: gate de CI obrigatório `prisma migrate diff --from-migrations --to-schema` (o comentário da migration indica que já existe verificação de deriva — tornar bloqueante e publicar o resultado), mais convenção "migration no mesmo PR do model".

### P2 — Higiene dos scripts de banco da raiz
`migrate.sql` (ALTER avulso fora do ciclo de migrations), `create-auth.ts`/`recreate-account.ts` (senha `00000000` hardcoded, `set_config('app.bypass_rls','on',FALSE)` em conexão de sessão — não `TRUE` local, bypass **global** enquanto a conexão viver), `create-auth.ts` ainda faz `DELETE FROM "Organization" WHERE name LIKE '%Marcelin%'` — destrutivo e pessoal. Proposta: mover para `scripts/` com guardas (exigir `--confirm`, proibir senha <16 chars, usar `runInTransaction`/papel migrator), ou deletar os obsoletos.

### P2 — `AILog.organizationId` nullable subconta custo por tenant
Linhas sem tenant ficam invisíveis para somas de budget (`schema.prisma:1838-1848`). Proposta: exigir resolução de tenant no write path de IA (worker resolve tenant do job) ou registrar custo em bucket "unattributed" explícito.

### P2 — Cobertura RLS automática para tabelas novas
Com 162 models e ~20 migrations de "add_missing_rls", o padrão "esquecer RLS na tabela nova" já ocorreu 4+ vezes. Proposta: script de CI (`scripts/db/audit-database-governance.ts` já existe — estender) que falhe se existir tabela com coluna `organizationId`/`tenantId` sem `relrowsecurity`/`relforcerowsecurity`, ou teste de catálogo.

### P3 — Unificar nomenclatura `tenantId` → `organizationId`
`AuditLog.tenantId`, `AIGovernancePolicy.tenantId` divergem do padrão `organizationId` (schema.prisma:852). Custo baixo, reduz erro em policies e código.

### P3 — `Float` para valores monetários
`Lead.amount`, `CommercialGoal.amount`, `Company.capitalSocial`, `AILog.cost` usam `Float`/`Double` enquanto `ForecastSnapshot`/`MarketIntelligenceCompany` usam `Decimal` (schema.prisma:599, 1102, 227, 1832 vs 1153, 369). Proposta: migrar para `Decimal(14,2)` incrementalmente.

### P3 — FKs de `owner`/`actorId`/`uploadedBy`/`changedBy`/`requestedBy` sem constraint
`Activity.owner`, `Lead.owner` são `String` livre; `LeadFieldChange.changedBy`, `OptOutRecord.requestedBy`, `Attachment.uploadedBy`, `AutomationVersion.editedByUserId` idem (decisão consciente em alguns casos — "sobreviver à remoção do usuário"). Proposta: padronizar decisão documentada: FK opcional `onDelete: SetNull` onde fizer sentido, ou comentário explícito onde for intencional.

### P3 — Índices compostos para threads quentes
`WhatsAppMessage` tem `(organizationId, phoneE164)` mas não `(organizationId, contactId, receivedAt)` — leitura de thread por contato ordenada por data tende a sort em memória. Idem `Activity (organizationId, leadId, date)`. Verificar com `pg_stat_statements` antes de criar.

### P3 — FK composta `(id, organizationId)` além de `DecisionMaker`
Estender o padrão tenant-safe de `DecisionMaker` a `LeadStageHistory`, `CrmDealItem`, `CopilotoDealHealthSnapshot` (que já referenciam `Lead`/`Company` por id simples).

---

## 3. ERROS, FALHAS E DÍVIDAS

### P1 — Anonimização LGPD incompleta (cobertura parcial do titular)
`eraseDataSubject` (`src/shared/services/dataSubjectErasure.service.ts`) não toca: `Note` (PII livre, 3 caminhos de vínculo — schema.prisma:784-791), `WhatsAppMessage.phoneE164` (schema.prisma:2229 — telefone em claro e indexado mesmo após "anonimização"; só `body` é zerado, linha 137-140), `EmailMessage` (schema.prisma:3653+), `Attachment` (objeto S3 nunca deletado — só metadado soft-deletável existe; erasure não marca `deletedAt` nem remove `objectKey`), `EnrichmentLog.rawData` (schema.prisma:447-462), `AgentMemoryRecord`/`LearningCandidate` (schema.prisma:4855+, 4812+), `CopilotoDealHealthSnapshot` (schema.prisma:2533+), `AILog`. **Evidência:** ausência de qualquer referência a esses models no service (372 linhas lidas integralmente). Um titular que exerceu exclusão ainda tem nome em notas, telefone em mensagens e áudio/anexo no bucket. Severidade P1 por ser descumprimento do direito de exclusão (LGPD art. 18) em dados efetivamente retidos.

### P1 — `AuditLog` retém PII completa sem política de retenção
`AuditService.log` grava `afterState: result` (row inteiro) e `beforeState` (`prisma.ts:270-286, 416-424`). Para `Contact` os campos cifrados saem cifrados, mas `name`, `observations`, `customFields`, e todo o row de `Lead`/`Company` ficam em claro para sempre — `AuditLog` não tem `deletedAt`, não entra em nenhuma rotina de purge e a policy RLS só isola por tenant. `schema.prisma:844-859`. Risco: retenção indefinida de PII + crescimento ilimitado da tabela mais quente de auditoria.

### P1 — `scripts/db/purge-expired-data.sql` é uma armadilha
A função `purge_expired_lgpd_records()` (a) **nunca é chamada** por nenhum código (grep em `src/`, `scripts/`, workers: zero invocações — só menção em doc gerada); (b) se executada, faz `UPDATE "Contact" SET email=NULL, phone=NULL` **via SQL direto**, fora do interceptor do Prisma — logo **não limpa os 8 índices cegos** (`emailIndex`, `phoneLast8Index`, etc.), deixando hashes determinísticos de PII órfãos; (c) o critério `updatedAt < 2 years` anonimiza contatos comercialmente frios sem consentimento do titular nem registro em `AuditLog`. Arquivo: `scripts/db/purge-expired-data.sql:4-21`. Deve ser removido ou reescrito como worker que delegue a `eraseDataSubject`/interceptors.

### P2 — Drift schema↔migrations reincidente (já ocorreu 2×)
`20260720235926_sync_accumulated_schema_drift` e `20261020200000_fix_schema_migration_drift` existem porque models entraram no schema sem migration correspondente (o segundo corrige índices ausentes, nomes de constraint truncados >63 bytes, e `ALTER TABLE "User" DROP CONSTRAINT`). Índices que "existiam só no schema" (`Activity_leadId_idx`, `Contact_companyId_idx`, `Lead_companyId_idx`…) rodariam queries quentes em seq scan até o fix. O drift de 2026-10 foi parcialmente causado por nomes de constraint/index > 63 bytes truncados silenciosamente pelo Postgres — limitação que vai se repetir (FKs compostas do padrão `DecisionMaker` geram nomes longos; vide renames na migration). Recomendado: lint de nome de constraint no CI.

### P2 — Scripts de banco perigosos na raiz
- `create-auth.ts`: senha `'00000000'` hardcoded (linha 30), `set_config('app.bypass_rls','on',FALSE)` — bypass **de sessão inteira** (não `is_local=TRUE`), DELETE em `user`/`session`/`account` e `DELETE FROM "Organization" WHERE name LIKE '%Marcelin%'` (linhas 18-25). Executável por qualquer um com `DATABASE_URL`.
- `recreate-account.ts`: mesma senha `'00000000'` (linha ~33), bypass de sessão, INSERT direto em `account` com hash — cria ADMIN sem passar por Better Auth nem `mustChangePassword`.
- `create_admin_user.ts`: melhor (senha via `ADMIN_INITIAL_PASSWORD`, bcrypt) mas bcrypt ≠ scrypt do Better Auth (`seed_users.ts:2` documenta) — hash pode ser incompatível dependendo do fluxo.
- `seed_users.ts`: imprime senhas geradas no console (linhas 134-140) — ok para seed local, perigoso se rodado contra homolog/prod.
- `migrate.sql`: `ALTER TABLE "Organization" ADD COLUMN "setupCompleted"` solto na raiz — drift manual fora do ciclo de migrations.

### P2 — `src/features/prospecting/outbound/server/db.ts` — shim legado com SQL cru fora de RLS
`DbHandle.exec/run` chamam `prisma.$queryRawUnsafe`/`$executeRawUnsafe` no client global **sem `withRlsContext`** (linhas 33, 45; há `biome-ignore no-prisma-tx-escape` assumindo dívida). O SQL gerado é estilo SQLite (`?`→`$n`, tabela `activity_log` com colunas snake_case que **não existe** no schema Postgres — grep confirma zero ocorrências em `schema.prisma`/migrations). Na prática `logActivity` falha silenciosamente (`catch` → `console.error`, linha 79-81) e `saveDatabase()`/`executeQuery`/`getStats` são stubs vazios. Código morto que finge funcionar — risco se alguém "religar" sem revisar tenancy.

### P2 — `AILog.organizationId` nullable → custo de IA subcontado por tenant
`schema.prisma:1838` — registros sem tenant (workers, scripts) ficam fora de `assertOrgAiBudgetNotExceeded` e de qualquer relatório por organização; o budget pode ser estourado por consumo não atribuído. Índices `(organizationId, createdAt)` não ajudam linhas NULL.

### P2 — `Note` fora de `AUDITABLE_MODELS` → sem auditoria nem soft delete
`AUDITABLE_MODELS` (`prisma-interceptors.ts:162-171`) cobre Company/Contact/Lead/Activity/Crm*/Attachment, mas **não `Note`** — criação/edição/exclusão de nota (que pode conter PII e decisão comercial sensível) não gera `AuditLog` e `delete` em `Note` é hard delete real (não há `deletedAt` no model, schema.prisma:773-799). Idem `TimelineEvent` (append-only por design, mas sem auditoria de quem escreveu — `type`/`description` livres).

### P3 — `Activity.owner`/`Lead.owner` sem FK; `deleteReason` sempre hardcoded
`Activity.owner String` (schema.prisma:734) e `Lead.owner String?` (:578) não referenciam `User` — renomear/excluir usuário deixa owner órfão (parcialmente mitigado por `LeadFieldChange` que guarda histórico de owner). Além disso o interceptor grava `deleteReason: 'Soft delete'`/`'Cascade Soft Delete'` fixo (`prisma.ts:300,325,354`) — o motivo real informado pelo chamador nunca é persistido.

### P3 — `Company.bitrixCompanyId` sem unique → duplicatas por design
`schema.prisma:282-289` documenta que cada Deal importado cria Company nova sem dedupe — duas linhas locais podem apontar para o mesmo `bitrixCompanyId`. Decisão consciente, mas gera dados duplicados no CRM e no índice de busca; métrica de duplicatas deveria existir.

### P3 — `Prospect` sem write path e fora de `tenantModels`
Documentado no próprio schema (`schema.prisma:3275+`): model existe, tem `@@unique([organizationId, cnpj])`, mas nenhum create/upsert em `src/` — e não está em `TENANT_INJECTED_MODELS` (`tenant-scoping-registry.ts:42+`). Se um dia ganharmos create path, a injeção de tenant não é automática. Risco latente, não bug ativo.

### P3 — `Session.ipAddress`/`userAgent` e `TimelineEvent` sem retenção
Dados de sessão e timeline crescem sem expurgo; `TimelineEvent.description` é texto livre que pode conter PII e só é mascarado quando o lead do titular é anonimizado.

### P3 — Cobertura de índices assimétrica em tabelas novas
`EmailMessage` tem `@@index([leadId])` mas nenhum índice direto em `organizationId` isolado (o unique composto cobre prefixo — ok); `PublicLeadConsent` idem. `CopilotoConversation`/demais modelos Copiloto (schema.prisma:2334+) merecem revisão de índices das queries reais de listagem por `organizationId+createdAt` — não verificado contra queries quentes por falta de profiling.

---

## Anexo — verificações executadas

- `npx prisma validate` → **schema válido** (Prisma 7.10.0).
- `prisma migrate diff --from-migrations --to-schema` → **não executado**: shadow DB indisponível (role `prospector_app` sem ownership/CREATEDB; `SHADOW_DATABASE_URL` default `localhost:5434/shadowdb` inexistente neste ambiente). Recomendado rodar no CI com banco dedicado.
- Contagem de models sem `organizationId`: 27 de 162 — a maioria é legítima (auth Better Auth, definições globais de agente, MarketIntelligence global, enums de plataforma); os casos tenant-scoped cobertos só por pai (`Note`, `TimelineEvent`, `EnrichmentLog`, `CrmPipelineStage`, `DocumentChunk`) têm policy RLS correta — **verificado em migrations, não apenas no schema**.
- Soft delete (`deletedAt`) existe em apenas ~6 models (Company, Contact, Lead, Activity, Attachment e derivados CRM) — o restante do schema (162 models) não tem exclusão lógica; coerente com o desenho, mas significa que "excluir" uma `WhatsAppMessage`/`EmailMessage`/`CopilotoConversation` é sempre físico ou via flag específica do domínio.

# Handoff: 11 (Pietro) → 12 (Vera) — Schema aditivo `deletedBy`/`deleteReason` nos 4 models auditáveis

- **De:** 11 — Pietro (Schema Prisma e Modelagem, Squad 10)
- **Para:** 12 — Vera (`prisma/migrations/**`), cc: 10 — Mara, 00 — Astra, 09 — Silas
- **Origem:** `.agents/handoffs/squad-10/10-para-11-12-proposta-deletedby-deletereason.md` (Opção A, autorizada pelo Orquestrador Humano §4) — DEM-20261123-001
- **Onda / Branch:** coordenação Squad 10 · `agente/11-deletedby-schema-s10` · base `coord/squad-10` @ `4f41ee3b5`
- **Status:** RESOLVIDO (schema) — migration pendente do Agente 12

---

## 1. Diff exato aplicado em `prisma/schema.prisma`

8 linhas adicionadas, zero removidas. Convenção idêntica aos demais models auditáveis do schema (ex.: `Contact` L537-539, `TimelineEvent` L797-799): `deletedBy String?` + `deleteReason String?`, nullable, sem default, posicionadas imediatamente após `deletedAt`.

```diff
@@ model CadenceSequence (após deletedAt, antes de `runs CadenceRun[]`)
   deletedAt DateTime?
+  deletedBy    String?
+  deleteReason String?

@@ model Workflow (após deletedAt, antes de createdBy/updatedBy)
   deletedAt DateTime?
+  deletedBy    String?
+  deleteReason String?
   createdBy String?
   updatedBy String?

@@ model Agent (após deletedAt, antes dos @@index)
   deletedAt DateTime?
+  deletedBy    String?
+  deleteReason String?

@@ model AgentSession (após deletedAt, antes dos @@index)
   deletedAt DateTime?
+  deletedBy    String?
+  deleteReason String?
```

## 2. Tipos escolhidos e justificativa

- `String?` (TEXT no Postgres) para ambos — mesma convenção de todos os models que já têm o trio (`deletedBy`/`deleteReason` aparecem 14× no schema, todos `String?`).
- **Nullable sem default**: aditivo puro; rows existentes ficam `NULL` (semanticamente correto — deletes antigos não têm metadado). Sem backfill necessário.
- **Sem enum para `deleteReason`**: o interceptor (`buildSoftDeleteData`) grava string livre do caller; enum quebraria consumidores. `deletedBy` é `String?` livre (userId), não FK — consistente com os demais models.
- Alinhamento de colunas segue o estilo local de cada bloco (formatação não padronizada no arquivo; `prisma format` NÃO foi aplicado pois realinharia ~110 linhas não relacionadas — diff mantido cirúrgico em 8 linhas).

## 3. Ajuste consequente em teste (fora do schema, mesmo commit)

`src/lib/__tests__/prisma-interceptors.unit.test.ts` — o teste `'models só com deletedAt recebem apenas deletedAt'` ficou inválido: após `prisma generate`, o DMMF passa a expor os novos campos e `buildSoftDeleteData` (DMMF-driven, `src/lib/prisma-interceptors.ts:235`) escreve os 3 campos nos 4 models. Teste substituído por `'Agent/AgentSession/CadenceSequence/Workflow recebem os 3 campos após colunas aditivas'` — verde (28/28 no arquivo). Nenhum model auditável resta com "só deletedAt"; o branch de tolerância parcial do `buildSoftDeleteData` fica sem cobertura direta (código mantido como defesa — não é escopo removê-lo).

## 4. O que a migration (Agente 12) deve conter

Expand-only, compatível N/N-1 (B-05). Proposta SQL da Mara já validada:

```sql
ALTER TABLE "Agent"           ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "AgentSession"    ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "CadenceSequence" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "Workflow"        ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
```

- **Locks**: `ADD COLUMN` nullable sem default = metadata-only no Postgres 11+, `ACCESS EXCLUSIVE` breve (não reescreve tabela). Sem `NOT NULL`, sem `DEFAULT`, sem FK, sem índice → sem rewrite, sem backfill, sem `CREATE INDEX CONCURRENTLY` necessário.
- **Ordem de deploy (expand/contract)**: migration pode ser aplicada antes OU depois do deploy do código — ambos os lados são seguros:
  - código novo + coluna ausente → `buildSoftDeleteData` usa DMMF do client gerado; ATENÇÃO: se o client for regenerado com o schema novo antes da migration, `delete` nos 4 models tentará gravar colunas inexistentes → erro. **Recomendado: aplicar migration ANTES do deploy do client regenerado** (ordem expand-first clássica).
  - coluna presente + código velho → colunas ficam NULL, ignoradas. Seguro.
- **Rollback**: colunas aditivas são seguras de reverter via `ALTER TABLE ... DROP COLUMN` se necessário, mas o rollback primário é "não dropar" — dados de auditoria em `deletedBy`/`deleteReason` não devem ser destruídos. Classificação: **aditiva** (runbook `docs/security/runbooks/MIGRATION_ROLLBACK.md`).
- **RLS**: não tocar (Nilo/13). Colunas herdam as políticas existentes das tabelas.
- **Não usar como bypass de audit append-only**: `AuditLog` continua sendo a trilha; estas colunas são metadado do soft delete, não substituem auditoria.

## 5. Verificações executadas

- `npx prisma validate --schema prisma/schema.prisma` → **válido** ✅
- `npx prisma generate --schema prisma/schema.prisma` → **gerado** (v7.10.0) ✅
- `npx vitest run src/lib/__tests__/prisma-interceptors.unit.test.ts --config vitest.unit.config.ts` → **28/28 passed** ✅
- `prisma format` avaliado e **rejeitado** (realinha ~110 linhas fora do escopo; arquivo não está format-clean na base).
- Grep de consumers: `deletedBy`/`deleteReason` já consumidos por `prisma-interceptors.ts`, `softDeleteCascadeGuard.ts`, `dataSubjectErasure.service.ts`, dedup services — todos DMMF/schema-driven, **nenhuma mudança de código necessária**.
- Migration NÃO criada (propriedade do 12). Nenhum banco tocado. RLS intocado.

## 6. ⚠️ Aviso de ambiente (para coordenador)

`node_modules` do worktree é junction → `C:\Github\Birthub-360\node_modules`, que por sua vez é junction → `C:\Github\Birthub-360-worktrees\agente-16-worker-outbound\node_modules` (**node_modules compartilhado entre checkouts**). O `prisma generate` acima atualizou o `@prisma/client` compartilhado com o schema novo. Consequência: outros worktrees que rodarem `prisma-interceptors.unit.test.ts` contra esse client verão o teste antigo falhar até merge deste branch. Mitigação: mergear 11+12 juntos e rápido, ou regenerar client por checkout se houver isolamento. Registrado para transparência — não é defeito do diff.

## 7. Critérios de aceite (herdados da proposta)

- [x] Schema com 4×(`deletedBy String?` + `deleteReason String?`) — commit local em `agente/11-deletedby-schema-s10`.
- [x] `prisma validate` + `generate` + teste unitário do interceptor verdes.
- [ ] Migration expand-only do 12 criada e aplicada.
- [ ] Teste de integração (sugestão Mara: `agent.delete`/`cadenceSequence.delete`) confirmando persistência dos 3 campos — pós-migration.
- [ ] Parecer Silas sobre SHA congelado.

# Handoff: 10 (Mara) → 11 (Pietro) / 12 (Vera) — Proposta de migration aditiva `deletedBy`/`deleteReason` (4 models)

- **De:** 10 — Mara (Coordenador de Dados & Persistência, Squad 10)
- **Para:** 11 — Pietro (`prisma/schema.prisma`), 12 — Vera (`prisma/migrations/**`), cc: 00 — Astra, 20 — Ciro
- **Origem:** handoffs `.agents/handoffs/onda-3/20-para-11-12-modelos-auditaveis-sem-deletedby.md` e `.agents/handoffs/onda-3/10-para-11-12-modelos-auditaveis-sem-deletedby.md` (este último RESOLVIDO em código via `buildSoftDeleteData`)
- **Onda / Branch:** coordenação Squad 10 · `coord/squad-10` · base `93e82c220` · DEM-20261123-001
- **Status:** PROPOSTA — **NÃO APLICAR sem decisão humana** (schema = 11, migration = 12, decisão de migration é humana)

---

## 1. Estado verificado na base `93e82c220`

Os 4 models em `AUDITABLE_MODELS` (`src/lib/prisma-interceptors.ts:163-191`) possuem **apenas `deletedAt`**:

| Model | `deletedAt` | `deletedBy` | `deleteReason` |
|---|---|---|---|
| `Agent` (~schema L5350) | ✅ | ❌ | ❌ |
| `AgentSession` (~schema L5570) | ✅ | ❌ | ❌ |
| `CadenceSequence` (~schema L3606) | ✅ | ❌ | ❌ |
| `Workflow` (~schema L5307) | ✅ | ❌ | ❌ |

`buildSoftDeleteData` (DMMF-driven, `src/lib/prisma-interceptors.ts:235+`) já escreve apenas os campos existentes → soft delete funciona, mas **sem metadados de exclusão** (quem/quando/porquê) nesses 4 models. `AuditLog` (beforeState/afterState) continua registrando o evento.

## 2. Proposta — Opção A (recomendada pelo Agente 20 e endossada por Mara)

Colunas anuláveis, sem default → metadata-only no Postgres 11+, zero table rewrite, compatível N/N-1 (checklist zero-downtime B-05):

```prisma
// prisma/schema.prisma — adicionar a cada um dos 4 models:
deletedBy    String?
deleteReason String?
```

```sql
-- prisma/migrations/<ts>_soft_delete_metadata_4_models/migration.sql
ALTER TABLE "Agent"           ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "AgentSession"    ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "CadenceSequence" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "Workflow"        ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
```

Após aplicada, `buildSoftDeleteData` passa a escrever os 3 campos automaticamente (zero mudança de código — DMMF-driven).

**Opção B rejeitada:** remover os 4 models de `AUDITABLE_MODELS` — perderiam filtro `deletedAt` e trilha de auditoria.
**Opção C (defesa extra, só se A rejeitada):** interceptor tolerante já existe (`buildSoftDeleteData`); não há trabalho adicional necessário.

## 3. Despacho condicionado

- **11 Pietro:** quando houver decisão humana favorável, aplicar as 4 linhas no `prisma/schema.prisma` (único escritor do arquivo).
- **12 Vera:** criar a migration expand-only correspondente em `prisma/migrations/**` (único escritor), com checklist zero-downtime preenchido.
- **10 Mara:** após merge, validar com teste de integração `prisma.agent.delete()`/`workflow.deleteMany()` confirmando `deletedBy`/`deleteReason` persistidos.
- **09 Silas:** parecer do SHA congelado antes de promoção.

## 4. Critérios de aceite

- [ ] Decisão humana registrada (A ou rejeição).
- [ ] Se A: schema + migration aditiva aplicados; `delete`/`deleteMany` nos 4 models gravam os 3 campos.
- [ ] Teste cobrindo ao menos um model (sugestão: `agent` ou `cadenceSequence`).

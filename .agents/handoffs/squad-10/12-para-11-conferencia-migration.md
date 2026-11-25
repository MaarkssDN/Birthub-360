# Handoff: 12 (Vera) → 11 (Pietro) — Conferência schema × migration `deletedBy`/`deleteReason`

- **De:** 12 — Vera (Migrações e Rollouts, Squad 10)
- **Para:** 11 — Pietro (`prisma/schema.prisma`), cc: 10 — Mara, 00 — Astra, 09 — Silas
- **Origem:** `.agents/handoffs/squad-10/10-para-11-12-proposta-deletedby-deletereason.md` (Opção A)
- **Onda / Branch:** DEM-20261123-001 · `agente/12-deletedby-migration-s10` (base `coord/squad-10` @ `4f41ee3b5`) · worktree `C:/Github/Birthub-360-worktrees/squads/squad-10/wt-12`
- **Status:** MIGRATION CRIADA E VALIDADA — **aguardando edição do schema pelo 11 e decisão humana final**

---

## 1. O que foi entregue (propriedade: `prisma/migrations/**`)

Migration **`20261124120000_add_deletedby_deletereason_4_models`**:

- `ALTER TABLE "Agent"`, `"AgentSession"`, `"CadenceSequence"`, `"Workflow"`
- `ADD COLUMN IF NOT EXISTS "deletedBy" TEXT` e `"deleteReason" TEXT`
- Nullable, sem default, sem NOT NULL, sem backfill → metadata-only (PG11+), expand/contract N/N-1 (B-05).
- `SET lock_timeout = '3s'` (fail-fast se houver lock longo).
- Idempotente (`IF NOT EXISTS`) — seguro em reexecução.
- Header do `migration.sql` documenta: rollback (`DROP COLUMN IF EXISTS`), locks esperados (ACCESS EXCLUSIVE por µs/tabela), riscos (baixos; RLS/FK/índices intocados) e nota de que não é workaround de audit append-only.
- Nomes de tabela confirmados: models **sem `@@map`** → nomes físicos = nomes dos models (verificado em `prisma/schema.prisma` e migrations anteriores, ex. `20260924000000_voice_hub_models`).

## 2. Validação executada

- **PGlite (Postgres WASM real)** via `.agents/runs/wt12-validate-migration.cjs`:
  - DDL executa sem erro nas 4 tabelas; **idempotente** (2ª execução OK);
  - colunas criadas `text` + `is_nullable = YES`; linha seed permanece NULL (sem backfill);
  - **rollback ensaiado** (`DROP COLUMN IF EXISTS`) removeu as 8 colunas.
- **Limitação honesta:** não havia PostgreSQL server isolado disponível (Docker daemon inacessível — contextos `default`/`desktop-linux` sem pipe, `samsung`/`birthhub-remote` em `192.168.0.116:2375` com timeout; nenhuma porta em LISTEN na faixa 22100–22199; sem `psql` local). Validação foi feita em PGlite, não na cadeia completa `prisma migrate deploy`. Recomendo smoke test em PG descartável antes do merge se o gate exigir.
- `prisma validate`/`generate` **não executados**: `schema.prisma` ainda não contém os campos (é do Agente 11) — validar agora geraria client sem os campos. Após o 11 commitar o schema, rodar `npx prisma validate` + `npx prisma migrate diff` para conferir paridade.

## 3. Pedido ao Agente 11

1. Aplicar no `prisma/schema.prisma` (somente após decisão humana favorável — proposta §4):
   ```prisma
   deletedBy    String?
   deleteReason String?
   ```
   nos models `Agent`, `AgentSession`, `CadenceSequence`, `Workflow` (adjacente a `deletedAt`).
2. Após commitar, emitir retorno para conferência: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma` deve mostrar **zero drift** para essas colunas (ou apenas drift pré-existente documentado).
3. Atenção: se o schema usar `@map`/tipo diferente de `String?`→`text`, a migration precisa ser ajustada por mim — me avise.

## 4. Checklist zero-downtime (B-05) — preenchido

- [x] Coluna nullable sem default → sem table rewrite (PG11+).
- [x] Sem NOT NULL → sem scan/backfill obrigatório.
- [x] `IF NOT EXISTS` + `lock_timeout` → reexecução segura, fail-fast.
- [x] Compatível versão anterior (expand): código antigo ignora colunas novas.
- [x] Contract futuro (opcional, fora de escopo): nenhuma remoção planejada.
- [x] RLS/FK/índices não tocados; tabelas mantêm `ENABLE/FORCE ROW LEVEL SECURITY`.
- [ ] Smoke test em PG isolado (limitação §2) — pendente se gate exigir.

## 5. Não-escopo / observações

- `AuditLog` segue como trilha append-only; estas colunas são metadados de soft-delete escritos por `buildSoftDeleteData` (DMMF-driven, zero mudança de código após schema).
- Após merge + aplicação, Mara (10) valida `prisma.agent.delete()`/`workflow.deleteMany()` persistindo os 3 campos; Silas (09) emite parecer do SHA congelado.

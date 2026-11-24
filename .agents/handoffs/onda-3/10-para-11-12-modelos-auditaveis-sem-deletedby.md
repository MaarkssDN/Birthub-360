# Handoff: 10 (Mara) → 11 (Pietro) & 12 (Vera) — colunas deletedBy/deleteReason ausentes em 4 models auditáveis

- **De:** 10 — Mara (Coordenador de Dados & Persistência)
- **Para:** 11 — Pietro (`prisma/schema.prisma`), 12 — Vera (`prisma/migrations/**`), cc: 00 — Astra (aprovação humana)
- **Onda / Branch:** Onda 3 · `agente/10-data-interceptors-onda3` · DEM-20261123-001
- **Status:** RESOLVIDO no código (mitigação) — decisão de schema PENDENTE (melhoria, não bloqueador)
- **Origem:** handoffs do Agente 20 em `.agents/handoffs/onda-3/` (`20-para-11-12-modelos-auditaveis-sem-deletedby.md`) — replicado aqui porque aqueles arquivos ainda não estavam integrados na baseline.

---

## 1. Problema

Quatro models estão em `AUDITABLE_MODELS` (`src/lib/prisma-interceptors.ts`) mas têm **apenas `deletedAt`** no schema — sem `deletedBy` nem `deleteReason`:

| Model | schema.prisma | Observação |
|---|---|---|
| `Agent` | ~linha 5350 | voice-hub |
| `AgentSession` | ~linha 5570 | voice-hub |
| `CadenceSequence` | ~linha 3606 | cadências |
| `Workflow` | ~linha 5307 | voice-hub |

O interceptor de delete em `src/lib/prisma.ts` escrevia `{ deletedAt, deletedBy, deleteReason }` incondicionalmente → `prisma.<model>.delete/deleteMany` lançava "Unknown argument" (PrismaClientValidationError). **Não era só latente:** fixtures de integração já chamam `prisma.cadenceSequence.delete/deleteMany` (`tests/integration/cadence-*.test.ts`, `rls-tenant-isolation.test.ts:259`) e `prisma.agentSession.deleteMany` (`voice-hub-rls.test.ts:56`).

## 2. O que foi feito (nesta onda, sem tocar schema)

Decisão: **tolerância por model** — o `data` de soft delete agora é montado por `buildSoftDeleteData(model, userId, reason)` (`src/lib/prisma-interceptors.ts`), que deriva os campos existentes do `Prisma.dmmf` e escreve só `deletedAt` nos 4 models acima. Aplicado nos 3 caminhos de `prisma.ts`: `delete`, `deleteMany` e cascade (Company→Contact/Lead, Contact→Lead, Lead→Activity — hoje todos completos, helper blinda o futuro).

Fail-fast foi **descartado**: manteria crash em caminho real sem ganho — `deletedAt` + `AuditLog` (beforeState/afterState completos) + RLS já cobrem a trilha de auditoria.

## 3. O que segue pendente (decisão 11/12 + aprovação humana)

Para paridade completa de metadados de exclusão (quem/quando/porquê), avaliar migration aditiva:

```sql
ALTER TABLE "Agent"         ADD COLUMN "deletedBy" TEXT, ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "AgentSession"  ADD COLUMN "deletedBy" TEXT, ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "CadenceSequence" ADD COLUMN "deletedBy" TEXT, ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Workflow"      ADD COLUMN "deletedBy" TEXT, ADD COLUMN "deleteReason" TEXT;
```

Colunas novas são anuláveis, sem default, sem table rewrite → classe **aditiva** no checklist zero-downtime. Se aprovadas, basta atualizar o schema; `buildSoftDeleteData` passa a escrever os campos automaticamente (DMMF-driven, zero mudança de código).

## 4. Teste esperado

- `npx vitest run -c vitest.unit.config.ts src/lib/__tests__/prisma-interceptors.unit.test.ts` — verde (casos `buildSoftDeleteData` cobrem os 4 models).
- Após migration: teste de integração que faça `prisma.agent.delete(...)` e confira `deletedBy`/`deleteReason` persistidos.

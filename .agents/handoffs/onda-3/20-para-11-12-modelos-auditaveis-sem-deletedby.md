# Handoff: 20 (Ciro) → 11 (Pietro) / 12 (Vera) — Models auditáveis sem `deletedBy`/`deleteReason` quebram `delete`/`deleteMany`

- **Agente emissor:** 20 — Ciro
- **Destinatários:** 11 — Pietro (`prisma/schema.prisma`), 12 — Vera (`prisma/migrations/**`), cc 10 — Mara, 00 — Astra
- **Onda / Branch:** Onda 3 · `agente/20-core-backend-onda3` · baseline `32d07c375`
- **Status:** ABERTO — correção fora do ownership do Agente 20

---

## 1. Diagnóstico (causa-raiz comprovada)

`AUDITABLE_MODELS` (`src/lib/prisma-interceptors.ts:162-182`) inclui 4 models que possuem **apenas `deletedAt`** no schema — sem `deletedBy` nem `deleteReason`:

| Model | Campos de soft delete no schema |
|---|---|
| `Agent` | `deletedAt` apenas |
| `AgentSession` | `deletedAt` apenas |
| `CadenceSequence` | `deletedAt` apenas |
| `Workflow` | `deletedAt` apenas |

O interceptor de delete em `src/lib/prisma.ts` escreve **sempre os 3 campos**:

- `delete` → `update` com `data: { deletedAt: new Date(), deletedBy: userId, deleteReason: 'Soft delete' }` (`src/lib/prisma.ts:301-304`)
- `deleteMany` → `updateMany` com os mesmos 3 campos (`src/lib/prisma.ts:326-329`)
- cascata soft delete idem (`:354-358`)

Como Prisma valida argumentos desconhecidos **antes** de tocar o banco, qualquer `prisma.agent.delete(...)`, `prisma.workflow.deleteMany(...)`, etc. via client estendido falha com `PrismaClientValidationError` ("Unknown argument `deletedBy`/`deleteReason`") — nunca chega ao Postgres.

O comentário em `prisma-interceptors.ts:172-176` (DEBT-0056) afirma que esses models "têm `deletedAt` no schema e código que o preenche" — verdade, mas omite que **não têm** `deletedBy`/`deleteReason`, e o interceptor pressupõe os 3.

### Estado atual do impacto

Verificação por grep: os repositórios que mexem nesses models já fazem soft delete **manual** via `update({ data: { deletedAt: new Date() } })`, sem passar por `delete`/`deleteMany`:

- `src/lib/voice-hub/repositories/sessionRepository.ts:44-46` (`agentSession`)
- `src/lib/voice-hub/repositories/workflowRepository.ts:66-68` (`workflow`)
- `src/lib/voice-hub/repositories/agentRepository.ts` (`agent`, sempre com `deletedAt: null` nos where)

Portanto a falha é **latente**: explode no primeiro `delete`/`deleteMany` futuro via client estendido (ex.: um CRUD admin novo, seed de limpeza, job de expurgo que use `deleteMany`). Não foi encontrada chamada ativa hoje — mas o contrato está quebrado.

### Contraste com models completos

`CopilotoConversation` e `TimelineEvent` possuem os 3 campos; `Company`, `Contact`, `Lead`, `Activity`, `CrmPipeline`, `CrmProduct`, `CrmDealItem`, `CrmCommercialDocument`, `Attachment` idem. Os 4 models acima são a exceção.

## 2. Correções possíveis (decisão de schema → Agente 11)

**Opção A (recomendada — coerente com o restante do sistema):** adicionar `deletedBy String?` e `deleteReason String?` aos 4 models + migration expand-only do Agente 12:

```sql
ALTER TABLE "Agent"         ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "AgentSession"  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "CadenceSequence" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
ALTER TABLE "Workflow"      ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
```

Colunas nullable, sem default, metadata-only no Postgres 11+ → zero table rewrite, compatível com N/N-1 (checklist zero-downtime).

**Opção B:** remover os 4 models de `AUDITABLE_MODELS` — **não recomendada**: eles já usam `deletedAt` (leituras filtram, repositories fazem soft delete manual) e perderiam auditoria de delete e o filtro automático de `findUnique`.

**Opção C (defesa em profundidade, independente da escolha):** tornar o payload de delete do interceptor tolerante a models sem `deletedBy`/`deleteReason` — exigiria um registro de "campos de soft delete por model" em `prisma-interceptors.ts`. Só vale a pena se a Opção A for rejeitada; aumenta complexidade (P2 — simplicidade).

## 3. Critérios de aceite

- [ ] Decisão registrada (Opção A ou B) com parecer do Agente 11.
- [ ] Se A: schema + migration expand-only aplicados; `prisma.agent.delete()`/`workflow.deleteMany()` etc. funcionam via client estendido gerando soft delete + AuditLog.
- [ ] Teste de integração ou unitário cobrindo `delete`/`deleteMany` em ao menos um dos 4 models.

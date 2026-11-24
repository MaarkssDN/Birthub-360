# Handoff: 20 (Ciro) → 11 (Pietro) / 10 (Mara) — `TimelineEvent` fora de `AUDITABLE_MODELS`

- **Agente emissor:** 20 — Ciro (Coordenador de Backend & Contratos)
- **Destinatários:** 11 — Pietro (`prisma/schema.prisma`), 10 — Mara (Coordenador de Dados; provável dono de `src/lib/prisma*.ts`), cc 00 — Astra
- **Onda / Branch:** Onda 3 · `agente/20-core-backend-onda3` · baseline `32d07c375`
- **Status:** ABERTO — correção fora do ownership do Agente 20 (`src/api/index.ts`, `src/api/router.ts` — ver handoff separado sobre ownership inexistente)
- **Origem:** investigação ONDA3-20-CORE-BACKEND das falhas de domínio `isAuditableModel`/`deleteReason` registradas na matriz de ownership da Onda 3

---

## 1. Diagnóstico (causa-raiz comprovada)

A Onda 2 (commit `9ba824429`, merge de #504) adicionou soft delete completo a `TimelineEvent`:

```prisma
// prisma/schema.prisma (~linhas 795-800)
model TimelineEvent {
  // ...
  deletedAt    DateTime?
  deletedBy    String?
  deleteReason String?
  @@index([leadId, deletedAt, createdAt])
}
```

Porém `AUDITABLE_MODELS` em `src/lib/prisma-interceptors.ts:162-182` **não foi atualizado** e continua com 14 models, sem `'TimelineEvent'`. Consequência:

- `isAuditableModel('TimelineEvent') === false` (`src/lib/prisma-interceptors.ts:184-186`).
- `applySoftDeleteReadFilter` (`:326-337`) **não injeta `where.deletedAt = null`** em `findMany`/`findFirst`/`count`/`aggregate`/`groupBy` de `TimelineEvent`.
- `injectSoftDeleteSelect`/`handleSoftDeleteResult` (`:344-402`) não protegem `findUnique`.
- `delete`/`deleteMany` via client estendido executam **hard delete** (sem soft delete, sem trilha em AuditLog — o bloco de auditoria em `src/lib/prisma.ts:405` também depende de `isAuditable`).

### Evidência de impacto real (não é código morto)

`TimelineEvent` é lido por caminhos de produção através do `prisma` estendido:

- `src/features/commercial-intelligence/infra/PrismaCommercialIntelligenceRepository.ts:127` — `prisma.timelineEvent.count(...)`
- `src/features/commercial-intelligence/infra/PrismaCommercialIntelligenceRepository.ts:150` — `prisma.timelineEvent.findMany(...)`
- `src/features/crm/application/LeadDeduplicationService.ts:111` — `prisma.timelineEvent.updateMany` (re-parent, não delete)
- `src/shared/services/dataSubjectErasure.service.ts:234` — `tx.timelineEvent.updateMany` (anonimização LGPD)
- `src/shared/services/dataSubjectPortability.service.ts:259` — `prisma.timelineEvent.findMany` (portabilidade LGPD — exporta registros soft-deletados hoje)

Ou seja: hoje qualquer `TimelineEvent` soft-deletado continua aparecendo em contagens, listagens e na portabilidade do titular — violação do contrato de soft delete e de minimização LGPD.

### Derivação do schema (verificação executada)

Script de conferência `model` × campos `deletedAt`/`deletedBy`/`deleteReason` em `prisma/schema.prisma`:

- 15 models possuem `deletedAt`.
- `AUDITABLE_MODELS` cobre 14; **único ausente: `TimelineEvent`** (que possui os 3 campos completos).

## 2. Correção proposta

**Opção recomendada (mínima, sem migration):** adicionar `'TimelineEvent'` a `AUDITABLE_MODELS` em `src/lib/prisma-interceptors.ts` e cobrir com teste unitário (ex.: `isAuditableModel('TimelineEvent') === true` e `applySoftDeleteReadFilter` injeta `deletedAt: null`).

Observações:

- `TimelineEvent` **não possui `organizationId`** — o filtro de tenant vem do `lead` pai; a policy RLS existente já governa. A inclusão em `AUDITABLE_MODELS` não altera escopo de tenant (não está em `TENANT_INJECTED_MODELS`).
- Não há chamadas `.delete()`/`.deleteMany()` em `timelineEvent` hoje — a inclusão é segura e corrige o filtro de leitura imediatamente.
- Se algum fluxo futuro precisar de hard delete (ex.: expurgo LGPD do Agente 15), deverá usar `$executeRaw`/client sem extensão ou delete físico explícito documentado.

**Dono do arquivo:** `src/lib/prisma-interceptors.ts` e `src/lib/prisma.ts` não constam na `MATRIZ_PROPRIEDADE.md` — solicitar a 10/00 a confirmação do dono (sugestão: Agente 10 — Mara, dados & persistência; o arquivo nasceu da tarefa saneamento-013 executada pelo Agente 01).

## 3. Critérios de aceite

- [ ] `'TimelineEvent'` presente em `AUDITABLE_MODELS`.
- [ ] Teste unitário cobrindo `isAuditableModel('TimelineEvent')` e filtro `deletedAt: null` em `findMany`/`count`.
- [ ] Opcional (débito): teste de paridade schema↔AUDITABLE_MODELS que falhe quando um model ganhar `deletedAt` sem entrar na lista (previne reincidência — a Onda 2 já reincidiu).

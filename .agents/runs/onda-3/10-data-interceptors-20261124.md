# ONDA 3 — Relatório: Agente 10 (Mara) · ONDA3-10-DATA-INTERCEPTORS

- **Data:** 2026-11-24
- **Worktree:** `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-10-data-interceptors`
- **Branch:** `agente/10-data-interceptors-onda3` · **Base:** `ca4abcf17` (`integracao/onda-3-dem20261123`)
- **Demanda:** DEM-20261123-001 · **Runtime:** Devin (subagente)
- **Ownership exercido:** `src/lib/prisma-interceptors.ts`, `src/lib/prisma.ts`, `src/lib/__tests__/prisma-interceptors.unit.test.ts` (+ handoff/run docs em `.agents/`)

## Escopo executado

### Defeito A — TimelineEvent fora de AUDITABLE_MODELS (CORRIGIDO)

- `src/lib/prisma-interceptors.ts`: `'TimelineEvent'` adicionado a `AUDITABLE_MODELS` (agora 15 models = exatamente os 15 models com `deletedAt` no `schema.prisma`, verificado por diff manual do DMMF e travado por teste de paridade).
- Efeito: leituras (`findFirst/findFirstOrThrow/findMany/count/aggregate/groupBy`) passam a filtrar `deletedAt: null`; `findUnique/findUniqueOrThrow` com select parcial ganham o tratamento de soft delete; `delete/deleteMany` viram soft delete + `AuditLog` (antes: hard delete sem trilha).
- **Impacto LGPD confirmado e corrigido:** `dataSubjectPortability.service.ts:259` (`prisma.timelineEvent.findMany`) não exporta mais eventos soft-deletados; `dataSubjectErasure.service.ts` (updateMany de redação) não é afetado. TimelineEvent não tem `organizationId` — `AuditService.log` usa `tenantId` do requestContext e cai para `''` sem quebrar (verificado em `audit.service.ts`).
- Comentário DEBT-0056 atualizado (contagem de models derivada do schema).

### Defeito B — 4 models auditáveis sem deletedBy/deleteReason (MITIGADO + handoff)

- **Decisão: tolerância por model** (detalhes e justificativa no handoff `10-para-11-12-modelos-auditaveis-sem-deletedby.md`). Fail-fast descartado: crash latente em caminho real (fixtures de integração já chamam `cadenceSequence.delete/deleteMany` e `agentSession.deleteMany`) sem ganho de segurança — `deletedAt` + AuditLog + RLS já cobrem a trilha.
- Nova função pura `buildSoftDeleteData(model, userId, reason)` em `prisma-interceptors.ts`: deriva campos do `Prisma.dmmf` (metadado estático, mesmo padrão de `tenant-scoping-registry.ts` — sem instanciar client/pool) e escreve só o que existe no schema. Model fora do DMMF → comportamento legado completo (fail-fast ruidoso).
- `src/lib/prisma.ts`: os 3 literais inline de soft delete (`delete`, `deleteMany`, cascade) substituídos pelo helper; cascade agora chama o helper por model de destino (Contact/Lead/Activity — todos completos hoje).
- Schema/migrations **não tocados** (proibido). Colunas `deletedBy`/`deleteReason` nos 4 models seguem como melhoria pendente de 11/12 + aprovação humana — se criadas, o helper passa a escrevê-las automaticamente (zero código).

### Cobertura do diff schema × AUDITABLE_MODELS

- 15 models com `deletedAt` no schema; os 15 agora em `AUDITABLE_MODELS`. Nenhum outro model com `deletedAt` fora da lista. Paridade travada por teste estrutural novo.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/prisma-interceptors.ts` | +`Prisma` import (dmmf), +`TimelineEvent` em AUDITABLE_MODELS, +`DMMF_MODEL_FIELDS`/`buildSoftDeleteData`, comentário DEBT-0056 ajustado |
| `src/lib/prisma.ts` | import `buildSoftDeleteData`; 3 caminhos de soft delete usam o helper (com casts `Prisma.*UpdateManyMutationInput` no cascade tipado) |
| `src/lib/__tests__/prisma-interceptors.unit.test.ts` | +3 testes (TimelineEvent auditável, paridade DMMF↔AUDITABLE_MODELS, buildSoftDeleteData ×3 cenários) |
| `.agents/handoffs/onda-3/10-para-11-12-modelos-auditaveis-sem-deletedby.md` | handoff formal Defeito B |
| `.agents/runs/onda-3/10-data-interceptors-20261124.md` | este relatório |

## Verificação executada

| Comando | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts src/lib/__tests__/prisma-interceptors.unit.test.ts tests/unit/lib/prisma-interceptors.test.ts` | **49/49 passaram** (28 + 21) |
| `npm run typecheck` (`tsc --noEmit`) | **0 erros** |
| `npx biome lint` nos 3 arquivos alterados | **limpo** |

Testes de integração (`tests/integration/**`, ex.: `cadence-*.test.ts`, `rls-tenant-isolation.test.ts`, `timeline.test.ts`, `voice-hub-rls.test.ts`) **não executados** — exigem Postgres+RLS real e estão fora do escopo de testes direcionados da missão; ficam para o gate de integração coordenado pelo Agente 00. Recomendo incluí-los no lote de integração: eles exercitam exatamente os caminhos alterados (deleteMany de CadenceSequence/AgentSession/TimelineEvent).

## Riscos / pendências / limitações conhecidas

1. **Includes aninhados não são interceptados** (limitação arquitetural pré-existente, afeta TODOS os models auditáveis): `prisma.lead.findUnique({ include: { timeline: true } })` não passa por `applySoftDeleteReadFilter` — o filtro `deletedAt:null` só vale para operações top-level do model. Repositórios já filtram manualmente nos includes críticos (ex.: `PrismaLeadRepository`). Não corrigi — reescrever `include`/`select` aninhados é mudança arquitetural maior, fora do escopo; registrado para ciência do coordenador.
2. **Fixtures de teste** que fazem `timelineEvent.deleteMany()` agora geram soft delete (linhas permanecem com `deletedAt` preenchido). Leituras/counts filtram, então suites devem seguir verdes; acúmulo de linhas mortas em `_test` é aceitável, mas se alguma suite depender de ausência física, abrir handoff ao Agente 08.
3. **AuditLog de TimelineEvent** usa `tenantId` do requestContext; chamadas fora de contexto gravam `tenantId=''` (comportamento já existente do AuditService para models sem organizationId — ex.: Verification). Aceitável; se quiserem tenant obrigatório, é decisão de schema/domínio.
4. **Defeito B — schema pendente**: handoff `10-para-11-12-...` aberto para colunas `deletedBy`/`deleteReason` nos 4 models (aditivo, baixa prioridade).
5. **Ownership gap**: `src/lib/prisma-interceptors.ts`/`src/lib/prisma.ts` não constam na MATRIZ_PROPRIEDADE — designado ad-hoc pelo coordenador nesta onda. Sugiro formalizar dono (Squad 10 / Mara) na próxima revisão da matriz.

## Commits

(registrados abaixo após commit — ver `git log agente/10-data-interceptors-onda3`)

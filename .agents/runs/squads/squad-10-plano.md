# PLANO DO SQUAD 10 — DADOS, BANCO E MULTI-TENANCY (DEM-20261123-001)

- **Coordenador:** Agente 10 — Mara (Devin, sessão `squad-10-coord-20261124-devin`)
- **Data:** 2026-11-24
- **Branch de integração do squad:** `coord/squad-10` (→ `integracao/squad-10` na 1ª entrega auditada)
- **Worktree do coordenador:** `C:/Github/Birthub-360-worktrees/squads/squad-10/wt-coord`
- **Base de corte:** `93e82c220` (head de `integracao/onda-3-dem20261123`)
- **node_modules:** junction → `C:\Github\Birthub-360\node_modules`
- **Lease:** `.agents/runs/leases/squad-10.lease` (expira 2026-11-24T22:01Z, renovável)
- **Portas efêmeras do squad:** faixa 22100–22199 (regra 22000 + NN*10)
- **Postura:** NO-GO até homologação humana; sem push/PR/main.

## 1. Modo de operação

Não há ferramenta de subagente disponível nesta sessão → Mara executa as missões priorizadas diretamente e emite plano de despacho para executores quando houver slots livres. Capacidade conservadora: máx. 3 executores concorrentes (estrutura §5). Cada executor usará branch `agente/<id>-<slug>-s10` e worktree `squads/squad-10/wt-<id>`.

## 2. Backlog priorizado (ordem de execução)

| # | Agente | Missão | Ownership | Depende de | Status |
|---|--------|--------|-----------|------------|--------|
| M1 | 10 Mara | Verificar estado do interceptor soft-delete (`TimelineEvent`, `buildSoftDeleteData`) + teste unitário dirigido | `src/lib/db/index.ts`, `src/lib/prisma.ts`, `src/lib/prisma-interceptors.ts`, `src/lib/__tests__/prisma-interceptors.unit.test.ts` | — | **EXECUTADO** (ver §4) |
| M2 | 10 Mara | Proposta de schema/migration aditiva (`deletedBy`/`deleteReason` em Agent, AgentSession, CadenceSequence, Workflow) — SEM aplicar; decisão humana → 11/12 | Proposta em `.agents/handoffs/squad-10/` | Handoff 20→11/12 (`.agents/handoffs/onda-3/`) | **EXECUTADO** (doc emitido) |
| M3 | 11 Pietro | Auditoria `prisma/schema.prisma`: FKs `ON DELETE RESTRICT`, índices, paridade `deletedAt`↔`AUDITABLE_MODELS` | `prisma/schema.prisma` | — | DESPACHO (aguarda slot) |
| M4 | 12 Vera | Auditoria `prisma/migrations/**`: zero downtime B-05, rollback, ordem | `prisma/migrations/**` | M3 (parcialmente independente — pode iniciar com inventário) | DESPACHO |
| M5 | 13 Nilo | Erros 42501 residuais + cobertura RLS 100% | `src/lib/tenant-prisma.ts`, `scripts/security/rls-coverage.ts`, `check-rls-coverage.ts`, `supabase/migrations/**` | — | DESPACHO |
| M6 | 15 Olavo | Retenção/expurgo sem mutar `AuditLog` (alinhado 08-Dora) | `src/lib/db/retention/**` | Handoff 08 (LGPD) já integrado (`f2011442e`) | DESPACHO |
| M7 | 19 Bruno | Backup/restore e integridade referencial; bloqueio dumps no Git (B-14) | `scripts/backup/**`, `scripts/verify-integrity.ts` | — | AVALIAR → planejar |
| M8 | 16 Cora | N+1 queries e índices (parceria Squad 40) | `src/lib/db/queries/**` | Levantamento de queries quentes | AVALIAR |
| M9 | 17 Remo | Cache Redis por tenant, TTL, locks distribuídos | `src/lib/cache/**`, `redis.config.ts` | — | AVALIAR |
| M10 | 18 Ayla | Lineage/auditoria de dados, `isAuditableModel`, proveniência | `src/features/audit-logs/**` | M1, contratos 07/08/20 | AVALIAR |

Ordem de despacho inicial (respeitando exclusão mútua 11↔12 e capacidade ≤3):

1. **Onda A (agora):** 11 Pietro (auditoria schema — leitura/análise primeiro, commits só se houver correção de ownership clara) + 13 Nilo (RLS/42501 — independente de schema) + 12 Vera (inventário de migrations — leitura; escrita só após parecer do 11).
2. **Onda B:** 15 Olavo (retenção) + 19 Bruno (backup/integridade) — após M2 decidido ou em paralelo pois não tocam schema.
3. **Onda C:** 16/17/18 conforme folga do scheduler e dependências.

## 3. Riscos e bloqueios

- **R1 — Decisão de schema pendente (humana):** migration aditiva `deletedBy`/`deleteReason` nos 4 models (Agent, AgentSession, CadenceSequence, Workflow) está proposta, NÃO aplicada. Mitigação em código já integrada (`buildSoftDeleteData` DMMF-driven). Sem decisão, `buildSoftDeleteData` segue escrevendo só `deletedAt` — comportamento correto, apenas sem metadados de exclusão.
- **R2 — Exclusão mútua 11↔12:** nunca despachar escrita simultânea em `prisma/schema.prisma` e `prisma/migrations/**`. 12 só cria migration após schema aprovado.
- **R3 — 42501 residual:** depende de banco de teste por squad; usar schema/banco exclusivo do squad 10 quando houver mutação (estrutura §4). Não compartilhar banco de escrita.
- **R4 — AuditLog imutável:** qualquer expurgo (Olavo/Dora) não pode mutar `AuditLog`; anonimização segue `dataSubjectErasure.service.ts`.
- **R5 — Suites pesadas em fila:** `test:integration`/`test:e2e`/build só 1 por vez no squad.

## 4. Evidências desta sessão

- Worktree `wt-coord` criado em `93e82c220`, branch `coord/squad-10`.
- Junction `node_modules` criada.
- Lease registrado.
- `npx vitest run -c vitest.unit.config.ts src/lib/__tests__/prisma-interceptors.unit.test.ts` → **28/28 testes PASS** (3.61s).
- Verificação de schema: os 4 models (`Agent`, `AgentSession`, `CadenceSequence`, `Workflow`) confirmados com apenas `deletedAt` — sem `deletedBy`/`deleteReason`.
- `TimelineEvent` já consta em `AUDITABLE_MODELS` (`src/lib/prisma-interceptors.ts:190`) — handoff 20→10 resolvido na baseline.

## 5. Handoffs emitidos nesta sessão

- `.agents/handoffs/squad-10/10-para-11-12-proposta-deletedby-deletereason.md` — proposta de migration aditiva (SEM aplicar; decisão humana).
- `.agents/handoffs/squad-10/10-para-00-relatorio-sessao-coordenacao.md` — relatório MISSÃO/AGENTE/BRANCH/WORKTREE/SHA/STATUS ao Astra.

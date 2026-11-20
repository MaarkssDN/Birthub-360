# Handoff & Relatório de Execução — Onda 2 (Squad 00 & 10: Dados & QA)

- **Coordenador:** Agente 10 — Mara
- **Onda / Base / Branch:** Onda 2 · `integracao/onda-2` · `agente/10-onda2-dados-qa`
- **Princípios seguidos:** P1–P4 (alterações cirúrgicas, testes Vitest executados, arquivos alheios do working tree preservados).

---

## 1. `[09 · Silas]` Verificação de hash SHA-256 em `.agents/reviews/` para CI — **CONCLUÍDO (`[x]`)**

- **Arquivos criados:**
  - `scripts/governance/verify-review-hashes.ts` — calcula SHA-256 (com normalização CRLF→LF para portabilidade Windows/Linux) de todos os pareceres sob `.agents/reviews/**`, compara com o manifesto e falha com exit code `1` se houver parecer adulterado, removido ou não registrado. Suporta `--update` para emissão de novos pareceres pelo Agente 09.
  - `scripts/governance/review-hashes.manifest.json` — manifesto com os 454 arquivos atuais de `.agents/reviews/`.
  - `tests/unit/governance/verify-review-hashes.test.ts` — 6 testes unitários cobrindo cálculo recursivo POSIX, normalização CRLF/LF, manifesto íntegro, detecção de arquivo alterado/removido/não-registrado e manifesto ausente.
- **Evidência:**
  - `npx tsx scripts/governance/verify-review-hashes.ts` → `Pareceres de .agents/reviews/ íntegros.` (exit 0)
  - `npx vitest run tests/unit/governance/verify-review-hashes.test.ts` → `6 passed (6)`

---

## 2. `[16 · Cora]` Auditoria e teste de ausência de N+1 em `PrismaContactRepository` e `PrismaActivityRepository` — **CONCLUÍDO (`[x]`)**

- **Verificação realizada (sem alterar comportamento):**
  - `PrismaLeadRepository.findAllWithFilters` já possuía carregamento em lote de `company`, `contact` e `copilotoDealHealthSnapshot` (`distinct: ['leadId']`, coberto por `src/features/crm/infra/__tests__/PrismaLeadRepository.test.ts`).
  - `PrismaContactRepository` (`src/features/contacts/infra/PrismaContactRepository.ts`):
    - `findAllWithFilters`: executa 1 `prisma.contact.findMany` com `include: { company: true }` + 1 `prisma.contact.count` via `prisma.$transaction`. Zero N+1.
    - `findById`: executa 1 `prisma.contact.findFirst` com `include: { company: true, leads: true }`. Zero N+1.
  - `PrismaActivityRepository` (`src/features/activities/infra/PrismaActivityRepository.ts`):
    - `findAllPaginated`, `findRange` e `findAllWithFilters`: executam 1 `prisma.activity.findMany` com `include: { lead: { include: { company: true, contact: true } } }`. Zero N+1 (inclusive quando consumido por `ActivityUseCases.generateIcalFeed`).
- **Arquivo criado:**
  - `tests/unit/db/crm-repositories-n-plus-one.test.ts` — 3 testes garantindo o contrato de query única com `include` aninhado em `PrismaContactRepository` e `PrismaActivityRepository`.

---

## 3. `[11 · Pietro]` `onDelete: Cascade` → Soft Delete / `Restrict` em `Activity` e `TimelineEvent` — **HANDOFF EMITIDO (`[ ]` aguardando aprovação humana)**

- **Regra respeitada:** `prisma/schema.prisma` e `prisma/migrations/**` são bloqueadores exclusivos (Pietro 11 + Vera 12, `AGENTS.md` §14). O schema **não foi alterado**.
- **Handoff detalhado:** `.agents/handoffs/onda-2-10-para-11-12-soft-delete-activity-timeline.md` contendo:
  1. Diagnóstico das linhas 750–800 (`Activity` já possui `deletedAt`/`deletedBy`/`deleteReason`, mas mantém `onDelete: Cascade` e hard delete no repositório; `TimelineEvent` não possui `deletedAt` e usa `onDelete: Cascade`).
  2. Diff proposto para `prisma/schema.prisma` (`onDelete: Restrict` + campos `deletedAt`, `deletedBy`, `deleteReason` em `TimelineEvent` + índices compostos `[organizationId, deletedAt, date]` e `[leadId, deletedAt, createdAt]`).
  3. Plano de migração Zero-Downtime em 2 fases conforme `prisma/migrations/MIGRATION_ZERO_DOWNTIME_CHECKLIST.md` (Fase 1: Expand nullable + `CREATE INDEX CONCURRENTLY` + filtro `deletedAt: null` nos repositórios; Fase 2: troca das FKs para `ON DELETE RESTRICT NOT VALID` + `VALIDATE CONSTRAINT` com `lock_timeout = '3s'`).

---

## 4. `[02 · Bento]` Avaliação de Testcontainers Redis para testes de integração — **HANDOFF EMITIDO (`[ ]` bloqueado por daemon Docker indisponível)**

- **Diagnóstico do ambiente:**
  - Binário `docker` instalado (`Docker version 29.9.3, build 5457199`), porém o daemon (`npipe:////./pipe/dockerDesktopLinuxEngine`) **não está em execução** neste host Windows (`failed to connect to the docker API ... O sistema não pode encontrar o arquivo especificado`).
  - O pacote `testcontainers` (`^11.14.0`) já está instalado no projeto e configurado em `vitest.container.config.ts` (`tests/container/**/*.test.ts`, condicionado à flag `RUN_INFRA_TESTS=1`, como em `tests/container/postgres.test.ts`).
- **Plano de adoção para o Agente 02 (Bento) quando o runner com Docker estiver ativo:**
  1. Criar `tests/container/redis.test.ts` (ou helper `tests/container/helpers/redisContainer.ts`) subindo `new GenericContainer('redis:7-alpine').withExposedPorts(6379).withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))`.
  2. Injetar `REDIS_URL=redis://${host}:${mappedPort}` antes de importar `src/lib/redis.ts` / `src/lib/queue/distributedLock.ts` nos testes de integração de lock distribuído, rate limit e idempotência BullMQ.
  3. Manter gate `process.env.RUN_INFRA_TESTS === '1'` em `vitest.container.config.ts` para não quebrar ambientes locais sem daemon Docker ativo, e habilitar `RUN_INFRA_TESTS=1` no job de CI com serviço Docker disponível.

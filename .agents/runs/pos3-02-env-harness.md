# POS3-02-ENV-HARNESS — Runbook do harness isolado de integração

**Agente:** 02 — Bento (Test Harness & Ambiente de Execução, Squad 00)
**Data:** 2026-11-26 · **Branch:** `agente/02-env-harness-s00` · **Worktree:** `wt-02-env-harness`
**Revisão:** v2 — correções do REPROVADO do Agente 09 (Silas) sobre `22f48da75` (ver §8).
**Status:** harness ENTREGUE e validado estaticamente; execução real BLOQUEADA neste host (ver §5).

## 1. O que foi entregue

| Artefato | Papel |
|---|---|
| `tests/setup/docker-compose.pos3-02-test.yml` | Stack isolado `pos3-02-env-harness`: `pos3_02_postgres` (pgvector/pgvector:pg17 **digest-pinado**, :5434), `pos3_02_redis` (redis:7-alpine digest-pinado, :6379), `pos3_02_meilisearch` (v1.6 digest-pinado, :7701). Volumes `pos3_02_*`, `restart: 'no'`, healthchecks, bind só em 127.0.0.1. Vive em `tests/setup/` = ownership nominal do Agente 02 na MATRIZ. |
| `tests/setup/pos3-02-env-harness.mjs` | Bootstrap end-to-end **na ordem correta**: `compose up --wait` → cria `prospectordb_pos3_02_test` → papéis/extensões (`create-app-role.sql.tpl`) → `.env.test` → trava `assertTestDatabaseSafety` → `prisma generate` + `migrate deploy` → **seed compliance (depois das tabelas existirem)** → vitest → `compose down` garantido em `finally`. |
| `.env.test` gerado | `DATABASE_URL`/`DIRECT_URL` → banco `prospectordb_pos3_02_test` em :5434; `REDIS_URL` → `redis://:***@localhost:6379/2` (DB index 2, isolado do index 1 da stack compartilhada); `MEILI_HOST` :7701 do `.env.test.example` preservado. |

Isolamento: prefixo `pos3_02_` em containers/volumes + banco dedicado + Redis DB index dedicado.
O seed de compliance (`compliance-baseline-org`) é idempotente e nunca toca `test-org-id`.

## 2. Inventário do que já existia (não dupliquei)

- `vitest.integration.config.ts`: 2 projetos (`integration` node + `integration-ui` jsdom), `fileParallelism:false`, `hookTimeout/testTimeout: 30s`, coverage em `coverage/integration`.
- `tests/helpers/integration-setup.ts`: seatbelt exige `DATABASE_URL` com "test" no nome do banco; seed `test-org-id`; limpeza por tenant; mock de meilisearch.
- `scripts/test/prepare-integration-env.js`: trava `assertTestDatabaseSafety` (NODE_ENV=test, sufixo `_test`, bloqueio de hosts prod), criação de `.env.test`, bootstrap de banco/papéis — **acoplado aos nomes `birthhub_*`**. Meu script reutiliza suas funções puras (`buildComplianceSeedSql`, `assertTestDatabaseSafety`, `parseDotEnvContent`, `dockerRemoteHost`, `rewriteEnvTestForRemoteDocker`) via import — **o arquivo não foi alterado**.
- `docker-compose.postgres-local.yml` + `scripts/db/*`: initdb de papéis reutilizado via mounts no meu compose (somente `create-app-role.sql.tpl` + `docker-init.sh`).
- CI (`.github/workflows/ci.yml`): service containers `pgvector/pgvector:pg16` + `redis:7` nas portas 5434/6379 — a suíte já é desenhada para esse contrato.

## 3. Como usar

```bash
# Fluxo completo (sobe → papéis → migra → seed → roda as 3 suítes de cadência → derruba):
node tests/setup/pos3-02-env-harness.mjs

# Qualquer suíte de integração:
node tests/setup/pos3-02-env-harness.mjs -- tests/integration/cadenceRun.worker.test.ts
node tests/setup/pos3-02-env-harness.mjs --keep-up          # deixa de pé p/ iterar
node tests/setup/pos3-02-env-harness.mjs --down             # derruba (volumes ficam)
node tests/setup/pos3-02-env-harness.mjs --down --purge     # derruba + zera volumes
node tests/setup/pos3-02-env-harness.mjs --db prospectordb_meu_worktree_test
node tests/setup/pos3-02-env-harness.mjs --skip-migrate     # só com volume já migrado
```

Alternativa manual: `docker compose -f tests/setup/docker-compose.pos3-02-test.yml up -d --wait` + os passos do script.

## 4. Convivência com a stack compartilhada

Os DOIS ambientes publicam 5434/6379/7701 — **nunca rode ao mesmo tempo**. Se `docker compose up`
falhar com bind/porta ocupada, a stack `birthhub_*` está de pé: derrube-a
(`docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml down`) ou use o outro
harness. Não alterei `docker-compose.yml`/`docker-compose.postgres-local.yml` (propriedade do
Agente 93 — Max).

## 5. Bloqueios reais observados neste host (2026-11-26)

1. **Docker indisponível**: `docker.exe` existe (WinGet Docker.CLI) mas é bloqueado por política
   de Controle de Aplicativo ("Uma política de Controle de Aplicativo bloqueou este arquivo").
   Docker Desktop **não está instalado** (`C:\Program Files\Docker\Docker` ausente), nenhum
   daemon/processos docker, **sem distros WSL**, sem podman. Portas 5434/6379/5432 recusam
   conexão; nenhum serviço postgres/redis nativo.
2. **`node_modules` em reinstalação**: o junction aponta para `D:\Github\Birthub-360\node_modules`
   (checkout principal) que está sendo reinstalado — `.bin/` ausente, `vitest`/`prisma` não
   resolvíveis agora.
3. **`.env`/`.env.test` ausentes neste worktree** (só `.example`) — o script gera `.env.test`
   sozinho, mas a execução depende dos itens 1–2.

**Consequência**: as 3 suítes de cadência e o smoke de integração **não puderam ser executados
neste host** — não é skip nem falha de código; é indisponibilidade de infraestrutura. Em host com
Docker funcional, o comando único da §3 executa tudo. No CI, o job `build-and-test` já cobre a
suíte com service containers equivalentes.

## 6. Verificações realizadas

- `node --check tests/setup/pos3-02-env-harness.mjs` → OK.
- `python -c yaml.safe_load(tests/setup/docker-compose.pos3-02-test.yml)` → OK.
- `node tests/setup/pos3-02-env-harness.mjs --down` → aborta com a mensagem de bloqueio esperada (exit 1) — fail-fast validado, sem `process.exit` prematuro.
- `git diff --check` → limpo.
- Ordem bootstrap conferida contra `create-app-role.sql` (papéis antes das migrations, que rodam como `prospector_migrator` via `DIRECT_URL`) e contra `buildComplianceSeedSql` (INSERTs em `Organization`/`OrganizationAiConsent`/`OptOutRecord` — só existem pós-`migrate deploy`).
- Ausência de postgis nas migrations verificada por grep em `prisma/migrations/**` (só `vector`/`pg_trgm`).

## 7. Pendências / handoffs

- **Agente 04 (Téo)**: harness pronto para executar `tests/integration/**` — ver
  `.agents/handoffs/onda-4/02-para-04-env-harness-pronto.md` (atualizado com os novos paths).
- **Agente 00 (Astra)**: registro de ownership — harness realocado para `tests/setup/**`
  (cobertura nominal do Agente 02 na MATRIZ); ver `.agents/handoffs/onda-4/02-para-00-ownership-tests-setup.md`.
- **Decisão humana/orquestrador**: provisionar Docker neste host (ou rodar a validação em CI/outro
  worktree Linux) para obter o resultado real pass/fail das suítes de cadência.
- Se a stack `pos3_02_*` precisar de Postgres 16 (paridade exata com CI), trocar a imagem para
  `pgvector/pgvector:pg16` + digest correspondente — hoje pg17 por paridade com
  `docker-compose.postgres-local.yml`.
- Se uma migration futura exigir PostGIS: `pgvector/pgvector` não o inclui — usar
  `docker/postgres/Dockerfile` (instala `postgresql-17-postgis-3`) ou imagem equivalente, e
  remontar `scripts/db/02-enable-extensions.sql` no initdb.

## 8. Registro de revisão (REPROVADO → correções)

| # | Achado do Silas | Correção |
|---|---|---|
| 1 | Seed compliance antes de `migrate deploy` falha em banco vazio | Reordenado: papéis/extensões → `.env.test` → `prisma generate`+`migrate deploy` → seed → vitest. Funções separadas: `bootstrapRolesAndExtensions` / `seedComplianceBaseline`. |
| 2 | Initdb monta `02-enable-extensions.sql` que cria `postgis` — ausente em `pgvector/pgvector` | Removidos os mounts de `02-enable-extensions.sql` (postgis) e `03-create-langfuse-db.sql` do compose; restam só `create-app-role.sql.tpl` + `docker-init.sh` (criam `vector`/`pg_trgm`, disponíveis na imagem). Migrations não usam postgis (grep em `prisma/migrations`). `scripts/db/` intocado. Alternativa documentada: `docker/postgres/Dockerfile` se um dia precisar. |
| 3 | `pgvector/pgvector:pg17` sem digest | Pinado `@sha256:b513c48566e4777cd3370451400000c78eda6a08131d68f4c31d4a76f27bd8fd` (manifest list, Docker Hub 2026-11-26) + comentário de atualização. |
| 4 | `fail()` com `process.exit` dentro do try bypassava `finally` → containers zumbis | `fail()` agora lança `HarnessError`; `main()` tem try/catch/finally — qualquer falha pós-`up` executa `compose down` antes de `process.exit`. |
| 5 | `--db` validado só por sufixo + interpolação SQL | Whitelist estrita `^[a-zA-Z_][a-zA-Z0-9_]*_test$` aplicada ao valor; charset sem aspas/operadores torna a interpolação segura; identificador quotado no CREATE DATABASE. |
| 6 | Ownership gap (compose raiz + `scripts/test/`) | Realocados para `tests/setup/` (`docker-compose.pos3-02-test.yml`, `pos3-02-env-harness.mjs`) — dentro de `tests/setup/**`, de propriedade nominal do Agente 02 na MATRIZ. `scripts/test/prepare-integration-env.js` não foi movido (arquivo pré-existente, usado por `pretest:integration`); meu script apenas o importa. Handoff de registro enviado ao Agente 00. |

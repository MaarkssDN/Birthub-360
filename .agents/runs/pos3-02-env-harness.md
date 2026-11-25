# POS3-02-ENV-HARNESS — Runbook do harness isolado de integração

**Agente:** 02 — Bento (Test Harness & Ambiente de Execução, Squad 00)
**Data:** 2026-11-26 · **Branch:** `agente/02-env-harness-s00` · **Worktree:** `wt-02-env-harness`
**Status:** harness ENTREGUE e validado estaticamente; execução real BLOQUEADA neste host (ver §5).

## 1. O que foi entregue

| Artefato | Papel |
|---|---|
| `docker-compose.test.yml` | Stack isolado `pos3-02-env-harness`: `pos3_02_postgres` (pgvector/pgvector:pg17, :5434), `pos3_02_redis` (redis:7-alpine digest-pinado, :6379), `pos3_02_meilisearch` (v1.6 digest-pinado, :7701). Volumes `pos3_02_*`, `restart: 'no'`, healthchecks, bind só em 127.0.0.1. |
| `scripts/test/pos3-02-env-harness.mjs` | Bootstrap end-to-end: `compose up --wait` → cria `prospectordb_pos3_02_test` → roda `create-app-role.sql.tpl` (papéis `prospector_app`/`prospector_migrator` + vector/pg_trgm) → seed de compliance (`buildComplianceSeedSql`, reutilizado de `prepare-integration-env.js`) → gera `.env.test` → trava `assertTestDatabaseSafety` → `prisma generate` + `migrate deploy` → vitest → `compose down` (ou `--keep-up`). |
| `.env.test` gerado | `DATABASE_URL`/`DIRECT_URL` → banco `prospectordb_pos3_02_test` em :5434; `REDIS_URL` → `redis://:***@localhost:6379/2` (DB index 2, isolado do index 1 da stack compartilhada); `MEILI_HOST` :7701 do `.env.test.example` preservado. |

Isolamento: prefixo `pos3_02_` em containers/volumes + banco dedicado + Redis DB index dedicado.
O seed de compliance (`compliance-baseline-org`) é idempotente e nunca toca `test-org-id`.

## 2. Inventário do que já existia (não dupliquei)

- `vitest.integration.config.ts`: 2 projetos (`integration` node + `integration-ui` jsdom), `fileParallelism:false`, `hookTimeout/testTimeout: 30s`, coverage em `coverage/integration`.
- `tests/helpers/integration-setup.ts`: seatbelt exige `DATABASE_URL` com "test" no nome do banco; seed `test-org-id`; limpeza por tenant; mock de meilisearch.
- `scripts/test/prepare-integration-env.js`: trava `assertTestDatabaseSafety` (NODE_ENV=test, sufixo `_test`, bloqueio de hosts prod), criação de `.env.test`, bootstrap de banco/papéis — **mas acoplado aos nomes `birthhub_*`**. Meu script reutiliza suas funções puras (`buildComplianceSeedSql`, `assertTestDatabaseSafety`, `parseDotEnvContent`, `dockerRemoteHost`, `rewriteEnvTestForRemoteDocker`) sem depender dos nomes de container.
- `docker-compose.postgres-local.yml` + `scripts/db/*`: initdb de papéis reutilizado via mounts no meu compose.
- CI (`.github/workflows/ci.yml`): service containers `pgvector/pgvector:pg16` + `redis:7` nas portas 5434/6379 — a suíte já é desenhada para esse contrato.

## 3. Como usar

```bash
# Fluxo completo (sobe → migra → roda as 3 suítes de cadência → derruba):
node scripts/test/pos3-02-env-harness.mjs

# Qualquer suíte de integração:
node scripts/test/pos3-02-env-harness.mjs -- tests/integration/cadenceRun.worker.test.ts
node scripts/test/pos3-02-env-harness.mjs --keep-up          # deixa de pé p/ iterar
node scripts/test/pos3-02-env-harness.mjs --down             # derruba (volumes ficam)
node scripts/test/pos3-02-env-harness.mjs --down --purge     # derruba + zera volumes
node scripts/test/pos3-02-env-harness.mjs --skip-migrate     # schema já migrado
```

Alternativa manual: `docker compose -f docker-compose.test.yml up -d --wait` + os passos do script.

## 4. Convivência com a stack compartilhada

Os DOIS ambientes publicam 5434/6379/7701 — **nunca rode ao mesmo tempo**. Se `docker compose up`
falhar com bind/porta ocupada, a stack `birthhub_*` está de pé: derrube-a
(`docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml down`) ou use o outro
harness. Não alterei `docker-compose.yml`/`docker-compose.postgres-local.yml` (propriedade do
Agente 93 — Max) nem `prepare-integration-env.js` além do necessário (nenhuma alteração foi feita
a ele; só importei funções já exportadas).

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

- `node --check scripts/test/pos3-02-env-harness.mjs` → OK.
- `node scripts/test/pos3-02-env-harness.mjs --down` → aborta com a mensagem de bloqueio esperada (exit 1) — caminho de falha-fast validado.
- YAML do compose validado com `yaml.safe_load` → OK.
- Nomes de banco/roles/senhas conferidos contra `.env.test.example`, `create-app-role.sql` e `prepare-integration-env.js` (sufixo `_test` satisfaz a trava de segurança).

## 7. Pendências / handoffs

- **Agente 04 (Téo)**: o harness está pronto para executar `tests/integration/**` dele assim que
  houver Docker — ver `.agents/handoffs/onda-4/02-para-04-env-harness-pronto.md`.
- **Decisão humana/orquestrador**: provisionar Docker neste host (ou rodar a validação em CI/outro
  worktree Linux) para obter o resultado real pass/fail das suítes de cadência.
- Se a stack `pos3_02_*` precisar de Postgres 16 (paridade exata com CI), trocar a imagem para
  `pgvector/pgvector:pg16` — hoje pg17 por paridade com `docker-compose.postgres-local.yml`.

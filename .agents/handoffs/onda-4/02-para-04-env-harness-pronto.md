# Handoff 02 → 04 — Harness de ambiente de integração pronto (POS3-02-ENV-HARNESS, v2)

**De:** Agente 02 — Bento · **Para:** Agente 04 — Téo · **Data:** 2026-11-26
**Worktree origem:** `wt-02-env-harness` · branch `agente/02-env-harness-s00`
**Revisão:** paths atualizados após REPROVADO do Silas (v1 tinha compose na raiz e script em `scripts/test/`).

## Contexto

Você escreve os TESTES de integração (stage-transitions); eu entrego o AMBIENTE que os executa.
Divisão respeitada: não toquei em `tests/integration/**` (sua propriedade).

## O que usar

```bash
cd <seu worktree>
node <repo>/tests/setup/pos3-02-env-harness.mjs --keep-up -- tests/integration/<seus-arquivos>.test.ts
```

Os artefatos (mergeados na branch acima; se ainda não estiverem no seu worktree, rode a partir do
`wt-02-env-harness` ou copie os 2 arquivos — ambos vivem em `tests/setup/`, meu ownership):

- `tests/setup/docker-compose.pos3-02-test.yml` — stack isolado `pos3_02_*` (PG :5434
  pgvector/pg17 digest-pinado, Redis :6379, Meili :7701), volumes próprios, healthchecks.
- `tests/setup/pos3-02-env-harness.mjs` — sobe stack → cria banco → papéis/extensões →
  `.env.test` → `prisma migrate deploy` → seed compliance → vitest → `down`
  (ou `--keep-up` para iterar; `--down`/`--purge`; `--db <nome>_test` com whitelist estrita).

Detalhes: `.agents/runs/pos3-02-env-harness.md` (runbook completo, §8 tem o mapa das correções).

## Atenção

- Banco isolado é `prospectordb_pos3_02_test` — se precisar de banco próprio por worktree, use
  `--db prospectordb_<seu-nome>_test` (só `[a-zA-Z0-9_]`, precisa terminar em `_test`).
- `--keep-up` deixa os containers de pé para rodadas sucessivas; lembre de `down` ao terminar.
- **Bloqueio conhecido neste host Windows**: Docker CLI bloqueado por App Control e Docker Desktop
  ausente — neste worktree a execução real não foi possível. Se seu ambiente tiver Docker, o
  comando acima resolve; caso contrário, reporte o bloqueio (não é falha dos testes).
- Meilisearch é mockado em `integration-setup.ts`, mas o serviço sobe mesmo assim (paridade com
  `.env.test.example` :7701).
- Postgres da imagem `pgvector/pgvector` NÃO tem PostGIS — as migrations atuais não precisam;
  se alguma migration sua exigir, avise que eu ajusto a imagem (Dockerfile próprio do repo).

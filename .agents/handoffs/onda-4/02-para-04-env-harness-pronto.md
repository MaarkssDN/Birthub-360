# Handoff 02 → 04 — Harness de ambiente de integração pronto (POS3-02-ENV-HARNES)

**De:** Agente 02 — Bento · **Para:** Agente 04 — Téo · **Data:** 2026-11-26
**Worktree origem:** `wt-02-env-harness` · branch `agente/02-env-harness-s00`

## Contexto

Você escreve os TESTES de integração (stage-transitions); eu entrego o AMBIENTE que os executa.
Divisão respeitada: não toquei em `tests/integration/**` (sua propriedade).

## O que usar

```bash
cd <seu worktree>
node <repo>/scripts/test/pos3-02-env-harness.mjs --keep-up -- tests/integration/<seus-arquivos>.test.ts
```

O script (mergeado na branch acima; se ainda não estiver no seu worktree, rode a partir do
`wt-02-env-harness` apontando os arquivos por caminho absoluto ou copie os 2 artefatos):

- `docker-compose.test.yml` — stack isolado `pos3_02_*` (PG :5434 pgvector/pg17, Redis :6379,
  Meili :7701), volumes próprios, healthchecks.
- `scripts/test/pos3-02-env-harness.mjs` — sobe stack → cria `prospectordb_pos3_02_test` →
  papéis app/migrator + extensões → seed compliance → `.env.test` → `prisma migrate deploy` →
  vitest → `down` (ou `--keep-up` para iterar).

Detalhes: `.agents/runs/pos3-02-env-harness.md` (runbook completo).

## Atenção

- Banco isolado é `prospectordb_pos3_02_test` — se precisar de banco próprio por worktree, use
  `--db prospectordb_<seu-nome>_test` (precisa terminar em `_test`).
- `--keep-up` deixa os containers de pé para rodadas sucessivas; lembre de `down` ao terminar.
- **Bloqueio conhecido neste host Windows**: Docker CLI bloqueado por App Control e Docker Desktop
  ausente — neste worktree a execução real não foi possível. Se seu ambiente tiver Docker, o
  comando acima resolve; caso contrário, reporte o bloqueio (não é falha dos testes).
- Meilisearch é mockado em `integration-setup.ts`, mas o serviço sobe mesmo assim (paridade com
  `.env.test.example` :7701).

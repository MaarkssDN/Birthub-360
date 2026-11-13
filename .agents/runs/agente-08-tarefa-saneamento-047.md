# Run — Agente 08 — TAREFA-SANEAMENTO-047 (BT360-DT-0047)

Onda: W5 | Branch: `agente/08-w5-qa` | Worktree: `agente-08-w5-qa`

## Escopo
`docs/development/LOCAL_FIRST.md` — overlay PostgreSQL no bootstrap local.

## Diagnóstico
Documento já correto desde `63f59a064`: comando `docker compose -f
docker-compose.yml -f docker-compose.postgres-local.yml up -d` presente (linha 77);
overlay define `postgres` em 5434 com pgvector.

## Entrega
`tests/unit/ci/local-first-docs.test.ts` — 2 casos que falham se o runbook
omitir o overlay ou perder a referência a 5434.

## Gates
- vitest alvo: 2/2 PASS
- `docker compose config` não executado (sem Docker daemon nesta sessão);
  validação é documental via teste de conteúdo.

# Run — Agente 08 — TAREFA-SANEAMENTO-024 (BT360-DT-0045)

Onda: W5 | Branch: `agente/08-w5-qa` | Worktree: `agente-08-w5-qa`

## Escopo
`Dockerfile` / `package-lock.json` — reinstalação da Prisma CLI pós-prune.

## Diagnóstico
Correção já existente desde `508a05271` (Onda 0): versão exata capturada do
node_modules do `npm ci`, reinstall pinado `prisma@${prisma_version}`,
postinstall do schema-engine com verificação de existência, e guard de
divergência CLI/lock/client que falha o build. prisma 7.10.0 consistente.

## Entrega
`tests/unit/ci/dockerfile-prisma-pin.test.ts` — 6 casos, incluindo execução real
de `scripts/verify-docker-context.mjs` (orphan gate agora coberto pelo test:unit).

## Gates
- vitest alvo: 6/6 PASS
- `node scripts/verify-docker-context.mjs` — PASS standalone e via teste

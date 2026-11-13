# Run — Agente 08A — TAREFA-SANEAMENTO-026 (BT360-DT-0049)

Onda: W5 | Branch: `agente/08A-w5-gitops` | Base: 5d3f267e1

## Escopo
`.github/workflows/ci.yml` — cache de dependências.

## Diagnóstico
`cache: 'npm'` já presente nos 2 jobs; faltava cache dos engines Prisma.

## Entrega
Step `Cache Prisma engines` (actions/cache v6.1.0 SHA-pinado) após cada
`npm ci`, paths `node_modules/.prisma`, `node_modules/@prisma/engines`,
`~/.cache/prisma`, chave `prisma-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`.

## Gates
- vitest `w5-gitops-governance.test.ts`: casos de cache PASS.
- `npx tsc --noEmit` PASS.

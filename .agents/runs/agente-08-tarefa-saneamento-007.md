# Run — Agente 08 — TAREFA-SANEAMENTO-007 (BT360-DT-0044)

Onda: W5 | Branch: `agente/08-w5-qa` | Worktree: `agente-08-w5-qa`

## Escopo
`vitest.unit.config.ts` — descoberta de testes co-localizados em `src/features`.

## Diagnóstico
Dívida já corrigida pelo commit `8b120cca4` (2026-10-17): `src/**/*.test.ts` e
`src/**/*.test.tsx` presentes no `include`. Censo: 234 arquivos de teste em
`src/features`, 0 fora dos padrões; 0 `*.spec.*` sob `src/`.

## Entrega
`tests/unit/config/vitest-discovery.test.ts` — guarda de regressão (4 casos):
include obrigatório presente, nenhum órfão de descoberta em `src/`+`tests/unit/`,
nenhum padrão morto, caminho de falha documentado (`*.spec.*`/`__tests__` sem
`.test` não roda).

## Gates
- vitest alvo: 4/4 PASS (e 12/12 junto com os outros 2 testes da onda)
- `npx tsc --noEmit` — ver resultado no relatório da onda
- `npm run lint` — sem novos problemas (testes/ não é lintado pelo biome)

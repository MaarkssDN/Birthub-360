# Run — Agente 18 — TAREFA-SANEAMENTO-037 (BT360-DT-0083)

Onda: W5 | Branch: `agente/18-w5-contratos` | Base: 5d3f267e1

## Diagnóstico
O Passe 2 de `scripts/verify-openapi-drift.ts` já era recursivo
(`router.use` aninhado, commit `97ebdd73e`) e o CLI sai 0 com 75 routers
resolvidos — Hub de Inteligência/Timeline coberto. Lacuna real: os helpers
não eram exportados, então a cobertura não tinha teste de regressão.

## Entrega
- `scripts/verify-openapi-drift.ts`: helpers exportados + `main()` só roda em
  execução direta (sem efeito colateral em import).
- `tests/unit/contracts/verify-openapi-drift.test.ts`: 3 casos —
  repo real sem deriva (>50 routers), documento vazio gera findings
  (falha detectada), prefixos `/intelligence` e `/market-intelligence` sem
  vazamento.

## Gates executados
- vitest contratos (3 arquivos): 13/13 PASS
- `npx tsx scripts/verify-openapi-drift.ts`: exit 0 (CLI preservado)
- `npx tsc --noEmit`: ver resultado no commit

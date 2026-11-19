De: Agente 24
Para: Agente 00
Onda: saneamento-handoffs-20261114
Status: aberto
Prioridade: normal
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

Gate verify:ownership-coverage cobre só o bloco fenced do AGENTS.md §15 — regras de aprovação de server.ts/package.json/lockfile estão em prosa e não são cobertas.

## Arquivo(s) envolvido(s)

scripts/governance/check-ownership-coverage.ts + ownership-coverage.manifest.json

## Evidência

Parecer 24, ressalva do PR #309.

## Alteração necessária

Estender o manifesto/parse para incluir as regras de aprovação em prosa (server.ts, package.json, lockfile) ou documentar explicitamente como "fora do gate — aprovação manual do 00".

## Teste esperado

Gate falha se server.ts/package.json forem alterados sem registro de aprovação.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

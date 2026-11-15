De: Agente 24
Para: Agente 05
Onda: saneamento-handoffs-20261114
Status: aberto
Prioridade: alto
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

GET /search-runs/:searchId devolve SearchRun completo sem escopo de tenant.

## Arquivo(s) envolvido(s)

src/features/prospecting/outbound/server/routes/system.routes.ts (ou rota equivalente)

## Evidência

Parecer 24, ressalva F3 do PR #323.

## Alteração necessária

Aplicar filtro company na query do search-run (via lead/user/company conforme o modelo).

## Teste esperado

Search-run de outra company → 404.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

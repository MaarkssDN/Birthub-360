De: Agente 24
Para: Agente 05
Onda: saneamento-handoffs-20261114
Status: resolvido
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

## Resolução

**Agente 05 — 2026-11-17** (branch `agente/05-handoffs-20261117`)

Correção portada da branch `agente/05-onda1-handoffs` (commit `5aec9295b`): `GET /search-runs/:searchId` em `src/features/prospecting/outbound/server/routes/system.routes.ts` (~L68-90) exige `requireTenantScope` (router-level) e compara `normalizeTenantCompany(run.request.company)` com `tenantCompany(req)` — mismatch ou run sem company registrada → 404. O tipo `SearchRunRequest.company` foi corrigido de `'atlas' | 'totaltrac'` para `string` em `observability.ts` (o campo sempre recebeu string livre, ex.: 'birthhub360').

Teste: `tests/unit/features/prospecting/outbound/tenantScope.test.ts` — 3 cenários (mesma company → 200; outra company → 404; sem company → 404), 16/16 verde.

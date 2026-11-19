De: Agente 24
Para: Agente 05
Onda: saneamento-handoffs-20261114
Status: resolvido
Prioridade: alto
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

POST /prospect aceita `company` do body para role admin — escrita cross-tenant possível (leads.routes.ts ~L863-871).

## Arquivo(s) envolvido(s)

src/features/prospecting/outbound/server/routes/leads.routes.ts

## Evidência

Parecer 24, ressalva F2 do PR #323.

## Alteração necessária

Ignorar/rejeitar `company` do body e usar sempre tenantCompany(req); ou restringir override a fluxo interno documentado.

## Teste esperado

Admin da company A não consegue gravar lead com company B via body.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

## Resolução

**Agente 05 — 2026-11-17** (branch `agente/05-handoffs-20261117`)

Correção portada da branch `agente/05-onda1-handoffs` (commit `5aec9295b`, PR #323 fechado não-mergeado pelo proprietário — hardening reaplicado aqui): `POST /prospect` em `src/features/prospecting/outbound/server/routes/leads.routes.ts` (~L864-868) agora deriva `company` de `tenantCompany(req)` (sessão, normalizada) — o bypass `role !== 'admin' ? session : body` foi removido; `bodyCompany` resta só como fallback defensivo inalcançável após `requireTenantScope`. Bônus: a rota inteira está sob `requireTenantScope` (401 sem sessão / 403 sem company).

Teste: `tests/unit/features/prospecting/outbound/tenantScope.test.ts` — "admin NÃO consegue prospectar com company de outro tenant via body" (16/16 verde nesta branch).

# Handoff 16 → 05 — Cache Redis de providers sem discriminador de tenant

- De: 16 — Runtime, Workers e Escala
- Para: 05 — Prospecção
- Onda: 3 (MEL-22)
- Status: resolvido
- Prioridade: alto
- Bloqueador-ref: `.agents/runs/onda-3/16-mel22-cache-redis-tenant.md`
- Sprint destino: a definir pelo 00

## Problema

`buildProviderCacheKey` (`src/features/prospecting/services/providerCache.ts:41-55`)
gera chaves `prospecting:provider-cache:v1:{provider}:{operation}:{params}` **sem
`organizationId`**. Call sites: `apollo/people.ts:45,218,319`, `hunter.service.ts:58,132`,
`github.service.ts:71,130`, `youtube.service.ts:49`.

Resultado de provider buscado pelo tenant A (contato, e-mail, perfil — dado potencialmente
pago via quota Apollo/Hunter) é servido a qualquer outro tenant que fizer a mesma busca.
Risco de compartilhamento cross-tenant de dados de contato + diluição de custo por tenant.

## Alteração necessária

Incluir `organizationId` como segmento obrigatório da chave (padrão canônico:
`semcache:{organizationId}:{hash}` de `src/lib/ai/gateway/semanticCache.ts:162-198`,
ou `ci:report:{report}:{organizationId}:{filtro}` de `reportCache.ts`). Opções:

1. Adicionar `organizationId` ao `params` de cada call site (simples, explícito); ou
2. Estender `buildProviderCacheKey`/`withProviderCache` para exigir `organizationId`
   como argumento (fail-closed, evita esquecimento futuro).

Atenção: o fallback `memoryCache` em memória usa a mesma chave — a correção cobre os
dois backends automaticamente.

Decisão de produto embutida: se a intenção for compartilhar cache de dados públicos de
provider entre tenants (economia de quota), registrar a decisão explicitamente e
avaliar com 21 (LGPD) se resultados enriquecidos com dados de contato podem ser
compartilhados entre tenants.

## Teste esperado

- Duas organizações buscando o mesmo domínio geram chaves Redis distintas.
- `resetProviderCacheForTests` continua limpando o prefixo inteiro.

## Contexto adicional

Auditoria completa das demais chaves Redis (todas as demais já têm tenant ou são globais
por desenho) em `.agents/runs/onda-3/16-mel22-cache-redis-tenant.md`.

## Resolução

**Agente 05 — 2026-11-17** (branch `agente/05-handoffs-20261117`)

Opção "tenant como segmento obrigatório da chave" implementada em `src/features/prospecting/services/providerCache.ts`:

- `buildProviderCacheKey` agora inclui `getTenantId()` (organizationId do `requestContext` — populado por `authenticateToken` em requests HTTP e por `withTenantContext` em workers) como segmento obrigatório: `prospecting:provider-cache:v2:{tenantId}:{provider}:{operation}:{params}`. Prefixo bumpado para `v2` (chaves v1 sem tenant expiram pelo TTL de 1h).
- Chamadas sem tenant conhecido caem no bucket próprio `no-tenant` — nunca compartilham cache com organizações reais (fail-safe para workers/scripts sem contexto).
- Cobre automaticamente os 7 call sites (`apollo/people.ts` ×3, `hunter.service.ts` ×2, `github.service.ts` ×2, `youtube.service.ts` ×1) e qualquer call site futuro, pois a discriminação acontece dentro de `buildProviderCacheKey` — sem mudança de assinatura nas funções de serviço.
- `memoryCache` (fallback) usa a mesma chave → coberto; `resetProviderCacheForTests` continua limpando o prefixo inteiro (agora v2).

**Decisão de produto (compartilhamento de cache entre tenants):** não adotada — dados de contato de providers pagos (Apollo People Match/Search, Hunter Email Finder) são potencialmente PII e quota é por tenant; o custo de não compartilhar é uma chamada extra por tenant, o que é o comportamento correto de isolamento. GitHub/YouTube (dados públicos) também ficam por tenant por uniformidade — se volume de quota virar problema, reabrir com avaliação do 21 (LGPD).

**Teste:** `src/features/prospecting/services/__tests__/providerCache.test.ts` — 2 novos casos (chaves distintas por org; bucket `no-tenant` isolado). `vitest run` → 12/12 verde.

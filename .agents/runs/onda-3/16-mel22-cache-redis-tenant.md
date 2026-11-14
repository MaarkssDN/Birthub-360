# MEL-22 — Governança de cache Redis por tenant (Agente 16, Onda 3)

Data: 2026-11-14 · Branch: `agente/16-onda3-runtime`

## Método

Inventário de todos os consumidores de `cacheConnection`/`getRedisClient`/`redisClient`
em `src/` e verificação do discriminador `organizationId` em cada namespace de chave.
Não existe um utilitário `cache-key-discriminator` em código — o padrão canônico vive
implementado em `src/lib/ai/gateway/semanticCache.ts` (`semcache:{organizationId}:{hash}`,
com fail-closed quando `organizationId` ausente, `semanticCache.ts:162-198`) e em
`src/features/commercial-intelligence/application/reportCache.ts`
(`ci:report:{report}:{organizationId}:{filtro}`, `reportCache.ts:60-71`).

## Matriz de chaves auditada

| Namespace / call site | Tenant na chave? | Veredito |
|---|---|---|
| `semcache:{org}:{hash}` — `src/lib/ai/gateway/semanticCache.ts:184` | Sim, obrigatório (throw sem org) | OK |
| `ci:report:{report}:{org}:{filtro}` — `reportCache.ts:65` | Sim | OK (TTL 60s, sem invalidação — decisão documentada no próprio arquivo) |
| `analytics:dash:{org}:{months}` — `analytics.service.ts:261` | Sim | OK |
| `ai-finops:token-quota:usage:{org}:{month}` — `tokenQuota.service.ts:183,488` | Sim | OK |
| `ai-gateway:budget:org:{org}:{month}` — `budget.ts:178` | Sim | OK |
| `prospecting-budget:org:{org}:{month}` — `providerBudget.ts:102` | Sim | OK |
| `webhook:dedup:{provider}:{org}:{digest}` — `webhookIdempotency.ts:75` | Sim | OK |
| `wa-auth:{org}:*` — `useRedisAuthState.ts:29`, `whatsapp.service.ts:284,337` | Sim | OK |
| `automation:trigger:{sha256(identity)}` — `automation-idempotency.service.ts:69,85` | Sim — `TriggerIdentity` inclui `organizationId` (`:60-66`) | OK |
| `whatsapp:session-lock:{org}` — `whatsapp.service.ts:53` | Sim | OK (lock, não cache de dados) |
| `cadence-run:{runId}` — `RedisCadenceRunLock.ts:17` | runId único por execução | OK |
| `cold-leads-scanner:lock`, `stagnation-scanner:lock`, `unified-scanner:lock` | Não (mutex global de job único do cluster) | OK — não cacheia dado de tenant; o job itera tenants internamente |
| `ai-gateway:circuit:{provider}[:failures|:open]` — `circuit-breaker.ts:24,46,62-82` | Não | **Aceitável por desenho** — estado de saúde do provider de IA, não dado de tenant; compartilhamento cross-tenant é intencional (provider fora do ar afeta todos). Documentado aqui para registro. |
| `prospecting:provider-cache:v1:{provider}:{op}:{params}` — `providerCache.ts:19,54` | **NÃO** | **GAP → handoff 16→05** |

## Gap principal (handoff)

`buildProviderCacheKey` (`src/features/prospecting/services/providerCache.ts:41-55`) gera
`prospecting:provider-cache:v1:{provider}:{operation}:{params normalizados}` **sem
`organizationId`**. Nenhum call site (`apollo/people.ts:45,218,319`,
`hunter.service.ts:58,132`, `github.service.ts:71,130`, `youtube.service.ts:49`) inclui o
tenant nos params. Consequências:

1. **Compartilhamento cross-tenant de resultados de provider** — dados de contato
   (e-mail, telefone, perfil) buscados pelo tenant A são servidos ao tenant B que pesquisar
   o mesmo domínio/nome. Os dados vêm de providers públicos, mas o resultado enriquecido
   pode conter dados que o tenant A pagou para obter (quota Apollo/Hunter) — questão de
   custo e, potencialmente, de LGPD/proveniência.
2. **Custo por tenant diluído** — o cache "grátis" para B consome o resultado pago por A;
   se a decisão de produto for isolar custo por tenant, a chave precisa do org.

Arquivo pertence ao Agente 05 (Prospecção) → handoff
`.agents/handoffs/onda-3/16-para-05-provider-cache-sem-tenant.md`.

## Invalidação em writes

- `reportCache`/`analytics`: TTL 60s, sem invalidação por escrita — decisão explícita e
  documentada nos próprios arquivos (frescor aceitável para dashboards executivos).
- `providerCache`: TTL 1h (`DEFAULT_PROVIDER_CACHE_TTL_SECONDS`), sem invalidação —
  coerente com dados de provider, mas reforça a necessidade do discriminador de tenant.
- `semanticCache`: possui `invalidateTenant(organizationId)` (`semanticCache.ts:335`).
- Locks/dedup (`webhook:dedup`, `automation:trigger`, locks distribuídos): TTL-based,
  não exigem invalidação por escrita.

## Código morto correlato

`src/lib/queue/idempotencyManager.ts` (Set em memória chamado de "durável", zero callers)
— ver G9 da auditoria MEL-21.

## Correções aplicadas no meu domínio

Nenhuma alteração de call site foi necessária em `src/lib/**` — todos os namespaces de
infra (locks, dedup, circuit breaker, budgets) já carregam tenant ou são globais por
desenho. O único gap real está em feature de outro dono (05) → handoff.

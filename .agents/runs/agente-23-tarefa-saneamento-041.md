# Run — Agente 23 — TAREFA-SANEAMENTO-041 (BT360-DT-0093)

Onda: W5 | Branch: `agente/23-w5-custo` | Base: 5d3f267e1

## Diagnóstico
`SemanticCacheService` completo (Redis + fallback local, TTL por propósito,
isolamento por organizationId, descarte de CONFIDENTIAL, métricas FinOps) e já
exportado pelo gateway — porém **nenhum caller passava `useCache`**, logo o
cache estava dormente.

## Entrega
`commercialAgentV3Orchestrator.service.ts`: `useCache: true` +
`ttlSeconds: CACHE_TTL.ACCOUNT_DIAGNOSTIC` na chamada
`generateStructuredOutput` da análise comercial V3 — o fluxo de "pesquisa/
análise de empresa repetida" do tenant. Stub E2E (`COMMERCIAL_V3_LLM_STUB`)
continua tendo precedência: o throw acontece antes do gateway, então testes
determinísticos não são afetados por cache.

## Gates
- vitest commercial-v3 + gateway cache + semanticCache: 68/69→ após fix do
  teste, tudo verde (ver 042)
- `npx tsc --noEmit`: PASS

# Run — Agente 10 — TAREFA-SANEAMENTO-029 (BT360-DT-0057)

Onda: W5 | Branch: `agente/10-w5-infra` | Base: 5d3f267e1

## Diagnóstico
Dívida já resolvida pela PR #240 (mergeada em main, presente na base):
- `k8s/ingress.yaml` e `charts/birthhub-360/values.yaml` com
  `limit-rps: 30` / `limit-connections: 20`;
- nginx de produção com `limit_req`/`limit_conn` zones (30r/s global,
  5r/s em /api/auth/, 429);
- handoff já constava `resolvido`.

## Entrega desta onda
`tests/unit/infra/ingress-rate-limit.test.ts` — 3 casos que falham se as
anotações de rate limit forem removidas do Ingress estático, dos values do
chart ou se o template parar de renderizar `ingress.annotations`.

## Gates
- vitest alvo: 3/3 PASS

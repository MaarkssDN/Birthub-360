# Handoff 21 → 00 — Paths OpenAPI removidos por não terem rota real (fantasma)

```
De: 21 — Zara (Contratos de API, OpenAPI e Schemas Zod)
Para: 00 — Astra (Coordenador Global)
Onda: 3 (demanda DEM-20261123-001, missão ONDA3-21-API-CONTRACTS)
Status: aberto — ciência + contestação possível pelos donos de feature
Prioridade: normal
```

## Contexto

Auditoria inversa (documentado → implementado) sobre `docs/openapi.yaml` ×
rotas Express resolvidas estaticamente (mesma técnica do
`scripts/verify-openapi-drift.ts`, estendida para o sentido contrário).
O gate oficial só verifica código→doc; esta varredura cobriu doc→código.

Foram encontrados e **removidos do spec** 15 path items / 16 operações que
não possuem nenhuma rota real correspondente (verificação manual de cada
um: mount em `src/bootstrap/routes.ts`, sub-routers aninhados, factories
`create*Router`, handler inline `app.get`, e better-auth). Nenhum cliente
frontend referencia esses paths.

## Paths removidos (commit neste worktree)

| Path removido | Método(s) | Provável motivo |
|---|---|---|
| `/market-intelligence/companies` | GET | Rota real é `/companies/market-intelligence` (já documentada separadamente) |
| `/market-intelligence/companies/{cnpj}` | GET | Idem — real: `/companies/market-intelligence/{cnpj}/intelligence` |
| `/market-intelligence/companies/{cnpj}/approve-to-pipeline` | POST | Idem — real: `/companies/market-intelligence/{cnpj}/approve-to-pipeline` |
| `/agent/chat` | POST | Sem rota; funcionalidade coberta por `/agent/commercial-v3/*` |
| `/agent/groq` | POST | Sem rota |
| `/agent/roleplay` | POST | Sem rota |
| `/agent/qualification` | POST | Sem rota |
| `/usage/quota` | GET | `usageRoutes` só expõe `GET /api/usage` |
| `/usage/quota/alert` | POST | Sem rota |
| `/cadence/opt-outs/check` | GET | `cadence.routes.ts` só tem `/opt-outs` GET+POST |
| `/cadence/runs/{id}/events` | POST | Runs só têm pause/resume/stop |
| `/intelligence/swarm/schedule` | POST | Swarm Scheduler é worker BullMQ, não endpoint HTTP |
| `/intelligence/swarm/status` | GET | Idem |
| `/copiloto-ia/conversations/{id}/live-insights` | GET+POST | Sem rota em `copilotoIa.routes.ts` |
| `/copiloto-ia/live-hud/{callId}` | GET | Sem rota |

## O que NÃO foi tocado (falsos positivos da varredura estática)

- `/auth/*` (6 ops) — handler better-auth montado via `mountAuthHandler`,
  fora do padrão `router.METHOD` literal. Documentado intencionalmente.
- `/market-intelligence/accounts/*` e `/data-quality-report` — router via
  factory `createAccountIntelligenceRouter()` (varredura não resolve
  factories; rotas confirmadas no fonte).
- `/commercial-intelligence/predictive/*` — idem (`createPredictiveRoutes`).
- `/notifications/stream` — `app.get` inline em `src/bootstrap/routes.ts:187`.

## Pedido

1. Se algum desses endpoints for **planejado** (ex.: `/usage/quota` do FinOps,
   `/agent/chat` do copiloto), o dono da feature deve implementar a rota —
   handoff para Hugo (22) conforme ownership de rotas. A remoção do spec foi
   a correção correta do drift documental, não uma decisão de produto.
2. Se algum for **renomeado**, o path novo deve entrar no spec pelo agente
   de contratos.
3. CI: correção da causa raiz do Schemathesis está em
   `.agents/handoffs/onda-3/21-para-94-schemathesis-origin-flag.md`.

## Evidências

- `.agents/runs/onda-3/21-relatorio.md`
- `npm run verify:openapi-drift` → ✅ 0 deriva (495 paths / 555 ops)
- Diff: `docs/openapi.yaml` −357 linhas, somente remoções de path items.

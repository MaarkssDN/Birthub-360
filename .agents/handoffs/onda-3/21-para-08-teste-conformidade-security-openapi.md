# Handoff 21 → 08 — Teste de conformidade: `security` do OpenAPI vs mounts sem autenticação

```
De: 21 — Contratos de API, OpenAPI e Schemas Zod
Para: 08 — QA e Release
Onda: onda-3 (ONDA3-21-API-CONTRACTS)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: a definir pelo 00
```

## Problema

Na auditoria ONDA3-21 foi comprovado que operações públicas/webhook de
`docs/openapi.yaml` herdavam o `security` global (`sessionCookie`) embora os
mounts correspondentes não passem por `authenticateToken`/`requireTenant`
(`src/bootstrap/webhooks.ts` — montadas antes do `express.json()` — e os mounts
públicos de `src/bootstrap/routes.ts`: `/api/public/*`, `/api/calendar/book`).
Corrigi o YAML (`security: []` em 13 operações + nota em `info.description`,
commit `ae5988377`), mas nada impede regressão: o gate `verify:openapi-drift`
compara apenas path+método, não o requisito de autenticação.

## Arquivo(s) envolvido(s)

- `docs/openapi.yaml` (contrato — dono: 21)
- `tests/unit/contracts/` (dono: 08) — sugestão de novo teste de conformidade
- Referência de mounts: `src/bootstrap/webhooks.ts`, `src/bootstrap/routes.ts`

## Evidência

`ae5988377` em `agente/21-api-contracts-onda3`: 20 operações agora declaram
`security: []` (7 já existiam para `/auth/*` e DSR; 13 adicionadas nesta onda).
Lista de mounts sem autenticação verificada estaticamente:

- webhooks: `/api/integrations/birth-voice` (só `/webhook`), `/api/integrations/3cx/webhook`,
  `/api/webhooks/voice-result`, `/api/webhooks/email`, `/api/webhooks/signature`,
  `/api/integrations/bitrix` (só `/webhook/:connectionId`), `/api/integrations/chatwoot`,
  `/api/integrations/stripe` (só `/webhook/:connectionId`);
- públicos: `/api/public/demo-leads`, `/api/public/lead-capture`,
  `/api/public/proposals` (`/:token/view`), `/api/calendar/book` (GET+POST `/:slug`).

Atenção: `/api/integrations/birth-voice`, `/bitrix` e `/stripe` têm routers
autenticados coexistindo no mesmo prefixo — apenas os sub-paths de webhook são
públicos; o teste não pode marcar o prefixo inteiro.

## Alteração necessária

Criar teste unitário (sugestão em `tests/unit/contracts/`) que:

1. parseia `docs/openapi.yaml`;
2. para cada path documentado sob os prefixos públicos/webhook acima, afirma
   `security: []` na operação correspondente;
3. opcionalmente, varre `src/bootstrap/webhooks.ts` + `src/bootstrap/routes.ts`
   atrás de `app.use('/api/...')` sem `authenticateToken`/`requireTenant` e
   cruza com os paths documentados — mounts sem auth cujo path documentado
   NÃO tem `security: []` devem falhar o teste.

## Teste esperado

`npx vitest run tests/unit/contracts/<novo-arquivo>` verde; reverter qualquer
`security: []` deve quebrar o teste.

## Contexto adicional

- `npm run verify:openapi-drift` permanece verde (81 prefixos, 510 paths, 0 deriva).
- Handoff relacionado já aberto: `backlog-5/18-para-08-schemathesis-ci.md`
  (Schemathesis em CI cobriria conformidade request/response de fato).
- `postman/specs/Birth Hub 360º API/openapi.yaml` foi ressincronizado com
  `docs/openapi.yaml` nesta entrega (estava 2.280 linhas atrás — era subconjunto
  estrito, sem conteúdo divergente). O workflow `postman-sync.yml` publica esse
  arquivo no workspace Postman.

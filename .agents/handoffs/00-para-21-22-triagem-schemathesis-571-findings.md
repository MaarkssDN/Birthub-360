# Handoff — Triagem dos 571 findings Schemathesis (API × OpenAPI)

```
De: 00 — Astra (sessão Genesis)
Para: 21 — Zara (Contratos API/OpenAPI) · 22 — Hugo (Rotas/Middlewares)
       cc: 50 — Atlas · 51 — Bela · 96 — Nera
Onda: genesis-consolidacao-20261121 / api-schema-fuzz
Status: aberto
Prioridade: alta (P0 nos 5xx; P1 na documentação)
Bloqueador-ref: run GitHub Actions 45083747478
```

## Problema

O primeiro run real do `api-schema-fuzz.yml` (workflow_dispatch,
`integracao/consolidacao-20261121` @ `5ce58788b`) executou Schemathesis 4.33.4
contra a API de teste completa: **571/571 operações, 58.025 casos, 900s**.

Resultado: **571 unique_failures** agregadas em 7 checks ST. A triagem por
causa-raiz está em
`.agents/runs/genesis-consolidacao-20261121/12-TRIAGEM-FINDINGS-SCHEMATHESIS.md`.
Resumo: a maioria NÃO é bug de produto — é débito de documentação OpenAPI
(501 dos 571 findings são status codes não declarados, dominados por 401).

## O que se pede

### Agente 21 (Zara) — contratos/OpenAPI

1. Avaliar declaração sistemática de `401`/`403`/`400`/`404`/`500` no
   `docs/openapi.yaml` — preferencialmente via componente reutilizável,
   sem inflar cada operação manualmente.
2. Alinhar o spec aos endpoints Better Auth (`/auth/*`): shapes de resposta
   (ST108), validações mais estritas que o documentado (ST202) e payloads
   inválidos aceitos (ST201).
3. Classificar ST401 (`GET /auth/get-session`, `POST /auth/sign-out`):
   provável falso positivo semântico Better Auth — documentar exceção ou
   ajustar o check no workflow (decisão conjunta com 08A).

### Agente 22 (Hugo) — rotas/middlewares + owners de integração

1. **P0 — 5xx reais (ST101, 12 findings):** investigar exceções do tipo
   `prisma.slackConnection.findFirst()` (campo `enabled` — possível drift
   schema×código) e "Configuração de rota inválida" em webhooks. Webhooks
   sem credencial retornam 503 — decidir se 503 é a resposta correta e
   documentá-la, ou se deve ser 4xx.
2. ST204: TRACE retorna 404 onde se espera 405 — avaliar middleware de
   método não permitido ou declarar no spec.
3. owners de integração (50/51/96): endpoints `/integrations/*/webhook`,
   `/webhooks/*`, `/auth/sso-*` concentram os 5xx — validar tratamento de
   payload inválido/ausência de assinatura.

## Evidência

- Run: https://github.com/MaarkssDN/Birthub-360/actions/runs/45083747478
- Artifact: `schemathesis-report-45083747478` (JUnit + JSON)
- Relatório de triagem: `12-TRIAGEM-FINDINGS-SCHEMATHESIS.md` (matriz
  completa por check, status codes e owners sugeridos)

## Critério de aceite

- Spec declara respostas de auth consistentemente → ST103 deve cair de
  ~531 para dezenas na próxima execução.
- 5xx reais eliminados ou convertidos em 4xx documentados.
- Reexecução comparável (`workflow_dispatch`) com `unique_failures`
  agrupadas por check — meta a definir pelo Orquestrador.

## Restrições

- Não adicionar 429/404/500 ao spec indiscriminadamente para "verde" —
  cada declaração deve refletir comportamento real.
- Não alterar código de produto fora do ownership do executor.
- Findings de harness/spec (TRACE→405) podem ser resolvidos no workflow
  mediante aprovação 08A/00.

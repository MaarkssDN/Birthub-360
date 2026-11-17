# Relatório — Agente 18 / Backlog Onda 5 (DEM-20261116-001)

## MEL-40 — Envelope de erro padronizado ✅

`src/shared/middlewares/errorHandler.ts` (uncommitted work do agente interrompido,
revisado e corrigido pelo orquestrador):

- `sanitizeStatusCode`: status fora de 400–599 normaliza para 500 — impede
  `RangeError` dentro do próprio handler (que fazia o Express devolver página
  HTML de erro em dev, quebrando o contrato JSON).
- `clientSafeMessage`: em produção, TODO erro 5xx recebe "Erro Interno do
  Servidor" — AppError 502/503/504 também pode carregar detalhe de upstream
  (faultstring Omie, erros Slack/Stripe). 4xx mantêm mensagem (erros do pedido).
- `clientSafeDetails`: `details` suprimido junto em 5xx de produção.
- CORREÇÃO DO ORQUESTRADOR: comentário JSDoc continha `*/` literal
  (`integrations/*/`) que fechava o bloco prematuramente → syntax error;
  reescrito sem o padrão.

Evidência: `vitest run tests/unit/shared/middlewares/errorHandler.test.ts` → 19/19 ✅

## MEL-39 — OpenAPI sync ✅ (parcial)

- `npm run verify:openapi-drift` → ✅ 0 deriva estrutural (80 prefixos, 506 paths,
  78 routers verificados).
- Schemathesis: script `test:api-schema` existe mas exige venv+app — handoff
  `18-para-08-schemathesis-ci.md` para decisão de CI.

## Gates

- vitest errorHandler: 19/19 ✅
- verify:openapi-drift: ✅
- tsc/lint completos: pendentes de CI (node_modules foi reinstalado nesta sessão)

## Observações

- O agente 18 foi interrompido com trabalho não commitado; o orquestrador
  revisou, corrigiu o syntax error e completou o escopo restante.
- `src/shared/**` pertence ao Agente 01 por docs/AGENTS.md — errorHandler é
  middleware compartilhado; alteração é hardening de contrato, registrada aqui
  para ciência do 01.

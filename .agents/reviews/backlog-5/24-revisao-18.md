# Parecer 24 — Agente 18 / Backlog Onda 5 (DEM-20261116-001)
- Autor: 18 (+orquestrador completou) | Auditor: 24 | Branch: agente/18-backlog5-api | Base: integracao/backlog-onda-5
- 1ª revisão: REPROVADO → correções aplicadas → veredito final: APROVADO

## Achados da 1ª revisão e resolução

- **A1 (alto) — furo no mascaramento**: caminho de erro genérico usava
  `status === 500` inline em vez de `clientSafeMessage` → 502/503 de
  middlewares de terceiros vazavam mensagem em produção.
  RESOLVIDO: `sendError(req, res, status, clientSafeMessage(err, status))`.
  Coberto por teste de regressão (erro genérico statusCode=503 → mascarado).
- **A2 (alto) — zero cobertura dos caminhos novos**: os 19 testes só
  cobriam contrato pré-existente; NODE_ENV=test tornava o branch de
  produção dead code.
  RESOLVIDO: novo `errorHandler.production.test.ts` com `vi.mock('@/config/env')`
  → NODE_ENV=production sem disparar travas de boot. 9 casos: AppError 503/502
  mascarados + details suprimidos, 4xx preservado, genérico 503 mascarado
  (regressão A1), genérico 404 preservado, statusCode inválido (200/700/'abc')
  → 500 sem RangeError. Adicionado pelo orquestrador (tests/** é do 08 —
  registrado em handoff 18→01 e ciência do 08 via este parecer).
- **A3 (médio) — propriedade src/shared (dono 01)**: sem handoff.
  RESOLVIDO: `.agents/handoffs/backlog-5/18-para-01-error-handler-shared.md`
  criado com status resolvido + evidências.

## Verificações positivas (mantidas)
- sanitizeStatusCode correto (inteiro 400–599, fallback 500).
- clientSafeDetails suprime details em 5xx prod; sendError só inclui
  details quando definido — envelope aditivo, não quebra clientes.
- ZodError/Prisma mantêm mensagens seguras hardcoded.
- MEL-39: verify:openapi-drift é script pré-existente — escopo honesto;
  Schemathesis corretamente delegado ao 08 via handoff bem formado.

## Gates reexecutados pelo orquestrador
- vitest tests/unit/shared/middlewares/: **47/47 ✅**
- verify:openapi-drift: ✅ (80 prefixos, 506 paths, 0 deriva)
- tsc/lint/build: verificados na integração.

## Ressalva de governança
- `src/shared/middlewares/errorHandler.ts` é do Agente 01 — alteração
  justificada por MEL-40 (contrato de API = domínio 18); ciência formal
  via handoff 18→01 criado. Aceite do 01 é retroativo e não bloqueante.

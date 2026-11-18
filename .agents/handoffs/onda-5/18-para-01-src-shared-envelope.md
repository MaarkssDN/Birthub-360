De: Agente 18 — Contratos, API e Documentação Viva
Para: Agente 01 — Plataforma, Segurança e Dados
Onda: 5
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-40
Sprint destino: Onda 5

## Problema

`src/shared/**` é governado pelo AGENTS.md local como propriedade do Agente 01. A missão MEL-40
(padronização do envelope de erro de API) exigiu alterações nesse diretório, executadas pelo 18
por ser o dono do domínio de contratos:

- **Novo**: `src/shared/contracts/apiEnvelope.contract.ts` — schemas Zod canônicos
  (`ApiErrorEnvelopeSchema`, `ApiSuccessEnvelopeSchema`, `ApiEnvelopeSchema`) + `API_ERROR_CODES`.
- **Alterado**: `src/shared/middlewares/errorHandler.ts` — `ApiErrorCode` passou a ser importado
  do contrato (re-exportado para compatibilidade); adicionado helper público `sendApiError`
  (mesmo envelope do middleware, para rotas que respondem erro sem lançar exceção).
- **Novo**: `src/shared/middlewares/__tests__/errorHandler.unit.test.ts` — 13 testes de contrato
  (mapeamento status→code, retryable, requestId, mascaramento 500 em produção, ZodError, AppError,
  Prisma P2002/P2025, conformidade com o schema Zod).

## Arquivo(s) envolvido(s)

- `src/shared/contracts/apiEnvelope.contract.ts`
- `src/shared/middlewares/errorHandler.ts`
- `src/shared/middlewares/__tests__/errorHandler.unit.test.ts`

## Evidência

- `npm run verify:openapi-drift` verde; schema `ErrorResponse` de `docs/openapi.yaml` documenta o
  mesmo envelope; contrato documentado em `docs/api/README.md`.
- Comportamento externo inalterado: mesmos status, mesmos campos — `code`/`retryable`/`requestId`
  já eram emitidos antes; só a fonte do tipo mudou de lugar.

## Alteração necessária

Nenhuma ação corretiva esperada — é um FYI de propriedade cruzada. Se o 01 quiser ajustar naming,
dependências ou mover o contrato para outro diretório, os pontos de contato são os arquivos acima.
Consumidores de `AppError`/`ApiErrorCode` continuam importando de `errorHandler.js` (re-export).

## Teste esperado

- `npx vitest run -c vitest.unit.config.ts src/shared/middlewares/__tests__/errorHandler.unit.test.ts` → 13/13.

## Contexto adicional

- Migração dos ~159 retornos inline `{ success:false, error }` em `*.routes.ts` para `sendApiError`
  é gradual e pertence aos donos de cada feature — documentado em `docs/api/README.md`.

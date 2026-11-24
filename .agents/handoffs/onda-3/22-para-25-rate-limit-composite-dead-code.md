# Handoff 22 → 25 — `src/api/middlewares/rate-limit.ts` é código morto

De: 22 — Hugo (Camada HTTP, Middlewares e Rotas)
Para: 25 — dono exclusivo de `src/api/middlewares/rate-limit.ts` (MATRIZ_PROPRIEDADE.md:39)
Onda: 3 (dem-20261123)
Status: aberto
Prioridade: baixa
Bloqueador-ref: nenhum
Sprint destino: saneamento

## Problema

`resolveCompositeRateLimitKey` (e os tipos `RateLimitIdentityInput`) em
`src/api/middlewares/rate-limit.ts` **não é importado por nenhum arquivo** do repositório
(grep em `src/` e `tests/` — zero ocorrências fora do próprio arquivo). O rate limiting real
é implementado com `express-rate-limit` em `src/bootstrap/rateLimiters.ts`, que não usa essa
função.

Risco: código morto que *parece* ser a camada de rate limit da API pode induzir o próximo
agente a assumir que o rate limit composto (tenant+apiKey+IP) está ativo quando não está.

## Arquivo(s) envolvido(s)

- `src/api/middlewares/rate-limit.ts` (único arquivo do diretório `src/api/` neste baseline)

## Evidência

`git ls-files src/api` → somente `src/api/middlewares/rate-limit.ts`.
`grep -rn "resolveCompositeRateLimitKey" src tests` → apenas a definição.
Relatório: `.agents/runs/22-onda3-controllers-auditoria.md`.

## Alteração necessária

Decisão do Agente 25: (a) remover o arquivo se a chave composta não está nos planos; ou
(b) integrar de fato no `rateLimiters.ts` (que hoje chaveia por IP ou organizationId —
não distingue apiKey). Se a intenção era rate limit por API key corporativa, isso é uma
decisão de produto a escalar ao 00/20 antes de implementar.

## Teste esperado

Se remover: `npx tsc --noEmit` + `npm run lint` verdes (nada referencia o módulo).
Se integrar: teste unitário da função de chave + teste de rate limit por apiKey.

## Contexto adicional

Nota de ownership: neste baseline o Agente 22 (dono genérico de `src/api/middlewares/**`)
não tem nenhum arquivo gravável — `rate-limit.ts` é exclusivo do 25 pela entrada mais
específica da matriz. `src/api/controllers/**` não existe no SHA `32d07c375`.

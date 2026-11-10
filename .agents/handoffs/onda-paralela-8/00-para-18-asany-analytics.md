De: 00 — Coordenador
Para: 18 — Contratos, API e Documentação Viva
Onda: paralela-8
Status: aberto
Prioridade: normal

## Problema
`src/features/analytics/presentation/AnalyticsController.ts` contém 6 casts `as any` que mascaram divergência de contrato entre controller, serviço e schema de resposta. Agente 18 é dono de contratos/OpenAPI (`docs/openapi.yaml`).

## Evidência
`grep -n "as any" src/features/analytics/presentation/AnalyticsController.ts` → 6 ocorrências.

## Alteração necessária
Tipar corretamente as respostas (interfaces/Zod existentes no projeto), verificando contra o contrato real do serviço chamado. Se o contrato divergir do OpenAPI, registrar no relatório — não alterar `docs/openapi.yaml` sem necessidade comprovada.

## Teste esperado
`npx tsc --noEmit` limpo; `npx biome lint` no arquivo; nenhum `as any` remanescente no arquivo.

## Contexto
Worktree: `.claude/worktrees/ag-18`, branch `agente/18-asany-analytics`.

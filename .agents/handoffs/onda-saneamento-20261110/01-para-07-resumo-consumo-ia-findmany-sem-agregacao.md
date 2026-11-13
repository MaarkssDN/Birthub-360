De: Agente 01 (Plataforma, Segurança e Dados)
Para: Agente 07 (IA, Copiloto e Automações)
Onda: W3 (saneamento-20261110) — originado de TAREFA-SANEAMENTO-012 / BT360-DT-0008
Status: aberto
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — saneamento waves 3–6
Sprint destino: W4 (domínio intelligence)

## Problema

O handoff original (00→01, TAREFA-SANEAMENTO-012) aponta
`src/features/analytics/infra/PrismaAnalyticsRepository.ts`, mas esse arquivo **não
possui nenhum método de resumo de consumo de IA** — verificado: nenhum `aILog`,
`agentExecution` ou agregação de tokens/custo no arquivo (métodos são todos de
leads/atividades/funil). O arquivo é propriedade do Agente 04 e não contém a dívida.

O ofensor real está em arquivos do **seu** domínio (`src/features/intelligence/`):

### 1. `src/features/intelligence/services/agentCostAnalysis.service.ts` (rota `GET /api/agent/cost-analysis`)

- `analyzeAgentCosts()` faz `prisma.aILog.findMany` **sem `take`/paginação** — carrega
  todas as linhas do período em memória para agregar em JS (exatamente a dívida
  BT360-DT-0008: dashboard >3s e memória excessiva em volume).
- **Bug adicional crítico:** o `select` pede `costUsd`, `promptTokens` e
  `completionTokens` — campos que **não existem** no model `AILog` (schema tem
  `tokens Int`, `cost Float`, `model`, `promptId`, `agentRole`, `organizationId`,
  `latencyMs`, `createdAt`). O Prisma valida `select` em runtime → o endpoint
  provavelmente responde 500 hoje. TypeScript não pega porque `AILogSelect` é tipo
  mapeado (`$Extensions.GetSelect`) que não dispara excess-property-check.
- Correção sugerida: `prisma.aILog.groupBy({ by: ['agentRole'], _count, _sum: { cost, tokens }, _avg: { latencyMs } })` + tratar `agentRole: null` como 'UNKNOWN'; avgCost = _sum.cost/_count; avgTokens = _sum.tokens/_count. Manter shape do `AgentCostAnalysis` DTO (contrato da rota).

### 2. `src/features/intelligence/services/agentUsageHeatmap.service.ts` (rota `GET /api/agent/usage-heatmap`)

- `generateAgentUsageHeatmap()` faz `prisma.agentMemory.findMany` sem limite —
  mesma classe de dívida (todas as linhas em memória).
- Agrava: `totalLatency` nunca é acumulado (`avgLatencyMs` = NaN/Infinity) e
  `costUsd: stats.count * 0.01` é **custo fabricado** — viola "não fabricar KPI"
  (analytics/AGENTS.md §Não pode) e §30. Se não há fonte real de custo por execução,
  o campo deve sair do DTO ou vir de `AgentExecution.costUsd`/`aILog` agregado.

## Evidência

- `src/features/intelligence/services/agentCostAnalysis.service.ts:34-45` — findMany sem take + select de campos inexistentes.
- `src/features/intelligence/services/agentUsageHeatmap.service.ts:33-41` — findMany sem take; linhas 56-58 — latência não acumulada e custo estimado fabricado.
- `prisma/schema.prisma` model `AILog` (linha ~1826): campos reais listados acima.
- `src/features/analytics/infra/PrismaAnalyticsRepository.ts` — nenhum método de IA (grep `aiLog|aILog|token|cost` = 0 ocorrências).
- Rotas: `src/features/intelligence/routes/agent.routes.ts:414` (cost-analysis) e ~linha 400 (usage-heatmap).

## Alteração necessária

Executar dentro da propriedade do Agente 07 (`src/features/intelligence/**`):

1. Substituir `findMany`+agregação em memória por `groupBy`/`aggregate` do Prisma
   nos dois services, preservando os DTOs de resposta (ou abrindo handoff ao 18 se
   o contrato mudar).
2. Corrigir os campos do select para os campos reais de `AILog`.
3. Eliminar custo/latência fabricados do heatmap — usar fonte real ou remover do DTO.
4. Testes: agregação sucesso/vazio/múltiplos agentRoles; falha de banco propaga
   (não vira lista vazia silenciosa — mesmo princípio do handoff 07-w4-kb-search).

## Teste esperado

- `npx tsc --noEmit`, `npm run lint`, vitest do diretório `src/features/intelligence/services/__tests__/` (sucesso e falha).
- Assert de que a query usa `groupBy`/`aggregate` (não `findMany` sem `take`).

## Contexto adicional

- O handoff original 00→01 (TAREFA-SANEAMENTO-012) foi respondido pelo 01 com a
  constatação de arquivo divergente — ver `.agents/handoffs/onda-saneamento-20261110/00-para-01-resumo-de-consumo-de-inteligencia-artificial-carrega-todas-as-linhas-d.md` (seção Resolução) e `.agents/runs/agente-01-tarefa-saneamento-012.md`.
- `PrismaUsageRepository` (billing, Agente 01) já usa `groupBy`/`aggregate`/`$queryRaw`
  corretamente — serve de padrão de referência.
- Revisão Agente 24 obrigatória.

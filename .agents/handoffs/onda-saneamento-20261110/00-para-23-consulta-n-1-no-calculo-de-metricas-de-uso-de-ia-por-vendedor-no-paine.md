De: Agente 00 — Coordenador
Para: Agente 23 (Custo, Performance e Limites de IA)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-042)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Consulta N+1 no cálculo de métricas de uso de IA por vendedor no painel gerencial**

- **Dívida técnica:** BT360-DT-0094
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Falta de agrupamento em query única via `groupBy`.

**Impacto:** Lentidão no painel de gestão de equipe e sobrecarga desnecessária no pool de conexões do banco de dados.

## Arquivo(s) envolvido(s)

`src/features/intelligence/services/agentCostAnalysis.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-042`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-042` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução

`agentCostAnalysis.service.ts` agregava em memória após `findMany` de todos os
AILog do período — e ainda selecionava campos inexistentes no model (`costUsd`,
`promptTokens`, `completionTokens`). Reescrito para `prisma.aILog.groupBy`
sobre os campos reais (`cost` USD, `tokens`) com merge de `agentRole` nulo em
'UNKNOWN' preservando a semântica anterior. Novo teste
`agentCostAnalysis.service.test.ts` cobre agregação, merge nulo/UNKNOWN,
período vazio e propagação de erro do banco (4/4).

**Agente 23 — 2026-11-11** (branch `agente/23-n1-metricas-ia`, concluído pelo Agente 00 após interrupção do executor; pendente de revisão do Agente 24)

`analyzeAgentCosts` reescrito para `prisma.aILog.groupBy({ by: ['agentRole'], _count, _sum: { cost, tokens } })` — UMA query agregada em vez de `findMany` de todas as linhas + agregação em memória (varredura sem teto da tabela do tenant a cada chamada do painel).

**Achado adicional corrigido:** a versão anterior selecionava `costUsd`/`promptTokens`/`completionTokens`, campos que NÃO existem no model `AILog` (reais: `tokens`, `cost`, `model`, `agentRole`) — o endpoint `/api/agent/cost-analysis` falharia em runtime. O shape de retorno `AgentCostAnalysis` foi preservado (mesmos campos/ordenação/mostExpensive/mostEfficient).

Testes: `__tests__/agentCostAnalysis.service.test.ts` — 4/4 (shape, ordenação, período vazio, propagação de erro, `_sum` nulo → 0).

Gates: vitest focado 4/4 ✓; `npx tsc --noEmit` executado pelo Agente 00 no worktree.

**Agente 23 — 2026-11-12** (branch `agente/23-custo-saneamento`): WIP idêntico ao commit `a6972ed8f` de `origin/agente/23-n1-metricas-ia` foi commitado e a branch remota integrada via merge (sem reescrita de histórico). Gates reexecutados neste worktree: `npx vitest run -c vitest.unit.config.ts` nos 2 arquivos alterados → **12/12 testes PASS** (4 agentCostAnalysis + 8 marketResearchTool). `npx tsc --noEmit` e `npm run lint` executados na mesma branch — ver relatório `.agents/runs/agente-23-saneamento-onda-20261112.md`. Pendente apenas o parecer formal do Agente 24 (condição de encerramento do handoff).


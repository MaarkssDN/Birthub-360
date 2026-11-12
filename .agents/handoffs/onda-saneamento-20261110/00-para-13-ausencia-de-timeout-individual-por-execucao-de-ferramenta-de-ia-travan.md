De: Agente 00 — Coordenador
Para: Agente 13 (Enxame Autônomo e Governança de Runtime)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-031)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Ausência de timeout individual por execução de ferramenta de IA travando o runtime do agente**

- **Dívida técnica:** BT360-DT-0068
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Falta de wrapper defensivo com `Promise.race` ou timeout configurável por ferramenta.

**Impacto:** Travamento de tarefas autônomas de enriquecimento e prospecção em background.

## Arquivo(s) envolvido(s)

`src/features/intelligence/agents/tools/`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-031`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-031` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 13 — 2026-11-12, branch `agente/13-w3-tool-timeout`)

O caminho real de execução de ferramentas do runtime do enxame não é
`agents/tools/` (inexistente) nem o `AgentExecutor` do LangChain (domínio 07) — é
`src/features/job-roles/services/toolExecutors.ts` + `agentRuntime.service.ts`
(`await executor(ctx)` sem limite, BT360-DT-0068). Implementado:

- `withToolTimeout(executor, toolCode, timeoutMs)` — `Promise.race` com
  `ToolTimeoutError` (`TOOL_TIMEOUT: executor "<code>" excedeu o limite de <ms>ms`).
- `DEFAULT_TOOL_EXECUTOR_TIMEOUT_MS = 120_000` + `TOOL_EXECUTOR_TIMEOUT_OVERRIDES_MS`
  (override por capability — mapa vazio, ponto de extensão documentado).
- `getToolExecutor` retorna o executor já wrapped — `agentRuntime.service.ts`
  não precisou de edição; a `AgentExecution` vira `FAILED` com erro observável.

Limitação registrada no código: `Promise.race` não cancela a promise do executor
travado (continua em background); cancelamento real exigiria `AbortSignal`
propagado aos use-cases — follow-up se necessário. Testes:
`tests/unit/features/job-roles/toolExecutors.timeout.test.ts` — 6/6 verdes
(roundtrip, hang→TOOL_TIMEOUT, erro propagado, registry fail-closed preservado).
Run report: `.agents/runs/agente-13-tarefa-saneamento-031.md`. Pendente: revisão do
Agente 24.

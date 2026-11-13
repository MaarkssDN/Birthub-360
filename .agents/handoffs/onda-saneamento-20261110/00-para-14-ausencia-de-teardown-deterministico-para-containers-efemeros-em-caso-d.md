De: Agente 00 — Coordenador
Para: Agente 14 (Ambiente de Execução e Test Harness)
Onda: Onda 2 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-032)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 2

## Problema

**Ausência de teardown determinístico para containers efêmeros em caso de cancelamento por SIGINT**

- **Dívida técnica:** BT360-DT-0070
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O harness não registra listeners de sinais de processo (`process.on('SIGINT')`, `process.on('SIGTERM')`) para garantir o encerramento limpo dos containers antes da saída.

**Impacto:** Acúmulo de dezenas de containers zumbis no Docker local; lentidão e travamentos por esgotamento de memória no host.

## Arquivo(s) envolvido(s)

`scripts/test/prepare-integration-env.js`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-032`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-032` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 14 — 2026-11-12, branch `agente/14-w3-teardown-sigint`)

`scripts/test/prepare-integration-env.js` agora registra handlers `SIGINT`/`SIGTERM`
quando entra no caminho Docker local (não-CI). Apenas os containers iniciados por
esta execução entram em `ephemeralContainers` (serviços ausentes subidos via
`docker compose up -d` + `birthhub_meilisearch_test` quando provisionado) — os três
containers fixos já em execução, compartilhados entre worktrees, nunca são parados.
No sinal, o harness executa `docker stop` em cada um e sai com código 130/143.
`stopEphemeralContainers` é exportado e coberto por 3 testes unitários (sucesso,
falha parcial tolerada, lista vazia). Nota: durante `spawnSync` bloqueante o handler
é entregue ao retornar o spawn (atraso máximo de ~2s no loop de wait) — determinístico
o suficiente para o objetivo de não deixar zumbis. Run report:
`.agents/runs/agente-14-tarefa-saneamento-032.md`. Pendente: revisão do Agente 24.

## Verificação de merge (Agente 14 — 2026-11-12, branch `agente/14-harness-saneamento`)

Implementação confirmada em `main` via PR #239 (commit `55424831b`):
`stopEphemeralContainers`/`registerSignalTeardown`/`ephemeralContainers` presentes em
`scripts/test/prepare-integration-env.js` (L184–370). Reexecução nesta sessão:
`vitest run tests/unit/scripts/test-harness-safety.test.ts` → 12/12 ✅,
`node --check` ✅, `npx tsc --noEmit` ✅, `npm run lint` exit 0 (warnings pré-existentes).
Status mantido `em-andamento`: condição de encerramento é parecer APROVADO do Agente 24.

## Encerramento (Coordenador 00 — 2026-11-13)

Condição de parecer APROVADO do Agente 24 satisfeita: revisão independente em
`.agents/reviews/` (PR #257, `pr251-24-revisao.md`) confirmou a implementação em
`main` via PR #239 com evidência de código e testes. Handoff encerrado como
`resolvido`.

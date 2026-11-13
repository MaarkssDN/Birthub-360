De: Agente 00 — Coordenador
Para: Agente 06 (Integrações e Bitrix)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-045)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 3

## Problema

**Tratamento incompleto de promessas assíncronas em componentes de importação externa (Sonar S9383)**

- **Dívida técnica:** BT360-DT-0032
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Omissão de `AbortController` na requisição disparada pelo hook.

**Impacto:** Alertas de linter e pequenas degradações de memória em clientes web de baixa performance.

## Arquivo(s) envolvido(s)

`src/features/integrations/components/ExternalCrmPanel.tsx`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-045`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-045` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 06 — W5, TAREFA-SANEAMENTO-045 / BT360-DT-0032)

Status: resolvido.

`ExternalCrmPanel.fetchConnections` agora aceita `AbortSignal` opcional:

- O `useEffect` de carga cria um `AbortController` por ciclo de vida e aborta no
  cleanup (desmontagem/troca de provider), eliminando atualização de estado após
  unmount e cancelando a requisição em voo.
- O `catch` distingue cancelamento (`signal.aborted` / `AbortError`) de falhas
  reais: aborts retornam silenciosamente sem toast/erro; falhas HTTP/rede continuam
  exibindo mensagem explícita via `setError` + `toast.error` (nada é escondido).
- `finally` só limpa `loading` quando a requisição não foi abortada.
- O botão "Atualizar lista" chama `fetchConnections()` sem signal (retry manual
  não é cancelável, comportamento preservado).

Gates: `npx tsc --noEmit` PASS; `biome check` PASS; evidências completas em
`.agents/runs/agente-06-tarefa-saneamento-045.md`.

## Resolução (Agente 06 — implementação concluída, aguardando revisão do Agente 24)

Branch `agente/06-integracoes-saneamento`, worktree `C:/Github/Birthub-360-worktrees/agente-06-integracoes`, commit `7f27a2575`.

- `src/features/integrations/components/ExternalCrmPanel.tsx`: `fetchConnections` agora aceita `AbortSignal`; o `useEffect` de montagem/criação cria um `AbortController` e aborta no cleanup (troca de `providerKey`/`displayName` ou desmontagem). `AbortError` retorna silenciosamente — não vira erro de UI nem `toast.error`. Chamadas manuais (botão "Atualizar", reload pós-save) seguem sem signal.
- Tratamento de erro explícito preservado (mensagens de erro por status/rede inalteradas — sem fallbacks enganosos).
- Teste adicionado em `tests/unit/features/integrations/ExternalCrmPanel.test.tsx`: novo caso "aborta a listagem via AbortController ao desmontar, sem erro/toast (S9383)" + `vi.clearAllMocks()` no `beforeEach` para isolar histórico de mocks entre casos.
- **Gates:** `npx tsc --noEmit` limpo; `npx biome lint` no escopo limpo; `vitest run tests/unit/features/integrations/ExternalCrmPanel.test.tsx` — 11/11 passando.
- **Pendente:** parecer formal `APROVADO` do Agente 24 (condição de encerramento do handoff).

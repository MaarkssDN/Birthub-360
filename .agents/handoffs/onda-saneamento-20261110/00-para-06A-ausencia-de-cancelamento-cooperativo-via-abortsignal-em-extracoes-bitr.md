De: Agente 00 — Coordenador
Para: Agente 06A (Extrações Bitrix)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-046)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 3

## Problema

**Ausência de cancelamento cooperativo via AbortSignal em extrações Bitrix em lote**

- **Dívida técnica:** BT360-DT-0036
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O loop de paginação não verifica o status da extração entre uma página e outra e não propaga um `AbortController.signal` para os métodos de busca.

**Impacto:** Consumo de recursos de rede e CPU desnecessário após o usuário solicitar a interrupção da tarefa.

## Arquivo(s) envolvido(s)

`src/features/integrations/bitrix/service/extraction.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-046`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-046` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

Implementado em 2026-11-12 pelo Agente 06A (worktree `agente-06a-bitrix`, branch `agente/06A-bitrix-saneamento`, base `origin/main` @ 0b52894e0):

- `src/features/integrations/bitrix/service/client.ts`: novo `BitrixCallOptions.signal?: AbortSignal` e nova classe `BitrixCallAbortedError`. `attemptBitrixCall` vincula o signal externo ao `AbortController` interno (abort em voo rejeita o fetch na hora, distinguido de timeout real via `signal?.aborted` antes da classificação `TransientBitrixError` 504). `callBitrix` verifica `signal.aborted` antes de cada tentativa e usa `sleepUnlessAborted` no backoff entre tentativas — abort durante retry encerra sem consumir as tentativas restantes. Erro de abort nunca é classificado como falha transitória/definitiva do Bitrix.
- `src/features/integrations/bitrix/service/extraction.ts`: um `AbortController` por execução (`runAbortController`), disparado quando `isCancelled` confirma `status='cancelled'` (checagem pré-entidade e dentro do callback `onPage`). O signal é propagado a `extractEntityPages` → cada `callBitrix`, e verificado no topo do loop de paginação. `BitrixCallAbortedError` é tratado no catch da entidade como cancelamento cooperativo (mesmo desfecho do cancelamento entre páginas: nenhum arquivo gerado, nenhum `status='failed'`, sem incremento da métrica de falhas).
- Testes: 3 novos casos em `client.test.ts` (signal pré-abortado, abort em voo, abort durante backoff) e 2 novos casos em `extraction.test.ts` (abort do signal propagado + desfecho de `BitrixCallAbortedError`); asserção de options do `callBitrix` atualizada para incluir `signal`.

Gates executados: `npx tsc --noEmit` (0 erros), `npm run lint` (biome — 0 erros; warnings pré-existentes fora do escopo), `npx vitest run -c vitest.unit.config.ts src/features/integrations/bitrix` → 16 arquivos / 187 testes passando. Relatório: `.agents/runs/06a-saneamento-abortsignal-purga.md`.

**Pendente de encerramento formal:** parecer `APROVADO` do Agente 24 (validação de hashes + não-regressão), conforme condição do handoff.

De: Agente 00 — Coordenador
Para: Agente 06A (Extrações Bitrix)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-046)
Status: em-andamento
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

## Resolução (Agente 06A — 2026-11-12)

`BitrixCallOptions.signal?: AbortSignal` adicionado em `client.ts` (adição retrocompatível — opcional): o signal externo aborta o mesmo `AbortController` do timeout por request, `callBitrix` verifica `signal.aborted` antes de cada attempt e no catch (abort nunca vira retry transitório — propaga `AbortError`/reason cru).

`extraction.ts`: um `AbortController` por `executeExtractionRun`; todo `isCancelled` positivo passa por `checkCancelled()` que aborta o signal. O signal é propagado a `extractEntityPages` → `callBitrix` (interrompe fetch em voo) e aos backoffs via `sleepOrAbort` (resolve no abort sem esperar o delay). Checagem `signal.aborted` no topo de cada página e no catch de retry de página — `AbortError` é tratado como cancelamento cooperativo (nunca `failRun`/arquivo/`completed`).

Testes: 2 novos em `extraction.test.ts` (signal propagado e observavelmente abortado; AbortError → cancelamento sem falha). Suítes: extraction 45/45, client+timeout+files+purge 44/44.

Pendente: parecer Agente 24 e integração Agente 00.

De: Agente 00 — Coordenador
Para: Agente 05 (Prospecção Comercial)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-020)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Ausência de validação prévia em lote de listas de supressão (Opt-Out) em importações de prospecção**

- **Dívida técnica:** BT360-DT-0028
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Validação de opt-out tratada como etapa de borda no envio em vez de filtro sanitizador no funil de entrada.

**Impacto:** Risco de violação de preferências de privacidade e perda de visibilidade prévia sobre quantos contatos da lista são elegíveis para disparo.

## Arquivo(s) envolvido(s)

`src/features/prospecting/services/cold-email.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-020`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-020` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

**Agente 05 — 2026-11-11** (branch `agente/05-supressao-optout`, commit `f635264b6`, pendente de revisão do Agente 24)

`sendColdEmailBatch(campaigns)` adicionada em `src/features/prospecting/services/cold-email.service.ts`: consulta `isOptedOut`/`prismaOptOutRepository` para TODA a lista antes de qualquer envio, classifica cada item como `sent`/`failed`/`opt-out-suppressed`/`invalid`, e devolve contagens agregadas (`eligibleCount`, `suppressedCount`, etc.) — opt-out vira filtro sanitizador na entrada do funil, com visibilidade prévia sobre elegíveis. Fail-closed sem `organizationId`; erro do supressor propaga (sem fallback silencioso); `sendColdEmail` mantém a checagem de borda (defesa em profundidade).

Testes: `cold-email.service.test.ts` — 9/9 (lista mista, supressão, inválido, contagens).

Observação para o 24: a checagem por item usa `isOptedOut` (1 query por campanha) — filtro em lote por consulta única ficou fora do escopo cirúrgico; se o volume de listas crescer, avaliar `findMatches` batch (registrar como melhoria futura, não bloqueia).

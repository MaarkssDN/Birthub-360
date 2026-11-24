# Handoff — Agente 44 (Lola) → Agente 17 · Worker de cadência carrega sequência sem filtro de tenant + observações de contratos dormentes

- **De:** 44 — Motor de Cadências Comerciais (auditoria Onda 3, `ONDA3-44-CADENCE`)
- **Para:** 17 — Cadência Multicanal e Ciclo de Receita
- **Onda:** 3
- **Status:** resolvido
- **Prioridade:** normal
- **Bloqueador-ref:** nenhum
- **Sprint destino:** próxima janela do 17

## Problema

### 1. Lookup de `CadenceSequence` no worker sem `organizationId` (defesa em profundidade)

`scanAndAdvanceCadenceRuns` (`src/features/cadence/jobs/cadenceRun.worker.ts`,
~L145-148) busca sequências por `id: { in: sequenceIds }` sob `bypassRls`, sem
filtrar `organizationId`. O `CadenceRun.sequenceId` é FK simples para
`CadenceSequence.id` — o schema **não** garante que run e sequência sejam do
mesmo tenant. A rota `POST /runs` filtra corretamente (`cadence.routes.ts`
~L370-373), mas se uma linha cross-tenant ever existir (bug, restore, escrita
direta), o worker despacharia o `templateRef`/conteúdo da sequência do tenant B
para o lead do tenant A — vazamento cross-tenant de conteúdo comercial.

Mesmo padrão em `src/features/cadence/infra/cadenceWebhookResolver.ts`
(~L47-50, `findUnique` por id apenas).

Correção sugerida: filtrar a busca de sequências por
`organizationId: { in: [...orgs dos runs] }` e casar par (org, sequenceId), ou
rejeitar run cuja sequência não pertence ao `run.organizationId` (tratar como
sequência inválida → `policy-guardrail`). Endurecimento opcional no schema
(chave composta `(organizationId, id)` na FK) é decisão do Agente 01.

### 2. `CadenceExecutionService.enqueueAction` — caminho `queued` sem persistência

`src/features/cadence/application/CadenceExecutionService.ts` (~L276-281):
`enqueueAction` sem `autoExecute` retorna `accepted: true, status: 'queued'`,
mas nada é persistido nem enfileirado — não existe consumidor do "queue".
Se algum chamador (Swarm/contrato `CadenceExecutionPort`) tratar `queued`
como "será enviado", a ação se perde silenciosamente. Hoje não há caller de
produção (só `index.ts` exporta); registrar a decisão: implementar fila real,
mudar o contrato, ou documentar que `queued` é apenas ack de validação.

### 3. `multichannelDispatcher.service.ts` — mock que loga sucesso

`src/features/cadence/services/multichannelDispatcher.service.ts`: `dispatch`
retorna `{ success: true }` e loga "Disparo de cadência realizado com sucesso"
sem enviar nada a canal real. Se for ligado a um caminho real no futuro,
viola "nenhuma escrita otimista". Sugerir renomear/declarar explicitamente
como stub ou remover se morto.

## Arquivo(s) envolvido(s)

- `src/features/cadence/jobs/cadenceRun.worker.ts` (~L145-148)
- `src/features/cadence/infra/cadenceWebhookResolver.ts` (~L47-50)
- `src/features/cadence/application/CadenceExecutionService.ts` (~L276-281)
- `src/features/cadence/services/multichannelDispatcher.service.ts` (inteiro)

## Evidência

Auditoria estática do Agente 44 na baseline `32d07c375`; itens 2 e 3 são
código dormente hoje (sem caller de produção) — risco latente, não bug ativo.

## Alteração necessária

Conforme itens acima — prioridade ao item 1 (único com caminho real de
disparo). Itens 2-3 podem virar decisão documentada ou remoção.

## Teste esperado

Teste de integração do worker: run do tenant A referenciando sequenceId do
tenant B é encerrado como `failed`/`policy-guardrail` ou ignorado — nunca
despacha conteúdo da sequência estranha.

## Contexto adicional

- `POST /runs` já valida `sequenceId` com `organizationId` — o gap é só no
  worker/webhook resolver (defesa em profundidade, não exploit conhecido).
- `CadenceRun_leadId_active_unique` (índice parcial na migration) está
  confirmado e `POST /runs` mapeia P2002 → 409 corretamente.

## Resolução (Agente 44 — follow-up ONDA3-44-CADENCE-FIX, commits `8cae07968` + `148133b6b`)

- **Item 1 — CORRIGIDO.** `cadenceRun.worker.ts`: a busca de
  `CadenceSequence` agora filtra `organizationId ∈ orgs dos runs ativos` e o
  mapa guarda `{ sequence, organizationId }`; o consumidor exige par
  `(run.organizationId === seq.organizationId)` — mismatch cai no fluxo de
  sequência inválida → run `failed`/`policy-guardrail`, nunca despacha conteúdo
  de outro tenant. `cadenceWebhookResolver.ts`: `findUnique` por id →
  `findFirst({ id, organizationId })`. Varredura dos demais lookups
  (`cadence.routes.ts`, `PrismaCadenceSequenceRepository`,
  `PrismaCadenceRunRepository`, `PrismaCadenceRateLimitPort`,
  `PrismaCalendarSchedulerPort`): todos já filtram por `organizationId` —
  aprovado sem alteração.
- **Item 2 — DOCUMENTADO (stub sem caller de produção).** `enqueueAction`
  retorna `accepted/queued` sem persistir fila: verificado que não há nenhum
  caller de produção (só `index.ts` reexporta; consumidores do contrato
  `CadenceExecutionPort` não existem fora de teste). Decisão: mantido como
  contrato de porta para uso futuro pelo Swarm; se um consumidor real surgir,
  a fila deverá ser implementada antes — registrado em
  `.agents/runs/onda-3/44-relatorio.md`. Não é bug ativo.
- **Item 3 — DOCUMENTADO (stub).** `multichannelDispatcher.service.ts` segue
  sem caller de produção; mantido como stub declarado. Se for ligado a envio
  real, deve ser substituído por dispatcher honesto (mesma disciplina de
  "nenhuma escrita otimista" do AGENTS.md local do 17).
- **Teste de regressão**: 2 cenários no mesmo arquivo de teste — run com
  `sequenceId` de outro tenant → `failedInvalidSequence=1` e query com filtro
  de org assertado; run com sequência do mesmo tenant → não cai no caminho de
  falha.
- **Gates**: `npx tsc --noEmit` verde; vitest cadence-related 226/226.

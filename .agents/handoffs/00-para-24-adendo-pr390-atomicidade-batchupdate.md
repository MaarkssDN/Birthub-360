# Handoff — 00 → 24 · Adendo de revisão PR #390 (atomicidade batchUpdateLeads)

```
De: 00 — Coordenador
Para: 24 — Revisão Independente
Onda: Saneamento de Handoffs 2026-11-17/18 (Wave A/B)
Status: resolvido
Prioridade: alto (gate de merge do PR #390)
Bloqueador-ref: PR #390 head 54b117f53446536b4dbb837ac6020b6e0c6f1dc9
Sprint destino: integração Wave A/B
```

## Problema

O Agente 01 apontou, e o Coordenador confirmou no diff do head `54b117f53`, que `batchUpdateLeads` em `src/features/crm/application/LeadUseCases.ts` passou a executar **duas escritas sequenciais** quando um item muda status + owner/tags:

1. `this.updateLeadStatus(...)` — fluxo completo (gate CYC-007, closedAt, sync pipeline/stage/probability, LeadStageHistory, timeline, broadcasts DEAL_WON/DEAL_LOST, re-sync Bitrix);
2. `prisma.lead.update` direto para `owner`/`tags` (+ `recordLeadFieldChanges` quando owner muda).

Se a segunda escrita falhar após a primeira ter sucesso, **o status persiste mas o item é contabilizado em `failedCount`** — estado parcial silencioso para o caller (`CrmBoard.tsx`). Na `main` anterior a operação era uma única escrita atômica (`prisma.lead.update` com status+owner+tags juntos). Ou seja: o patch troca atomicidade por herdar o fluxo de fechamento correto — trade-off **consciente e documentado no próprio código** ("Nota de atomicidade", ~linha 770 do arquivo no head do PR).

O parecer existente `.agents/reviews/24-revisao-pr390-agente04-handoffs.md` aprovou o head `54b117f53`, mas **não se posiciona explicitamente sobre essa nota de atomicidade**. Decisão do 00 (2026-11-18): exigir adendo do 24 antes do merge.

## Arquivo(s) envolvido(s)

- `src/features/crm/application/LeadUseCases.ts` — `batchUpdateLeads` (head `54b117f53` do PR #390)
- `src/features/crm/application/__tests__/LeadUseCases.batchUpdate.test.ts` — verificar se há cobertura do cenário de falha parcial
- `.agents/reviews/24-revisao-pr390-agente04-handoffs.md` — parecer a ser complementado (não sobrescrever; adicionar seção de adendo)

## Evidência

- Diff `main` → `pr-390` inspecionado em 2026-11-18: na `main`, `dataToUpdate` único gravava status+owner+tags em um `prisma.lead.update`; no PR, status vai por `updateLeadStatus` e owner/tags por update separado.
- Comentário no código do PR assume o trade-off explicitamente.
- Testes do PR cobrem normalização de enum, gate CYC-007 e `failedCount`, mas confirmar se cobrem "status persistiu + owner falhou".

## Alteração necessária

Emitir **adendo** ao parecer do PR #390 (nova seção ou arquivo `.agents/reviews/24-revisao-pr390-adendo-atomicidade.md`) respondendo:

1. O trade-off documentado é aceitável como está (status = escrita primária; falha posterior gera `failedCount` + log identificando a escrita), ou é bloqueador?
2. `failedCount` hoje conflaciona "rejeitado pelo gate CYC-007" com "erro de infraestrutura" — o caller consegue distinguir? Isso é aceitável?
3. Existe alternativa de menor custo que preserve o fluxo de fechamento sem a janela de falha parcial (ex.: owner/tags primeiro, ou compensação), ou a ordem atual é a menos ruim?
4. Cobertura de teste do cenário de falha parcial existe ou deve ser exigida antes do merge?

Veredito do adendo: `APROVADO` / `REPROVADO` / `APROVADO COM RESSALVAS` para o merge do PR #390.

## Teste esperado

- Revisão do diff já existente (sem necessidade de subir ambiente).
- Opcional: verificar se `LeadUseCases.batchUpdate.test.ts` tem caso simulando falha na segunda escrita.

## Contexto adicional

- PR #390 também resolve handoffs de tenancy FKs (assertLeadRelationsInTenant), gate CYC-007 em lote e contraste WCAG — escopo maior que este adendo; a revisão anterior já validou esses pontos.
- Ordem de merge sugerida da onda: #381 → #383 (dependência coluna `company`) → demais; #390 depende deste adendo.
- Relacionado: `.agents/runs/00-fila-handoffs-20261117.md`, seção "Atualização — 2026-11-18 (relatório final Agente 01/01A)".

## Resolução

- **Data da Resolução:** 2026-11-19
- **Auditor:** Agente 24 — Revisão Independente
- **Parecer Emitido:** `.agents/reviews/24-revisao-pr390-adendo-atomicidade.md`
- **Veredito:** **STATUS: APROVADO**
- **Síntese:** A análise de atomicidade confirmou que o trade-off temporário de duas escritas sequenciais do commit `54b117f53` foi sanado e superado pelo commit `ff9b5143b`. O `repository.updateStatus` foi parametrizado com `extraFields`, gravando `status`, `closedAt`, `pipelineId`, `pipelineStageId`, `probability`, `owner`, `tags` e `timeline` em uma única instrução `prisma.lead.update` atômica por item. A semântica de `failedCount` é resiliente e adequada para o Kanban do CRM. Testes automatizados cobrem o cenário de sucesso atômico e rejeição sem estado parcial (`LeadUseCases.batchUpdate.test.ts` 11/11 aprovados, `PrismaLeadRepository.test.ts` 13/13 aprovados). O PR #390 está formalmente aprovado e liberado para merge. Handoff encerrado.

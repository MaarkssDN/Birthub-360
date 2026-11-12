# Run — Agente 05 · Prospecção — Handoffs pendentes (saneamento 20261110)

- **Data:** 2026-11-12
- **Branch:** `agente/05-prospeccao-saneamento` (worktree `C:\Github\Birthub-360-worktrees\agente-05-prospeccao`, fast-forward para origin/main @ bd292b3be)
- **Escopo:** executar todos os handoffs `aberto`/`em-andamento` destinados ao Agente 05.

## Handoffs localizados

Varredura de `.agents/handoffs/**` por `Para:` contendo `05`/`Prospecção` em origin/main:

| Handoff | Status inicial | Desfecho |
|---|---|---|
| `onda-saneamento-20261110/00-para-05-acumulo-de-cache-...` (TAREFA-SANEAMENTO-019 / BT360-DT-0027) | em-andamento | **resolvido** — já integrado em main |
| `onda-saneamento-20261110/00-para-05-ausencia-de-validacao-previa-...` (TAREFA-SANEAMENTO-020 / BT360-DT-0028) | aberto | **resolvido** — implementação re-aplicada nesta branch |
| `onda-saneamento-20261105/00-para-05-circuit-breaker-enriquecimento-leads.md` | resolvido | sem ação |
| `onda-turbo-20261009/07-para-00-turbo-ai.md` (05 como co-destinatário) | resolvido | sem ação |

Handoffs antigos endereçados ao 05 (onda-2, onda-6, onda-7, onda-14, audit-ach, techdebt-2026-09-29) não existem mais na árvore de origin/main — consolidados/removidos na limpeza pré-formatação (`aac2839fd` e seguintes).

## O que foi feito

### 1. TAREFA-SANEAMENTO-019 — expurgo do cache de enriquecimento

Implementação já estava integrada: commit `0e412d67b` + merge `83298fa86` ("revisao 24 aprovado"). Re-verificado nesta sessão: `purgeExpiredEnrichmentLogs`/`maybePurgeExpiredEnrichmentLogs` presentes em `src/features/prospecting/services/enrichment.service.ts`; `enrichmentRetention.test.ts` 10/10. Handoff marcado `resolvido` com evidência.

### 2. TAREFA-SANEAMENTO-020 — opt-out como filtro sanitizador em lote (cold email)

**Achado de regressão:** a implementação original (commit `f635264b6`, merge `92996f4d3` wave 2) havia sido perdida em merges subsequentes — `sendColdEmailBatch` não existia mais em `cold-email.service.ts` e o handoff havia voltado a `Status: aberto` sem seção de resolução.

Re-aplicada de forma idêntica ao commit original (diff cirúrgico):

- `src/features/prospecting/services/cold-email.service.ts` (+92 linhas): `sendColdEmailBatch` + tipos `ColdEmailBatchOutcome`/`ColdEmailBatchItemResult`/`ColdEmailBatchResult`. Filtra opt-out para a lista inteira ANTES de qualquer envio; `invalid` fail-closed sem `organizationId`; erro do supressor propaga; `sendColdEmail` mantém checagem de borda.
- `src/features/prospecting/services/__tests__/cold-email.service.test.ts` (+~110 linhas): 5 novos testes no describe `sendColdEmailBatch`.

Sem migration/schema (não aplicável — só serviços em `src/features/prospecting/**`, propriedade do Agente 05).

## Gates executados (worktree, node_modules via junction p/ checkout principal)

- `npx tsc --noEmit` — passou (exit 0, sem diagnósticos).
- `npx biome lint` nos 2 arquivos alterados — 0 diagnósticos.
- `npx vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/cold-email.service.test.ts` — 9/9.
- `npx vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/enrichmentRetention.test.ts` — 10/10.

## Pendências

- Parecer formal do Agente 24 sobre a re-aplicação do TAREFA-SANEAMENTO-020 (a resolução original já havia sido mergeada uma vez; esta é uma re-aplicação idêntica após perda por merge).
- Recomendação registrada no handoff: avaliar `findMatches` batch (1 query por lista) se o volume de listas crescer — melhoria futura, não bloqueia.

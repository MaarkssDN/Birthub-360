# Handoff — Refatoração de hotspots CRM (CrmBoard + PrismaCrm360Repository)

De: 00 — Coordenador
Para: 04 — CRM e BI
Onda: W7 (pós-auditoria 2026-11-12)
Status: resolvido
Prioridade: normal
Sprint destino: próxima onda

## Problema

Relatório do supervisor Onda 00 marcou hotspots de manutenibilidade:
`CrmBoard.tsx` (~1258 linhas) e `PrismaCrm360Repository.ts` (~1205 linhas na
epocha do relatório). A tentativa de refatoração na W7 foi interrompida
(sessão reiniciou) com extração parcial órfã — descartada sem commit.

## Arquivo(s) envolvido(s)

- `src/features/crm/components/CrmBoard.tsx` (ou caminho real — verificar)
- `src/features/crm360/infra/PrismaCrm360Repository.ts`

## Evidência

- Worktree `agente-04-crm-hotspots` preservada (branch `agente/04-crm-hotspots`,
  sem commits — arquivos órfãos foram removidos pelo coordenador).

## Alteração necessária

Refatoração CIRÚRGICA, zero mudança de comportamento:
1. `PrismaCrm360Repository`: extrair grupos coesos (ex.: deal items,
   documents) para classes adjacentes em `infra/`, facade estável.
2. `CrmBoard.tsx`: extrair sub-componentes puros (cards, colunas, filtros).
3. Gate: `npx tsc --noEmit` + vitest crm360 + testes de componente.

## Teste esperado

- Suite crm360 verde; nenhum teste de comportamento alterado.

## Contexto adicional

Atenção: o repositório recebeu merges recentes (trava FOR UPDATE de desconto,
addDealItem guard) — trabalhar em cima do HEAD atual de
`integracao/coordenador-20261112`.

## Resolução (Agente 04, Onda 3 — 2026-11-15, worktree `agente/04-onda3-crm`)

Refatoração cirúrgica concluída, zero mudança de comportamento, em cima do HEAD atual de
`origin/main` (não da branch `integracao/coordenador-20261112` citada no handoff — a base
vigente já continha a trava FOR UPDATE de desconto e o guard de addDealItem).

**`PrismaCrm360Repository.ts`: 1152 → 599 linhas** (limite de falha do gate: 1000).
- Novo `infra/PrismaCrmDocumentRepository.ts` (550 linhas): todos os métodos de
  `CrmCommercialDocument` — listDocuments, createDocument, updateDocumentContent,
  listDocumentVersions, updateDocumentStatus, reconcileFaturaStripePayment,
  recordDocumentView, requestDocumentSignature — com `serializeDocument`.
- Novo `infra/PrismaCrmDealItemsRepository.ts` (124 linhas): listProducts, createProduct,
  getDealItems, addDealItem (com trava RN-CRM-02), removeDealItem.
- Novo `infra/crm360Calculations.ts` (35 linhas): `roundMoney`, `calculateItem`,
  `computeDocumentTotals` compartilhados.
- `PrismaCrm360Repository` virou fachada estável: mantém overview/pipelines/board/
  updateLeadStage/convertLead e delega o restante — assinatura pública e
  `ICrm360Repository` inalteradas.
- Exceção removida de `docs/architecture/HOTSPOT_EXCEPTIONS.md` (arquivo não precisa mais
  dela). Aproveitada a limpeza para remover um fragmento órfão de exceções antigas
  (`BitrixImportPanel.tsx`/`CadenceHub.tsx` — headers `###` perdidos num merge anterior;
  ambos os arquivos hoje estão muito abaixo de 1000 linhas, então as exceções estavam mortas).
- `.dependency-cruiser-known-violations.json`: as 5 arestas `no-cross-feature-imports`
  (3→cadence, 2→crm) migraram de `from` para o novo arquivo de documentos; as 2 arestas crm
  permanecem também no arquivo principal (updateLeadStage). Baseline continua cobrindo
  exatamente as violações reais.

**`CrmBoard.tsx`: 886 → 687 linhas** (abaixo do limite de aviso de 700).
- Novo `src/hooks/useCrmBoardBatchActions.ts` (150 linhas): handleBatchMoveStage,
  handleBatchReassignOwner, handleBatchExportBitrix, handleBatchEnrichSelected +
  `isBatchUpdating`.
- Novo `src/hooks/useCrmBoardUrlParams.ts` (142 linhas): handleFunnelChange,
  handleApplySavedView, handleOwner/Enrichment/Temperature/SearchQuery/ClearFilters —
  `useSearchParams` segue como fonte de verdade.
- `clearSelection` no componente replica exatamente o `setSelectedLeadIds(new Set())`
  original (não toca `selectionMode`, como antes).

**Gates executados (worktree):**
- `npx tsc --noEmit` — limpo.
- `npx biome check` nos 7 arquivos tocados — limpo (após `--write` de formatação).
- `npm run check:hotspots` — 1916 arquivos, 0 falhas; exceção do repository removida sem
  exceção stale correspondente.
- `npm run lint:architecture` + `verify:architecture-coverage` — verdes.
- vitest unit: `tests/unit/features/crm360/**` (59 testes, incl.
  `PrismaCrm360Repository.test.ts` e `.reconciliation.test.ts`),
  `CrmBoardToolbar.test.tsx`, `CrmBoard-performance.test.tsx`, `AppLayout.test.tsx`
  (87 testes) — todos verdes.
- Testes de integração que exercitam o repositório (`tests/integration/
  proposalVersioning`, `document-signature.routes`, `dealClosureGate`) requerem banco de
  testes — não executados neste ambiente; a superfície pública não mudou, então o risco é
  baixo, mas ficam como verificação pendente do gate de integração.

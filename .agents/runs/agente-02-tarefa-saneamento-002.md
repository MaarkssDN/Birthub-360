# Run — Agente 02 · TAREFA-SANEAMENTO-002 / BT360-DT-0015

- **Data:** 2026-11-12
- **Onda:** W4 (Domínio de produto)
- **Branch:** `agente/02-w4-crmboard` (base `origin/integracao/onda-saneamento-20261110` @ `4b561f15b`)
- **Worktree:** `C:/Github/Birthub-360-worktrees/agente-02-w4-produto`
- **Handoff:** `00-para-02-hotspot-estrutural-...` → `em-andamento`

## O que foi feito

`src/components/CrmBoard.tsx`: **1257 → 501 linhas**. Extrações cirúrgicas em `src/components/crm-board/`:

| Arquivo | Responsabilidade |
|---|---|
| `useCrmBoardDnD.ts` (259 ln) | sensors dnd-kit, coordinateGetter de teclado multi-coluna (cursor em ref — solução documentada preservada), announcements a11y, handlers drag |
| `useCrmBoardBulkActions.ts` (198 ln) | seleção múltipla, `/api/team/assignable`, batch stage/owner/Bitrix/enrich |
| `CrmBoardHeader.tsx` (175 ln) | título, toggle de funil, toolbar de ações |
| `CrmBoardFiltersBar.tsx` (121 ln) | busca + filtros owner/enriquecimento/temperatura |
| `CrmBoardBatchBar.tsx` (165 ln) | barra flutuante de ações em lote |
| `CrmBoardMetricsBar.tsx` (70 ln) | faixa de vitais do pipeline |
| `stageLabels.ts` (21 ln) | `STAGE_DISPLAY_LABELS`/`formatStageLabel` (re-exportado por CrmBoard.tsx) |

Componente principal mantém: estado de funil/filtros via URL, `useCrmBoardController`, SSE, agrupamento por coluna, composição JSX, modais/drawer.

## Verificação

- `npx tsc --noEmit`: **PASS**.
- `npx biome check` (8 arquivos): **PASS**.
- `vitest tests/unit/features/crm/ + useCrmBoardController.test.tsx`: **44/44 PASS**.
- `check:hotspots`: **exit 0** (0 arquivos sem exceção); exceção do CrmBoard em `HOTSPOT_EXCEPTIONS.md` ficou obsoleta — gate emite warning sugerindo limpeza; remoção delegada ao Agente 08 (dono de `docs/`).
- E2E do board: **não executado** (sem Docker).

## Pendências

- Parecer Agente 24; integração pelo Agente 00.

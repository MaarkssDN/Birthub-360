# Plano do Squad 30 — Produto, UX, Design System e Marca (v2)
Coordenadora: Agente 30 — Violeta · DEM-20261123-001
Clone autoritativo: `C:\Github\Birthub-360` (NÃO usar `D:\Github\Birthub-360` — stale/divergente)
Branch coord: `coord/squad-30-v2` · Branch integração: `integracao/squad-30`
Worktree: `C:/Github/Birthub-360-worktrees/squads/squad-30/wt-coord`
Base: `93e82c220` (ancestralidade verificada: `32d07c375` = ponta Onda 3 é ancestor;
`git merge-base --is-ancestor 32d07c375 HEAD` → OK)
Lease: `.agents/runs/leases/squad-30-coord-v2.lease` · Portas: 22300–22399

## Histórico
- `coord/squad-30` + `bd83277f0` (clone D:) = **SUPERADA** — SkipLink duplicado;
  já integrado na Onda 3 via Agentes 34 (`ec193df74`) e 31 (`0e27cf657`),
  parecer Silas APROVADO. Branch antiga preservada intacta no clone D:.

## Estado real na base 93e82c220
- SkipLink: **integrado** (`src/components/a11y/SkipLink.tsx` + `index.ts` +
  montagem em `MainLayout.tsx:52`).
- Inventário a11y do Agente 34 (`.agents/runs/onda-3/34-relatorio.md`):
  58 diagnósticos `lint/a11y/*` roteados por ownership.
- `src/components/feedback/` = só `EmptyState.tsx` (lacuna Loading/Error → 32).
- `src/components/motion/` = só `MotionWrapper.tsx` (35).
- Registro oficial: `.agents/runs/REGISTRO_GLOBAL_100_AGENTES_20261124.md` —
  squad 30: 31 e 34 com entregas Onda 3 integradas; 30/32/33/35–39 PREPARADOS.

## Backlog priorizado
| # | Item | Owner path | Status |
|---|------|-----------|--------|
| S30-02a | a11y paths sem dono — item 1: cards `CentralModulesHomeViews.tsx` div/motion.div onClick sem teclado (WCAG 2.1.1/4.1.2) | `src/features/home/**` (squad 30) | **EXECUTADA** (coord/squad-30-v2) |
| S30-02b | a11y paths sem dono — item 2: `DashboardBuilderModal.tsx` labels órfãs ×3 | `features/dashboard/**` → sugerido 38 | handoff interno squad |
| S30-02c | paths sem dono — itens 3–5: copilot HUD, mobile recorder, teste AuthContext | fora do squad 30 | rerrotear p/ 70-74 / 80 / 08 via Astra |
| S30-02d | 34→36 landing a11y (27 ocorr.) | `features/landing/**` (36 PREPARADO) | endossado, aguarda executor |
| S30-02e | 34→38 charts a11y (RevenueChart roles) | `components/charts/**` (38 PREPARADO) | endossado, aguarda executor |
| S30-02f | 34→40 KanbanBoard stub role=button | Squad 40 | handoff formal já endereçado a 40-Ravi |
| S30-02g | 34→60 voice-hub a11y (18 ocorr.) | Squad 60 | handoff formal já endereçado a 60-Aurora |
| S30-03 | Estados UI: Loading/Error/Skeleton em `feedback/**` | 32 Ema | próxima missão recomendada |
| S30-04 | App shell: foco/ordem pós-SkipLink, drawer mobile | 31 Noa | avaliar |
| S30-05 | Design system: tokens + extrair viewers de `PillarRegistry.tsx` (hotspot #11, vence 30/11) | 33 Célia | prioridade por prazo |
| S30-06 | Motion audit (35), landing hotspots #1/#2 (36, vence 30/11), dashboards (38), brandbook (39) | — | avaliar demanda |

## Execução S30-02a (evidência)
- `src/features/home/CentralModulesHomeViews.tsx`: 4 cards clicáveis
  (Bento/Grid/Hub/Flow) ganharam `role="button"`, `tabIndex={0}` e
  `onKeyDown` Enter/Espaço via helper `onModuleCardKeyDown`.
- Biome-ignore justificado em `useSemanticElements` (card contém headings —
  `<button>` nativo inválido por content model).
- Teste novo `src/features/home/__tests__/CentralModulesHomeViews.a11y.test.tsx`
  (8 casos: role/tabindex + Enter/Espaço nas 4 views).
- Gates: `tsc --noEmit` exit 0 · `biome lint src/features/home/` limpo ·
  vitest 8/8 novo + 3/3 `CentralModulesHome.test.tsx` existente.

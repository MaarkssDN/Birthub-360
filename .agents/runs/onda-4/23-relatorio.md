# Agente 23 — Relatório Onda 4 (MEL-25 / MEL-26 / MEL-32 — DEM-20261114-003)

Branch: `agente/23-onda4-perf` (base `integracao/onda-4`)
Worktree: `C:\Github\Birthub-360-worktrees\agente-23-onda4-perf`
Status: **concluído** — retomada de sessão congelada; diff revisado, completado e commitado.

## Commits

| Hash | Escopo |
|---|---|
| `81c71f3d1` | refactor(icons,MEL-25): decompõe BrandIcons e flowIcons |
| `a68e15efa` | refactor(home,MEL-25): extrai views de CentralModulesHome |
| `e5684aaa5` | perf(activities,MEL-32): memoiza filtro da ActivityList |
| `026c3d9e3` | perf(build,MEL-26): manualChunks impede preload de vendor-charts/vendor-3d |

## Diff resumido

### MEL-25 — god components decompostos (sem mudança visual/comportamental)

**Biblioteca de ícones** (`src/components/icons/`)
- `brandIconBase.tsx` (novo, 23 linhas): helper `brandIconBase()` + tipo `BrandIconProps` extraídos de `BrandIcons.tsx`.
- `BrandIcons.tsx`: 818 → 393 linhas — núcleo (navegação, ações, status CRM).
- `BrandIconsExtended.tsx` (novo, 327 linhas): ícones sociais/utilitários (`IconFacebook`, `IconStar`, `IconTag`, etc.).
- `index.ts`: reexporta os três módulos — **mesmos exports públicos**, sem dependência circular (fluxo unidirecional: Extended/Base → BrandIcons → index).
- Verificação: diff das listas de `export function/const/type` HEAD vs. novo = idêntico (BrandIconProps reexportado via `export type { ... }`).

**Title icons** (`src/components/brand/title-icons/`)
- `flowIcons.tsx`: 744 → ~460 linhas (mantém `FlowSectionIcon`, `FlowStep1-5Icon`).
- `flowIconsSections.tsx` (novo, 282 linhas): `AiSectionIcon`, `AutomationSectionIcon`, etc.
- `LandingTitleIcons.tsx`: +1 linha de reexport — mesmo contrato público.
- Verificação: diff de exports HEAD vs. novo = idêntico.

**CentralModulesHome** (`src/features/home/`)
- `CentralModulesHome.tsx`: ~930 → 325 linhas — orquestração (layout state, filtros, handlers).
- `CentralModulesHomeViews.tsx` (novo, 615 linhas): `BentoEditorialView`, `GridModularView`, `HubOrbitalView`, `WorkflowPipelineView` com o mesmo contrato interno (`modules`, `onNavigate`, `isDark`).

### MEL-26 — bundle

`vite.config.ts` (`manualChunks`): duas regras novas, ambas removendo **arestas estáticas indevidas** do entry:

1. `vite/preload-helper` → `vendor-react`: o helper de preload do Vite é importado estaticamente por todo chunk com import dinâmico. Sem regra própria, o Rollup o alojava dentro do primeiro chunk manual (vendor-3d) e o entry passava a importá-lo — fazendo o Vite marcar vendor-3d como modulepreload do `index.html`.
2. `clsx`/`tailwind-merge` → `vendor-react`: o entry importava `clsx` de `vendor-charts` (clsx é dependência do recharts), forçando preload de ~121 kB gzip no load inicial.

**Evidência (build antes → depois, medido neste worktree):**

| Métrica | Antes (base) | Depois |
|---|---|---|
| `index.html` modulepreload | vendor-auth, **vendor-3d (901.98 kB / 243.92 kB gz)**, **vendor-charts (427.65 kB / 121.28 kB gz)**, vendor-motion, vendor-icons, vendor-react | vendor-auth, vendor-react, vendor-motion, vendor-icons |
| Entry `index-*.js` | 539.69 kB / 168.11 kB gz | 511.60 kB / 159.41 kB gz |
| vendor-react | 341.82 kB / 111.15 kB gz | 371.15 kB / 120.69 kB gz (absorveu clsx/tailwind-merge/preload-helper) |

Redução líquida no caminho crítico de preload: **~355 kB gzip** (vendor-3d + vendor-charts saem do load inicial; vendor-react cresce ~9,5 kB gz). Nenhum chunk de rota mudou de tamanho de forma relevante — lazy loading existente preservado.

### MEL-32 — ActivityList

`ActivityList.tsx`: `filtered` (filtro client-side sobre até 100 atividades, `useActivities({ limit: 100 })`) passou de recomputação a cada render para `useMemo` com deps `[activities, filterMineOnly, currentUser?.name, searchTerm]` — digitação no formulário de nova atividade não reexecuta mais o filtro. Grid já usa `key={a.id}`; cards são `motion.div` com animação de entrada. Virtualização não aplicada: lista limitada a 100 itens e já particionada em chunk lazy (`ActivityList-*.js` 21 kB) — memoização + keys corretas atendem o critério sem refatoração de comportamento.

## Gates executados

| Gate | Resultado |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | ✅ verde |
| `npm run lint` (biome) | ✅ verde — 1515 warnings pré-existentes no repo (0 errors); 3 warnings nos arquivos tocados são pré-existentes (parâmetro `color` não usado em `FlowSectionIcon` — código movido verbatim; a11y em `CentralModulesHomeViews` — div onClick movida verbatim do original) |
| `npx vitest run tests/unit/components/layout/AppLayout.test.tsx` | ✅ 87/87 (mocka `CentralModulesHome` e `ActivityList`) |
| `npm run build` | ✅ verde — 5944 módulos, PWA precache 252 entradas verificado |
| `npm run check:hotspots` | ✅ 0 arquivos acima de 1000 linhas sem exceção (BrandIcons 393, flowIcons ~460+282, CentralModulesHome 325+615; ActivityList 861 — warning pré-existente) |

Não há testes unitários dedicados aos componentes de ícones/title-icons/home — os únicos testes que tocam os módulos alterados são os de `AppLayout` (via mocks), executados acima.

## Pendências / observações

- `ActivityList.tsx` segue em 861 linhas (warning de hotspot, limite 1000) — modularização adicional fica para demanda futura; fora do escopo MEL-32.
- Lint: warnings a11y (`noStaticElementInteractions`/`useKeyWithClickEvents`) e `noUnusedFunctionParameters` nos arquivos tocados são **pré-existentes** (código movido verbatim); não corrigidos para preservar diff cirúrgico. Recomendo handoff ao dono do domínio se quiserem saneamento.
- `dist/` regenerado pelo build de comparação — artefato local, não commitado.
- Sem impacto em tenancy/LGPD/contratos de API. Arquivos tocados: `src/components/icons/**`, `src/components/brand/**`, `src/features/home/**`, `src/features/activities/components/ActivityList.tsx` (domínio do Agente 04 — mudança cirúrgica de performance autorizada pela missão DEM-20261114-003; se o 04 contestar, reverter `e5684aaa5`), `vite.config.ts`.

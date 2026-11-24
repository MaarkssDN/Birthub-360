# Plano do Squad 30 — Produto, UX, Design System e Marca
Coordenadora: Agente 30 — Violeta · DEM-20261123-001
Branch: `coord/squad-30` · Worktree: `C:/Github/Birthub-360-worktrees/squads/squad-30/wt-coord`
Base: `9f80c07ed` (ponta de `integracao/onda-4-dem20261123`, que contém `integracao/onda-3-dem20261123`)

## Desvios de setup registrados
- SHA `93e82c220` **não existe** neste clone (verificado via `git cat-file`, `git rev-list --all`, após `git fetch origin`). Base adotada: ponta da integração Onda 4 (`9f80c07ed`), que já contém a Onda 3.
- `.agents/runs/REGISTRO_GLOBAL_100_AGENTES_20261124.md`, `.agents/runs/estrutura-10-coordenadores-squads-20261124.md` e handoffs `34-para-*` **não existem** neste checkout — provável artefato da onda ainda não mergeado. Backlog reconstruído a partir de AGENTS.md, MATRIZ_PROPRIEDADE.md e estado real do código.
- `.agents/runs/leases/` não existia; criado `squad-30.lease`.
- Sem runtime de subagentes neste ambiente → execução priorizada pela própria coordenadora, com handoffs formais para revisão dos especialistas e do Silas.

## Estado real verificado (evidência)
- **Não existe SkipLink** em `src/` (grep `skip.?link|skip.?to.?main` = 0 ocorrências).
- `<main>` em `src/components/layout/MainLayout.tsx` não tinha `id` nem `tabIndex` → WCAG 2.2 AA critério **2.4.1 Bypass Blocks** em aberto.
- `src/components/a11y/` não existia (dono: Agente 34 Ari).
- `src/components/feedback/` contém apenas `EmptyState.tsx` → lacunas de Loading/Error (Agente 32 Ema).
- `src/components/motion/` contém apenas `MotionWrapper.tsx`; `MotionConfig reducedMotion="user"` já ativo em `App.tsx` (base do Agente 35 Mia).

## Backlog priorizado do squad
| # | Agente | Missão | Prioridade | Status |
|---|--------|--------|-----------|--------|
| S30-01 | 30→34/31 | SkipLink WCAG 2.4.1 + alvo `#main-content` | P0 | **EXECUTADA** (esta branch) |
| S30-02 | 34 Ari | Consolidar débitos a11y: landing (`src/features/landing/**`), charts (`src/components/charts/**`), CRM (handoff formal p/ Squad 40), voice-hub (handoff formal p/ Squad 60) | P1 | planejada |
| S30-03 | 32 Ema | Estados de UI: criar Loading/Error em `src/components/feedback/` | P1 | planejada |
| S30-04 | 31 Noa | Revisar ordem de foco do shell pós-SkipLink; drawer mobile | P2 | planejada |
| S30-05 | 33 Célia | Auditoria tokens/componentes base (`ui/**`, `tailwind.config`) | P2 | avaliar |
| S30-06 | 35–39 | Motion residual, landing, onboarding, dashboards, marca | P3 | avaliar demanda |

## Regras operacionais do squad
- Portas: 22300–22399. Sem push/PR/main. SHA congelado → parecer Silas via Astra.
- Handoffs internos em `.agents/handoffs/squad-30/`; cross-squad formais (40 CRM, 50 integrações, 60 voice).
- Ownership: 31 `App.tsx`+`layout/**`; 32 `feedback/**`; 33 `ui/**`+tokens; 34 `a11y/**`; 35 `motion/**`; 36 `landing/**`; 37 `onboarding/ui/**`; 38 `analytics/ui`+`charts/**`; 39 `identidade-visual`+`documentacao-aplicacao`.
- Edição S30-01 tocou `layout/MainLayout.tsx` (31) e criou `a11y/SkipLink.tsx` (34) **executada pela coordenadora** por indisponibilidade de subagentes — sinalizado nos handoffs para revisão dos donos.

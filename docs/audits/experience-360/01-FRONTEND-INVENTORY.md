# 01 — Inventário Técnico do Frontend
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base auditada:** `origin/main @ 0d790443d` (worktree `Birthub-360-audit-main`)
**Complementa:** `.agents/runs/birthub-experience-360-fase-zero-relatorio.md` (Fase Zero de 2026-11-19, HEAD 03546a77)

## 1. Stack verificada

| Camada | Tecnologia | Evidência |
|---|---|---|
| Framework | React 19.3 + Vite 6.4 (SPA, não SSR) | `package.json` |
| Roteamento | react-router-dom 7.18 | `package.json`, `src/App.tsx` (194 linhas) |
| Estilo | Tailwind CSS v4 CSS-first (`@tailwindcss/vite`), tokens em `@theme` | `src/styles/globals.css` (1.990 linhas), `src/index.css` (8 linhas) |
| Componentes base | shadcn-style em `src/components/ui/` (~97 arquivos), Radix slot, lucide-react | `src/components/ui/` |
| Motion | framer-motion 13 + `src/lib/motion.ts` | `package.json` |
| Gráficos | recharts 3 | `package.json` |
| 3D | three 0.185 (landing) | `package.json`, `src/features/landing/` |
| Testes | Vitest 4 (unit/integration/container), Playwright 1.63 (e2e + visual), axe-core | `vitest.*.config.ts`, `playwright*.config.ts` |
| Mobile | Capacitor (`capacitor.config.ts`, `android/`, `ios/`) | raiz |
| Qualidade | Biome (lint/format), dependency-cruiser, SonarQube, k6, ZAP, Trivy | `biome.json`, `package.json` scripts |

## 2. Dimensão do código frontend

| Métrica | Valor |
|---|---|
| Arquivos `.tsx` em `src/` | 545 |
| Arquivos `.ts` em `src/` | 1.791 |
| Arquivos `.css` em `src/` | 16 |
| Features (`src/features/`) | 59 módulos |
| Componentes raiz (`src/components/`) | ~15 diretórios + arquivos soltos |
| `src/components/ui/` | ~97 primitivos/componentes |
| Rotas `/app/*` em `AppLayout.tsx` | 73 `<Route path>` (+ index, wildcard, redirects) |
| Rotas públicas em `App.tsx` | ~13 |

### Maiores arquivos (monólitos potenciais)

| Arquivo | Linhas | Observação |
|---|---|---|
| `src/features/landing/pages/Landing360.tsx` | 3.190 | Landing (fora de escopo de redessin — decisão vigente) |
| `src/features/landing/components/pillars/PillarRegistry.tsx` | 1.402 | Landing |
| `src/features/voice-hub/components/design-system/index.tsx` | 1.098 | DS paralelo do voice-hub — risco de divergência |
| `src/features/crm/components/LeadDetailDrawer.tsx` | 1.051 | Acima do limite de hotspot (1.000) |
| `src/features/landing/pages/Landing360Impeccable.tsx` | 1.020 | Landing |
| `src/features/intelligence/components/SuperagentCreator.tsx` | 995 | |
| `src/features/dashboard/components/SinglePageDashboard.tsx` | 978 | |
| `src/features/intelligence/components/AIPendingActionsInbox.tsx` | 970 | |
| `src/features/intelligence/components/UniversalEcosystemPanel.tsx` | 950 | |
| `src/features/intelligence/components/IntelligenceHub.tsx` | 939 | |
| `src/features/intelligence/components/SwarmDashboard.tsx` | 932 | |
| `src/features/commercial-intelligence/components/DailyPlanHub.tsx` | 922 | |
| `src/components/Intelligence.tsx` | 906 | Componente raiz compartilhado — dono a escalar ao 00 |

## 3. Organização

- **`src/features/<modulo>/`** — estrutura hexagonal recorrente: `domain/`, `application/`, `infra/`, `presentation/` (rotas/controller), `components/`, `*.api.ts`, hooks. Bom isolamento por domínio.
- **`src/components/`** — compartilhados: `ui/` (primitivos), `layout/` (shell — dono Agente 02), `crm/`, `charts/`, `feedback/`, `icons/`, `brand/`, `motion/`.
- **`src/pages/`** — apenas 3 arquivos; a maioria das telas vive dentro de `src/features/*/components/`.
- **`src/styles/globals.css`** — folha única de tokens + utilitários globais (dono Agente 03).

## 4. Ownership de arquivos (relevante para esta operação)

| Escopo | Dono | Regra |
|---|---|---|
| `src/App.tsx`, `src/components/layout/**` (Sidebar, shell) | Agente 02 | Nenhum outro agente altera navegação |
| `src/components/ui/**`, `src/styles/**` | Agente 03 | Tokens/estilos globais |
| `src/lib/motion.ts` + variantes | Agente 03D | |
| a11y (atributos) em `src/**` | Agente 03E | |
| QA visual/baselines | Agente 03F + 08/14 | |
| `src/pages/**`, orquestração de design | Agentes 03A/03B | |
| **Landing e Login** | **intocáveis** (03A/03G) | PRs #412/#415 já trataram; não reabrir |
| `identidade-visual/**`, marca | Agente 11 | |
| `.github/workflows/**`, `playwright.config.ts` | Agente 08 | |
| `android/**`, `capacitor.config.ts` | Agente 09 | |
| `.agents/prompts/**`, `AGENTS.md`, `.claude/CLAUDE.md` | decisão humana | |

## 5. Baseline de gates (estado conhecido)

| Gate | Último resultado conhecido | Fonte |
|---|---|---|
| `npm run typecheck` | verde (0 erros) | fase-zero §11 |
| `npm run lint` (biome) | 0 erros, ~1.561 warnings pré-existentes | fase-zero §2 |
| `npm run test:unit` | verde: 921 arquivos / 7.366 testes | fase-zero §11 |
| `test:architecture` | EXIT 0 (70 violações conhecidas conferem) | fase-zero §11 |
| `test:e2e` / `test:visual` / axe | harness local do Agente 14: auth 4/4, accessibility 34/34; inventário visual 70 rotas executado (ver §6) | `14-inventario-visual-app-20261119.md` |
| `npm audit` | vulnerabilidades reportadas, detalhe não coletado | fase-zero QA-001 |

## 6. Inventário visual real já executado (Agente 14, 2026-11-19)

70 rotas `/app/*` × 4 variantes (1280×800 / 390×844 × claro/escuro), usuário ADMIN:
- 0 overflow horizontal a 390px; carga ≤ 2,2 s.
- 10 rotas são redirects/aliases.
- `characters` com HTTP 500 real; 3 rotas com 404 em endpoints de agente; `editor` com 429 (artefato de carga).
- axe crítico/sério em **19 de 70 rotas** (51 limpas): labels/select-name em settings de pilares, `button-name` em gamification, `color-contrast` em 7 rotas.
- **A11Y-001 medido:** 444/445 títulos h1–h4 passam no tema claro; falha só o H1 de `/app/characters` (`--warn` #FFC107 sobre #F4F7FB ≈ 1,52:1).
- NÃO executado: snapshots visuais com baseline, papéis não-ADMIN, interações além de carga, Meilisearch.

## 7. Divergências de branch auditada

- Branch de trabalho da sessão: `chore/handoff-00-despacho-wave-a-b-20261120` @ `e62fdd238` (2 commits à frente, 11 atrás de `origin/main`).
- Auditoria de código feita sobre `origin/main @ 0d790443d` (worktree destacado) — inclui merges waveF (#491–#496) e trilhas C.1–C.3 (Next Best Action, Round-Robin por score, telemetria Voice Hub).
- Working tree da branch tem modificações não commitadas restritas a `docs/orchestration/**` e handoffs `.agents/handoffs/**` — preservadas, não auditadas como código.

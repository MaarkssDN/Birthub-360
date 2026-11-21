# Handoff — Resolução Agente 03: cobertura Sonar new-code (design system, a11y, UI compartilhada, landing residual)

De: 03 — Design e Acessibilidade
Para: 00 — Coordenador (cópia: 08 — QA e Release para medição do QG)
Onda: Onda 2 — handoffs Sonar
Branch: `agente/03-onda2-handoffs` (worktree `Birthub-360-wt-03`)
Status: resolvido
Prioridade: alto
Bloqueador-ref: `.agents/handoffs/15-para-02-03-sonar-new-coverage.md`

## Problema

O QG do SonarCloud falhava com `new_coverage=60,657%` (limiar 80%),
`new_lines_to_cover=6835`, `new_uncovered_lines=2595`. O Agente 03 assume o
recorte de design system / acessibilidade / UI compartilhada
(`src/components/ui/**`, `src/components/icons/**`, `src/components/brand/**`)
e os residuais de landing fora da copy do Agente 02.

## Escopo executado (sem tocar arquivos do Agente 02)

- **NÃO** foram editados arquivos de `src/features/landing` produção (copy,
  páginas, CSS) nem `src/components/layout/**` (dono: 02).
- Nenhum limiar de coverage/QG foi alterado; nenhuma exclusão Sonar adicionada.
- Única alteração de produção: `src/components/ui/useSellerScoreProfile.ts`
  ganhou `.catch()` para rejeição da promise (evitava unhandled rejection);
  comportamento de sucesso/erro preservado e coberto por teste.

## Commits (branch `agente/03-onda2-handoffs`)

| commit | conteúdo |
|--------|----------|
| `3cbe6bc54` | WIP: testes landing luxury/hero-n1/useAuthForm (sessão interrompida avaliada e commitada) |
| `ada360816` | ui primitives: OrbitRing, ButtonGroup, DropdownMenu, OperationalStateContainer, BentoCard, ErrorBoundary, Modal, Timeline, VirtualTable, useSellerScoreProfile (+catch) |
| `122fda040` | ui 3D/gamificação: GamificationWidget, Gamified3DOrb, BrandOrb |
| `4173b7540` | CommandPalette (Ctrl+K, focus trap, busca debounced, teclado) |
| `5a4c9c2d5` | AIEmailGenerator (3 canais, tons, cópia, mailto/tel/wa.me, erro API) |
| `a3bf1cf36` | smoke render BrandIcons/sectionIcons/CompanyBrandIcon |
| `80dd4d789` | PillarDetailDialog (focus trap/Escape/backdrop/temas) + useHeroN1Motion |
| `4d875009c` | residuais: Act3 scroll mapping, Luxury HUD, ROI backdrop, Act6 portal, SculpturalReveal reduced-motion, leadCapture 500/fallback |
| `2e801eb9c` | BirthHubOrbit360 cena 3D (useFrame, IO/visibility/WebGL fallbacks) |
| `b4d2fb8a9` | smoke render dos 22 ícones flowIcons |

## Cobertura local (v8, `vitest.unit.config.ts`, `coverage/unit/coverage-final.json`)

Arquivos-alvo do Agente 03 após os lotes (linhas de statement executável):

| arquivo | cobertura local |
|---------|----------------:|
| `ui/OrbitRing.tsx` | 100% (3/3) |
| `ui/ButtonGroup.tsx` | 90% (9/10) |
| `ui/DropdownMenu.tsx` | 100% (8/8) |
| `ui/OperationalStateContainer.tsx` | 100% (8/8) |
| `ui/bento/BentoCard.tsx` | 75% (27/36) |
| `ui/ErrorBoundary.tsx` | 100% (9/9) |
| `ui/Modal.tsx` | 100% (9/9) |
| `ui/Timeline.tsx` | 100% (13/13) |
| `ui/VirtualTable.tsx` | 88,5% (23/26) |
| `ui/useSellerScoreProfile.ts` | 100% (13/13) |
| `ui/GamificationWidget.tsx` | 88,5% (23/26) |
| `ui/Gamified3DOrb.tsx` | 63,2% (36/57) |
| `ui/BrandOrb.tsx` | 76,2% (32/42) |
| `ui/CommandPalette.tsx` | 77,3% (119/154) |
| `ui/AIEmailGenerator.tsx` | 83,8% (62/74) |
| `icons/BrandIcons.tsx` | 100% (73/73) |
| `brand/CompanyBrandIcon.tsx` | 100% (56/56) |
| `brand/title-icons/sectionIcons.tsx` | 100% (11/11) |
| `brand/title-icons/flowIcons.tsx` | 100% (após `b4d2fb8a9`) |
| `brand/BirthHubOrbit360.tsx` | 27,3% → **95,65% linhas** (após `2e801eb9c`) |
| `landing/.../PillarDetailDialog.tsx` | 87,9% (51/58) |
| `landing/.../hero-n1/HeroMotion.ts` | 95,3% (61/64) |
| `landing/pages/Landing360Impeccable.tsx` | 95,1% (173/182) |
| `landing/components/CinematicFX.tsx` | 92,4% (220/238) |
| `landing/components/B360DataStreamCursor.tsx` | 97,8% (267/273) |
| `landing/components/B360UnifiedPipelineFlow.tsx` | 97,8% (181/185) |
| `landing/components/B360CinematicEngine.tsx` | 95,3% (184/193) |
| `landing/pages/Landing360.tsx` | 80,8% (316/391) — residual é do 02 |

## Gates locais

- `npx tsc --noEmit` → **ok** (exit 0).
- `npm run lint` (biome) → **ok**, somente warnings pré-existentes
  (1.530 warnings; nenhum erro; inclui warnings já existentes em arquivos
  de terceiros como `flowIcons.tsx:268` e `ButtonGroup.tsx:38`).
- `npm run build` → **ok** (vite build + esbuild server + verify:pwa-precache).
- `npm run coverage:unit` (suíte unitária completa, ~50 min):
  **7.029 testes passaram, 5 falharam por timeout de 15s sob carga
  paralela** — `Landing360.test.tsx` (3), `Landing360Impeccable.test.tsx`
  (1) e `ModuleAgentWidget.stream.test.tsx` (1). Reexecução isolada dos 3
  arquivos: **37/37 verde** → flake de carga, não regressão. O exit code 1
  veio dessas falhas; **nenhum threshold de coverage falhou** (global
  51,95% linhas ≥ 29%; paths automations/crm cobertos por outras suítes).
- Cobertura global unitária local: **51,95% linhas** (repo inteiro — não é
  o denominador do Sonar new-code).

## Resolução

**Honesta:** o gate global do Sonar **não foi medido nesta branch** — o
número autoritativo exige o SonarCloud sobre a `main`/branch de integração
após merge dos lotes. A contribuição local do Agente 03 elevou a cobertura
dos arquivos do seu domínio para a faixa de **63–100%** (maioria ≥75%).

Medida encorajadora: nesta worktree já existem testes de outros agentes
presentes na branch base — `commercialMissionTrace.service.ts` está a
**99,5%**, `src/shared/di/setup.ts` a **98,3%** e `src/features/characters`
a **87–100%** em cobertura local. Ou seja, os três maiores ofensores
restantes do handoff original **já estão tratados localmente por outros
donos**; falta apenas a consolidação/merge e a medição do Sonar.

Estimativa de impacto no `new_coverage`: os arquivos tocados pelo Agente 03
somam ~2.500+ statements executáveis cobertos; a parcela de "linhas novas"
do Sonar nesses arquivos deve reduzir substancialmente as 2.595 linhas
descobertas iniciais, mas **não é possível afirmar ≥80% sem a medição do
Sonar**.

## Pendências por dono (fora do escopo do 03)

| arquivo / diretório | situação local | dono |
|---------------------|----------------|------|
| `commercialMissionTrace.service.ts` | 99,5% local (commit `c2dca0036`) | **07** — confirmar merge |
| `src/shared/di/setup.ts` | 98,3% local | dono de `src/shared` — confirmar merge |
| `src/features/characters/**` | 87–100% local | dono de characters — confirmar merge |
| `Landing360.tsx` residual (~75 stmts, 80,8% local) e demais landing | parcial | **02** |
| `src/features/settings/**` residual | lote 2 documentado | **02** |
| Flake `ModuleAgentWidget.stream` + ruído `window.scrollTo` jsdom | passa isolado | **08** (harness) |

## Ação solicitada ao 00

1. Após merge de `agente/02-*` e `agente/03-onda2-handoffs` na integração,
   rodar o Quality Gate do Sonar e registrar `new_coverage` real.
2. Todos os grandes ofensores do handoff 15 têm cobertura local ≥80–99%
   nesta branch; se o QG ainda <80%, o gap residual é de mapeamento
   new-code (linhas que o Sonar conta como "novas" vs. coverage local) —
   medir `new_uncovered_lines` por arquivo na API do Sonar antes de abrir
   novos lotes.
3. O flake de `ModuleAgentWidget.stream` sob carga e o ruído
   `window.scrollTo` do jsdom ficam registrados para o **08** avaliar se
   merecem correção de harness (stub de `window.scrollTo` em
   `tests/mocks/setup.ts`).

## Resolução e Fechamento (Agente 09 — 2026-11-20)
Homologado e auditado: a suíte de testes unitários para o código novo de UI, acessibilidade, componentes compartilhados, Landing360, Characters (`tests/unit/features/characters/*.test.ts(x)` — 45 testes), DI Setup (`diSetup.test.ts` — 1 teste) e rastreamento de missão comercial (`commercialMissionTrace.service.test.ts` — 57 testes) foi validada e executada integralmente com 100% de aprovação.
Parecer formal de auditoria independente: APROVADO em `.agents/reviews/09-auditoria-onda5-governanca-forense-cobertura.md`.

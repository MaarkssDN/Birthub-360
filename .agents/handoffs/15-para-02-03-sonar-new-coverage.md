# Handoff — Cobertura de código novo abaixo de 80% (Sonar)

De: 15 — Segurança Aplicada
Para: 02 — Produto e UX / 03 — Design e Acessibilidade (landing e UI); demais donos citados por arquivo
Onda: Quality Gate da main `94f95097` (período de código novo desde 2026-10-27T21:30:30Z)
Status: aberto (parcial)
Prioridade: alto (bloqueia `new_coverage=60,7%`, limiar 80%)

## Problema

O Quality Gate do SonarCloud (`MarksNN_Birthub-360`, `main`) falha com
`new_coverage=60.657%` (limiar 80%), `new_lines_to_cover=6835`,
`new_uncovered_lines=2595` (`api/measures/component` e `component_tree`,
branch=main, período 1). A suspeita de que só o commit `75dee1ab` (settings
por pilar) derrubasse a métrica **não se confirma**: `src/features/settings`
tem 90 linhas novas descobertas / 205 a cobrir (53,7%) — contribui, mas não
é o maior peso.

## Arquivos que mais pesam (new_uncovered_lines, API Sonar)

| uncov | to_cover | cov% | arquivo | dono provável |
|------:|---------:|-----:|---------|---------------|
| 254 | 264 | 4,6 | `src/features/landing/components/B360DataStreamCursor.tsx` | 02 / 03 |
| 193 | 193 | 0,0 | `src/features/landing/pages/Landing360Impeccable.tsx` | 02 / 03 |
| 173 | 173 | 0,0 | `src/features/intelligence/services/commercialMissionTrace.service.ts` | 07 |
| 168 | 241 | 30,5 | `src/features/landing/components/CinematicFX.tsx` | 02 / 03 |
| 164 | 176 | 7,9 | `src/features/landing/components/B360UnifiedPipelineFlow.tsx` | 02 / 03 |
| 163 | 179 | 10,0 | `src/features/landing/components/B360CinematicEngine.tsx` | 02 / 03 |
| 114 | 119 | 6,6 | `src/shared/di/setup.ts` | ver AGENTS do `src/shared` |
| 76 | 76 | 0,0 | `src/features/characters/CharacterGalleryView.tsx` | dono de characters |
| 70 | 70 | 0,0 | `src/features/characters/useCharacterExecution.ts` | dono de characters |
| 43 | 107 | 56,8 | `src/features/settings/components/PillarSettingsPlaceholder.tsx` | 02 (`settings/AGENTS.md`) |
| 19 | 19 | 0,0 | `src/features/settings/routes/pillarSettings.routes.ts` | 02 |

Diretórios: `src/features/landing` sozinho tem **1268 / 2149** (45,8%) — é o
principal lastro. `src/components` 321 / 581 (43,0%). Settings é o 10º diretório.

## Alteração necessária

Cobrir com testes unitários (sem baixar o limiar, sem `sonar.exclusions` /
exclusions de coverage) principalmente os componentes novos da landing e os
serviços com 0% no período. Não estender exceções de Quality Gate.

Critério de pronto: `new_coverage` ≥ 80% no Quality Gate da `main`, medido
pelo Sonar no mesmo período.

## Contexto

O Agente 15 avalia um PR só de testes para alvos tratáveis (serviço de mission
trace, rotas/infra de settings) sem mexer em código de produção. Isso não
chega sozinho a 80% — o grosso é UI da landing. Este handoff permanece aberto
para o dono da landing/UI.

## Resolução

Parcial — lote 1 (landing), branch `agente-02/sonar-coverage-landing-1`.

Testes reais (Vitest 4 + jsdom + Testing Library) para os 5 arquivos de maior
peso da landing, **sem alterar código de produção, CSS da landing, snapshots
Playwright, limiar do Sonar ou exclusions**. Os efeitos de canvas/rAF que o
código desliga com `NODE_ENV === 'test'` foram exercitados stubando
`NODE_ENV=development` só no teste, com rAF em fila e canvas mockado.

Cobertura local (v8, `vitest.unit.config.ts`, mesmos 5 arquivos, suíte de
`tests/unit/features/landing` antes/depois):

| arquivo | linhas antes | linhas depois |
|---------|-------------:|--------------:|
| `B360DataStreamCursor.tsx` | 3,83% (10/261) | 99,23% (259/261) |
| `Landing360Impeccable.tsx` | 0% (0/167) | 97,0% (162/167) |
| `CinematicFX.tsx` | 26,69% (59/221) | 95,47% (211/221) |
| `B360UnifiedPipelineFlow.tsx` | 6,81% (12/176) | 100% (176/176) |
| `B360CinematicEngine.tsx` | 6,47% (11/170) | 100% (170/170) |
| **conjunto** | **9,24% (92/995)** | **98,29% (978/995)** |

São +886 linhas executáveis cobertas nestes arquivos. No recorte de código
novo do Sonar esses 5 arquivos tinham **942 linhas descobertas**; a maior
parte deve entrar no numerador de `new_coverage`.

O Quality Gate da main ainda não fecha sozinho com este lote: de 60,7% para
80% faltam ~1228 linhas novas cobertas (6835 a cobrir, 2595 descobertas).
Este lote deve abater a maior parte das 942, restando da ordem de **300–400
linhas** (mais o que o Sonar não creditar 1:1). Próximos lotes: settings
(90/205, 53,7%) e o restante da landing / `src/components`.

Gates locais deste lote: 66 testes da suíte de landing (inclui os 12 casos
já existentes de `Landing360.test.tsx`), `typecheck`, `lint` e `build` ok.

---

Parcial — lote 2 (settings + `src/components`), branch `agente-02/sonar-coverage-settings-1`.

Testes reais (Vitest 4 + jsdom + Testing Library) para o recorte de settings
do período de código novo e para os componentes novos de maior impacto em
`src/components`, **sem alterar código de produção, CSS da landing, snapshots
Playwright, limiar do Sonar ou exclusions**. Sem rebase e sem force push.

Cobertura local (v8, `vitest.unit.config.ts`) — arquivos alvo deste lote:

### Settings

| arquivo | linhas antes | linhas depois |
|---------|-------------:|--------------:|
| `pillarSettings.routes.ts` | 0% (0/18) | 100% (18/18) |
| `pillarSettings.api.ts` | 0% (0/4) | 100% (4/4) |
| `PillarSettingsSettingRepository.ts` | 12,50% (1/8) | 100% (8/8) |
| `pillarSettings.ts` (domain) | 72,50% (29/40) | 97,50% (39/40) |
| `pillarSettings.service.ts` | 86,36% (19/22) | 95,45% (21/22) |
| `PillarSettingsPlaceholder.tsx` | 50,31% (80/159) | 84,27% (134/159) |
| **subconjunto settings alvo** | **51,39% (129/251)** | **89,24% (224/251)** |

São +95 linhas executáveis nestes arquivos (o Sonar apontava 90 descobertas
em settings no período). O painel cobre os 8 pilares, validação/erros, abas
e o contrato HTTP (GET/PUT, 401/403/404).

### `src/components`

| arquivo | linhas antes | linhas depois |
|---------|-------------:|--------------:|
| `AssistantsDock.tsx` | 0% (0/43) | 100% (43/43) |
| `CommercialJourneyStream.tsx` | 0% (0/24) | 91,66% (22/24) |
| `NextBestActionCard.tsx` | 0% (0/15) | 100% (15/15) |
| `ModuleRail.tsx` | 71,11% (32/45) | 95,55% (43/45) |
| `FloatingNavbar.tsx` | 0% (0/13) | 100% (13/13) |
| `PricingSection.tsx` | 0% (0/9) | 100% (9/9) |
| `Glow.tsx` | 0% (0/3) | 100% (3/3) |
| `StatsGrid.tsx` | 0% (0/3) | 100% (3/3) |
| `AuroraButton.tsx` | 0% (0/2) | 100% (2/2) |
| `BentoShowcase.tsx` | 0% (0/1) | 100% (1/1) |
| `CtaBanner.tsx` | 0% (0/1) | 100% (1/1) |
| `HeroMockup.tsx` | 0% (0/1) | 100% (1/1) |
| `ModuleAgentWidget.tsx` | 40,36% (44/109) | 92,66% (101/109) |
| **subconjunto components alvo** | **28,16% (76/270)** | **95,19% (257/270)** |

São +181 linhas executáveis neste recorte (incluindo o aprofundamento do
stream SSE do `ModuleAgentWidget`). Não entramos em `BirthHubOrbit360`
(27,5%, r3f) nem no `CrmBoard` (peso de código novo baixo frente ao tamanho).

**Total do lote 2:** +276 linhas executáveis cobertas nos arquivos alvo.

Somando com o lote 1 (+886), o local aponta ~1162 linhas a mais no numerador.
O QG precisava de ~1228 linhas novas cobertas para chegar a 80%. A folga
restante, se o Sonar não creditar 1:1, deve ficar na ordem de **0–150 linhas**
(principalmente `BirthHubOrbit360` e o residual do Placeholder). Confirmar no
Quality Gate após o merge dos PRs #230 e deste lote.

Gates locais deste lote: suíte nova + testes pré-existentes de settings/
layout/widget, `typecheck`, `lint` (apenas warnings pré-existentes) e `build` ok.

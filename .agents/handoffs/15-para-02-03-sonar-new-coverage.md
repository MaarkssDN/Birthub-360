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

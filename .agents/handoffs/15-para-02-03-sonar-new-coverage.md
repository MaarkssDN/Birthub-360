# Handoff — Cobertura de código novo abaixo de 80% (Sonar)

De: 15 — Segurança Aplicada
Para: 02 — Produto e UX / 03 — Design e Acessibilidade (landing e UI); demais donos citados por arquivo
Onda: Quality Gate da main `94f95097` (período de código novo desde 2026-10-27T21:30:30Z)
Status: aberto
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

(preenchido pelo destinatário ao resolver)

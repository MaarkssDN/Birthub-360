# Handoff — SonarQube PR #368: cobertura e duplicação de código novo fora do escopo do 03

De: 03 — Design e Acessibilidade
Para: 00 — Coordenador
Onda: PR #368 (`agente/00-paleta-oficial-migracao`)
Status: aberto
Prioridade: alto (Quality Gate SonarCloud reprovado — 2 de 3 condições restantes não são do domínio 03)
Bloqueador-ref: run SonarQube `44581969083` (2026-11-19), projeto `MarksNN_Birthub-360`, pullRequest=368

## Problema

O gate `SonarQube` do PR #368 reprova o Quality Gate em 3 condições. Após a
correção do teste unitário (`LuxuryHeaderHUD.interactions.test.tsx`, commit
`ecbb82345`), os testes voltaram a passar e a análise rodou até o QG, que
reportou:

| condição | atual | aceitável |
|----------|------:|----------:|
| `new_reliability_rating` (Bugs) | 3 (C) | ≤ 1 (A) |
| `new_coverage` | 45,5% | ≥ 80,0% |
| `new_duplicated_lines_density` | 9,1% | ≤ 3,0% |

Dados extraídos da API pública do SonarCloud (`api/measures/component`,
`component_tree`, `issues/search`, `duplications/show` — sem token).

### 1. Bugs (reliability C) — 3 issues `typescript:S3923`, todos em arquivos do Agente 05

Ver handoff irmão `.agents/handoffs/03-para-05-sonar-s3923-ternarios-mortos-paleta-pr368.md`
(com diffs prontos). São ternários `isDark ? 'var(--x)' : 'var(--x)'` criados
pela própria migração hex→var() — correção de 3 linhas, zero impacto visual.

### 2. Cobertura de código novo — 80 linhas descobertas de 153 a cobrir

Para ≥80% é preciso cobrir ~50 das 80 linhas descobertas. Distribuição por dono:

| uncov | arquivo | dono provável |
|------:|---------|---------------|
| 15 | `src/components/layout/ModuleNavPanel.tsx` | 02 |
| 10 | `src/components/layout/ModuleRail.tsx` | 02 |
| 6 | `src/components/layout/navItemThemes.ts` | 02 |
| 11 | `src/bootstrap/frontend.ts` | escalar (sem AGENTS.md local) |
| ~36 | `src/features/prospecting/outbound/**` (PerformanceTab 6, lead-card 9, demais ~2/arquivo) | 05 |
| 1+1 | `src/components/ui/AiReasoningVisualizer.tsx`, `src/components/ErrorBoundary.tsx` | 03 (marginal) |

### 3. Duplicação de código novo — 245 linhas duplicadas (9,1%; preciso ≤ ~80 para 3%)

| dup lines | arquivo | dono |
|----------:|---------|------|
| 172 | `src/components/layout/moduleThemes.ts` | 02 |
| 73 | `src/features/characters/characterCatalogAgents.ts` + `characterCatalogPillars.ts` | dono de characters (sem AGENTS.md → escalar) |

`api/duplications/show` em `moduleThemes.ts`: blocos de 49 linhas repetidos
entre os 11 módulos (`p01`–`p11`) e blocos de 29 linhas ×11 — a estrutura
`dark:{…}/light:{…}` ficou mais homogênea após a migração para `var()`. Refatorar
para factory compartilhada é decisão do dono (02), não cirúrgica.

## O que o Agente 03 já corrigiu neste PR (commits na branch)

- `ecbb82345` — `biome format --write` nos 25 arquivos do PR fora do padrão
  (gate `application gate`/`build`); assertion do teste unitário do
  `LuxuryHeaderHUD` atualizada de `bg-[#0D0D0D]/85` para `bg-[var(--bg)]/85`
  (mesmo comportamento, token novo — não enfraquece assert).
- `69b7948d7` — `visual-regression/visual.spec.ts`: assertion de cor do CTA
  "Acessar Célula Comercial" de `rgb(248,250,252)` para `rgb(6, 26, 58)` —
  `--on-brand` oficial é Deep Navy `#061A3A` no light ("NUNCA texto branco em
  cima" do Antique Gold, `globals.css:205-206,269`). Spec não estava no diff do
  PR; a paleta mudou o pixel e quebrou a expectativa hard-coded.

## Alteração necessária (fora do escopo 03)

1. **05**: aplicar as 3 correções S3923 do handoff irmão (ou autorizar o 03).
2. **02**: cobrir `ModuleNavPanel`/`ModuleRail`/`navItemThemes` (~31 linhas) e
   avaliar dedup de `moduleThemes.ts` (172 linhas duplicadas — provavelmente
   resolve a maior parte da condição de duplicação sozinho).
3. **05**: cobrir residual de `prospecting/outbound` (~36 linhas).
4. **Dono de characters / bootstrap**: `characterCatalog*.ts` (73 dup) e
   `frontend.ts` (11 uncov) — escalar ao 00 se não houver dono.
5. Alternativa estrutural (decisão do 00/24): se a política aceitar, revisar o
   QG para PRs de migração de tokens — mas isso é mudança de `.github/workflows`
  /config Sonar (dono 08/decisão humana), fora do meu mandato.

## Teste esperado

- `api/issues/search?pullRequest=368&types=BUG` → 0 issues novos.
- `api/measures/component?pullRequest=368` → `new_coverage ≥ 80`,
  `new_duplicated_lines_density ≤ 3`, `new_reliability_rating = 1`.

## Contexto adicional

- O gate `SonarQube` roda `npm run test:unit -- --coverage` + scan; a falha
  anterior era o teste unitário (já corrigido). O QG só apareceu depois.
- Não alterei limiar, exclusions ou config do Sonar.

# Revisão independente — WF6 a11y noLabelWithoutControl (intelligence) — PR #166

- **Missão:** WF6 lote 1 a11y (`lint/a11y/noLabelWithoutControl`), uma PR por área.
- **Autor:** WF6 · **Auditor:** Agente 24 — Revisão Independente
- **Base:** main `16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69` (merge-base confirmado; PR não está atrás de main)
- **SHA revisado:** `2a61e34aa8b33648e08a058769eb9604fc49562a` (reverificado com gh no início e antes da escrita)
- **Escopo:** UniversalEcosystemPanel.tsx + tests/unit/features/intelligence/components/UniversalEcosystemPanel.test.tsx. Sem package.json/lockfiles (§15), sem App.tsx, schema/migrations ou workflows.

## Critérios
1. Sem mudança visual: className idêntico; nenhum seletor CSS/Tailwind mira `label`; Visual Regression verde.
2. Cada label→span justificado (sem controle real a ligar); gatilhos de input file com nome acessível.
3. `useId` incondicional; ids únicos (inclusive em loops).
4. Gate §28: Release com todos os passos executados e verdes; Sonar, VR, CodeQL, Trivy, Dependency Review, Bundle Budget.

## Comandos
- `git diff origin/main p166 -- src`, `git merge-base origin/main p166`, `git diff --name-only`
- `rg --pcre2 '(?<![\w-])label(?![\w-])' -g '*.css' -g '*.scss' src` → 0 ocorrências; sem `tailwind.config.*`, sem variantes `[&_label]` em src
- `gh run list -c 2a61e34aa8b33648e08a058769eb9604fc49562a`; `gh api .../actions/runs/41434179085/jobs` (passos do application gate)
- `curl sonarcloud.io/api/qualitygates/project_status?...&pullRequest=166`

## Evidências
- `src/features/intelligence/components/UniversalEcosystemPanel.tsx:109` — `useId()` incondicional no topo.
- `:561` — no loop `item.fields.map`, `htmlFor={`${fieldId}-${item.provider}-${field.key}`}`: único por provedor × campo, mesmo com vários provedores em edição.
- `:631/649/720/735/780` — formato (select), titulo, agente-nome, agente-prompt, missao ligados.
- Nenhuma conversão label→span; className inalterado.

## CI (head 2a61e34a)
- Release "Central Birth Hub 360 Release" **41434179085: em andamento** — secret scan, trivy scan, dependency review verdes; application gate: Lint e Type Check verdes; Unit Tests/Golden Dataset em execução; Integration, Build, Smoke e E2E **pendentes** (não executados) após ~50 min de polling.
- VR: 41434179159 success
- CodeQL: 41434179102 success
- Trivy: 41434179136 success
- DepReview: 41434179200 success
- Bundle: 41434179079 success
- Sonar: 41434179095 success (gate OK)

## Achados
Nenhum P1/P2.
- Herdado vs novo: nenhuma falha nova atribuível ao diff até aqui.

## Pendências
- Release 41434179085 concluir com Integration, Build, Smoke e E2E executados e verdes.
- Nenhuma além da Release.

## Decisão
**SUPERADO — ver Atualização abaixo.** (decisão anterior: BLOQUEADO por CI pendente)

## Atualização — 2026-11-02 09:28 (UTC-3)
- Head reconfirmado com gh: `2a61e34aa8b33648e08a058769eb9604fc49562a` (inalterado); main segue `16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69`.
- Release \"Central Birth Hub 360 Release\" **41434179085: completed/success**. Todos os jobs verdes (secret scan, trivy, dependency review, application gate). Todos os passos do application gate executados e verdes:
  - Lint ✅ · Type Check ✅
  - Unit Tests ✅ — 5539 passed, 1 skipped
  - Golden Dataset ✅ — 11 passed
  - Integration Tests ✅ — 738 passed, 2 skipped
  - Build ✅ · Smoke ✅
  - E2E ✅ — 108 passed (8.7m)
- Baseline main 16dd960f: Release 41433136212 success. Nenhuma falha nova.
- Sonar segue como risco (não bloqueio), conforme achados acima.

## Decisão final
**APROVADO** para o SHA `2a61e34aa8b33648e08a058769eb9604fc49562a`. Pendências P3 acima não bloqueiam.

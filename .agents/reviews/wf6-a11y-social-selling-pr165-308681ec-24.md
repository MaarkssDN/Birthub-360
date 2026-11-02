# Revisão independente — WF6 a11y noLabelWithoutControl (social-selling) — PR #165

- **Missão:** WF6 lote 1 a11y (`lint/a11y/noLabelWithoutControl`), uma PR por área.
- **Autor:** WF6 · **Auditor:** Agente 24 — Revisão Independente
- **Base:** main `16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69` (merge-base confirmado; PR não está atrás de main)
- **SHA revisado:** `308681ec6fcb947de9ff1d9d375f162ed2b19f29` (reverificado com gh no início e antes da escrita)
- **Escopo:** ApproachGeneratorCard.tsx + tests/unit/features/social-selling/ApproachGeneratorCard.a11y.test.tsx. Sem package.json/lockfiles (§15), sem App.tsx, schema/migrations ou workflows.

## Critérios
1. Sem mudança visual: className idêntico; nenhum seletor CSS/Tailwind mira `label`; Visual Regression verde.
2. Cada label→span justificado (sem controle real a ligar); gatilhos de input file com nome acessível.
3. `useId` incondicional; ids únicos (inclusive em loops).
4. Gate §28: Release com todos os passos executados e verdes; Sonar, VR, CodeQL, Trivy, Dependency Review, Bundle Budget.

## Comandos
- `git diff origin/main p165 -- src`, `git merge-base origin/main p165`, `git diff --name-only`
- `rg --pcre2 '(?<![\w-])label(?![\w-])' -g '*.css' -g '*.scss' src` → 0 ocorrências; sem `tailwind.config.*`, sem variantes `[&_label]` em src
- `gh run list -c 308681ec6fcb947de9ff1d9d375f162ed2b19f29`; `gh api .../actions/runs/41434163665/jobs` (passos do application gate)
- `curl sonarcloud.io/api/qualitygates/project_status?...&pullRequest=165`

## Evidências
- `src/features/social-selling/components/ApproachGeneratorCard.tsx:26` — `useId()` incondicional no topo.
- Linhas 87/104/122/138/162/177 — labels empresa, cargo, segmento, canal (Select), gatilho, tom (Select) com `htmlFor`; controles recebem `id`.
- `src/components/ui/Input.tsx:37-48` e `src/components/ui/Select.tsx:34-37` — `forwardRef` com `{...props}` repassado ao elemento nativo, então `id` chega ao DOM.
- Nenhuma conversão label→span; className inalterado.

## CI (head 308681ec)
- Release "Central Birth Hub 360 Release" **41434163665: em andamento** — secret scan, trivy scan, dependency review verdes; application gate: Lint e Type Check verdes; Unit Tests/Golden Dataset em execução; Integration, Build, Smoke e E2E **pendentes** (não executados) após ~50 min de polling.
- VR: 41434163622 **failure** (prospect-dark.png 58518 px / 0.08; admin-module-access-light.png 1327 px / 0.01 e 45988 px / 0.14 — páginas fora do escopo do PR)
- CodeQL: 41434163787 success
- Trivy: 41434163767 success
- DepReview: 41434163625 success
- Bundle: 41434163701 success
- Sonar: 41434163717 success (gate OK)

## Achados
- P2 (bloqueante só para este ciclo): Visual Regression vermelho. As telas que falharam (prospect, admin-module-access) não são tocadas pelo PR, e #167 (que mexe em prospecting) e #164/#166/#168 passaram no VR na mesma base 16dd960f — tudo indica flake herdado, não regressão nova. Mesmo assim o critério pedido é VR verde.
- P3: nenhum de código.
- Herdado vs novo: nenhuma falha nova atribuível ao diff até aqui.

## Pendências
- Release 41434163665 concluir com Integration, Build, Smoke e E2E executados e verdes.
- Re-executar Visual Regression (41434163622) e obter verde; aguardar Release.

## Decisão
**BLOQUEADO (CI pendente)** — revisão de código sem bloqueios de mérito; nenhuma conversão a reverter. Teste obrigatório não executado não é aprovação: runs pendentes: Release 41434163665 (application gate: Unit Tests/Golden em execução; Integration, Build, Smoke, E2E pendentes). Também falta VR verde (41434163622 falhou).

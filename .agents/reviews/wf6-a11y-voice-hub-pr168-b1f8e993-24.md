# Revisão independente — WF6 a11y noLabelWithoutControl (voice-hub) — PR #168

- **Missão:** WF6 lote 1 a11y (`lint/a11y/noLabelWithoutControl`), uma PR por área.
- **Autor:** WF6 · **Auditor:** Agente 24 — Revisão Independente
- **Base:** main `16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69` (merge-base confirmado; PR não está atrás de main)
- **SHA revisado:** `b1f8e993dfd55a86efbc1ced90568d77c8024e65` (reverificado com gh no início e antes da escrita)
- **Escopo:** 9 arquivos voice-hub (components/AgentForm, pages/AgentOS + Dashboard/AgentOS, Dashboard/Developers, Dashboard/KnowledgeManager, pages/Organization + Dashboard/Organization, pages/Playground + Dashboard/Playground) + tests/unit/features/voice-hub/labels.a11y.test.tsx. Sem package.json/lockfiles (§15), sem App.tsx, schema/migrations ou workflows.

## Critérios
1. Sem mudança visual: className idêntico; nenhum seletor CSS/Tailwind mira `label`; Visual Regression verde.
2. Cada label→span justificado (sem controle real a ligar); gatilhos de input file com nome acessível.
3. `useId` incondicional; ids únicos (inclusive em loops).
4. Gate §28: Release com todos os passos executados e verdes; Sonar, VR, CodeQL, Trivy, Dependency Review, Bundle Budget.

## Comandos
- `git diff origin/main p168 -- src`, `git merge-base origin/main p168`, `git diff --name-only`
- `rg --pcre2 '(?<![\w-])label(?![\w-])' -g '*.css' -g '*.scss' src` → 0 ocorrências; sem `tailwind.config.*`, sem variantes `[&_label]` em src
- `gh run list -c b1f8e993dfd55a86efbc1ced90568d77c8024e65`; `gh api .../actions/runs/41434210683/jobs` (passos do application gate)
- `curl sonarcloud.io/api/qualitygates/project_status?...&pullRequest=168`

## Evidências
- `useId()` incondicional no topo: AgentForm.tsx:20, AgentOS.tsx:47 (×2), Developers.tsx:30, KnowledgeManager.tsx:47, Organization.tsx:48 (×2), Playground.tsx:30 (×2). Cada arquivo tem seu próprio useId, então ids iguais em pares duplicados não colidem.
- Labels ligados a input/select/textarea/range em todos os arquivos (ex.: AgentOS:173-299, Developers:424/495/516, KnowledgeManager:507-725 incl. `doc-arquivo` em input file, Playground:308/323).
- Conversões label→span em Organization ×2 (idênticas):
  - `:332` "Logo" — seguido de um div dropzone sem input nem handler (controle fictício herdado); span correto.
  - `:360` "1. Upload de Imagem Base" — input file `className="hidden"` acionado por `div role="button" tabIndex={0}` (`:371`) com Enter/Espaço; nome acessível vem do conteúdo ("Clique para fazer upload (PNG, JPG)" ou, com imagem, "Preview" + "Trocar Imagem"). Tem nome; não precisa reverter para label.
  - `:447` "Resultado" — título de área de saída, sem controle; span correto.
- className idêntico em todas as trocas.

## CI (head b1f8e993)
- Release "Central Birth Hub 360 Release" **41434210683: em andamento** — secret scan, trivy scan, dependency review verdes; application gate: Lint e Type Check verdes; Unit Tests/Golden Dataset em execução; Integration, Build, Smoke e E2E **pendentes** (não executados) após ~50 min de polling.
- VR: 41434210809 success
- CodeQL: 41434210604 success
- Trivy: 41434210445 success
- DepReview: 41434210721 success
- Bundle: 41434210663 success
- Sonar: 41434210579 failure — gate ERROR por new_coverage=55.6 e new_duplicated_lines_density=61.7 (duplicação herdada dos pares pages/ vs pages/Dashboard/; reliability/security/hotspots OK → risco, não bloqueio)

## Achados
- P3: o gatilho em Organization.tsx:371 não referencia o título "1. Upload de Imagem Base"; sugerir `aria-labelledby`/`aria-describedby` com o id do span em PR futuro.
- P3 (herdado): dropzone "Logo" (`:333`) parece clicável mas não tem ação.
- P3 (herdado): duplicação pages/ vs pages/Dashboard/ (Sonar 61.7%).
- Herdado vs novo: nenhuma falha nova atribuível ao diff até aqui.

## Pendências
- Release 41434210683 concluir com Integration, Build, Smoke e E2E executados e verdes.
- Nenhuma além da Release.

## Decisão
**BLOQUEADO (CI pendente)** — revisão de código sem bloqueios de mérito; nenhuma conversão a reverter. Teste obrigatório não executado não é aprovação: runs pendentes: Release 41434210683 (application gate: Unit Tests/Golden em execução; Integration, Build, Smoke, E2E pendentes).

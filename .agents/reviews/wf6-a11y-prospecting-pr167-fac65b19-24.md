# Revisão independente — WF6 a11y noLabelWithoutControl (prospecting) — PR #167

- **Missão:** WF6 lote 1 a11y (`lint/a11y/noLabelWithoutControl`), uma PR por área.
- **Autor:** WF6 · **Auditor:** Agente 24 — Revisão Independente
- **Base:** main `16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69` (merge-base confirmado; PR não está atrás de main)
- **SHA revisado:** `fac65b19554680dd40abc75db66134f5b5a7b59a` (reverificado com gh no início e antes da escrita)
- **Escopo:** 6 componentes outbound (DatabaseExplorerTab, LoginScreen, OllamaTerminalTab, ProspectorTab, Sidebar, lead-card/LeadTasksAndActivitySection) + tests/unit/features/prospecting/outbound/labels.a11y.test.tsx. Sem package.json/lockfiles (§15), sem App.tsx, schema/migrations ou workflows.

## Critérios
1. Sem mudança visual: className idêntico; nenhum seletor CSS/Tailwind mira `label`; Visual Regression verde.
2. Cada label→span justificado (sem controle real a ligar); gatilhos de input file com nome acessível.
3. `useId` incondicional; ids únicos (inclusive em loops).
4. Gate §28: Release com todos os passos executados e verdes; Sonar, VR, CodeQL, Trivy, Dependency Review, Bundle Budget.

## Comandos
- `git diff origin/main p167 -- src`, `git merge-base origin/main p167`, `git diff --name-only`
- `rg --pcre2 '(?<![\w-])label(?![\w-])' -g '*.css' -g '*.scss' src` → 0 ocorrências; sem `tailwind.config.*`, sem variantes `[&_label]` em src
- `gh run list -c fac65b19554680dd40abc75db66134f5b5a7b59a`; `gh api .../actions/runs/41434194361/jobs` (passos do application gate)
- `curl sonarcloud.io/api/qualitygates/project_status?...&pullRequest=167`

## Evidências
- `useId()` incondicional no topo: DatabaseExplorerTab.tsx:17, LoginScreen.tsx:48, OllamaTerminalTab.tsx:36, ProspectorTab.tsx:100, Sidebar.tsx:91, LeadTasksAndActivitySection.tsx:63.
- Labels ligados: sql (DatabaseExplorerTab:207), email/senha (LoginScreen:178/208), prompt (Ollama:172), uf/raio/quantidade (ProspectorTab:419/462/556), groq-key/groq-modelo/proposta/bitrix-alvo/google-places-key/apollo-key (Sidebar:447/473/569/706/740/767), contexto/observacao (LeadTasks:207/229).
- Conversões label→span: `Sidebar.tsx:306-308` "Motor de IA (LLM)" e `Sidebar.tsx:803-805` "Banco Relacional" — ambos são títulos de seção seguidos de botões ("Testar", seletor de provedor por botões, "SQL Explorer") e de cards estatísticos; não há controle de formulário a ligar. Span correto, className idêntico.

## CI (head fac65b19)
- Release "Central Birth Hub 360 Release" **41434194361: em andamento** — secret scan, trivy scan, dependency review verdes; application gate: Lint e Type Check verdes; Unit Tests/Golden Dataset em execução; Integration, Build, Smoke e E2E **pendentes** (não executados) após ~50 min de polling.
- VR: 41434194341 success
- CodeQL: 41434194435 success
- Trivy: 41434194441 success
- DepReview: 41434194359 success
- Bundle: 41434194279 success
- Sonar: 41434194386 failure — gate ERROR só por new_coverage=16.7 (risco, não bloqueio)

## Achados
- P3: `LeadTasksAndActivitySection.tsx:1` — `import { useId } from 'react'` antes de `import type React`; só estilo.
- P3 (herdado): seletor de provedor Ollama/Groq/… são botões soltos sem `aria-pressed`/grupo nomeado; fora do escopo de noLabelWithoutControl.
- Herdado vs novo: nenhuma falha nova atribuível ao diff até aqui.

## Pendências
- Release 41434194361 concluir com Integration, Build, Smoke e E2E executados e verdes.
- Nenhuma além da Release.

## Decisão
**BLOQUEADO (CI pendente)** — revisão de código sem bloqueios de mérito; nenhuma conversão a reverter. Teste obrigatório não executado não é aprovação: runs pendentes: Release 41434194361 (application gate: Unit Tests/Golden em execução; Integration, Build, Smoke, E2E pendentes).

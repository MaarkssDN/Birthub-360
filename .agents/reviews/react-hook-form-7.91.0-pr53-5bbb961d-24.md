# Parecer Agente 24 — PR #53 (react-hook-form-7.91.0)

- Missão: revisão independente de PR aberto
- Auditor: Agente 24 — Revisão Independente
- Autor: app/dependabot
- Revisão auditada (head SHA): `5bbb961d5b8dcc5147c0e4899585db757d92068c`
- Base (main no momento da revisão): `91dfdd48bf053bf84779bad933d6c40bb5d3f636`
- Data: 2026-11-02 (America/Sao_Paulo)
- Critérios: AGENTS.md §§ propriedade, P1–P4, LGPD/tenancy, evidências, parecer 24 (linhas 907–911)

## Decisão: **BLOQUEADO** (vinculada a `5bbb961d5b8dcc5147c0e4899585db757d92068c`; qualquer novo commit invalida este parecer)

## Escopo e diff
- Bump Dependabot: react-hook-form ^7.88.0→^7.91.0 (runtime, minor, sem breaking changes declarados na série 7.x). Arquivos: package.json (1 linha), package-lock.json, pnpm-lock.yaml (~650–700 linhas de churn no pnpm-lock, regeneração de snapshots; lockfileVersion inalterado). Ambos os lockfiles atualizados de forma consistente com o package.json.
- Propriedade: não toca schema/migrations, workflows nem App.tsx. Segurança: sem segredos/PII; Trivy, Dependency Review e CodeQL **pass**.
- Head está **5 commits atrás** da main (base feca08ba) — os lockfiles podem conflitar/estar obsoletos após rebase.

## CI (head 5bbb961d)
- Release run 41379000569: application gate **failure** — CI do PR: application gate falha com exatamente os mesmos 4 errors de lint da main (mesmos arquivos/linhas; nenhum arquivo do PR); 645 warnings vs 643 na main (diferença atribuível à base mais antiga, não a arquivos do PR). Por isso os testes unitários **não executaram** no CI deste PR.
- SonarQube **fail**; build consolidado fail em cascata; Frontend bundle budget e Visual Regression **pass**.

## Motivo do BLOQUEADO
Nenhum defeito atribuível ao bump foi encontrado, mas testes obrigatórios não executaram (gate interrompido por falha herdada) e o PR está defasado da main.
## Pendências para APROVADO
1. Main com lint verde; 2. `@dependabot rebase` (feito pelo dono, não por este auditor); 3. gate completo verde (lint+unit) no novo head; 4. justificar/zerar falha SonarQube.

## Baseline de CI da main (91dfdd48, 2026-11-02 ~04:04 BRT)
- Central Birth Hub 360 Release run 41403879064: **failure** — application gate falha no lint (Biome): **4 errors / 643 warnings** (ex.: src/components/ui/ErrorBoundary.tsx:1:8 noUnusedImports, src/components/layout/sidebarSections.ts:1:8, src/shared/security/terminalSafety.service.ts:19:8, src/shared/services/__tests__/dataSubjectErasure.unit.test.ts:16:7). Como o lint falha primeiro, os testes unitários não executam no gate.
- Frontend Bundle Budget run 41403879043: **failure** — build Vite: `Could not resolve "./ExternalCrmPanel.js" from src/features/integrations/components/Integrations.tsx` (introduzido pela remoção de arquivo do commit Gitleaks na main).
- Security - CodeQL 41403879050: success; SonarQube 41403879109: em andamento.
- Falhas acima são **herdadas** (pré-existentes na main) e não contam como gate verde.

## Comandos executados
- `gh pr view 53 --json headRefOid,files`, `git diff main...pr53`, `git rev-list --left-right --count main...pr53`
- `gh pr checks 53`, `gh run view <id> --log-failed`, `gh run list --branch main`

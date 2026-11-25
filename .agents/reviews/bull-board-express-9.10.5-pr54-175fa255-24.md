# Parecer Agente 24 — PR #54 (bull-board-express-9.10.5)

- Missão: revisão independente de PR aberto
- Auditor: Agente 24 — Revisão Independente
- Autor: app/dependabot
- Revisão auditada (head SHA): `175fa2556f6eed608bb490d4d90848aa68173be4`
- Base (main no momento da revisão): `91dfdd48bf053bf84779bad933d6c40bb5d3f636`
- Data: 2026-11-02 (America/Sao_Paulo)
- Critérios: AGENTS.md §§ propriedade, P1–P4, LGPD/tenancy, evidências, parecer 24 (linhas 907–911)

## Decisão: **REPROVADO** (vinculada a `175fa2556f6eed608bb490d4d90848aa68173be4`; qualquer novo commit invalida este parecer)

## Escopo e diff
- Bump Dependabot @bull-board/express ^9.6.0→^9.10.5 (package.json:101), mas **@bull-board/api permanece ^9.6.0** (package.json:100).
- **Achado bloqueante:** pnpm-lock.yaml do PR passa a conter duas versões do núcleo: `@bull-board/api@9.10.1` (linhas 1387/11955, dependência direta) e `@bull-board/api@9.10.5` (linhas 1399/11965, puxada pelo express), além de `@bull-board/ui` 9.10.1 e 9.10.5 (1414/1417). src/bootstrap/bullBoard.ts:1 usa `createBullBoard` de @bull-board/api com o ExpressAdapter — com pnpm isso combina instâncias de versões diferentes (risco de incompatibilidade de tipos/runtime e UI duplicada). O package-lock.json resolve tudo em 9.10.5 (linhas 2555–2606) → **os dois lockfiles divergem**.
- Propriedade: OK (sem schema/workflows/App.tsx). Segurança: Trivy/CodeQL/Dependency Review pass.
- Head 5 commits atrás da main (base feca08ba).

## CI (head 175fa255)
- Release run 41378988022: application gate **failure** — CI do PR: application gate falha com exatamente os mesmos 4 errors de lint da main (mesmos arquivos/linhas; nenhum arquivo do PR); 645 warnings vs 643 na main (diferença atribuível à base mais antiga, não a arquivos do PR). Por isso os testes unitários **não executaram** no CI deste PR.
- Visual Regression run 41378987961 **failure** (5× `toHaveScreenshot` falhou, 1 teste falho) — não é plausível para dependência backend; provável flakiness, mas não comprovada. SonarQube fail.

## Motivo do REPROVADO
Bump incompleto: versões divergentes do pacote irmão @bull-board/api/ui e inconsistência entre package-lock.json e pnpm-lock.yaml.
## Correção exigida
Atualizar @bull-board/api (e ui) junto para ^9.10.5 (grupo Dependabot `@bull-board/*`), rebase na main, gate e Visual Regression verdes.

## Baseline de CI da main (91dfdd48, 2026-11-02 ~04:04 BRT)
- Central Birth Hub 360 Release run 41403879064: **failure** — application gate falha no lint (Biome): **4 errors / 643 warnings** (ex.: src/components/ui/ErrorBoundary.tsx:1:8 noUnusedImports, src/components/layout/sidebarSections.ts:1:8, src/shared/security/terminalSafety.service.ts:19:8, src/shared/services/__tests__/dataSubjectErasure.unit.test.ts:16:7). Como o lint falha primeiro, os testes unitários não executam no gate.
- Frontend Bundle Budget run 41403879043: **failure** — build Vite: `Could not resolve "./ExternalCrmPanel.js" from src/features/integrations/components/Integrations.tsx` (introduzido pela remoção de arquivo do commit Gitleaks na main).
- Security - CodeQL 41403879050: success; SonarQube 41403879109: em andamento.
- Falhas acima são **herdadas** (pré-existentes na main) e não contam como gate verde.

## Comandos executados
- `gh pr view 54 --json headRefOid,files`, `git diff main...pr54`, `git rev-list --left-right --count main...pr54`
- `gh pr checks 54`, `gh run view <id> --log-failed`, `gh run list --branch main`

# Parecer Agente 24 — PR #155 (agente/wf5-prontidao-deploy)

- **SHA revisado:** `77736b1bce1fe9a7f29c5ae167eef28402899540` (head reconfirmado via `gh pr view` em 02/11/2026 ~04:40 BRT; base `main` = `2d62f9fa`, 0 atrás / 1 à frente)
- **Veredito:** **BLOQUEADO**
- Válido somente para este SHA. Qualquer novo commit (inclusive merge da main no branch) exige nova revisão.

## Diff (5 arquivos)
1. `.github/actions/require-ci-green/action.yml:30-34` — `inputs.sha` via `env: INPUT_SHA`; `sha="$INPUT_SHA"`. Correto (anti-injeção).
2. `.github/workflows/docker-publish.yml:43-47` — `inputs.sha` via env; removido `if:` e ramo `github.event.workflow_run.head_sha`. Gatilho `on:` (l.9-17) é só `workflow_dispatch`; o `workflow_run` já tinha sido removido (957710ce). Nenhum outro workflow referencia docker-publish (grep em `.github/workflows/*`). Remoção não quebra caminho vivo.
3. `.github/workflows/deploy-pages.yml:11-12,88-90` — workflow fica `contents: read`; `pages: write` + `id-token: write` só no job `deploy` (o único que usa `actions/deploy-pages`). `gate`/`pages-build` já tinham `contents: read` explícito; `upload-pages-artifact` e `configure-pages` não precisam de `pages: write`. Job `deploy` não faz checkout, então não precisa de `contents`. Menor privilégio: OK.
4. `.github/workflows/backup-production.yml:117-121` — SC2129: três `echo >>` agrupados em `{ ...; } >> "$GITHUB_STEP_SUMMARY"`. Mesma saída, mesmo `set -euo pipefail`. Comportamento preservado.
5. `docs/ops/wf5-prontidao-deploy.md` — relatório de prontidão (somente documentação).

## Segurança
- Nenhum `${{ inputs.* }}`/`github.event.*`/head ref restante dentro de `run:` nos arquivos alterados (só em `env:`/`with:`).
- Sem `pull_request_target`; nenhum secret novo; nenhuma permissão ampliada (só reduzida).
- Actions externas continuam pinadas por SHA completo.
- P3 (não bloqueante): `docker-publish.yml:47` grava `INPUT_SHA` em `$GITHUB_OUTPUT` antes da validação por regex (feita depois em `require-ci-green`). Um input com quebra de linha poderia injetar outra chave de output; risco baixo (dispatch exige permissão de escrita). Sugestão: validar `^[0-9a-f]{40}$` já no step `resolve`.

## Verificação independente
- `actionlint` (com shellcheck integrado) em todos os `.github/workflows/*.yml` do head: **0 achados**.

## CI
- Head `77736b1b`: Dependency Review 41406690635 success; Trivy 41406690617 success; **Release 41406690573, CodeQL 41406690582, SonarQube 41406690584 e Visual Regression 41406690642 ainda em andamento** no momento da revisão.
- Baseline main `2d62f9fa`: Release 41406269451 **failure** (job "application gate": Biome, p.ex. `src/components/ui/ErrorBoundary.tsx:1:8 noUnusedImports`) — falha **herdada**, sem relação com o PR (que não toca código de app).

## Propriedade (AGENTS.md)
- `AGENTS.md` (seção de donos): `.github/workflows/**` → **Agente 08**. "WF5" não existe na lista de agentes do AGENTS.md. 4 dos 5 arquivos são de propriedade do 08 (o composite `.github/actions/**` não tem dono explícito, mas é do mesmo domínio de CI/release). **Achado de propriedade: WF5 alterou arquivos de outro dono sem registro de handoff/aceite do Agente 08.**

## Motivos do BLOQUEIO
1. Propriedade: falta aceite explícito do Agente 08 (ou decisão do Agente 00/Marcelo) para as mudanças em `.github/workflows/**`.
2. CI do head ainda não concluída; gate de release da main segue vermelho (herdado), então não há testes verdes de referência.

## O que desbloqueia
- Aceite do Agente 08 (ou do 00/Marcelo) registrado para a alteração dos workflows.
- Main verde, merge da main no branch (sem rebase/force-push) e CI concluída no novo head; nova revisão do 24 nesse SHA.
- Tecnicamente o diff está correto; não há P1/P2.

## Aviso obrigatório
Este PR mexe em workflows de deploy/produção (docker-publish, deploy-pages, backup-production). **Mesmo com APROVADO, o merge e qualquer disparo desses workflows exigem OK explícito do Marcelo.** Nenhum workflow foi disparado nesta revisão.

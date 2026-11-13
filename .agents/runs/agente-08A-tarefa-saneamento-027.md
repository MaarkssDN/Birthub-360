# Run — Agente 08A — TAREFA-SANEAMENTO-027 (BT360-DT-0050)

Onda: W5 | Branch: `agente/08A-w5-gitops` | Base: 5d3f267e1

## Escopo
`.github/workflows/docker-publish.yml` — integridade de release.

## Entrega
- input opcional `tag` no workflow_dispatch.
- job `validate-release`: SHA deve ser ancestral de origin/main; tag deve ser
  semver, anotada e apontar para o SHA; publish depende dos dois jobs.
- Risco residual: sem verificação GPG (repo não assina commits) — decisão de
  governança separada, registrada para o Agente 00.

## Gates
- vitest `w5-gitops-governance.test.ts`: casos de publish PASS.
- `npx tsc --noEmit` PASS.
- YAML dos 3 workflows parseado pelo próprio teste (yaml lib).

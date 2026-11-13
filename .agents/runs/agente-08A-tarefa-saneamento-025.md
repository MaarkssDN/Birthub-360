# Run — Agente 08A — TAREFA-SANEAMENTO-025 (BT360-DT-0048)

Onda: W5 | Branch: `agente/08A-w5-gitops` | Base: 5d3f267e1

## Escopo
`.github/workflows/` — higiene de branches remotas órfãs.

## Entrega
Novo `branch-hygiene.yml`: weekly cron + dispatch; deleta apenas branches
ancestrais de origin/main, >14d inativas, fora dos padrões protegidos;
não-mergeadas só reportadas; dry_run no dispatch.

## Evidência
- 453 refs remotas classificadas localmente: 17 protegidas / 206 recentes /
  229 stale-candidates.
- vitest `w5-gitops-governance.test.ts`: casos de hygiene PASS.
- `npx tsc --noEmit` PASS.
